import {
    MarketBuySwapQuote,
    MarketSellSwapQuote,
    SignedOrder,
    SwapQuoter,
} from '@0x/asset-swapper';
import { ContractWrappers } from '@0x/contract-wrappers';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { assetDataUtils, generatePseudoRandomSalt, SupportedProvider, ZeroExTransaction } from '@0x/order-utils';
import { PrivateKeyWalletSubprovider, RedundantSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { AbiEncoder, BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { ASSET_SWAPPER_MARKET_ORDERS_OPTS, CHAIN_ID, ETHEREUM_RPC_URL, FEE_RECIPIENT_ADDRESS, MESH_WEBSOCKET_URI } from '../config';
import { DEFAULT_TOKEN_DECIMALS, ONE_SECOND_MS, SENDER_ADDRESS, SENDER_PRIVATE_KEY, TEN_MINUTES_MS } from '../constants';
import { logger } from '../logger';
import { CalculateMetaTransactionQuoteParams, GetMetaTransactionQuoteResponse, PostTransactionResponse, ZeroExTransactionWithoutDomain } from '../types';
import { orderUtils } from '../utils/order_utils';
import { findTokenDecimalsIfExists } from '../utils/token_metadata_utils';

export class MetaTransactionService {
    private readonly _provider: SupportedProvider;
    private readonly _swapQuoter: SwapQuoter;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;

    private static _createWeb3Provider(rpcHost: string): SupportedProvider {
        const WEB3_RPC_RETRY_COUNT = 3;
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(new PrivateKeyWalletSubprovider(SENDER_PRIVATE_KEY));
        const rpcSubproviders = MetaTransactionService._range(WEB3_RPC_RETRY_COUNT).map((_index: number) => new RPCSubprovider(rpcHost));
        providerEngine.addProvider(new RedundantSubprovider(rpcSubproviders));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }

    private static _range(rangeCount: number): number[] {
        return [...Array(rangeCount).keys()];
    }

    private static _calculateProtocolFee = (numOrders: number, gasPrice: BigNumber): BigNumber => {
        return new BigNumber(150000).times(gasPrice).times(numOrders);
    }

    constructor() {
        this._provider = MetaTransactionService._createWeb3Provider(ETHEREUM_RPC_URL);
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
            const attributedSwapQuote = this._attributeSwapQuoteOrders(marketSellSwapQuote);
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
            const attributedSwapQuote = this._attributeSwapQuoteOrders(marketBuySwapQuote);
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

        const buyTokenDecimals = await this._fetchTokenDecimalsIfRequiredAsync(buyTokenAddress);
        const sellTokenDecimals = await this._fetchTokenDecimalsIfRequiredAsync(sellTokenAddress);
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
            orders: this._cleanSignedOrderFields(orders),
        };
        return apiMetaTransactionQuote;
    }

    public async postTransactionAsync(zeroExTransaction: ZeroExTransactionWithoutDomain, signature: string): Promise<PostTransactionResponse> {
        // decode zeroExTransaction data
        const devUtils = new DevUtilsContract(this._contractWrappers.contractAddresses.devUtils, this._provider);
        const decodedArray = await devUtils.decodeZeroExTransactionData(zeroExTransaction.data).callAsync();
        const orders = decodedArray[1];
        const gas = 800000;
        const gasPrice = zeroExTransaction.gasPrice;
        // submit executeTransaction transaction
        const transactionHash = await this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature)
            .sendTransactionAsync({
                gas,
                from: SENDER_ADDRESS,
                gasPrice,
                value: MetaTransactionService._calculateProtocolFee(orders.length, gasPrice),
            });

        return {
            transactionHash,
        };
    }

    // TODO(fabio): Dedup this with copy in swap_servicec.ts
    // tslint:disable-next-line:prefer-function-over-method
    private _attributeSwapQuoteOrders(
        swapQuote: MarketSellSwapQuote | MarketBuySwapQuote,
    ): MarketSellSwapQuote | MarketBuySwapQuote {
        // Where possible, attribute any fills of these orders to the Fee Recipient Address
        const attributedOrders = swapQuote.orders.map(o => {
            try {
                const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(o.makerAssetData);
                if (orderUtils.isBridgeAssetData(decodedAssetData)) {
                    return {
                        ...o,
                        feeRecipientAddress: FEE_RECIPIENT_ADDRESS,
                    };
                }
                // tslint:disable-next-line:no-empty
            } catch (err) {}
            // Default to unmodified order
            return o;
        });
        const attributedSwapQuote = {
            ...swapQuote,
            orders: attributedOrders,
        };
        return attributedSwapQuote;
    }

    // tslint:disable-next-line:prefer-function-over-method
    private _cleanSignedOrderFields(orders: SignedOrder[]): SignedOrder[] {
        return orders.map(o => ({
            chainId: o.chainId,
            exchangeAddress: o.exchangeAddress,
            makerAddress: o.makerAddress,
            takerAddress: o.takerAddress,
            feeRecipientAddress: o.feeRecipientAddress,
            senderAddress: o.senderAddress,
            makerAssetAmount: o.makerAssetAmount,
            takerAssetAmount: o.takerAssetAmount,
            makerFee: o.makerFee,
            takerFee: o.takerFee,
            expirationTimeSeconds: o.expirationTimeSeconds,
            salt: o.salt,
            makerAssetData: o.makerAssetData,
            takerAssetData: o.takerAssetData,
            makerFeeAssetData: o.makerFeeAssetData,
            takerFeeAssetData: o.takerFeeAssetData,
            signature: o.signature,
        }));
    }
    private async _fetchTokenDecimalsIfRequiredAsync(tokenAddress: string): Promise<number> {
        // HACK(dekz): Our ERC20Wrapper does not have decimals as it is optional
        // so we must encode this ourselves
        let decimals = findTokenDecimalsIfExists(tokenAddress, CHAIN_ID);
        if (!decimals) {
            const decimalsEncoder = new AbiEncoder.Method({
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [{ name: '', type: 'uint8' }],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            });
            const encodedCallData = decimalsEncoder.encode(tokenAddress);
            try {
                const result = await this._web3Wrapper.callAsync({ data: encodedCallData, to: tokenAddress });
                decimals = decimalsEncoder.strictDecodeReturnValue<BigNumber>(result).toNumber();
                logger.info(`Unmapped token decimals ${tokenAddress} ${decimals}`);
            } catch (err) {
                logger.error(`Error fetching token decimals ${tokenAddress}`);
                decimals = DEFAULT_TOKEN_DECIMALS;
            }
        }
        return decimals;
    }
}
