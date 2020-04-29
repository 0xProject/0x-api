import { ContractWrappers } from '@0x/contract-wrappers';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { SupportedProvider } from '@0x/order-utils';
import {
    NonceTrackerSubprovider,
    PartialTxParams,
    PrivateKeyWalletSubprovider,
    RedundantSubprovider,
    RPCSubprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { BigNumber, intervalUtils, providerUtils, RevertError } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';
import EthereumTx = require('ethereumjs-tx');
import { Connection, Repository } from 'typeorm';

import {
    CHAIN_ID,
    ETHEREUM_RPC_URL,
    META_TXN_RELAY_ADDRESS,
    META_TXN_RELAY_PRIVATE_KEY,
    WHITELISTED_API_KEYS_META_TXN_SUBMIT,
} from '../config';
import {
    ETH_GAS_STATION_API_BASE_URL,
    ETH_TRANSFER_GAS_LIMIT,
    EXPECTED_MINED_SEC,
    STUCK_TX_POLLING_INTERVAL_MS,
    UNSTICKING_TRANSACTION_GAS_MULTIPLIER,
} from '../constants';
import { TransactionEntity } from '../entities';
import { logger } from '../logger';
import { PostTransactionResponse, TransactionStates, ZeroExTransactionWithoutDomain } from '../types';

export class SignerService {
    private readonly _provider: SupportedProvider;
    private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _devUtils: DevUtilsContract;
    private readonly _transactionEntityRepository: Repository<TransactionEntity>;
    private readonly _privateKeyBuffer: Buffer;
    private readonly _stuckTransactionWatcherTimer: NodeJS.Timer;

    public static isEligibleForFreeMetaTxn(apiKey: string): boolean {
        return WHITELISTED_API_KEYS_META_TXN_SUBMIT.includes(apiKey);
    }

    private static _createWeb3Provider(
        rpcHost: string,
        privateWalletSubprovider: PrivateKeyWalletSubprovider,
        nonceTrackerSubprovider: NonceTrackerSubprovider,
    ): SupportedProvider {
        const WEB3_RPC_RETRY_COUNT = 3;
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(nonceTrackerSubprovider);
        providerEngine.addProvider(privateWalletSubprovider);
        const rpcSubproviders = SignerService._range(WEB3_RPC_RETRY_COUNT).map(
            (_index: number) => new RPCSubprovider(rpcHost),
        );
        providerEngine.addProvider(new RedundantSubprovider(rpcSubproviders));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }
    private static _range(rangeCount: number): number[] {
        return [...Array(rangeCount).keys()];
    }
    private static _calculateProtocolFee(numOrders: number, gasPrice: BigNumber): BigNumber {
        return new BigNumber(150000).times(gasPrice).times(numOrders);
    }
    constructor(dbConnection: Connection) {
        this._privateWalletSubprovider = new PrivateKeyWalletSubprovider(META_TXN_RELAY_PRIVATE_KEY);
        this._nonceTrackerSubprovider = new NonceTrackerSubprovider();
        this._provider = SignerService._createWeb3Provider(
            ETHEREUM_RPC_URL,
            this._privateWalletSubprovider,
            this._nonceTrackerSubprovider,
        );
        this._contractWrappers = new ContractWrappers(this._provider, { chainId: CHAIN_ID });
        this._web3Wrapper = new Web3Wrapper(this._provider);
        this._devUtils = new DevUtilsContract(this._contractWrappers.contractAddresses.devUtils, this._provider);
        this._transactionEntityRepository = dbConnection.getRepository(TransactionEntity);
        this._privateKeyBuffer = Buffer.from(META_TXN_RELAY_PRIVATE_KEY, 'hex');
        this._stuckTransactionWatcherTimer = intervalUtils.setAsyncExcludingInterval(
            async () => {
                logger.trace('watching for stuck transactions');
                await this._checkForStuckTransactionsAsync();
            },
            STUCK_TX_POLLING_INTERVAL_MS,
            (err: Error) => {
                logger.error({
                    message: `stuck transaction watcher failed to check for stuck transactions`,
                    err: err.stack,
                });
            },
        );
    }
    public stopStuckTransactionWatcher(): void {
        intervalUtils.clearAsyncExcludingInterval(this._stuckTransactionWatcherTimer);
    }
    public async validateZeroExTransactionFillAsync(
        zeroExTransaction: ZeroExTransactionWithoutDomain,
        signature: string,
    ): Promise<BigNumber> {
        // Verify 0x txn won't expire in next 60 seconds
        // tslint:disable-next-line:custom-no-magic-numbers
        const sixtySecondsFromNow = new BigNumber(+new Date() + 60);
        if (zeroExTransaction.expirationTimeSeconds <= sixtySecondsFromNow) {
            throw new Error('zeroExTransaction expirationTimeSeconds in less than 60 seconds from now');
        }

        const decodedArray = await this._devUtils.decodeZeroExTransactionData(zeroExTransaction.data).callAsync();
        const orders = decodedArray[1];

        // Verify orders don't expire in next 60 seconds
        orders.forEach(order => {
            if (order.expirationTimeSeconds <= sixtySecondsFromNow) {
                throw new Error('Order included in zeroExTransaction expires in less than 60 seconds from now');
            }
        });

        const gasPrice = zeroExTransaction.gasPrice;
        const currentFastGasPrice = await this._getGasPriceFromGasStationOrThrowAsync();
        // Make sure gasPrice is not 3X the current fast EthGasStation gas price
        // tslint:disable-next-line:custom-no-magic-numbers
        if (currentFastGasPrice < gasPrice && gasPrice.minus(currentFastGasPrice) > currentFastGasPrice.times(3)) {
            throw new Error('Gas price too high');
        }

        const protocolFee = SignerService._calculateProtocolFee(orders.length, gasPrice);

        try {
            await this._contractWrappers.exchange.executeTransaction(zeroExTransaction, signature).callAsync({
                from: META_TXN_RELAY_ADDRESS,
                gasPrice,
                value: protocolFee,
            });
        } catch (err) {
            if (err.values && err.values.errorData && err.values.errorData !== '0x') {
                const decodedCallData = RevertError.decode(err.values.errorData, false);
                throw decodedCallData;
            }
            throw err;
        }

        return protocolFee;
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

        const executeTxnCalldata = await this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature)
            .getABIEncodedTransactionData();

        const ethereumTxnParams: PartialTxParams = {
            data: executeTxnCalldata,
            gas: web3WrapperUtils.encodeAmountAsHexString(gas),
            from: META_TXN_RELAY_ADDRESS,
            gasPrice: web3WrapperUtils.encodeAmountAsHexString(gasPrice),
            value: web3WrapperUtils.encodeAmountAsHexString(protocolFee),
            to: this._contractWrappers.exchange.address,
            nonce: await this._getNonceAsync(META_TXN_RELAY_ADDRESS),
            chainId: CHAIN_ID,
        };

        return ethereumTxnParams;
    }
    public async submitZeroExTransactionIfWhitelistedAsync(
        zeroExTransaction: ZeroExTransactionWithoutDomain,
        signature: string,
        protocolFee: BigNumber,
    ): Promise<PostTransactionResponse> {
        const ethereumTxnParams = await this.generateExecuteTransactionEthereumTransactionAsync(
            zeroExTransaction,
            signature,
            protocolFee,
        );
        // HACK(oskar): Using private method to validate txParams since it is
        // not yet exposed by the package.
        (PrivateKeyWalletSubprovider as any)._validateTxParams(ethereumTxnParams);
        const { signedEthereumTransaction, txHash } = this._getTransactionHashAndRawTxString(ethereumTxnParams);
        const transactionEntity = TransactionEntity.make({
            hash: txHash,
            status: TransactionStates.Unsubmitted,
            nonce: web3WrapperUtils.convertHexToNumber(ethereumTxnParams.nonce),
            gasPrice: zeroExTransaction.gasPrice,
            metaTxnRelayerAddress: META_TXN_RELAY_ADDRESS,
            expectedMinedInSec: EXPECTED_MINED_SEC,
        });
        await this._transactionEntityRepository.save(transactionEntity);
        const ethereumTransactionHash = await this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature)
            .sendTransactionAsync(
                {
                    from: META_TXN_RELAY_ADDRESS,
                    gasPrice: zeroExTransaction.gasPrice,
                    value: protocolFee,
                },
                {
                    shouldValidate: false,
                },
            );
        await this._updateTransactionEntityToSubmittedAsync(txHash);
        return {
            ethereumTransactionHash,
            signedEthereumTransaction,
        };
    }
    private async _checkForStuckTransactionsAsync(): Promise<void> {
        const stuckTransactions = await this._transactionEntityRepository.find({
            where: { status: TransactionStates.Stuck },
        });
        if (stuckTransactions.length === 0) {
            return;
        }
        const gasStationPrice = await this._getGasPriceFromGasStationOrThrowAsync();
        const targetGasPrice = gasStationPrice.multipliedBy(UNSTICKING_TRANSACTION_GAS_MULTIPLIER);
        for (const tx of stuckTransactions) {
            try {
                await this._unstickTransactionAsync(tx, targetGasPrice);
            } catch (err) {
                logger.error(`failed to unstick transaction ${tx.hash}`, { err });
            }
        }
    }
    private async _unstickTransactionAsync(tx: TransactionEntity, gasPrice: BigNumber): Promise<string> {
        const ethereumTxnParams: PartialTxParams = {
            from: META_TXN_RELAY_ADDRESS,
            to: META_TXN_RELAY_ADDRESS,
            value: web3WrapperUtils.encodeAmountAsHexString(0),
            nonce: web3WrapperUtils.encodeAmountAsHexString(tx.nonce),
            chainId: CHAIN_ID,
            gasPrice: web3WrapperUtils.encodeAmountAsHexString(gasPrice),
            gas: web3WrapperUtils.encodeAmountAsHexString(ETH_TRANSFER_GAS_LIMIT),
        };
        const { signedEthereumTransaction, txHash } = this._getTransactionHashAndRawTxString(ethereumTxnParams);
        const transactionEntity = TransactionEntity.make({
            hash: txHash,
            status: TransactionStates.Unsubmitted,
            nonce: tx.nonce,
            gasPrice,
            metaTxnRelayerAddress: META_TXN_RELAY_ADDRESS,
            expectedMinedInSec: EXPECTED_MINED_SEC,
        });
        await this._transactionEntityRepository.save(transactionEntity);
        await this._web3Wrapper.sendRawPayloadAsync({
            method: 'eth_sendRawTransaction',
            params: [signedEthereumTransaction],
        });
        await this._updateTransactionEntityToSubmittedAsync(txHash);
        return txHash;
    }
    private async _updateTransactionEntityToSubmittedAsync(txHash: string): Promise<boolean> {
        // if the transaction was not updated in the meantime, we change its status to Submitted.
        try {
            await this._transactionEntityRepository.manager.transaction(async transactionEntityManager => {
                const repo = transactionEntityManager.getRepository(TransactionEntity);
                const txn = await repo.findOne(txHash);
                if (txn !== undefined && txn.status === TransactionStates.Unsubmitted) {
                    txn.status = TransactionStates.Submitted;
                    await transactionEntityManager.save(txn);
                }
            });
            return true;
        } catch (err) {
            // the TransacitonEntity was updated in the meantime. This will
            // rollback the database transaction.
            logger.warn('failed to store transaction with submitted status, rolling back', { err });
        }

        return false;
    }
    private _getTransactionHashAndRawTxString(
        ethereumTxnParams: PartialTxParams,
    ): { signedEthereumTransaction: string; txHash: string } {
        const tx = new EthereumTx(ethereumTxnParams);
        tx.sign(this._privateKeyBuffer, true);
        const txHashBuffer = tx.hash();
        const txHash = `0x${txHashBuffer.toString('hex')}`;
        const signedEthereumTransaction = `0x${tx.serialize().toString('hex')}`;
        return { signedEthereumTransaction, txHash };
    }
    private async _getNonceAsync(senderAddress: string): Promise<string> {
        // HACK(fabio): NonceTrackerSubprovider doesn't expose the subsequent nonce
        // to use so we fetch it from it's private instance variable
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
