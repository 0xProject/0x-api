"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = exports.getNativeAdjustedFillableAmountsFromMakerAmount = exports.getNativeAdjustedFillableAmountsFromTakerAmount = exports.getNativeAdjustedTakerFeeAmount = exports.getNativeAdjustedMakerFillAmount = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const assert_1 = require("@0x/assert");
const constants_1 = require("./market_operation_utils/constants");
/**
 * Given an amount of taker asset, calculate the the amount of maker asset
 * @param order The order
 * @param makerFillAmount the amount of taker asset
 */
function getNativeAdjustedMakerFillAmount(order, takerFillAmount) {
    // Round down because exchange rate favors Maker
    const makerFillAmount = takerFillAmount
        .multipliedBy(order.makerAmount)
        .div(order.takerAmount)
        .integerValue(utils_1.BigNumber.ROUND_FLOOR);
    return makerFillAmount;
}
exports.getNativeAdjustedMakerFillAmount = getNativeAdjustedMakerFillAmount;
/**
 * Given an amount of maker asset, calculate the equivalent amount in taker asset
 * @param order The order
 * @param makerFillAmount the amount of maker asset
 */
function getNativeAdjustedTakerFillAmount(order, makerFillAmount) {
    // Round up because exchange rate favors Maker
    const takerFillAmount = makerFillAmount
        .multipliedBy(order.takerAmount)
        .div(order.makerAmount)
        .integerValue(utils_1.BigNumber.ROUND_CEIL);
    return takerFillAmount;
}
/**
 * Given an amount of taker asset, calculate the fee amount required for the taker
 * @param order The order
 * @param takerFillAmount the amount of taker asset
 */
function getNativeAdjustedTakerFeeAmount(order, takerFillAmount) {
    // Round down because Taker fee rate favors Taker
    const takerFeeAmount = takerFillAmount
        .multipliedBy(order.takerTokenFeeAmount)
        .div(order.takerAmount)
        .integerValue(utils_1.BigNumber.ROUND_FLOOR);
    return takerFeeAmount;
}
exports.getNativeAdjustedTakerFeeAmount = getNativeAdjustedTakerFeeAmount;
const EMPTY_FILLABLE_AMOUNTS = {
    fillableMakerAmount: constants_1.ZERO_AMOUNT,
    fillableTakerAmount: constants_1.ZERO_AMOUNT,
    fillableTakerFeeAmount: constants_1.ZERO_AMOUNT,
};
function getNativeAdjustedFillableAmountsFromTakerAmount(order, takerFillableAmount) {
    if (takerFillableAmount.isZero()) {
        return EMPTY_FILLABLE_AMOUNTS;
    }
    return {
        fillableTakerAmount: takerFillableAmount,
        fillableMakerAmount: getNativeAdjustedMakerFillAmount(order.order, takerFillableAmount),
        fillableTakerFeeAmount: order.type === protocol_utils_1.FillQuoteTransformerOrderType.Limit
            ? getNativeAdjustedTakerFeeAmount(order.order, takerFillableAmount)
            : constants_1.ZERO_AMOUNT,
    };
}
exports.getNativeAdjustedFillableAmountsFromTakerAmount = getNativeAdjustedFillableAmountsFromTakerAmount;
function getNativeAdjustedFillableAmountsFromMakerAmount(order, makerFillableAmount) {
    if (makerFillableAmount.isZero()) {
        return EMPTY_FILLABLE_AMOUNTS;
    }
    const takerFillableAmount = getNativeAdjustedTakerFillAmount(order.order, makerFillableAmount);
    return {
        fillableMakerAmount: makerFillableAmount,
        fillableTakerAmount: takerFillableAmount,
        fillableTakerFeeAmount: order.type === protocol_utils_1.FillQuoteTransformerOrderType.Limit
            ? getNativeAdjustedTakerFeeAmount(order.order, takerFillableAmount)
            : constants_1.ZERO_AMOUNT,
    };
}
exports.getNativeAdjustedFillableAmountsFromMakerAmount = getNativeAdjustedFillableAmountsFromMakerAmount;
exports.assert = {
    ...assert_1.assert,
    isValidOrderbook(variableName, orderFetcher) {
        assert_1.assert.isFunction(`${variableName}.getOrdersAsync`, orderFetcher.getOrdersAsync.bind(orderFetcher));
        assert_1.assert.isFunction(`${variableName}.getBatchOrdersAsync`, orderFetcher.getBatchOrdersAsync.bind(orderFetcher));
    },
    isValidPercentage(variableName, percentage) {
        exports.assert.isNumber(variableName, percentage);
        exports.assert.assert(percentage >= 0 && percentage <= 1, `Expected ${variableName} to be between 0 and 1, but is ${percentage}`);
    },
};
//# sourceMappingURL=utils.js.map