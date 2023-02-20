"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeProxySwapQuoteConsumer = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const constants_1 = require("../constants");
const utils_2 = require("../utils/utils");
const constants_2 = require("../utils/market_operation_utils/constants");
const types_1 = require("../types");
const multiplex_encoders_1 = require("./multiplex_encoders");
const quote_consumer_utils_1 = require("./quote_consumer_utils");
const feature_rule_registry_1 = require("./feature_rules/feature_rule_registry");
const MAX_UINT256 = new utils_1.BigNumber(2).pow(256).minus(1);
const { NULL_ADDRESS, ZERO_AMOUNT } = constants_1.constants;
// use the same order in IPancakeSwapFeature.sol
const PANCAKE_SWAP_FORKS = [
    types_1.ERC20BridgeSource.PancakeSwap,
    types_1.ERC20BridgeSource.PancakeSwapV2,
    types_1.ERC20BridgeSource.BakerySwap,
    types_1.ERC20BridgeSource.SushiSwap,
    types_1.ERC20BridgeSource.ApeSwap,
];
class ExchangeProxySwapQuoteConsumer {
    constructor(chainId, exchangeProxy, transformerNonces, featureRuleRegistry) {
        this.chainId = chainId;
        this.exchangeProxy = exchangeProxy;
        this.transformerNonces = transformerNonces;
        this.featureRuleRegistry = featureRuleRegistry;
    }
    static create(chainId, contractAddresses) {
        const exchangeProxy = (0, quote_consumer_utils_1.createExchangeProxyWithoutProvider)(contractAddresses.exchangeProxy);
        const transformerNonces = (0, quote_consumer_utils_1.getTransformerNonces)(contractAddresses);
        // NOTES: consider injecting registry instead of relying on FeatureRuleRegistryImpl.
        const featureRuleRegistry = feature_rule_registry_1.FeatureRuleRegistryImpl.create(chainId, contractAddresses);
        return new ExchangeProxySwapQuoteConsumer(chainId, exchangeProxy, transformerNonces, featureRuleRegistry);
    }
    getCalldataOrThrow(quote, opts = {}) {
        const optsWithDefaults = {
            ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
            ...opts,
        };
        const { isFromETH, isToETH } = optsWithDefaults;
        const sellToken = quote.takerToken;
        const buyToken = quote.makerToken;
        // Take the bounds from the worst case
        const sellAmount = utils_1.BigNumber.max(quote.bestCaseQuoteInfo.totalTakerAmount, quote.worstCaseQuoteInfo.totalTakerAmount);
        const minBuyAmount = quote.worstCaseQuoteInfo.makerAmount;
        let ethAmount = quote.worstCaseQuoteInfo.protocolFeeInWeiAmount;
        if (isFromETH) {
            ethAmount = ethAmount.plus(sellAmount);
        }
        const maxSlippage = (0, quote_consumer_utils_1.getMaxQuoteSlippageRate)(quote);
        const slippedOrders = quote.path.getSlippedOrders(maxSlippage);
        const uniswapV2Rule = this.featureRuleRegistry.getUniswapV2Rule();
        if (uniswapV2Rule.isCompatible(quote, optsWithDefaults)) {
            return uniswapV2Rule.createCalldata(quote, optsWithDefaults);
        }
        // VIP routes.
        if (this.chainId === contract_addresses_1.ChainId.Mainnet &&
            (0, quote_consumer_utils_1.isDirectSwapCompatible)(quote.path, optsWithDefaults, [types_1.ERC20BridgeSource.UniswapV3])) {
            const fillData = slippedOrders[0].fillData;
            let _calldataHexString;
            if (isFromETH) {
                _calldataHexString = this.exchangeProxy
                    .sellEthForTokenToUniswapV3(fillData.path, minBuyAmount, NULL_ADDRESS)
                    .getABIEncodedTransactionData();
            }
            else if (isToETH) {
                _calldataHexString = this.exchangeProxy
                    .sellTokenForEthToUniswapV3(fillData.path, sellAmount, minBuyAmount, NULL_ADDRESS)
                    .getABIEncodedTransactionData();
            }
            else {
                _calldataHexString = this.exchangeProxy
                    .sellTokenForTokenToUniswapV3(fillData.path, sellAmount, minBuyAmount, NULL_ADDRESS)
                    .getABIEncodedTransactionData();
            }
            return {
                calldataHexString: _calldataHexString,
                ethAmount: isFromETH ? sellAmount : ZERO_AMOUNT,
                toAddress: this.exchangeProxy.address,
                allowanceTarget: this.exchangeProxy.address,
                gasOverhead: ZERO_AMOUNT,
            };
        }
        if (this.chainId === contract_addresses_1.ChainId.BSC &&
            (0, quote_consumer_utils_1.isDirectSwapCompatible)(quote.path, optsWithDefaults, [
                types_1.ERC20BridgeSource.PancakeSwap,
                types_1.ERC20BridgeSource.PancakeSwapV2,
                types_1.ERC20BridgeSource.BakerySwap,
                types_1.ERC20BridgeSource.SushiSwap,
                types_1.ERC20BridgeSource.ApeSwap,
            ])) {
            const source = slippedOrders[0].source;
            const fillData = slippedOrders[0].fillData;
            return {
                calldataHexString: this.exchangeProxy
                    .sellToPancakeSwap(fillData.tokenAddressPath.map((a, i) => {
                    if (i === 0 && isFromETH) {
                        return protocol_utils_1.ETH_TOKEN_ADDRESS;
                    }
                    if (i === fillData.tokenAddressPath.length - 1 && isToETH) {
                        return protocol_utils_1.ETH_TOKEN_ADDRESS;
                    }
                    return a;
                }), sellAmount, minBuyAmount, PANCAKE_SWAP_FORKS.indexOf(source))
                    .getABIEncodedTransactionData(),
                ethAmount: isFromETH ? sellAmount : ZERO_AMOUNT,
                toAddress: this.exchangeProxy.address,
                allowanceTarget: this.exchangeProxy.address,
                gasOverhead: ZERO_AMOUNT,
            };
        }
        if (this.chainId === contract_addresses_1.ChainId.Mainnet &&
            (0, quote_consumer_utils_1.isDirectSwapCompatible)(quote.path, optsWithDefaults, [types_1.ERC20BridgeSource.Curve]) &&
            // Curve VIP cannot currently support WETH buy/sell as the functionality needs to WITHDRAW or DEPOSIT
            // into WETH prior/post the trade.
            // ETH buy/sell is supported
            ![sellToken, buyToken].includes(constants_2.NATIVE_FEE_TOKEN_BY_CHAIN_ID[contract_addresses_1.ChainId.Mainnet])) {
            const fillData = slippedOrders[0].fillData;
            return {
                calldataHexString: this.exchangeProxy
                    .sellToLiquidityProvider(isFromETH ? protocol_utils_1.ETH_TOKEN_ADDRESS : sellToken, isToETH ? protocol_utils_1.ETH_TOKEN_ADDRESS : buyToken, constants_2.CURVE_LIQUIDITY_PROVIDER_BY_CHAIN_ID[this.chainId], NULL_ADDRESS, sellAmount, minBuyAmount, (0, protocol_utils_1.encodeCurveLiquidityProviderData)({
                    curveAddress: fillData.pool.poolAddress,
                    exchangeFunctionSelector: fillData.pool.exchangeFunctionSelector,
                    fromCoinIdx: new utils_1.BigNumber(fillData.fromTokenIdx),
                    toCoinIdx: new utils_1.BigNumber(fillData.toTokenIdx),
                }))
                    .getABIEncodedTransactionData(),
                ethAmount: isFromETH ? sellAmount : ZERO_AMOUNT,
                toAddress: this.exchangeProxy.address,
                allowanceTarget: this.exchangeProxy.address,
                gasOverhead: ZERO_AMOUNT,
            };
        }
        // RFQT VIP
        if ([contract_addresses_1.ChainId.Mainnet, contract_addresses_1.ChainId.Polygon].includes(this.chainId) &&
            !isToETH &&
            !isFromETH &&
            slippedOrders.every((o) => o.type === protocol_utils_1.FillQuoteTransformerOrderType.Rfq) &&
            !(0, quote_consumer_utils_1.requiresTransformERC20)(optsWithDefaults)) {
            const rfqOrdersData = slippedOrders.map((o) => o.fillData);
            const fillAmountPerOrder = (() => {
                // Don't think order taker amounts are clipped to actual sell amount
                // (the last one might be too large) so figure them out manually.
                let remaining = sellAmount;
                const fillAmounts = [];
                for (const o of slippedOrders) {
                    const fillAmount = utils_1.BigNumber.min(o.takerAmount, remaining);
                    fillAmounts.push(fillAmount);
                    remaining = remaining.minus(fillAmount);
                }
                return fillAmounts;
            })();
            const callData = slippedOrders.length === 1
                ? this.exchangeProxy
                    .fillRfqOrder(rfqOrdersData[0].order, rfqOrdersData[0].signature, fillAmountPerOrder[0])
                    .getABIEncodedTransactionData()
                : this.exchangeProxy
                    .batchFillRfqOrders(rfqOrdersData.map((d) => d.order), rfqOrdersData.map((d) => d.signature), fillAmountPerOrder, true)
                    .getABIEncodedTransactionData();
            return {
                calldataHexString: callData,
                ethAmount: ZERO_AMOUNT,
                toAddress: this.exchangeProxy.address,
                allowanceTarget: this.exchangeProxy.address,
                gasOverhead: ZERO_AMOUNT,
            };
        }
        // OTC orders
        // if we have more than one otc order we want to batch fill them through multiplex
        if ([contract_addresses_1.ChainId.Mainnet, contract_addresses_1.ChainId.Polygon, contract_addresses_1.ChainId.PolygonMumbai].includes(this.chainId) && // @todo goerli?
            slippedOrders.every((o) => o.type === protocol_utils_1.FillQuoteTransformerOrderType.Otc) &&
            !(0, quote_consumer_utils_1.requiresTransformERC20)(optsWithDefaults) &&
            slippedOrders.length === 1) {
            const otcOrdersData = slippedOrders.map((o) => o.fillData);
            let callData;
            // if the otc orders takerToken is the native asset
            if (isFromETH) {
                callData = this.exchangeProxy
                    .fillOtcOrderWithEth(otcOrdersData[0].order, otcOrdersData[0].signature)
                    .getABIEncodedTransactionData();
            }
            // if the otc orders makerToken is the native asset
            else if (isToETH) {
                callData = this.exchangeProxy
                    .fillOtcOrderForEth(otcOrdersData[0].order, otcOrdersData[0].signature, sellAmount)
                    .getABIEncodedTransactionData();
            }
            else {
                // if the otc order contains 2 erc20 tokens
                callData = this.exchangeProxy
                    .fillOtcOrder(otcOrdersData[0].order, otcOrdersData[0].signature, sellAmount)
                    .getABIEncodedTransactionData();
            }
            return {
                calldataHexString: callData,
                ethAmount: isFromETH ? sellAmount : ZERO_AMOUNT,
                toAddress: this.exchangeProxy.address,
                allowanceTarget: this.exchangeProxy.address,
                gasOverhead: ZERO_AMOUNT,
            };
        }
        if (this.chainId === contract_addresses_1.ChainId.Mainnet && (0, quote_consumer_utils_1.isMultiplexBatchFillCompatible)(quote, optsWithDefaults)) {
            return {
                calldataHexString: this.encodeMultiplexBatchFillCalldata(quote, optsWithDefaults),
                ethAmount,
                toAddress: this.exchangeProxy.address,
                allowanceTarget: this.exchangeProxy.address,
                gasOverhead: ZERO_AMOUNT,
            };
        }
        if (this.chainId === contract_addresses_1.ChainId.Mainnet && (0, quote_consumer_utils_1.isMultiplexMultiHopFillCompatible)(quote.path, optsWithDefaults)) {
            return {
                calldataHexString: this.encodeMultiplexMultiHopFillCalldata(quote, optsWithDefaults),
                ethAmount,
                toAddress: this.exchangeProxy.address,
                allowanceTarget: this.exchangeProxy.address,
                gasOverhead: ZERO_AMOUNT,
            };
        }
        // TODO(kyu-c): move the rest of the feature calldata generation logic to the rule/registry.
        return this.featureRuleRegistry.getTransformErc20Rule().createCalldata(quote, optsWithDefaults);
    }
    encodeMultiplexBatchFillCalldata(quote, opts) {
        const maxSlippage = (0, quote_consumer_utils_1.getMaxQuoteSlippageRate)(quote);
        const slippedOrders = quote.path.getSlippedOrders(maxSlippage);
        const subcalls = [];
        for_loop: for (const [i, order] of slippedOrders.entries()) {
            switch_statement: switch (order.source) {
                case types_1.ERC20BridgeSource.Native:
                    if (order.type !== protocol_utils_1.FillQuoteTransformerOrderType.Rfq &&
                        order.type !== protocol_utils_1.FillQuoteTransformerOrderType.Otc) {
                        // Should never happen because we check `isMultiplexBatchFillCompatible`
                        // before calling this function.
                        throw new Error('Multiplex batch fill only supported for RFQ native orders and OTC Orders');
                    }
                    if (order.type !== protocol_utils_1.FillQuoteTransformerOrderType.Otc) {
                        subcalls.push({
                            id: multiplex_encoders_1.MultiplexSubcall.Rfq,
                            sellAmount: order.takerAmount,
                            data: multiplex_encoders_1.multiplexRfqEncoder.encode({
                                order: order.fillData.order,
                                signature: order.fillData.signature,
                            }),
                        });
                    }
                    else {
                        subcalls.push({
                            id: multiplex_encoders_1.MultiplexSubcall.Otc,
                            sellAmount: order.takerAmount,
                            data: multiplex_encoders_1.multiplexOtcOrder.encode({
                                order: order.fillData.order,
                                signature: order.fillData.signature,
                            }),
                        });
                    }
                    break switch_statement;
                case types_1.ERC20BridgeSource.UniswapV2:
                case types_1.ERC20BridgeSource.SushiSwap:
                    subcalls.push({
                        id: multiplex_encoders_1.MultiplexSubcall.UniswapV2,
                        sellAmount: order.takerAmount,
                        data: multiplex_encoders_1.multiplexUniswapEncoder.encode({
                            tokens: order.fillData.tokenAddressPath,
                            isSushi: order.source === types_1.ERC20BridgeSource.SushiSwap,
                        }),
                    });
                    break switch_statement;
                case types_1.ERC20BridgeSource.UniswapV3: {
                    const fillData = order.fillData;
                    subcalls.push({
                        id: multiplex_encoders_1.MultiplexSubcall.UniswapV3,
                        sellAmount: order.takerAmount,
                        data: fillData.path,
                    });
                    break switch_statement;
                }
                default: {
                    const fqtData = (0, protocol_utils_1.encodeFillQuoteTransformerData)({
                        side: protocol_utils_1.FillQuoteTransformerSide.Sell,
                        sellToken: quote.takerToken,
                        buyToken: quote.makerToken,
                        ...(0, quote_consumer_utils_1.getFQTTransformerDataFromOptimizedOrders)(slippedOrders.slice(i)),
                        refundReceiver: NULL_ADDRESS,
                        fillAmount: MAX_UINT256,
                    });
                    const transformations = [
                        { deploymentNonce: this.transformerNonces.fillQuoteTransformer, data: fqtData },
                        {
                            deploymentNonce: this.transformerNonces.payTakerTransformer,
                            data: (0, protocol_utils_1.encodePayTakerTransformerData)({
                                tokens: [quote.takerToken],
                                amounts: [],
                            }),
                        },
                    ];
                    subcalls.push({
                        id: multiplex_encoders_1.MultiplexSubcall.TransformERC20,
                        sellAmount: utils_1.BigNumber.sum(...slippedOrders.slice(i).map((o) => o.takerAmount)),
                        data: multiplex_encoders_1.multiplexTransformERC20Encoder.encode({
                            transformations,
                        }),
                    });
                    break for_loop;
                }
            }
        }
        if (opts.isFromETH) {
            return this.exchangeProxy
                .multiplexBatchSellEthForToken(quote.makerToken, subcalls, quote.worstCaseQuoteInfo.makerAmount)
                .getABIEncodedTransactionData();
        }
        else if (opts.isToETH) {
            return this.exchangeProxy
                .multiplexBatchSellTokenForEth(quote.takerToken, subcalls, quote.worstCaseQuoteInfo.totalTakerAmount, quote.worstCaseQuoteInfo.makerAmount)
                .getABIEncodedTransactionData();
        }
        else {
            return this.exchangeProxy
                .multiplexBatchSellTokenForToken(quote.takerToken, quote.makerToken, subcalls, quote.worstCaseQuoteInfo.totalTakerAmount, quote.worstCaseQuoteInfo.makerAmount)
                .getABIEncodedTransactionData();
        }
    }
    encodeMultiplexMultiHopFillCalldata(quote, opts) {
        const maxSlippage = (0, quote_consumer_utils_1.getMaxQuoteSlippageRate)(quote);
        const { nativeOrders, bridgeOrders, twoHopOrders } = quote.path.getSlippedOrdersByType(maxSlippage);
        // Should have been checked with `isMultiplexMultiHopFillCompatible`.
        utils_2.assert.assert(nativeOrders.length === 0 && bridgeOrders.length === 0, 'non-multihop should not go through multiplexMultihop');
        utils_2.assert.assert(twoHopOrders.length === 1, 'multiplexMultiHop only supports single multihop order ');
        const { firstHopOrder, secondHopOrder } = twoHopOrders[0];
        const intermediateToken = firstHopOrder.makerToken;
        const tokens = [quote.takerToken, intermediateToken, quote.makerToken];
        const subcalls = [];
        for (const order of [firstHopOrder, secondHopOrder]) {
            switch (order.source) {
                case types_1.ERC20BridgeSource.UniswapV2:
                case types_1.ERC20BridgeSource.SushiSwap:
                    subcalls.push({
                        id: multiplex_encoders_1.MultiplexSubcall.UniswapV2,
                        data: multiplex_encoders_1.multiplexUniswapEncoder.encode({
                            tokens: order.fillData.tokenAddressPath,
                            isSushi: order.source === types_1.ERC20BridgeSource.SushiSwap,
                        }),
                    });
                    break;
                case types_1.ERC20BridgeSource.UniswapV3:
                    subcalls.push({
                        id: multiplex_encoders_1.MultiplexSubcall.UniswapV3,
                        data: order.fillData.path,
                    });
                    break;
                default:
                    // Should never happen because we check `isMultiplexMultiHopFillCompatible`
                    // before calling this function.
                    throw new Error(`Multiplex multi-hop unsupported source: ${order.source}`);
            }
        }
        if (opts.isFromETH) {
            return this.exchangeProxy
                .multiplexMultiHopSellEthForToken(tokens, subcalls, quote.worstCaseQuoteInfo.makerAmount)
                .getABIEncodedTransactionData();
        }
        else if (opts.isToETH) {
            return this.exchangeProxy
                .multiplexMultiHopSellTokenForEth(tokens, subcalls, quote.worstCaseQuoteInfo.totalTakerAmount, quote.worstCaseQuoteInfo.makerAmount)
                .getABIEncodedTransactionData();
        }
        else {
            return this.exchangeProxy
                .multiplexMultiHopSellTokenForToken(tokens, subcalls, quote.worstCaseQuoteInfo.totalTakerAmount, quote.worstCaseQuoteInfo.makerAmount)
                .getABIEncodedTransactionData();
        }
    }
}
exports.ExchangeProxySwapQuoteConsumer = ExchangeProxySwapQuoteConsumer;
//# sourceMappingURL=exchange_proxy_swap_quote_consumer.js.map