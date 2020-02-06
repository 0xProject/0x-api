import {
    SwapQuoter,
} from '@0x/asset-swapper';
import { ContractWrappers } from '@0x/contract-wrappers';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { generatePseudoRandomSalt, SupportedProvider, ZeroExTransaction } from '@0x/order-utils';
import { NonceTrackerSubprovider, PartialTxParams, PrivateKeyWalletSubprovider, RedundantSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber, providerUtils, RevertError } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { ASSET_SWAPPER_MARKET_ORDERS_OPTS, CHAIN_ID, ETHEREUM_RPC_URL, MESH_WEBSOCKET_URI } from '../config';
import { ONE_SECOND_MS, SENDER_ADDRESS, SENDER_PRIVATE_KEY, TEN_MINUTES_MS } from '../constants';
import { CalculateMetaTransactionQuoteParams, GetMetaTransactionQuoteResponse, PostTransactionResponse, ZeroExTransactionWithoutDomain } from '../types';
import { serviceUtils } from '../utils/service_utils';
import { utils } from '../utils/utils';

export class MetaTransactionService {
    private readonly _provider: SupportedProvider;
    private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _swapQuoter: SwapQuoter;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;

    private static _createWeb3Provider(rpcHost: string, privateWalletSubprovider: PrivateKeyWalletSubprovider, nonceTrackerSubprovider: NonceTrackerSubprovider): SupportedProvider {
        const WEB3_RPC_RETRY_COUNT = 3;
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(nonceTrackerSubprovider);
        providerEngine.addProvider(privateWalletSubprovider);
        const rpcSubproviders = MetaTransactionService._range(WEB3_RPC_RETRY_COUNT).map((_index: number) => new RPCSubprovider(rpcHost));
        providerEngine.addProvider(new RedundantSubprovider(rpcSubproviders));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }
    private static _range(rangeCount: number): number[] {
        return [...Array(rangeCount).keys()];
    }
    private static readonly _calculateProtocolFee = (numOrders: number, gasPrice: BigNumber): BigNumber => {
        return new BigNumber(150000).times(gasPrice).times(numOrders);
    }
    constructor() {
        this._privateWalletSubprovider = new PrivateKeyWalletSubprovider(SENDER_PRIVATE_KEY);
        this._nonceTrackerSubprovider = new NonceTrackerSubprovider();
        this._provider = MetaTransactionService._createWeb3Provider(ETHEREUM_RPC_URL, this._privateWalletSubprovider, this._nonceTrackerSubprovider);
        const swapQuoterOpts = {
            chainId: CHAIN_ID,
        };
        this._swapQuoter = SwapQuoter.getSwapQuoterForMeshEndpoint(this._provider, MESH_WEBSOCKET_URI, swapQuoterOpts);
        this._contractWrappers = new ContractWrappers(this._provider, { chainId: CHAIN_ID });
        this._web3Wrapper = new Web3Wrapper(this._provider);
    }
    public async calculateMetaTransactionQuoteAsync(params: CalculateMetaTransactionQuoteParams): Promise<GetMetaTransactionQuoteResponse> {
        const {
            takerAddress,
            sellAmount,
            buyAmount,
            buyTokenAddress,
            sellTokenAddress,
            slippagePercentage,
        } = params;

        // generate txData for marketSellOrdersFillOrKill or marketBuyOrdersFillOrKill
        const assetSwapperOpts = {
            slippagePercentage,
            ...ASSET_SWAPPER_MARKET_ORDERS_OPTS,
        };
        let txData;
        let orders;
        let makerAssetAmount;
        let totalTakerAssetAmount;
        if (sellAmount !== undefined) {
            const marketSellSwapQuote = await this._swapQuoter.getMarketSellSwapQuoteAsync(
                buyTokenAddress,
                sellTokenAddress,
                sellAmount,
                assetSwapperOpts,
            );
            makerAssetAmount = marketSellSwapQuote.bestCaseQuoteInfo.makerAssetAmount;
            totalTakerAssetAmount = marketSellSwapQuote.bestCaseQuoteInfo.totalTakerAssetAmount;
            const attributedSwapQuote = serviceUtils.attributeSwapQuoteOrders(marketSellSwapQuote);
            orders = attributedSwapQuote.orders;
            const signatures = orders.map(order => order.signature);
            txData = this._contractWrappers.exchange
                .marketSellOrdersFillOrKill(orders, sellAmount, signatures)
                .getABIEncodedTransactionData();
        } else if (buyAmount !== undefined) {
            const marketBuySwapQuote = await this._swapQuoter.getMarketBuySwapQuoteAsync(
                buyTokenAddress,
                sellTokenAddress,
                buyAmount,
                assetSwapperOpts,
            );
            makerAssetAmount = marketBuySwapQuote.bestCaseQuoteInfo.makerAssetAmount;
            totalTakerAssetAmount = marketBuySwapQuote.bestCaseQuoteInfo.totalTakerAssetAmount;
            const attributedSwapQuote = serviceUtils.attributeSwapQuoteOrders(marketBuySwapQuote);
            orders = attributedSwapQuote.orders;
            const signatures = orders.map(order => order.signature);
            txData = this._contractWrappers.exchange
                .marketBuyOrdersFillOrKill(orders, buyAmount, signatures)
                .getABIEncodedTransactionData();
        } else {
            throw new Error('sellAmount or buyAmount required');
        }
        // generate the zeroExTransaction object
        const takerTransactionSalt = generatePseudoRandomSalt();
        const gasPrice = new BigNumber(40000000000); // 40 gwei
        const expirationTimeSeconds = new BigNumber(Date.now() + TEN_MINUTES_MS)
            .div(ONE_SECOND_MS)
            .integerValue(BigNumber.ROUND_CEIL);
        const zeroExTransaction: ZeroExTransaction = {
            data: txData,
            salt: takerTransactionSalt,
            signerAddress: takerAddress,
            gasPrice,
            expirationTimeSeconds,
            domain: {
                chainId: CHAIN_ID,
                verifyingContract: this._contractWrappers.contractAddresses.exchange,
            },
        };
        // use the DevUtils contract to generate the transaction hash
        const devUtils = new DevUtilsContract(this._contractWrappers.contractAddresses.devUtils, this._provider);
        const zeroExTransactionHash = await devUtils
            .getTransactionHash(
                zeroExTransaction,
                new BigNumber(CHAIN_ID),
                this._contractWrappers.contractAddresses.exchange,
            )
            .callAsync();

        const buyTokenDecimals = await serviceUtils.fetchTokenDecimalsIfRequiredAsync(buyTokenAddress, this._web3Wrapper);
        const sellTokenDecimals = await serviceUtils.fetchTokenDecimalsIfRequiredAsync(sellTokenAddress, this._web3Wrapper);
        const unitMakerAssetAmount = Web3Wrapper.toUnitAmount(makerAssetAmount, buyTokenDecimals);
        const unitTakerAssetAMount = Web3Wrapper.toUnitAmount(totalTakerAssetAmount, sellTokenDecimals);
        const price =
                buyAmount === undefined
                    ? unitMakerAssetAmount.dividedBy(unitTakerAssetAMount).decimalPlaces(sellTokenDecimals)
                    : unitTakerAssetAMount.dividedBy(unitMakerAssetAmount).decimalPlaces(buyTokenDecimals);

        const apiMetaTransactionQuote: GetMetaTransactionQuoteResponse = {
            price,
            zeroExTransactionHash,
            zeroExTransaction,
            buyAmount: makerAssetAmount,
            sellAmount: totalTakerAssetAmount,
            orders: serviceUtils.cleanSignedOrderFields(orders),
        };
        return apiMetaTransactionQuote;
    }
    public async postTransactionAsync(zeroExTransaction: ZeroExTransactionWithoutDomain, signature: string): Promise<PostTransactionResponse> {
        // decode zeroExTransaction data
        const devUtils = new DevUtilsContract(this._contractWrappers.contractAddresses.devUtils, this._provider);
        const decodedArray = await devUtils.decodeZeroExTransactionData(zeroExTransaction.data).callAsync();
        const orders = decodedArray[1];
        const gasPrice = zeroExTransaction.gasPrice;
        const protocolFee = MetaTransactionService._calculateProtocolFee(orders.length, gasPrice);

        const executeTxnCalldata = await this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature).getABIEncodedTransactionData();

