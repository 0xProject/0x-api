"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateQuoteInfo = void 0;
const utils_1 = require("@0x/utils");
const types_1 = require("../types");
const quote_simulation_1 = require("./quote_simulation");
const _ = require("lodash");
const constants_1 = require("../constants");
function calculateQuoteInfo(params) {
    const { path, operation, assetFillAmount, gasPrice, gasSchedule, slippage } = params;
    const { nativeOrders, bridgeOrders, twoHopOrders } = path.getOrdersByType();
    const singleHopOrders = [...nativeOrders, ...bridgeOrders];
    const singleHopQuoteInfo = calculateSingleHopQuoteInfo(singleHopOrders, operation, assetFillAmount, gasPrice, gasSchedule, slippage);
    const twoHopQuoteInfos = twoHopOrders.map((order) => calculateTwoHopQuoteInfo(order, operation, gasSchedule, slippage));
    return {
        bestCaseQuoteInfo: mergeSwapQuoteInfos(singleHopQuoteInfo.bestCaseQuoteInfo, ...twoHopQuoteInfos.map((info) => info.bestCaseQuoteInfo)),
        worstCaseQuoteInfo: mergeSwapQuoteInfos(singleHopQuoteInfo.worstCaseQuoteInfo, ...twoHopQuoteInfos.map((info) => info.worstCaseQuoteInfo)),
        sourceBreakdown: calculateSwapQuoteOrdersBreakdown(singleHopQuoteInfo.fillAmountBySource, twoHopQuoteInfos.map((info) => info.multiHopFill)),
    };
}
exports.calculateQuoteInfo = calculateQuoteInfo;
function calculateSingleHopQuoteInfo(optimizedOrders, operation, assetFillAmount, gasPrice, gasSchedule, slippage) {
    const bestCaseFillResult = (0, quote_simulation_1.simulateBestCaseFill)({
        gasPrice,
        orders: optimizedOrders,
        side: operation,
        fillAmount: assetFillAmount,
        opts: { gasSchedule },
    });
    const worstCaseFillResult = (0, quote_simulation_1.simulateWorstCaseFill)({
        gasPrice,
        orders: optimizedOrders,
        side: operation,
        fillAmount: assetFillAmount,
        opts: { gasSchedule, slippage },
    });
    return {
        bestCaseQuoteInfo: fillResultsToQuoteInfo(bestCaseFillResult, 0),
        worstCaseQuoteInfo: fillResultsToQuoteInfo(worstCaseFillResult, slippage),
        fillAmountBySource: bestCaseFillResult.fillAmountBySource,
    };
}
function calculateTwoHopQuoteInfo(twoHopOrder, operation, gasSchedule, slippage) {
    const { firstHopOrder, secondHopOrder } = twoHopOrder;
    const gas = new utils_1.BigNumber(gasSchedule[types_1.ERC20BridgeSource.MultiHop]({
        firstHopSource: _.pick(firstHopOrder, 'source', 'fillData'),
        secondHopSource: _.pick(secondHopOrder, 'source', 'fillData'),
    })).toNumber();
    const isSell = operation === types_1.MarketOperation.Sell;
    return {
        bestCaseQuoteInfo: {
            makerAmount: secondHopOrder.makerAmount,
            takerAmount: firstHopOrder.takerAmount,
            totalTakerAmount: firstHopOrder.takerAmount,
            protocolFeeInWeiAmount: constants_1.constants.ZERO_AMOUNT,
            gas,
            slippage: 0,
        },
        // TODO jacob consolidate this with quote simulation worstCase
        worstCaseQuoteInfo: {
            makerAmount: isSell
                ? secondHopOrder.makerAmount.times(1 - slippage).integerValue()
                : secondHopOrder.makerAmount,
            takerAmount: isSell
                ? firstHopOrder.takerAmount
                : firstHopOrder.takerAmount.times(1 + slippage).integerValue(utils_1.BigNumber.ROUND_UP),
            totalTakerAmount: isSell
                ? firstHopOrder.takerAmount
                : firstHopOrder.takerAmount.times(1 + slippage).integerValue(utils_1.BigNumber.ROUND_UP),
            protocolFeeInWeiAmount: constants_1.constants.ZERO_AMOUNT,
            gas,
            slippage,
        },
        multiHopFill: {
            amount: firstHopOrder.takerAmount,
            intermediateToken: secondHopOrder.takerToken,
            hops: [firstHopOrder.source, secondHopOrder.source],
        },
    };
}
function mergeSwapQuoteInfos(...swapQuoteInfos) {
    if (swapQuoteInfos.length == 0) {
        throw new Error('swapQuoteInfos.length should be at least one');
    }
    const slippages = _.uniq(swapQuoteInfos.map((info) => info.slippage));
    if (slippages.length != 1) {
        throw new Error(`slippages of swapQuoteInfos vary: ${slippages}`);
    }
    const slippage = swapQuoteInfos[0].slippage;
    return {
        takerAmount: utils_1.BigNumber.sum(...swapQuoteInfos.map((info) => info.takerAmount)),
        totalTakerAmount: utils_1.BigNumber.sum(...swapQuoteInfos.map((info) => info.totalTakerAmount)),
        makerAmount: utils_1.BigNumber.sum(...swapQuoteInfos.map((info) => info.makerAmount)),
        protocolFeeInWeiAmount: utils_1.BigNumber.sum(...swapQuoteInfos.map((info) => info.protocolFeeInWeiAmount)),
        gas: _.sum(swapQuoteInfos.map((info) => info.gas)),
        // fillAmountBySource:
        slippage,
    };
}
function calculateSwapQuoteOrdersBreakdown(fillAmountBySource, multihopFills) {
    const totalFillAmount = utils_1.BigNumber.sum(...Object.values(fillAmountBySource), ...multihopFills.map((fill) => fill.amount));
    return {
        singleSource: _.mapValues(fillAmountBySource, (amount) => amount.div(totalFillAmount)),
        multihop: multihopFills.map((fill) => ({
            proportion: fill.amount.div(totalFillAmount),
            intermediateToken: fill.intermediateToken,
            hops: fill.hops,
        })),
    };
}
function fillResultsToQuoteInfo(fr, slippage) {
    return {
        makerAmount: fr.totalMakerAssetAmount,
        takerAmount: fr.takerAssetAmount,
        totalTakerAmount: fr.totalTakerAssetAmount,
        protocolFeeInWeiAmount: fr.protocolFeeAmount,
        gas: fr.gas,
        slippage,
    };
}
//# sourceMappingURL=quote_info.js.map