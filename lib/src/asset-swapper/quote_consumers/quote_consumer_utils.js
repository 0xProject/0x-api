"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransformerNonces = exports.requiresTransformERC20 = exports.getFQTTransformerDataFromOptimizedOrders = exports.isBuyQuote = exports.getMaxQuoteSlippageRate = exports.isDirectSwapCompatible = exports.isMultiplexMultiHopFillCompatible = exports.isMultiplexBatchFillCompatible = exports.createExchangeProxyWithoutProvider = void 0;
const contract_wrappers_1 = require("@0x/contract-wrappers");
const protocol_utils_1 = require("@0x/protocol-utils");
const types_1 = require("../types");
const orders_1 = require("../utils/market_operation_utils/orders");
const MULTIPLEX_BATCH_FILL_SOURCES = [
    types_1.ERC20BridgeSource.UniswapV2,
    types_1.ERC20BridgeSource.SushiSwap,
    types_1.ERC20BridgeSource.Native,
    types_1.ERC20BridgeSource.UniswapV3,
];
function createExchangeProxyWithoutProvider(exchangeProxyAddress) {
    const fakeProvider = {
        sendAsync() {
            return;
        },
    };
    return new contract_wrappers_1.IZeroExContract(exchangeProxyAddress, fakeProvider);
}
exports.createExchangeProxyWithoutProvider = createExchangeProxyWithoutProvider;
/**
 * Returns true iff a quote can be filled via `MultiplexFeature.batchFill`.
 */
function isMultiplexBatchFillCompatible(quote, opts) {
    if (requiresTransformERC20(opts)) {
        return false;
    }
    if (quote.path.hasTwoHop()) {
        return false;
    }
    if (quote.path
        .getOrders()
        .map((o) => o.type)
        .includes(protocol_utils_1.FillQuoteTransformerOrderType.Limit)) {
        return false;
    }
    // Use Multiplex if the non-fallback sources are a subset of
    // {UniswapV2, Sushiswap, RFQ, PLP, UniswapV3}
    const nonFallbackSources = quote.path.getOrders().map((o) => o.source);
    return nonFallbackSources.every((source) => MULTIPLEX_BATCH_FILL_SOURCES.includes(source));
}
exports.isMultiplexBatchFillCompatible = isMultiplexBatchFillCompatible;
const MULTIPLEX_MULTIHOP_FILL_SOURCES = [
    types_1.ERC20BridgeSource.UniswapV2,
    types_1.ERC20BridgeSource.SushiSwap,
    types_1.ERC20BridgeSource.UniswapV3,
];
/**
 * Returns true if a path can be filled via `MultiplexFeature.multiplexMultiHop*`.
 */
function isMultiplexMultiHopFillCompatible(path, opts) {
    if (requiresTransformERC20(opts)) {
        return false;
    }
    const { bridgeOrders, nativeOrders, twoHopOrders } = path.getOrdersByType();
    // Path shouldn't have any other type of order.
    if (bridgeOrders.length !== 0 || nativeOrders.length !== 0) {
        return false;
    }
    // MultiplexFeature only supports single two hop order.
    if (twoHopOrders.length !== 1) {
        return false;
    }
    const { firstHopOrder, secondHopOrder } = twoHopOrders[0];
    return (MULTIPLEX_MULTIHOP_FILL_SOURCES.includes(firstHopOrder.source) &&
        MULTIPLEX_MULTIHOP_FILL_SOURCES.includes(secondHopOrder.source));
}
exports.isMultiplexMultiHopFillCompatible = isMultiplexMultiHopFillCompatible;
/**
 * Returns true iff a quote can be filled via a VIP feature.
 */
