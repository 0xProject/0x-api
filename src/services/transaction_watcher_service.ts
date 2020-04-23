import { Web3Wrapper, SupportedProvider } from '@0x/web3-wrapper';
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';
import { InitializationOptions, TransactionData } from 'bnc-sdk/dist/types/src/interfaces';
import { Connection, Repository, QueryFailedError, LessThanOrEqual } from 'typeorm';
// HACK(oskar) - import BlocknativeSdk = require('bnc-sdk') does not work
// throwing `not-callable` error.
// tslint:disable-next-line:no-var-requires
const BlocknativeSdk = require('bnc-sdk');
import { TransactionEntity } from '../entities';
import { logger } from '../logger';
import { BlockNativeEvents, EmitterMapping, TransactionStates } from '../types';
import { utils } from '../utils/utils';
import { EXPECTED_MINED_IN_S, TX_WATCHER_POLLING_INTERVAL_IN_MS } from '../constants';

// TODO(oskar) better explanation, and the type guard smells
// type guards for transaction data, since for example the signature for tx.hash can be undefined
function isValidBlockNativeTransactionData(tx: TransactionData): tx is Required<TransactionData> {
    if (tx === undefined || tx.hash === undefined || tx.nonce === undefined) {
        return false;
    }

    return true;
}

export class TransactionWatcherService {
    private readonly _transactionRepository: Repository<TransactionEntity>;
    private readonly _provider: SupportedProvider;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _blocknative: any;
    private readonly _emitterToAccount: EmitterMapping;

    constructor(
        dbConnection: Connection,
        provider: SupportedProvider,
        blocknativeOpts: InitializationOptions,
        accountsToMonitor: string[],
    ) {
        this._transactionRepository = dbConnection.getRepository(TransactionEntity);
        this._provider = provider;
        this._web3Wrapper = new Web3Wrapper(this._provider);
        this._blocknative = new BlocknativeSdk(blocknativeOpts);
        this._emitterToAccount = {};
        for (const account of accountsToMonitor) {
            this._monitorAccount(account);
        }
    }
    public async startAsync(): Promise<void> {
        while (true) {
            // finding transactions that need updating for which we have missed
            // notifications from blocknative.
            logger.trace('syncing transaciton status');
            try {
                await this.syncTransactionStatus();
            } catch (err) {
                logger.error(`order watcher failed to sync transaction status`, { err });
            }
            await utils.delay(TX_WATCHER_POLLING_INTERVAL_IN_MS);
        }
    }
    public async syncTransactionStatus(): Promise<void> {
        await this._syncAbortedTransactions();
        await this._syncConfirmedOrStuckTransactions();
    }

