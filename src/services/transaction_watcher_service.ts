import { SupportedProvider, Web3Wrapper } from '@0x/web3-wrapper';
import { Connection, Not, Repository } from 'typeorm';

import { TX_WATCHER_POLLING_INTERVAL_MS } from '../constants';
import { TransactionEntity } from '../entities';
import { logger } from '../logger';
import { TransactionStates } from '../types';
import { utils } from '../utils/utils';

export class TransactionWatcherService {
    private readonly _transactionRepository: Repository<TransactionEntity>;
    private readonly _provider: SupportedProvider;
    private readonly _web3Wrapper: Web3Wrapper;

    constructor(dbConnection: Connection, provider: SupportedProvider) {
        this._transactionRepository = dbConnection.getRepository(TransactionEntity);
        this._provider = provider;
        this._web3Wrapper = new Web3Wrapper(this._provider);
    }
    public async startAsync(): Promise<void> {
        while (true) {
            logger.trace('syncing transaction status');
            try {
                await this.syncTransactionStatusAsync();
            } catch (err) {
                logger.error({ message: `order watcher failed to sync transaction status`, err: err.stack });
            }
            await utils.delay(TX_WATCHER_POLLING_INTERVAL_MS);
        }
    }
    public async syncTransactionStatusAsync(): Promise<void> {
        const transactionsToCheck = await this._transactionRepository.find({
            where: [
                { status: TransactionStates.Unsubmitted },
                { status: TransactionStates.Submitted },
                { status: TransactionStates.Mempool },
                { status: TransactionStates.Stuck },
            ],
        });
        logger.trace(`found ${transactionsToCheck.length} transactions to check status`);
        for (const tx of transactionsToCheck) {
            await this._findTransactionStatusAndUpdateAsync(tx);
        }
    }
    private async _findTransactionStatusAndUpdateAsync(txEntity: TransactionEntity): Promise<TransactionEntity> {
        // TODO(oskar) - LessThan does not work on dates in TypeORM queries,
        // ref: https://github.com/typeorm/typeorm/issues/3959
        const now = new Date();
        const isExpired = txEntity.expectedAt <= now;
        try {
            const txInBlockchain = await this._web3Wrapper.getTransactionByHashAsync(txEntity.hash);
            if (txInBlockchain !== undefined && txInBlockchain !== null && txInBlockchain.hash !== undefined) {
                if (txInBlockchain.blockNumber !== null) {
                    logger.trace({
                        message: `a transaction with a ${
                            txEntity.status
                        } status is already on the blockchain, updating status to confirmed`,
                        hash: txInBlockchain.hash,
                    });
                    txEntity.status = TransactionStates.Confirmed;
                    txEntity.blockNumber = txInBlockchain.blockNumber;
                    await this._transactionRepository.save(txEntity);
                    await this._abortTransactionsWithTheSameNonceAsync(txEntity);
                    return txEntity;
                    // Checks if the txn is in the mempool but still has it's status set to Unsubmitted or Submitted
                } else if (!isExpired && txEntity.status !== TransactionStates.Mempool) {
                    logger.trace({
                        message: `a transaction with a ${
                            txEntity.status
                        } status is pending, updating status to mempool`,
                        hash: txInBlockchain.hash,
                    });
                    txEntity.status = TransactionStates.Mempool;
                    return this._transactionRepository.save(txEntity);
                } else if (isExpired) {
                    // NOTE(oskar): we currently cancel all transactions that are in the
                    // "stuck" state. A better solution might be to unstick
                    // transactions one by one and observing if they unstick the
                    // subsequent transactions.
                    txEntity.status = TransactionStates.Stuck;
                    return this._transactionRepository.save(txEntity);
                }
            }
        } catch (err) {
            if (err instanceof TypeError) {
                // TODO(oskar) `getTransactionByHashAsync` throws a TypeError
                // when tx returned from `eth_getTransactionByHash` is null.
                if (isExpired) {
                    txEntity.status = TransactionStates.Dropped;
                    return this._transactionRepository.save(txEntity);
                }
            } else {
                // if the error is not from a typeerror, we rethrow
                throw err;
            }
        }
        return txEntity;
    }
    // Sets the transaction status to 'aborted' for transactions with the same nonce as the passed in txEntity
    private async _abortTransactionsWithTheSameNonceAsync(txEntity: TransactionEntity): Promise<TransactionEntity[]> {
        const transactionsToAbort = await this._transactionRepository.find({
            where: {
                nonce: txEntity.nonce,
                hash: Not(txEntity.hash),
                // if the transaction has already been marked as dropped, we can skip it
                status: Not(TransactionStates.Dropped),
            },
        });
        for (const tx of transactionsToAbort) {
            tx.status = TransactionStates.Aborted;
            await this._transactionRepository.save(tx);
        }

        return transactionsToAbort;
    }
}
