"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTwoHopSellQuote = exports.createSimpleBuySwapQuoteWithBridgeOrder = exports.createSimpleSellSwapQuoteWithBridgeOrder = exports.createSwapQuote = exports.NO_AFFILIATE_FEE = exports.ONE_ETHER = void 0;
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const asset_swapper_1 = require("../../../src/asset-swapper");
const types_1 = require("../../../src/asset-swapper/types");
const constants_1 = require("../../../src/asset-swapper/utils/market_operation_utils/constants");
const constants_2 = require("../../constants");
exports.ONE_ETHER = new asset_swapper_1.BigNumber(1e18);
exports.NO_AFFILIATE_FEE = {
    feeType: types_1.AffiliateFeeType.None,
    recipient: constants_2.NULL_ADDRESS,
    buyTokenFeeAmount: new asset_swapper_1.BigNumber(0),
    sellTokenFeeAmount: new asset_swapper_1.BigNumber(0),
};
const testConstants = {
    UNISWAP_V2_ROUTER: (0, contracts_test_utils_1.randomAddress)(),
    SUSHI_SWAP_ROUTER: (0, contracts_test_utils_1.randomAddress)(),
    VELODROME_ROUTER: (0, contracts_test_utils_1.randomAddress)(),
    DODO_POOL_ADDRESS: (0, contracts_test_utils_1.randomAddress)(),
    DODO_HELPER_ADDRESS: (0, contracts_test_utils_1.randomAddress)(),
};
function createFillData({ source, takerToken, makerToken, }) {
    switch (source) {
        case asset_swapper_1.ERC20BridgeSource.UniswapV2:
        case asset_swapper_1.ERC20BridgeSource.SushiSwap: {
            const fillData = {
                tokenAddressPath: [takerToken, makerToken],
                router: source === asset_swapper_1.ERC20BridgeSource.UniswapV2
                    ? testConstants.UNISWAP_V2_ROUTER
                    : testConstants.SUSHI_SWAP_ROUTER,
            };
            return fillData;
        }
        case asset_swapper_1.ERC20BridgeSource.Dodo: {
            const fillData = {
                poolAddress: testConstants.DODO_POOL_ADDRESS,
                isSellBase: false,
                helperAddress: testConstants.DODO_HELPER_ADDRESS,
            };
            return fillData;
        }
        case asset_swapper_1.ERC20BridgeSource.Velodrome: {
            const fillData = {
                router: testConstants.VELODROME_ROUTER,
                stable: false,
            };
            return fillData;
        }
        default:
            throw new Error(`createFillData: unimplemented source: ${source}`);
    }
}
function createBridgeOrder({ source, takerToken, makerToken, takerAmount, makerAmount, }) {
    return {
        source,
        takerToken,
        makerToken,
        takerAmount,
        makerAmount,
        type: asset_swapper_1.FillQuoteTransformerOrderType.Bridge,
        fillData: createFillData({ source, takerToken, makerToken }),
        // Currently unused by the tests that depends.
        fill: undefined,
    };
}
function createTwoHopOrder({ takerToken, intermediateToken, makerAmount, firstHopSource, secondHopSource, takerAmount, makerToken, }) {
    const firstHopOrder = createBridgeOrder({
        source: firstHopSource,
        takerToken,
        makerToken: intermediateToken,
        takerAmount,
        makerAmount: new asset_swapper_1.BigNumber(0),
    });
    const secondHopOrder = createBridgeOrder({
        source: secondHopSource,
        takerToken: intermediateToken,
        makerToken,
        takerAmount: constants_1.MAX_UINT256,
        makerAmount,
    });
    return { firstHopOrder, secondHopOrder };
}
function createPathFromOrders(partialOrdersByType) {
    const ordersByType = {
        bridgeOrders: [],
        nativeOrders: [],
        twoHopOrders: [],
        ...partialOrdersByType,
    };
    const { bridgeOrders, nativeOrders, twoHopOrders } = ordersByType;
    const twoHopIndividualOrders = twoHopOrders.flatMap(({ firstHopOrder, secondHopOrder }) => [
        firstHopOrder,
        secondHopOrder,
    ]);
    0;
    const orders = [...bridgeOrders, ...nativeOrders, ...twoHopIndividualOrders];
    return {
        getOrders: () => orders,
        getSlippedOrders: () => orders,
        getOrdersByType: () => ordersByType,
        getSlippedOrdersByType: () => ordersByType,
        hasTwoHop: () => ordersByType.twoHopOrders.length > 0,
    };
}
function createPath(params) {
    const bridgeOrderParams = params.bridgeOrderParams || [];
    const twoHopOrderParams = params.twoHopOrderParams || [];
    return createPathFromOrders({
        bridgeOrders: bridgeOrderParams.map(createBridgeOrder),
        twoHopOrders: twoHopOrderParams.map(createTwoHopOrder),
    });
}
function createSwapQuote({ side, takerToken, makerToken, takerAmount, makerAmount, createPathParams, slippage, takerAmountPerEth, makerAmountPerEth, gasPrice, }) {
    // NOTES: consider using `slippage` to generate different amounts for `worstCaseQuoteInfo` and
    // slipped orders of `path`.
    return {
        ...(side === types_1.MarketOperation.Buy
            ? { type: types_1.MarketOperation.Buy, makerTokenFillAmount: makerAmount }
            : { type: types_1.MarketOperation.Sell, takerTokenFillAmount: takerAmount }),
        takerToken,
        makerToken,
        gasPrice: new asset_swapper_1.BigNumber(gasPrice || 0),
        path: createPath(createPathParams),
        bestCaseQuoteInfo: {
            takerAmount,
            makerAmount,
            totalTakerAmount: takerAmount,
            protocolFeeInWeiAmount: new asset_swapper_1.BigNumber(0),
            gas: 42,
            slippage: 0,
        },
        worstCaseQuoteInfo: {
            takerAmount,
            makerAmount,
            totalTakerAmount: takerAmount,
            protocolFeeInWeiAmount: new asset_swapper_1.BigNumber(0),
            gas: 42,
            slippage: slippage || 0,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sourceBreakdown: {},
        makerTokenDecimals: 18,
        takerTokenDecimals: 18,
        takerAmountPerEth: takerAmountPerEth || new asset_swapper_1.BigNumber(0),
        makerAmountPerEth: makerAmountPerEth || new asset_swapper_1.BigNumber(0),
        blockNumber: 424242,
        samplerGasUsage: 1000000,
    };
}
exports.createSwapQuote = createSwapQuote;
function createSimpleSwapQuoteWithBridgeOrder({ side, source, takerToken, makerToken, takerAmount, makerAmount, slippage, takerAmountPerEth, makerAmountPerEth, gasPrice, }) {
    return createSwapQuote({
        side,
        takerToken,
        makerToken,
        takerAmount,
        makerAmount,
        createPathParams: {
            bridgeOrderParams: [
                {
                    takerToken,
                    makerToken,
                    takerAmount,
                    makerAmount,
                    source,
                },
            ],
        },
        slippage,
        takerAmountPerEth,
        makerAmountPerEth,
        gasPrice,
    });
}
function createSimpleSellSwapQuoteWithBridgeOrder(params) {
    return createSimpleSwapQuoteWithBridgeOrder({
        side: types_1.MarketOperation.Sell,
        ...params,
    });
}
exports.createSimpleSellSwapQuoteWithBridgeOrder = createSimpleSellSwapQuoteWithBridgeOrder;
function createSimpleBuySwapQuoteWithBridgeOrder(params) {
    return createSimpleSwapQuoteWithBridgeOrder({
        side: types_1.MarketOperation.Buy,
        ...params,
    });
}
exports.createSimpleBuySwapQuoteWithBridgeOrder = createSimpleBuySwapQuoteWithBridgeOrder;
function createTwoHopSellQuote({ takerToken, intermediateToken, makerToken, firstHopSource, secondHopSource, takerAmount, makerAmount, slippage, takerAmountPerEth, makerAmountPerEth, gasPrice, }) {
    return createSwapQuote({
        side: types_1.MarketOperation.Sell,
        takerToken,
        makerToken,
        takerAmount,
        makerAmount,
        createPathParams: {
            twoHopOrderParams: [
                {
                    takerToken,
                    intermediateToken,
                    makerToken,
                    firstHopSource,
                    secondHopSource,
                    takerAmount,
                    makerAmount,
                },
            ],
        },
        slippage,
        takerAmountPerEth,
        makerAmountPerEth,
        gasPrice,
    });
}
exports.createTwoHopSellQuote = createTwoHopSellQuote;
//# sourceMappingURL=test_data.js.map