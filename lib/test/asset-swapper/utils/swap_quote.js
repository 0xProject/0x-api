"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFullyFillableSwapQuoteWithNoFeesAsync = void 0;
const utils_1 = require("@0x/utils");
const asset_swapper_1 = require("../../../src/asset-swapper");
const constants_1 = require("../../../src/asset-swapper/constants");
const types_1 = require("../../../src/asset-swapper/types");
/**
 * Creates a swap quote given orders.
 */
async function getFullyFillableSwapQuoteWithNoFeesAsync(makerToken, takerToken, orders, operation, gasPrice) {
    const makerAmount = utils_1.BigNumber.sum(...[0, ...orders.map((o) => o.makerAmount)]);
    const takerAmount = utils_1.BigNumber.sum(...[0, ...orders.map((o) => o.takerAmount)]);
    const protocolFeePerOrder = constants_1.constants.PROTOCOL_FEE_MULTIPLIER.times(gasPrice);
    const quoteInfo = {
        makerAmount,
        feeTakerTokenAmount: constants_1.constants.ZERO_AMOUNT,
        takerAmount,
        totalTakerAmount: takerAmount,
        protocolFeeInWeiAmount: protocolFeePerOrder.times(orders.length),
        gas: 200e3,
        slippage: 0,
    };
    const breakdown = {
        [asset_swapper_1.ERC20BridgeSource.Native]: new utils_1.BigNumber(1),
    };
    const quoteBase = {
        makerToken,
        takerToken,
        orders: orders.map((order) => ({ ...order, fills: [] })),
        gasPrice,
        bestCaseQuoteInfo: quoteInfo,
        worstCaseQuoteInfo: quoteInfo,
        sourceBreakdown: breakdown,
        isTwoHop: false,
        takerAmountPerEth: constants_1.constants.ZERO_AMOUNT,
        makerAmountPerEth: constants_1.constants.ZERO_AMOUNT,
        makerTokenDecimals: 18,
        takerTokenDecimals: 18,
        blockNumber: 1337420,
    };
    if (operation === types_1.MarketOperation.Buy) {
        return {
            ...quoteBase,
            type: types_1.MarketOperation.Buy,
            makerTokenFillAmount: makerAmount,
        };
    }
    else {
        return {
            ...quoteBase,
            type: types_1.MarketOperation.Sell,
            takerTokenFillAmount: takerAmount,
        };
    }
}
exports.getFullyFillableSwapQuoteWithNoFeesAsync = getFullyFillableSwapQuoteWithNoFeesAsync;
//# sourceMappingURL=swap_quote.js.map