"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillQuoteOrders = exports.simulateWorstCaseFill = exports.simulateBestCaseFill = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const constants_1 = require("../constants");
const types_1 = require("../types");
const utils_2 = require("./utils");
const { PROTOCOL_FEE_MULTIPLIER, ZERO_AMOUNT } = constants_1.constants;
const { ROUND_DOWN, ROUND_UP } = utils_1.BigNumber;
const EMPTY_QUOTE_INTERMEDIATE_FILL_RESULT = {
    input: ZERO_AMOUNT,
    output: ZERO_AMOUNT,
    outputFee: ZERO_AMOUNT,
    inputFee: ZERO_AMOUNT,
    protocolFee: ZERO_AMOUNT,
    gas: 0,
};
const DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS = {
    protocolFeeMultiplier: PROTOCOL_FEE_MULTIPLIER,
    slippage: 0,
};
// Simulates filling a quote in the best case.
function simulateBestCaseFill(quoteInfo) {
    const opts = {
        ...DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS,
        ...quoteInfo.opts,
    };
    const protocolFeePerFillOrder = quoteInfo.gasPrice.times(opts.protocolFeeMultiplier);
    const result = fillQuoteOrders(createBestCaseFillOrderCalls(quoteInfo), quoteInfo.fillAmount, protocolFeePerFillOrder, opts.gasSchedule);
    return fromIntermediateQuoteFillResult(result, quoteInfo);
}
exports.simulateBestCaseFill = simulateBestCaseFill;
// Simulates filling a quote in the worst case.
// NOTES: this isn't correct as it applies slippage to native orders as well.
function simulateWorstCaseFill(quoteInfo) {
    const opts = {
        ...DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS,
        ...quoteInfo.opts,
    };
    const protocolFeePerFillOrder = quoteInfo.gasPrice.times(opts.protocolFeeMultiplier);
    const bestCase = createBestCaseFillOrderCalls(quoteInfo);
    const result = {
        ...fillQuoteOrders(bestCase, quoteInfo.fillAmount, protocolFeePerFillOrder, opts.gasSchedule),
        // Worst case gas and protocol fee is hitting all orders.
        gas: getTotalGasUsedByFills(quoteInfo.orders, opts.gasSchedule),
        protocolFee: protocolFeePerFillOrder.times(quoteInfo.orders.filter((o) => hasProtocolFee(o)).length),
    };
    // Adjust the output by 1-slippage for the worst case if it is a sell
    // Adjust the output by 1+slippage for the worst case if it is a buy
    result.output =
        quoteInfo.side === types_1.MarketOperation.Sell
            ? result.output.times(1 - opts.slippage).integerValue(utils_1.BigNumber.ROUND_DOWN)
            : result.output.times(1 + opts.slippage).integerValue(utils_1.BigNumber.ROUND_UP);
    return fromIntermediateQuoteFillResult(result, quoteInfo);
}
exports.simulateWorstCaseFill = simulateWorstCaseFill;
function fillQuoteOrders(fillOrders, inputAmount, protocolFeePerFillOrder, gasSchedule) {
    const result = {
        ...EMPTY_QUOTE_INTERMEDIATE_FILL_RESULT,
        inputBySource: {},
    };
    let remainingInput = inputAmount;
    for (const fo of fillOrders) {
        if (remainingInput.lte(0)) {
            break;
        }
        const { source, fillData } = fo.order;
        result.gas += gasSchedule[source](fillData);
        result.inputBySource[source] = result.inputBySource[source] || ZERO_AMOUNT;
        const filledInput = solveForInputFillAmount(remainingInput, fo.order.fill.input, fo.totalOrderInput, fo.totalOrderInputFee);
        const filledOutput = fo.order.fill.output.times(filledInput.div(fo.order.fill.input));
        const filledInputFee = filledInput.div(fo.totalOrderInput).times(fo.totalOrderInputFee);
        const filledOutputFee = filledOutput.div(fo.totalOrderOutput).times(fo.totalOrderOutputFee);
        result.inputBySource[source] = result.inputBySource[source].plus(filledInput);
        result.input = result.input.plus(filledInput);
        result.output = result.output.plus(filledOutput);
        result.inputFee = result.inputFee.plus(filledInputFee);
        result.outputFee = result.outputFee.plus(filledOutputFee);
        remainingInput = remainingInput.minus(filledInput.plus(filledInputFee));
        // NOTE: V4 Limit orders have Protocol fees
        const protocolFee = hasProtocolFee(fo.order) ? protocolFeePerFillOrder : ZERO_AMOUNT;
        result.protocolFee = result.protocolFee.plus(protocolFee);
    }
    return result;
}
exports.fillQuoteOrders = fillQuoteOrders;
function hasProtocolFee(o) {
    return o.type === protocol_utils_1.FillQuoteTransformerOrderType.Limit;
}
function solveForInputFillAmount(remainingInput, fillableInput, totalOrderInput, totalOrderInputFee) {
    // When accounting for input token taker fees, the effective input amount is
    // given by:
    //   i' = i + f * i / o
    // where:
    //   i' - The effective input amount, including fees
    //   i  - An input amount
    //   f  - totalOrderInputFee
    //   o  - totalOrderInput
    // Solving for i we get:
    //   i = (i' * o) / (f + o)
    const denom = totalOrderInput.plus(totalOrderInputFee);
    if (denom.eq(0)) {
        // A zero denominator would imply an order whose fees are >= the input
        // token amount.
        // For sells, takerFeeAmount >= takerAssetAmount (technically OK but really undesirable).
        // For buys, takerFeeAmount >= makerAssetAmount (losing all your returns to fees).
        return fillableInput;
    }
    return utils_1.BigNumber.min(fillableInput, 
    // let i' = remainingInput
    remainingInput.times(totalOrderInput).div(denom));
}
function createBestCaseFillOrderCalls(quoteInfo) {
    const { orders, side } = quoteInfo;
    return orders.map((o) => ({
        order: o,
        ...(side === types_1.MarketOperation.Sell
            ? {
                totalOrderInput: o.takerAmount,
                totalOrderOutput: o.makerAmount,
                totalOrderInputFee: o.type === protocol_utils_1.FillQuoteTransformerOrderType.Limit
                    ? (0, utils_2.getNativeAdjustedTakerFeeAmount)(o.fillData.order, o.takerAmount)
                    : ZERO_AMOUNT,
                totalOrderOutputFee: ZERO_AMOUNT, // makerToken fees are not supported in v4 (sell output)
            }
            : // Buy
                {
                    totalOrderInput: o.makerAmount,
                    totalOrderOutput: o.takerAmount,
                    totalOrderInputFee: ZERO_AMOUNT,
                    totalOrderOutputFee: o.type === protocol_utils_1.FillQuoteTransformerOrderType.Limit
                        ? (0, utils_2.getNativeAdjustedTakerFeeAmount)(o.fillData.order, o.takerAmount)
                        : ZERO_AMOUNT,
                }),
    }));
}
function roundInputAmount(amount, side) {
    return amount.integerValue(side === types_1.MarketOperation.Sell ? ROUND_UP : ROUND_DOWN);
}
function roundOutputAmount(amount, side) {
    return amount.integerValue(side === types_1.MarketOperation.Sell ? ROUND_DOWN : ROUND_UP);
}
function roundIntermediateFillResult(ir, side) {
    return {
        input: roundInputAmount(ir.input, side),
        output: roundOutputAmount(ir.output, side),
        inputFee: roundInputAmount(ir.inputFee, side),
        outputFee: roundOutputAmount(ir.outputFee, side),
        protocolFee: ir.protocolFee.integerValue(ROUND_UP),
        gas: Math.ceil(ir.gas),
        inputBySource: Object.assign({}, ...Object.entries(ir.inputBySource).map(([k, v]) => ({ [k]: roundInputAmount(v, side) }))),
    };
}
function fromIntermediateQuoteFillResult(ir, quoteInfo) {
    const { side } = quoteInfo;
    const _ir = roundIntermediateFillResult(ir, side);
    return {
        ...(side === types_1.MarketOperation.Sell
            ? // Sell
                {
                    makerAssetAmount: _ir.output,
                    takerAssetAmount: _ir.input,
                    takerFeeMakerAssetAmount: _ir.outputFee,
                    takerFeeTakerAssetAmount: _ir.inputFee,
                    totalMakerAssetAmount: _ir.output.plus(_ir.outputFee),
                    totalTakerAssetAmount: _ir.input.plus(_ir.inputFee),
                }
            : // Buy
                {
                    makerAssetAmount: _ir.input,
                    takerAssetAmount: _ir.output,
                    takerFeeMakerAssetAmount: _ir.inputFee,
                    takerFeeTakerAssetAmount: _ir.outputFee,
                    totalMakerAssetAmount: _ir.input.plus(_ir.inputFee),
                    totalTakerAssetAmount: _ir.output.plus(_ir.outputFee),
                }),
        protocolFeeAmount: _ir.protocolFee,
        gas: _ir.gas,
        fillAmountBySource: _ir.inputBySource,
    };
}
function getTotalGasUsedByFills(orders, gasSchedule) {
    return _.sum(orders.map((order) => gasSchedule[order.source](order.fillData)));
}
//# sourceMappingURL=quote_simulation.js.map