function isDirectSwapCompatible(path, opts, directSources) {
    if (requiresTransformERC20(opts)) {
        return false;
    }
    const orders = path.getOrders();
    // Must be a single order.
    if (orders.length !== 1) {
        return false;
    }
    const order = orders[0];
    if (!directSources.includes(order.source)) {
        return false;
    }
    return true;
}
exports.isDirectSwapCompatible = isDirectSwapCompatible;
function getMaxQuoteSlippageRate(quote) {
    return quote.worstCaseQuoteInfo.slippage;
}
exports.getMaxQuoteSlippageRate = getMaxQuoteSlippageRate;
function isBuyQuote(quote) {
    return quote.type === types_1.MarketOperation.Buy;
}
exports.isBuyQuote = isBuyQuote;
function isOptimizedBridgeOrder(x) {
    return x.type === protocol_utils_1.FillQuoteTransformerOrderType.Bridge;
}
function isOptimizedLimitOrder(x) {
    return x.type === protocol_utils_1.FillQuoteTransformerOrderType.Limit;
}
function isOptimizedRfqOrder(x) {
    return x.type === protocol_utils_1.FillQuoteTransformerOrderType.Rfq;
}
function isOptimizedOtcOrder(x) {
    return x.type === protocol_utils_1.FillQuoteTransformerOrderType.Otc;
}
/**
 * Converts the given `OptimizedMarketOrder`s into bridge, limit, and RFQ orders for
 * FillQuoteTransformer.
 */
function getFQTTransformerDataFromOptimizedOrders(orders) {
    const fqtData = {
        bridgeOrders: [],
        limitOrders: [],
        rfqOrders: [],
        otcOrders: [],
        fillSequence: [],
    };
    for (const order of orders) {
        if (isOptimizedBridgeOrder(order)) {
            fqtData.bridgeOrders.push({
                bridgeData: (0, orders_1.createBridgeDataForBridgeOrder)(order),
                makerTokenAmount: order.makerAmount,
                takerTokenAmount: order.takerAmount,
                source: (0, orders_1.getErc20BridgeSourceToBridgeSource)(order.source),
            });
        }
        else if (isOptimizedLimitOrder(order)) {
            fqtData.limitOrders.push({
                order: order.fillData.order,
                signature: order.fillData.signature,
                maxTakerTokenFillAmount: order.takerAmount,
            });
        }
        else if (isOptimizedRfqOrder(order)) {
            fqtData.rfqOrders.push({
                order: order.fillData.order,
                signature: order.fillData.signature,
                maxTakerTokenFillAmount: order.takerAmount,
            });
        }
        else if (isOptimizedOtcOrder(order)) {
            fqtData.otcOrders.push({
                order: order.fillData.order,
                signature: order.fillData.signature,
                maxTakerTokenFillAmount: order.takerAmount,
            });
        }
        else {
            // Should never happen
            throw new Error('Unknown Order type');
        }
        fqtData.fillSequence.push(order.type);
    }
    return fqtData;
}
exports.getFQTTransformerDataFromOptimizedOrders = getFQTTransformerDataFromOptimizedOrders;
/**
 * Returns true if swap quote must go through `transformERC20`.
 */
function requiresTransformERC20(opts) {
    // Is a mtx.
    if (opts.metaTransactionVersion !== undefined) {
        return true;
    }
    // Has an affiliate fee.
    const affiliateFees = [...opts.sellTokenAffiliateFees, ...opts.buyTokenAffiliateFees];
    if (affiliateFees.some((f) => f.buyTokenFeeAmount.gt(0) || f.sellTokenFeeAmount.gt(0))) {
        return true;
    }
    // VIP does not support selling the entire balance
    if (opts.shouldSellEntireBalance) {
        return true;
    }
    return false;
}
exports.requiresTransformERC20 = requiresTransformERC20;
function getTransformerNonces(contractAddresses) {
    return {
        wethTransformer: (0, protocol_utils_1.findTransformerNonce)(contractAddresses.transformers.wethTransformer, contractAddresses.exchangeProxyTransformerDeployer),
        payTakerTransformer: (0, protocol_utils_1.findTransformerNonce)(contractAddresses.transformers.payTakerTransformer, contractAddresses.exchangeProxyTransformerDeployer),
        fillQuoteTransformer: (0, protocol_utils_1.findTransformerNonce)(contractAddresses.transformers.fillQuoteTransformer, contractAddresses.exchangeProxyTransformerDeployer),
        affiliateFeeTransformer: (0, protocol_utils_1.findTransformerNonce)(contractAddresses.transformers.affiliateFeeTransformer, contractAddresses.exchangeProxyTransformerDeployer),
        positiveSlippageFeeTransformer: (0, protocol_utils_1.findTransformerNonce)(contractAddresses.transformers.positiveSlippageFeeTransformer, contractAddresses.exchangeProxyTransformerDeployer),
    };
}
exports.getTransformerNonces = getTransformerNonces;
//# sourceMappingURL=quote_consumer_utils.js.map