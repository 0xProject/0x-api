import { ContractWrappers } from '@0x/contract-wrappers';
import {
    NonceTrackerSubprovider,
    PartialTxParams,
    PrivateKeyWalletSubprovider,
    RedundantSubprovider,
    RPCSubprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { BigNumber, intervalUtils, providerUtils } from '@0x/utils';
import { SupportedProvider, Web3Wrapper } from '@0x/web3-wrapper';
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';
import EthereumTx = require('ethereumjs-tx');
import { Connection, Not, Repository } from 'typeorm';

import { CHAIN_ID, ETHEREUM_RPC_URL, META_TXN_RELAY_ADDRESS, META_TXN_RELAY_PRIVATE_KEY } from '../config';
import {
    ETH_GAS_STATION_API_BASE_URL,
    ETH_TRANSFER_GAS_LIMIT,
    EXPECTED_MINED_SEC,
    ONE_SECOND_MS,
    TX_WATCHER_POLLING_INTERVAL_MS,
    UNSTICKING_TRANSACTION_GAS_MULTIPLIER,
} from '../constants';
import { TransactionEntity } from '../entities';
import { logger } from '../logger';
import { TransactionStates, ZeroExTransactionWithoutDomain } from '../types';

export class TransactionWatcherService {
    private readonly _transactionRepository: Repository<TransactionEntity>;
    private readonly _provider: SupportedProvider;
    private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _transactionWatcherTimer: NodeJS.Timer;
    private readonly _privateKeyBuffer: Buffer;
    private readonly _publicAddress: string;

    private static _createWeb3Provider(
        rpcHost: string,
        privateWalletSubprovider: PrivateKeyWalletSubprovider,
        nonceTrackerSubprovider: NonceTrackerSubprovider,
    ): SupportedProvider {
        const WEB3_RPC_RETRY_COUNT = 3;
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(nonceTrackerSubprovider);
        providerEngine.addProvider(privateWalletSubprovider);
        const rpcSubproviders = TransactionWatcherService._range(WEB3_RPC_RETRY_COUNT).map(
            (_index: number) => new RPCSubprovider(rpcHost),
        );
        providerEngine.addProvider(new RedundantSubprovider(rpcSubproviders));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }

    private static _range(rangeCount: number): number[] {
        return [...Array(rangeCount).keys()];
    }

    constructor(dbConnection: Connection) {
        this._privateWalletSubprovider = new PrivateKeyWalletSubprovider(META_TXN_RELAY_PRIVATE_KEY);
        this._nonceTrackerSubprovider = new NonceTrackerSubprovider();
        this._provider = TransactionWatcherService._createWeb3Provider(
            ETHEREUM_RPC_URL,
            this._privateWalletSubprovider,
            this._nonceTrackerSubprovider,
        );
        this._transactionRepository = dbConnection.getRepository(TransactionEntity);
        this._contractWrappers = new ContractWrappers(this._provider, { chainId: CHAIN_ID });
        this._web3Wrapper = new Web3Wrapper(this._provider);
        this._privateKeyBuffer = Buffer.from(META_TXN_RELAY_PRIVATE_KEY, 'hex');
        this._publicAddress = META_TXN_RELAY_ADDRESS;
        this._transactionWatcherTimer = intervalUtils.setAsyncExcludingInterval(
            async () => {
                logger.trace('syncing transaction status');
                await this.syncTransactionStatusAsync();
            },
            TX_WATCHER_POLLING_INTERVAL_MS,
            (err: Error) => {
                logger.error({
                    message: `transaction watcher failed to sync transaction status: ${JSON.stringify(err)}`,
                    err: err.stack,
                });
            },
        );
    }
    public stop(): void {
        intervalUtils.clearAsyncExcludingInterval(this._transactionWatcherTimer);
    }
    public async syncTransactionStatusAsync(): Promise<void> {
        await this._signAndBroadcastTransactionsAsync();
        await this._syncBroadcastedTransactionStatusAsync();
        await this._checkForStuckTransactionsAsync();
    }
    public async generateExecuteTransactionEthereumTransactionAsync(
        zeroExTransaction: ZeroExTransactionWithoutDomain,
        signature: string,
        protocolFee: BigNumber,
    ): Promise<PartialTxParams> {
        const gasPrice = zeroExTransaction.gasPrice;
        // TODO(dekz): our pattern is to eth_call and estimateGas in parallel and return the result of eth_call validations
        const gas = await this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature)
            .estimateGasAsync({
                from: META_TXN_RELAY_ADDRESS,
                gasPrice,
                value: protocolFee,
            });

        const executeTxnCalldata = this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature)
            .getABIEncodedTransactionData();

        const ethereumTxnParams: PartialTxParams = {
            data: executeTxnCalldata,
            gas: web3WrapperUtils.encodeAmountAsHexString(gas),
            from: this._publicAddress,
            gasPrice: web3WrapperUtils.encodeAmountAsHexString(gasPrice),
            value: web3WrapperUtils.encodeAmountAsHexString(protocolFee),
            to: this._contractWrappers.exchange.address,
            nonce: await this._getNonceAsync(META_TXN_RELAY_ADDRESS),
            chainId: CHAIN_ID,
        };

        return ethereumTxnParams;
    }
    private async _signAndBroadcastMetaTxAsync(txEntity: TransactionEntity): Promise<void> {
        // TODO(oskar) refactor with type guards?
        if (txEntity.protocolFee === undefined) {
            throw new Error('txEntity is missing protocolFee');
        }
        if (txEntity.zeroExTransaction === undefined) {
            throw new Error('txEntity is missing zeroExTransaction');
        }
        if (txEntity.zeroExTransactionSignature === undefined) {
            throw new Error('txEntity is missing zeroExTransactionSignature');
        }
        const ethereumTxnParams = await this.generateExecuteTransactionEthereumTransactionAsync(
            txEntity.zeroExTransaction,
            txEntity.zeroExTransactionSignature,
            txEntity.protocolFee,
        );
        const signedEthereumTransaction = await this._privateWalletSubprovider.signTransactionAsync(ethereumTxnParams);
        const ethereumTransactionHash = await this._contractWrappers.exchange
            .executeTransaction(txEntity.zeroExTransaction, txEntity.zeroExTransactionSignature)
            .sendTransactionAsync(
                {
                    from: this._publicAddress,
                    gasPrice: txEntity.gasPrice,
                    value: txEntity.protocolFee,
                },
                { shouldValidate: false },
            );
        txEntity.status = TransactionStates.Submitted;
        txEntity.txHash = ethereumTransactionHash;
        txEntity.signedTx = signedEthereumTransaction;
        txEntity.nonce = web3WrapperUtils.convertHexToNumber(ethereumTxnParams.nonce);
        txEntity.from = ethereumTxnParams.from;
        await this._transactionRepository.save(txEntity);
    }
    private async _syncBroadcastedTransactionStatusAsync(): Promise<void> {
        const transactionsToCheck = await this._transactionRepository.find({
            where: [
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
        // TODO(oskar) - LessThanOrEqual and LessThan do not work on dates in
        // TypeORM queries, ref: https://github.com/typeorm/typeorm/issues/3959
        const latestBlockDate = await this._getLatestBlockDateAsync();
        const isExpired = txEntity.expectedAt <= latestBlockDate;
        if (txEntity.txHash === undefined) {
            logger.warn('missing txHash for transaction entity');
            return txEntity;
        }
        try {
            const txInBlockchain = await this._web3Wrapper.getTransactionByHashAsync(txEntity.txHash);
            if (txInBlockchain !== undefined && txInBlockchain !== null && txInBlockchain.hash !== undefined) {
                if (txInBlockchain.blockNumber !== null) {
                    logger.trace({
                        message: `a transaction with a ${
                            txEntity.status
                        } status is already on the blockchain, updating status to TransactionStates.Confirmed`,
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
                        } status is pending, updating status to TransactionStates.Mempool`,
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
                // HACK(oskar): web3Wrapper.getTransactionByHashAsync throws a
                // TypeError if the Ethereum node cannot find the transaction
                // and returns NULL instead of the transaction object. We
                // therefore use this to detect this case until @0x/web3-wrapper
                // is fixed.
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
                txHash: Not(txEntity.txHash),
                from: txEntity.from,
            },
        });
        for (const tx of transactionsToAbort) {
            tx.status = TransactionStates.Aborted;
            await this._transactionRepository.save(tx);
        }

        return transactionsToAbort;
    }
    private async _getLatestBlockDateAsync(): Promise<Date> {
        const latestBlockTimestamp = await this._web3Wrapper.getBlockTimestampAsync('latest');
        return new Date(latestBlockTimestamp * ONE_SECOND_MS);
    }
    private async _getNonceAsync(senderAddress: string): Promise<string> {
        // HACK(fabio): NonceTrackerSubprovider doesn't expose the subsequent nonce
        // to use so we fetch it from its private instance variable
        let nonce = (this._nonceTrackerSubprovider as any)._nonceCache[senderAddress];
        if (nonce === undefined) {
            nonce = await this._getTransactionCountAsync(senderAddress);
        }
        return nonce;
    }
    private async _getTransactionCountAsync(address: string): Promise<string> {
        const nonceHex = await this._web3Wrapper.sendRawPayloadAsync<string>({
            method: 'eth_getTransactionCount',
            params: [address, 'pending'],
        });
        return nonceHex;
    }
    private async _signAndBroadcastTransactionsAsync(): Promise<void> {
        const unsignedTransactions = await this._transactionRepository.find({
            where: [{ status: TransactionStates.Unsubmitted }],
        });
        logger.trace(`found ${unsignedTransactions.length} transactions to sign and broadcast`);
        for (const tx of unsignedTransactions) {
            await this._signAndBroadcastMetaTxAsync(tx);
        }
    }
    private async _unstickTransactionAsync(tx: TransactionEntity, gasPrice: BigNumber): Promise<string> {
        if (tx.nonce === undefined) {
            throw new Error(`failed to unstick transaction ${tx.txHash} nonce is undefined`);
        }
        const ethereumTxnParams: PartialTxParams = {
            from: META_TXN_RELAY_ADDRESS,
            to: META_TXN_RELAY_ADDRESS,
            value: web3WrapperUtils.encodeAmountAsHexString(0),
            nonce: web3WrapperUtils.encodeAmountAsHexString(tx.nonce),
            chainId: CHAIN_ID,
            gasPrice: web3WrapperUtils.encodeAmountAsHexString(gasPrice),
            gas: web3WrapperUtils.encodeAmountAsHexString(ETH_TRANSFER_GAS_LIMIT),
        };
        const { signedEthereumTransaction, txHash } = this._getSignedTxHashAndRawTxString(ethereumTxnParams);
        const transactionEntity = TransactionEntity.make({
            refHash: txHash,
            txHash,
            status: TransactionStates.Unsubmitted,
            nonce: tx.nonce,
            gasPrice,
            from: META_TXN_RELAY_ADDRESS,
            expectedMinedInSec: EXPECTED_MINED_SEC,
        });
        await this._transactionRepository.save(transactionEntity);
        await this._web3Wrapper.sendRawPayloadAsync({
            method: 'eth_sendRawTransaction',
            params: [signedEthereumTransaction],
        });
        await this._updateTransactionEntityToSubmittedAsync(txHash);
        return txHash;
    }
    private async _updateTransactionEntityToSubmittedAsync(txHash: string): Promise<void> {
        // if the transaction was not updated in the meantime, we change its status to Submitted.
        try {
            await this._transactionRepository.manager.transaction(async transactionEntityManager => {
                const repo = transactionEntityManager.getRepository(TransactionEntity);
                const txn = await repo.findOne(txHash);
                if (txn !== undefined && txn.status === TransactionStates.Unsubmitted) {
                    txn.status = TransactionStates.Submitted;
                    await transactionEntityManager.save(txn);
                }
            });
        } catch (err) {
            // the TransacitonEntity was updated in the meantime. This will
            // rollback the database transaction.
            logger.warn('failed to store transaction with submitted status, rolling back', { err });
        }
    }
    /**
     * creates a transaction and signs it with the private key of SignerService.
     * @param ethereumTxnParams transaction parameters
     * @return the SIGNED raw ethereum transaction and transaction hash
     */
    private _getSignedTxHashAndRawTxString(
        ethereumTxnParams: PartialTxParams,
    ): { signedEthereumTransaction: string; txHash: string } {
        const tx = new EthereumTx(ethereumTxnParams);
        tx.sign(this._privateKeyBuffer, true);
        const txHashBuffer = tx.hash();
        const txHash = `0x${txHashBuffer.toString('hex')}`;
        const signedEthereumTransaction = `0x${tx.serialize().toString('hex')}`;
        return { signedEthereumTransaction, txHash };
    }
    private async _checkForStuckTransactionsAsync(): Promise<void> {
        const stuckTransactions = await this._transactionRepository.find({
            where: { status: TransactionStates.Stuck },
        });
        if (stuckTransactions.length === 0) {
            return;
        }
        const gasStationPrice = await this._getGasPriceFromGasStationOrThrowAsync();
        const targetGasPrice = gasStationPrice.multipliedBy(UNSTICKING_TRANSACTION_GAS_MULTIPLIER);
        for (const tx of stuckTransactions) {
            if (tx.gasPrice !== undefined && tx.gasPrice.isGreaterThanOrEqualTo(targetGasPrice)) {
                logger.warn({
                    message:
                        'unsticking of transaction skipped as the targetGasPrice is less than or equal to the gas price it was submitted with',
                    txHash: tx.txHash,
                    txGasPrice: tx.gasPrice,
                    targetGasPrice,
                });
                continue;
            }
            try {
                await this._unstickTransactionAsync(tx, targetGasPrice);
            } catch (err) {
                logger.error(`failed to unstick transaction ${tx.txHash}`, { err });
            }
        }
    }
    // tslint:disable-next-line: prefer-function-over-method
    private async _getGasPriceFromGasStationOrThrowAsync(): Promise<BigNumber> {
        try {
            const res = await fetch(`${ETH_GAS_STATION_API_BASE_URL}/json/ethgasAPI.json`);
            const gasInfo = await res.json();
            // Eth Gas Station result is gwei * 10
            // tslint:disable-next-line:custom-no-magic-numbers
            const BASE_TEN = 10;
            const gasPriceGwei = new BigNumber(gasInfo.fast / BASE_TEN);
            // tslint:disable-next-line:custom-no-magic-numbers
            const unit = new BigNumber(BASE_TEN).pow(9);
            const gasPriceWei = unit.times(gasPriceGwei);
            return gasPriceWei;
        } catch (e) {
            throw new Error('Failed to fetch gas price from EthGasStation');
        }
    }
}
