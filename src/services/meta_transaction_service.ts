import { MarketBuySwapQuote, MarketSellSwapQuote, SwapQuoter } from '@0x/asset-swapper';
import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ContractWrappers } from '@0x/contract-wrappers';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { generatePseudoRandomSalt, signatureUtils, SupportedProvider, ZeroExTransaction } from '@0x/order-utils';
import { RedundantSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { Order, SignedOrder } from '@0x/types';
import { BigNumber, NULL_ADDRESS, NULL_BYTES, providerUtils, RevertError } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { ASSET_SWAPPER_MARKET_ORDERS_OPTS, CHAIN_ID, ETHEREUM_RPC_URL, MESH_WEBSOCKET_URI, SENDER_ADDRESS } from '../config';
import { ERC20_BRIDGE_ASSET_PREFIX, ONE_ETH, ONE_SECOND_MS, TEN_MINUTES_MS } from '../constants';
import { CalculateMetaTransactionQuoteParams, GetMetaTransactionQuoteResponse } from '../types';
import { serviceUtils } from '../utils/service_utils';

export class MetaTransactionService {
    private readonly _provider: SupportedProvider;
    private readonly _swapQuoter: SwapQuoter;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;

    private static _createWeb3Provider(rpcHost: string): SupportedProvider {
        const WEB3_RPC_RETRY_COUNT = 3;
        const providerEngine = new Web3ProviderEngine();
        const rpcSubproviders = MetaTransactionService._range(WEB3_RPC_RETRY_COUNT).map(
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
    private static _hasBridgeOrder(orders: SignedOrder[]): boolean {
        const bridgeOrders = orders.filter(order => {
            return order.makerAssetData.startsWith(ERC20_BRIDGE_ASSET_PREFIX);
        });
        return bridgeOrders.length > 0;
    }
    private static _getMakerDenominatedPriceFromOrders(orders: SignedOrder[]): BigNumber {
        let totalTakerAssetAmount = new BigNumber(0);
        let totalMakerAssetAmount = new BigNumber(0);
        orders.forEach(order => {
            totalMakerAssetAmount = totalMakerAssetAmount.plus(order.makerAssetAmount);
            totalTakerAssetAmount = totalTakerAssetAmount.plus(order.takerAssetAmount);
        });
        return totalMakerAssetAmount.div(totalTakerAssetAmount);
    }
    private static _addRelayFeeToFirstBridgeOrder(
        orders: SignedOrder[],
        feeAssetData: string,
        feeAmount: BigNumber,
    ): SignedOrder[] {
        for (const order of orders) {
            if (order.makerAssetData.startsWith(ERC20_BRIDGE_ASSET_PREFIX)) {
                order.feeRecipientAddress = SENDER_ADDRESS;
                order.takerFeeAssetData = feeAssetData;
                order.takerFee = feeAmount;
                break;
            }
        }
        return orders;
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
    public async calculateMetaTransactionQuoteAsync(
        params: CalculateMetaTransactionQuoteParams,
    ): Promise<GetMetaTransactionQuoteResponse> {
        const { takerAddress, sellAmount, buyAmount, buyTokenAddress, sellTokenAddress, slippagePercentage, excludedSources } = params;

        const assetSwapperOpts = {
            ...ASSET_SWAPPER_MARKET_ORDERS_OPTS,
            slippagePercentage,
            bridgeSlippage: slippagePercentage,
            excludedSources, // TODO(dave4506): overrides the excluded sources selected by chainId
        };

        const contractAddresses = getContractAddressesForChainOrThrow(CHAIN_ID);
        const shouldFetchTakerAssetPriceInWETH =
            buyTokenAddress !== contractAddresses.etherToken && sellTokenAddress !== contractAddresses.etherToken;
        const swapQuotePromises: Array<Promise<MarketSellSwapQuote | MarketBuySwapQuote>> = [];
        if (shouldFetchTakerAssetPriceInWETH) {
            swapQuotePromises.push(
                this._swapQuoter.getMarketBuySwapQuoteAsync(
                    contractAddresses.etherToken,
                    sellTokenAddress,
                    // We don't actually try and fill this quote, we just use it as a pricefeed for the
                    // meta-txn relay fee conversion so the amount here doesn't matter too much
                    ONE_ETH,
                    assetSwapperOpts,
                ),
            );
        } else {
            swapQuotePromises.push(
                new Promise((resolve, _reject) => {
                    resolve();
                }),
            );
        }

        if (sellAmount !== undefined) {
            swapQuotePromises.push(
                this._swapQuoter.getMarketSellSwapQuoteAsync(
                    buyTokenAddress,
                    sellTokenAddress,
                    sellAmount,
                    assetSwapperOpts,
                ),
            );
        } else if (buyAmount !== undefined) {
            swapQuotePromises.push(
                this._swapQuoter.getMarketBuySwapQuoteAsync(
                    buyTokenAddress,
                    sellTokenAddress,
                    buyAmount,
                    assetSwapperOpts,
                ),
            );
        } else {
            throw new Error('sellAmount or buyAmount required');
        }

        const [marketBuyWETHSwapQuote, swapQuote] = await Promise.all(swapQuotePromises);
        const makerAssetAmount = swapQuote.bestCaseQuoteInfo.makerAssetAmount;
        const totalTakerAssetAmount = swapQuote.bestCaseQuoteInfo.totalTakerAssetAmount;
        const gasPrice = swapQuote.gasPrice;
        const attributedSwapQuote = serviceUtils.attributeSwapQuoteOrders(swapQuote);
        let orders = attributedSwapQuote.orders;
        const signatures = orders.map(order => order.signature);

        const devUtils = new DevUtilsContract(this._contractWrappers.contractAddresses.devUtils, this._provider);
        const placeholderRelayFee = new BigNumber('1'); // Non-zero
        const wethRelayAssetData = await devUtils.encodeERC20AssetData(contractAddresses.etherToken).callAsync();
        const hasBridgeOrder = MetaTransactionService._hasBridgeOrder(orders);
        let placeholderOrders = _.clone(orders);
        if (hasBridgeOrder) {
            // Add fee to first bridge order
            placeholderOrders = MetaTransactionService._addRelayFeeToFirstBridgeOrder(
                placeholderOrders,
                wethRelayAssetData,
                placeholderRelayFee,
            );
        } else {
            // Add affiliate order
            const affiliateOrder = await this._createAffiliateOrderAsync(wethRelayAssetData, placeholderRelayFee);
            placeholderOrders.push(affiliateOrder);
        }

        const placeholderZeroExTransaction = this._generateZeroExTransaction(
            placeholderOrders,
            sellAmount,
            buyAmount,
            signatures,
            takerAddress,
            gasPrice,
        );

        // By setting the `from` address to the 0x transaction `signerAddress`, the 0x txn signature
        // is not checked by the smart contracts. This allows us to estimate the gas of the Ethereum txn
        // before having the 0x txn signature from the taker. This estimate will always be slightly less
        // than the gas used in actuality, since the signature verification must be performed when it is
        // actually submitted.
        // TODO(fabio): Compute the gas difference between w/ and w/o signature verification and add this gas
        // amount to the estimate returned here.
        // TODO(fabio): Since we must run the gas estimation with the `takerAddress` as the `from` address AND
        // protocol fees must be paid in ETH/WETH, this approach still necessitates the taker to have ETH in their
        // account. This does not yet allow for takers without _any_ ETH to take orders.
        const protocolFee = MetaTransactionService._calculateProtocolFee(placeholderOrders.length, gasPrice);
        const DUMMY_SIGNATURE = '0x04';

        try {
            await this._contractWrappers.exchange
                .executeTransaction(placeholderZeroExTransaction, DUMMY_SIGNATURE)
                .callAsync({
                    from: takerAddress,
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

        const estimatedGas = new BigNumber(
            await this._contractWrappers.exchange
                .executeTransaction(placeholderZeroExTransaction, DUMMY_SIGNATURE)
                .estimateGasAsync({
                    from: takerAddress,
                    gasPrice,
                    value: protocolFee,
                }),
        );

        // Estimated relayFeeInETH
        const estimatedProtocolFee = MetaTransactionService._calculateProtocolFee(placeholderOrders.length, gasPrice);
        const estimateRelayFeeInETH = gasPrice
            .times(estimatedGas)
            .plus(estimatedProtocolFee)
            .integerValue(BigNumber.ROUND_FLOOR);

        // Convert fee from ETH to takerAssetAmount if possible
        let relayAssetData = wethRelayAssetData;
        let relayFeeAmount = estimateRelayFeeInETH;
        if (sellTokenAddress !== contractAddresses.etherToken) {
            if (buyTokenAddress === contractAddresses.etherToken) {
                const priceDenominatedInMakerAsset = MetaTransactionService._getMakerDenominatedPriceFromOrders(orders);
                relayAssetData = await devUtils.encodeERC20AssetData(sellTokenAddress).callAsync();
                relayFeeAmount = estimateRelayFeeInETH
                    .div(priceDenominatedInMakerAsset)
                    .integerValue(BigNumber.ROUND_FLOOR);
            } else {
                const priceDenominatedInMakerAsset = MetaTransactionService._getMakerDenominatedPriceFromOrders(
                    marketBuyWETHSwapQuote.orders,
                );
                relayAssetData = await devUtils.encodeERC20AssetData(sellTokenAddress).callAsync();
                relayFeeAmount = estimateRelayFeeInETH
                    .div(priceDenominatedInMakerAsset)
                    .integerValue(BigNumber.ROUND_FLOOR);
            }
        }

        if (hasBridgeOrder) {
            // Add fee to first bridge order
            orders = MetaTransactionService._addRelayFeeToFirstBridgeOrder(orders, relayAssetData, relayFeeAmount);
        } else {
            // Add affiliate order
            const affiliateOrder = await this._createAffiliateOrderAsync(relayAssetData, relayFeeAmount);
            orders.push(affiliateOrder);
        }
        const zeroExTransaction = this._generateZeroExTransaction(
            orders,
            sellAmount,
            buyAmount,
            signatures,
            takerAddress,
            gasPrice,
        );

        // use the DevUtils contract to generate the transaction hash
        const zeroExTransactionHash = await devUtils
            .getTransactionHash(
                zeroExTransaction,
                new BigNumber(CHAIN_ID),
                this._contractWrappers.contractAddresses.exchange,
            )
            .callAsync();

        const buyTokenDecimals = await serviceUtils.fetchTokenDecimalsIfRequiredAsync(
            buyTokenAddress,
            this._web3Wrapper,
        );
        const sellTokenDecimals = await serviceUtils.fetchTokenDecimalsIfRequiredAsync(
            sellTokenAddress,
            this._web3Wrapper,
        );
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
    private _generateZeroExTransaction(
        orders: SignedOrder[],
        sellAmount: BigNumber | undefined,
        buyAmount: BigNumber | undefined,
        signatures: string[],
        takerAddress: string,
        gasPrice: BigNumber,
    ): ZeroExTransaction {
        // generate txData for marketSellOrdersFillOrKill or marketBuyOrdersFillOrKill
        let txData;
        if (sellAmount !== undefined) {
            txData = this._contractWrappers.exchange
                .marketSellOrdersFillOrKill(orders, sellAmount, signatures)
                .getABIEncodedTransactionData();
        } else if (buyAmount !== undefined) {
            txData = this._contractWrappers.exchange
                .marketBuyOrdersFillOrKill(orders, buyAmount, signatures)
                .getABIEncodedTransactionData();
        } else {
            throw new Error('sellAmount or buyAmount required');
        }

        // generate the zeroExTransaction object
        const expirationTimeSeconds = new BigNumber(Date.now() + TEN_MINUTES_MS)
            .div(ONE_SECOND_MS)
            .integerValue(BigNumber.ROUND_CEIL);
        const zeroExTransaction: ZeroExTransaction = {
            data: txData,
            salt: generatePseudoRandomSalt(),
            signerAddress: takerAddress,
            gasPrice,
            expirationTimeSeconds,
            domain: {
                chainId: CHAIN_ID,
                verifyingContract: this._contractWrappers.contractAddresses.exchange,
            },
        };
        return zeroExTransaction;
    }
    private async _createAffiliateOrderAsync(feeAssetData: string, feeAmount: BigNumber): Promise<SignedOrder> {
        const staticCallToNullAddressAssetData =
            '0xc339d10a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4700000000000000000000000000000000000000000000000000000000000000000';
        // Converts to 0xff00000000000000000000000000000000000000000000000000000000000000 (large, lots of cheap zero bytes)
        const largeExpiryWithManyZeroBytes = new BigNumber(
            '115339776388732929035197660848497720713218148788040405586178452820382218977280',
        );
        const contractAddresses = getContractAddressesForChainOrThrow(CHAIN_ID);
        const order: Order = {
            makerAddress: SENDER_ADDRESS,
            makerAssetData: staticCallToNullAddressAssetData,
            makerAssetAmount: feeAmount,
            makerFeeAssetData: NULL_BYTES,
            takerAddress: NULL_ADDRESS,
            takerAssetAmount: feeAmount,
            takerAssetData: feeAssetData,
            takerFeeAssetData: NULL_BYTES,
            expirationTimeSeconds: largeExpiryWithManyZeroBytes,
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            salt: new BigNumber(0),
            feeRecipientAddress: NULL_ADDRESS,
            chainId: CHAIN_ID,
            senderAddress: NULL_ADDRESS,
            exchangeAddress: contractAddresses.exchange,
        };
        const signedOrder = await signatureUtils.ecSignOrderAsync(this._provider, order, SENDER_ADDRESS);
        return signedOrder;
    }
}
