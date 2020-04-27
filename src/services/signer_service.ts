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
import { BigNumber, providerUtils, RevertError } from '@0x/utils';
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
    EXPECTED_MINED_IN_S,
    SIGNER_POLLING_INTERVAL_IN_MS,
    UNSTICKING_TRANSACTION_GAS_MULTIPLIER,
} from '../constants';
import { TransactionEntity } from '../entities';
import { logger } from '../logger';
import { PostTransactionResponse, TransactionStates, ZeroExTransactionWithoutDomain } from '../types';
import { utils } from '../utils/utils';

export class SignerService {
    private readonly _provider: SupportedProvider;
    private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _devUtils: DevUtilsContract;
    private readonly _transactionEntityRepository: Repository<TransactionEntity>;
    private readonly _privateKeyBuffer: Buffer;

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
        // tslint:disable-next-line
        this._watchForStuckTransactionsAsync();
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
        const signedEthereumTransaction = await this._privateWalletSubprovider.signTransactionAsync(ethereumTxnParams);
        // HACK(oskar) - we use EthereumTx directly to get the hash of the
        // underlying transaction to store it as unsubmitted before we broadcast
        // it. We do it after calling `signTransactionAsync` because web3Wrapper
        // does some checks for txParams.
        const tx = new EthereumTx(ethereumTxnParams);
        tx.sign(this._privateKeyBuffer, true);
        const txHash = tx.hash() as Buffer;
        const txHashHex = `0x${txHash.toString('hex')}`;
        const transactionEntity = new TransactionEntity({
            hash: txHashHex,
            status: TransactionStates.Unsubmitted,
            nonce: ethereumTxnParams.nonce,
            gasPrice: zeroExTransaction.gasPrice.toString(),
            metaTxnRelayerAddress: META_TXN_RELAY_ADDRESS,
            expectedMinedInSec: EXPECTED_MINED_IN_S,
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
        await this._updateTransactionEntityToSubmittedAsync(txHashHex);
        return {
            ethereumTransactionHash,
            signedEthereumTransaction,
        };
    }
    private async _watchForStuckTransactionsAsync(): Promise<void> {
        while (true) {
            logger.trace('watching for stuck transactions');
            try {
                // NOTE(oskar): we currently cancel all transactions that are in the
                // "stuck" state. A better solution might be to unstick
                // transactions one by one and observing if they unstick the
                // subsequent transactions.
                const stuckTransactions = await this._transactionEntityRepository.find({
                    where: { status: TransactionStates.Stuck },
                });
                const targetGasPrice = await this._getGasPriceFromGasStationOrThrowAsync();
                for (const tx of stuckTransactions) {
                    try {
                        await this._unstickTransactionAsync(
                            tx,
                            targetGasPrice.multipliedBy(new BigNumber(UNSTICKING_TRANSACTION_GAS_MULTIPLIER)),
                        );
                    } catch (err) {
                        logger.error(`failed to unstick transaction ${tx.hash}`, { err });
                    }
                }
            } catch (err) {
                logger.error('failed to query stuck transactions', { err });
            }
            await utils.delay(SIGNER_POLLING_INTERVAL_IN_MS);
        }
    }
    private async _unstickTransactionAsync(tx: TransactionEntity, gasPrice: BigNumber): Promise<string> {
        const ethereumTxnParams: PartialTxParams = {
            from: META_TXN_RELAY_ADDRESS,
            to: META_TXN_RELAY_ADDRESS,
            value: web3WrapperUtils.encodeAmountAsHexString(0),
            nonce: tx.nonce,
            chainId: CHAIN_ID,
            gasPrice: web3WrapperUtils.encodeAmountAsHexString(gasPrice),
            gas: web3WrapperUtils.encodeAmountAsHexString(ETH_TRANSFER_GAS_LIMIT),
        };
        const ethTx = new EthereumTx(ethereumTxnParams);
        ethTx.sign(this._privateKeyBuffer, true);
        const txHash = ethTx.hash() as Buffer;
        const txHashHex = `0x${txHash.toString('hex')}`;
        const transactionEntity = new TransactionEntity({
            hash: txHashHex,
            status: TransactionStates.Unsubmitted,
            nonce: tx.nonce,
            gasPrice: gasPrice.toString(),
            metaTxnRelayerAddress: META_TXN_RELAY_ADDRESS,
            expectedMinedInSec: EXPECTED_MINED_IN_S,
        });
        await this._transactionEntityRepository.save(transactionEntity);
        const rawTx = `0x${ethTx.serialize().toString('hex')}`;
        await this._web3Wrapper.sendRawPayloadAsync({
            method: 'eth_sendRawTransaction',
            params: [rawTx],
        });
        await this._updateTransactionEntityToSubmittedAsync(txHashHex);
        transactionEntity.status = TransactionStates.Submitted;
        await this._transactionEntityRepository.save(transactionEntity);
        return txHashHex;
    }
    private async _updateTransactionEntityToSubmittedAsync(txHash: string): Promise<boolean> {
        // if the transaction was not updated in the meantime, we change its status to Submitted.
        try {
            await this._transactionEntityRepository.manager.transaction(async transactionEntityManager => {
                const repo = transactionEntityManager.getRepository(TransactionEntity);
                const newTx = await repo.findOne(txHash);
                if (newTx !== undefined && newTx.status === TransactionStates.Unsubmitted) {
                    newTx.status = TransactionStates.Submitted;
                    await transactionEntityManager.save(newTx);
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
