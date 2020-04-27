import { SupportedProvider, Web3Wrapper } from '@0x/web3-wrapper';
import { Connection, Repository } from 'typeorm';

import { TX_WATCHER_POLLING_INTERVAL_IN_MS } from '../constants';
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
            // finding transactions that need updating for which we have missed
            // notifications from blocknative.
            logger.trace('syncing transaciton status');
            try {
                await this.syncTransactionStatusAsync();
            } catch (err) {
                logger.error(`order watcher failed to sync transaction status`, { err: err.stack });
            }
            await utils.delay(TX_WATCHER_POLLING_INTERVAL_IN_MS);
        }
    }
    public async syncTransactionStatusAsync(): Promise<void> {
        await this._syncTransactionStatusAsync();
    }

    public async _syncTransactionStatusAsync(): Promise<void> {
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

    private async _findTransactionStatusAndUpdateAsync(tx: TransactionEntity): Promise<TransactionEntity> {
        // TODO(oskar) - we are checking expiry inline, because TypeORM failed
        // to work with LessThanOrEqual:
        // const now = new Date();
        // const transactionsToCheck = await this._transactionRepository.find({
        //     where: [
        //         {
        //             status: TransactionStates.Mempool,
        //             expiresAt: LessThanOrEqual(now),
        //         },
        //         {
        //             status: TransactionStates.Submitted,
        //             expiresAt: LessThanOrEqual(now),
        //         },
        //     ],
        // });
        const now = new Date();
        const isExpired = tx.expectedAt <= now;
        try {
            const txInBlockchain = await this._web3Wrapper.getTransactionByHashAsync(tx.hash);
            if (txInBlockchain !== undefined && txInBlockchain !== null && txInBlockchain.hash !== undefined) {
                if (txInBlockchain.blockNumber !== null) {
                    logger.info(
                        `a transaction with a ${
                            tx.status
                        } status is already on the blockchain, updating status to confirmed`,
                        { hash: txInBlockchain.hash },
                    );

                    tx.status = TransactionStates.Confirmed;
                    return this._saveTransactionAsync(tx);
                } else if (!isExpired && tx.status !== TransactionStates.Mempool) {
                    logger.info(`a transaction with a ${tx.status} status is pending, updating status to mempool`, {
                        hash: txInBlockchain.hash,
                    });
                    tx.status = TransactionStates.Mempool;
                    return this._saveTransactionAsync(tx);
                } else if (isExpired) {
                    tx.status = TransactionStates.Stuck;
                    return this._saveTransactionAsync(tx);
                }
            }
        } catch (err) {
            // TODO(oskar) this throws a type error when calling a tx that was
            // already dropped. Can we catch this specific error?
            // TypeError: Cannot read property 'blockNumber' of null
            // at Object.unmarshalTransaction (/Users/overmorrow/projects/0x/0x-api/node_modules/@0x/web3-wrapper/src/marshaller.ts:85:32)
            // at Web3Wrapper.<anonymous> (/Users/overmorrow/projects/0x/0x-api/node_modules/@0x/web3-wrapper/src/web3_wrapper.ts:253:40)
            // at step (/Users/overmorrow/projects/0x/0x-api/node_modules/@0x/web3-wrapper/lib/src/web3_wrapper.js:43:23)
            // at Object.next (/Users/overmorrow/projects/0x/0x-api/node_modules/@0x/web3-wrapper/lib/src/web3_wrapper.js:24:53)
            // at fulfilled (/Users/overmorrow/projects/0x/0x-api/node_modules/@0x/web3-wrapper/lib/src/web3_wrapper.js:15:58)
            // at process._tickCallback (internal/process/next_tick.js:68:7)
            if (isExpired) {
                tx.status = TransactionStates.Dropped;
                return this._saveTransactionAsync(tx);
            }
        }
        return tx;
    }
    private async _saveTransactionAsync(tx: TransactionEntity): Promise<TransactionEntity> {
        await this._transactionRepository.manager.transaction(async transactionalEntityManager => {
            const repo = transactionalEntityManager.getRepository(TransactionEntity);
            await repo.save(tx);
        });
        return tx;
    }
}