    // TODO(oskar): Refactor, possibly with queryRunner.
    public async _syncAbortedTransactions(): Promise<void> {
        const stuckTransactions = await this._transactionRepository.find({
            where: [{ status: TransactionStates.Stuck }, { status: TransactionStates.Confirmed }],
        });

        const uniqueNonces: Set<string> = new Set();
        for (const tx of stuckTransactions) {
            uniqueNonces.add(tx.nonce);
        }

        for (const nonce of uniqueNonces) {
            const txesWithSameNonces = stuckTransactions.filter(tx => tx.nonce === nonce);
            const hasConfirmedTransaction =
                txesWithSameNonces.filter(tx => tx.status === TransactionStates.Confirmed).length > 0;
            if (hasConfirmedTransaction) {
                txesWithSameNonces.filter(tx => tx.status === TransactionStates.Stuck).forEach(async tx => {
                    tx.status = TransactionStates.Dropped;
                    await this._saveTransaction(tx);
                });
            }
        }
    }
    public async _syncConfirmedOrStuckTransactions(): Promise<void> {
        const now = new Date();
        const transactionsToCheck = await this._transactionRepository.find({
            where: [
                { status: TransactionStates.Mempool, expiresAt: LessThanOrEqual(now) },
                { status: TransactionStates.Submitted, expiresAt: LessThanOrEqual(now) },
            ],
        });
        logger.trace(`found ${transactionsToCheck.length} transactions needing an update`);
        transactionsToCheck.forEach(async tx => {
            await this._findTransactionStatusAndUpdateAsync(tx);
        });
    }
    private async _findTransactionStatusAndUpdateAsync(tx: TransactionEntity): Promise<TransactionEntity> {
        const txInBlockchain = await this._web3Wrapper.getTransactionByHashAsync(tx.hash);
        // TODO(oskar) - refactor
        if (
            txInBlockchain !== undefined &&
            txInBlockchain !== null &&
            txInBlockchain.hash !== undefined &&
            txInBlockchain.blockNumber !== null
        ) {
            logger.info(
                `a transaction with a ${tx.status} status is already on the blockchain, updating status to confirmed`,
                { hash: txInBlockchain.hash },
            );

            tx.status = TransactionStates.Confirmed;
            return this._saveTransaction(tx);
        }

        tx.status = TransactionStates.Stuck;
        return this._saveTransaction(tx);
    }
    private _monitorAccount(account: string): void {
        const { emitter } = this._blocknative.account(account);
        this._emitterToAccount[account] = emitter;
        emitter.on(BlockNativeEvents.TxSent, async (tx: TransactionData) => {
            await this._onTransactionUpdateEventSetStatusAsync(tx, TransactionStates.Submitted);
        });
        emitter.on(BlockNativeEvents.TxPool, async (tx: TransactionData) => {
            await this._onTransactionUpdateEventSetStatusAsync(tx, TransactionStates.Mempool);
        });
        emitter.on(BlockNativeEvents.TxConfirmed, async (tx: TransactionData) => {
            await this._onTransactionUpdateEventSetStatusAsync(tx, TransactionStates.Confirmed);
        });
        emitter.on(BlockNativeEvents.TxSpeedUp, async (tx: TransactionData) => {
            await this._onTransactionUpdateEventSetStatusAsync(tx, TransactionStates.Dropped);
        });
        emitter.on(BlockNativeEvents.TxCancel, async (tx: TransactionData) => {
            await this._onTransactionUpdateEventSetStatusAsync(tx, TransactionStates.Dropped);
        });
        emitter.on(BlockNativeEvents.TxFailed, async (tx: TransactionData) => {
            await this._onTransactionUpdateEventSetStatusAsync(tx, TransactionStates.Failed);
        });
    }
    private async _saveTransaction(tx: TransactionEntity): Promise<TransactionEntity> {
        await this._transactionRepository.manager.transaction(async transactionalEntityManager => {
            const repo = transactionalEntityManager.getRepository(TransactionEntity);

            await repo.save(tx);
        });
        return tx;
    }
    private async _onTransactionUpdateEventSetStatusAsync(
        tx: TransactionData,
        status: TransactionStates,
    ): Promise<void> {
        this._transactionRepository.manager.transaction(async transactionalEntityManager => {
            logger.info(`received an update event for transaction ${tx.hash}`, { hash: tx.hash, status: tx.status });
            const repo = transactionalEntityManager.getRepository(TransactionEntity);
            const storedTx = await repo.findOne(tx.hash);
            if (storedTx === undefined) {
                if (isValidBlockNativeTransactionData(tx)) {
                    logger.warn(
                        'transaction watcher got notified about a transaction not present yet in the database',
                        {
                            hash: tx.hash,
                        },
                    );
                    const newTx = new TransactionEntity({
                        hash: tx.hash,
                        status,
                        nonce: web3WrapperUtils.numberToHex(tx.nonce),
                        gasPrice: tx.gasPrice,
                        metaTxnRelayerAddress: tx.from,
                        expectedMinedInSec: EXPECTED_MINED_IN_S,
                    });
                    try {
                        await transactionalEntityManager.save(newTx);
                    } catch (err) {
                        if (err instanceof QueryFailedError) {
                            // Transaction got inserted after receiving the notification but before managing to update it.
                            logger.warn('db transaction conflict, rolling back');
                        } else {
                            logger.error(err);
                            throw new Error('failed to store transaction');
                        }
                    }
                } else {
                    throw new Error('invalid block native data');
                }
            } else {
                storedTx.status = status;
                await transactionalEntityManager.save(storedTx);
            }
        });
    }
}
