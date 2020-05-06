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
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';
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
    EXPECTED_MINED_SEC,
    ONE_SECOND_MS,
    TX_HASH_RESPONSE_WAIT_TIME_MS,
} from '../constants';
import { TransactionEntity } from '../entities';
import { PostTransactionResponse, TransactionStates, ZeroExTransactionWithoutDomain } from '../types';
import { utils } from '../utils/utils';

export class SignerService {
    private readonly _provider: SupportedProvider;
    private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _devUtils: DevUtilsContract;
    private readonly _transactionEntityRepository: Repository<TransactionEntity>;

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
        this._devUtils = new DevUtilsContract(this._contractWrappers.contractAddresses.devUtils, this._provider);
        this._transactionEntityRepository = dbConnection.getRepository(TransactionEntity);
    }
    public async validateZeroExTransactionFillAsync(
        zeroExTransaction: ZeroExTransactionWithoutDomain,
        signature: string,
    ): Promise<BigNumber> {
        // Verify 0x txn won't expire in next 60 seconds
        // tslint:disable-next-line:custom-no-magic-numbers
        const sixtySecondsFromNow = new BigNumber(Math.floor(new Date().getTime() / ONE_SECOND_MS) + 60);
        if (zeroExTransaction.expirationTimeSeconds.lte(sixtySecondsFromNow)) {
            throw new Error('zeroExTransaction expirationTimeSeconds in less than 60 seconds from now');
        }

        const decodedArray = await this._devUtils.decodeZeroExTransactionData(zeroExTransaction.data).callAsync();
        const orders = decodedArray[1];

        // Verify orders don't expire in next 60 seconds
        orders.forEach(order => {
            if (order.expirationTimeSeconds.lte(sixtySecondsFromNow)) {
                throw new Error('Order included in zeroExTransaction expires in less than 60 seconds from now');
            }
        });

        const gasPrice = zeroExTransaction.gasPrice;
        const currentFastGasPrice = await this._getGasPriceFromGasStationOrThrowAsync();
        // Make sure gasPrice is not 3X the current fast EthGasStation gas price
        // tslint:disable-next-line:custom-no-magic-numbers
        if (currentFastGasPrice.lt(gasPrice) && gasPrice.minus(currentFastGasPrice).gt(currentFastGasPrice.times(3))) {
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
    public async getZeroExTransactionHashFromZeroExTransactionAsync(
        zeroExTransaction: ZeroExTransactionWithoutDomain,
    ): Promise<string> {
        return this._devUtils
            .getTransactionHash(
                zeroExTransaction,
                new BigNumber(CHAIN_ID),
                this._contractWrappers.contractAddresses.exchange,
            )
            .callAsync();
    }
    public async generatePartialExecuteTransactionEthereumTransactionAsync(
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
            gasPrice: web3WrapperUtils.encodeAmountAsHexString(gasPrice),
            value: web3WrapperUtils.encodeAmountAsHexString(protocolFee),
            to: this._contractWrappers.exchange.address,
            chainId: CHAIN_ID,
            // NOTE we arent returning nonce and from fields back to the user
            nonce: '',
            from: '',
        };

        return ethereumTxnParams;
    }
    public async submitZeroExTransactionAsync(
        zeroExTransactionHash: string,
        zeroExTransaction: ZeroExTransactionWithoutDomain,
        signature: string,
        protocolFee: BigNumber,
    ): Promise<PostTransactionResponse> {
        const transactionEntity = TransactionEntity.make({
            refHash: zeroExTransactionHash,
            status: TransactionStates.Unsubmitted,
            takerAddress: zeroExTransaction.signerAddress,
            zeroExTransaction,
            zeroExTransactionSignature: signature,
            protocolFee,
            gasPrice: zeroExTransaction.gasPrice,
            expectedMinedInSec: EXPECTED_MINED_SEC,
        });
        await this._transactionEntityRepository.save(transactionEntity);
        const { ethereumTransactionHash, signedEthereumTransaction } = await this._waitUntilTxHashAsync(
            transactionEntity,
        );
        return {
            ethereumTransactionHash,
            signedEthereumTransaction,
        };
    }
    private async _waitUntilTxHashAsync(
        txEntity: TransactionEntity,
    ): Promise<{ ethereumTransactionHash: string; signedEthereumTransaction: string }> {
        return utils.runWithTimeout(async () => {
            while (true) {
                const tx = await this._transactionEntityRepository.findOne(txEntity.refHash);
                if (
                    tx !== undefined &&
                    tx.status === TransactionStates.Submitted &&
                    tx.txHash !== undefined &&
                    tx.signedTx !== undefined
                ) {
                    return { ethereumTransactionHash: tx.txHash, signedEthereumTransaction: tx.signedTx };
                }

                await utils.delayAsync(200);
            }
        }, TX_HASH_RESPONSE_WAIT_TIME_MS);
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
