"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRate = exports.getCompleteRate = void 0;
const types_1 = require("../../types");
const constants_1 = require("./constants");
/**
 * Computes the "complete" rate given the input/output of a path.
 * This value penalizes the path if it falls short of the target input.
 */
function getCompleteRate(side, input, output, targetInput) {
    if (input.eq(0) || output.eq(0) || targetInput.eq(0)) {
        return constants_1.ZERO_AMOUNT;
    }
    // Penalize paths that fall short of the entire input amount by a factor of
    // input / targetInput => (i / t)
    if (side === types_1.MarketOperation.Sell) {
        // (o / i) * (i / t) => (o / t)
        return output.div(targetInput);
    }
    // (i / o) * (i / t)
    return input.div(output).times(input.div(targetInput));
}
exports.getCompleteRate = getCompleteRate;
/**
 * Computes the rate given the input/output of a path.
 *
 * If it is a sell, output/input. If it is a buy, input/output.
 */
function getRate(side, input, output) {
    if (input.eq(0) || output.eq(0)) {
        return constants_1.ZERO_AMOUNT;
    }
    return side === types_1.MarketOperation.Sell ? output.div(input) : input.div(output);
}
exports.getRate = getRate;
//# sourceMappingURL=rate_utils.js.map