        try {
            await this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature)
            .callAsync({
                from: SENDER_ADDRESS,
                gasPrice,
                value: protocolFee,
            });
        } catch (err) {
            const decodedCallData = RevertError.decode(err.values.errorData, false);
            throw decodedCallData;
        }

        const gas = await this._contractWrappers.exchange
        .executeTransaction(zeroExTransaction, signature)
        .estimateGasAsync({
            from: SENDER_ADDRESS,
            gasPrice,
            value: protocolFee,
        });

        const ethereumTxn: PartialTxParams = {
            data: executeTxnCalldata,
            gas: utils.encodeAmountAsHexString(gas),
            from: SENDER_ADDRESS,
            gasPrice: utils.encodeAmountAsHexString(gasPrice),
            value: utils.encodeAmountAsHexString(protocolFee),
            to: this._contractWrappers.exchange.address,
            nonce: await this._getNonceAsync(SENDER_ADDRESS),
            chainId: CHAIN_ID,
        };
        const signedEthereumTransaction = await this._privateWalletSubprovider.signTransactionAsync(ethereumTxn);

        const transactionHash = await this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature)
            .sendTransactionAsync({
                gas,
                from: SENDER_ADDRESS,
                gasPrice,
                value: protocolFee,
            });

        return {
            transactionHash,
            signedEthereumTransaction,
        };
    }
    private async _getNonceAsync(senderAddress: string): Promise<string> {
        // HACK(fabio): NonceTrackerSubprovider doesn't expose the subsequent nonce
        // to use to we fetch it from it's private instance variable
        let nonce = (this._nonceTrackerSubprovider as any)._nonceCache[senderAddress];
        if (nonce === undefined) {
            nonce = await this._getTransactionCountAsync(senderAddress);
        }
        return nonce;
    }
    private async _getTransactionCountAsync(address: string): Promise<string> {
        const nonceHex = await this._web3Wrapper.sendRawPayloadAsync<string>({
            method: 'eth_getTransactionCount',
            params: [address, 'latest'],
        });
        return nonceHex;
    }
}
