"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestTwoHopQuote = void 0;
const constants_1 = require("./constants");
const rate_utils_1 = require("./rate_utils");
/**
 * Returns the best two-hop quote and the fee-adjusted rate of that quote.
 */
function getBestTwoHopQuote(marketSideLiquidity, feeSchedule, exchangeProxyOverhead, fillAdjustor) {
    const { side, inputAmount, outputAmountPerEth, quotes } = marketSideLiquidity;
    const { twoHopQuotes } = quotes;
    // Ensure the expected data we require exists. In the case where all hops reverted
    // or there were no sources included that allowed for multi hop,
    // we can end up with empty, but not undefined, fill data
    const filteredQuotes = twoHopQuotes.filter((quote) => quote &&
        quote.fillData &&
        quote.fillData.firstHopSource &&
        quote.fillData.secondHopSource &&
        quote.output.isGreaterThan(constants_1.ZERO_AMOUNT));
    if (filteredQuotes.length === 0) {
        return { quote: undefined, adjustedRate: constants_1.ZERO_AMOUNT };
    }
    const best = filteredQuotes
        .map((quote) => (0, rate_utils_1.getTwoHopAdjustedRate)(side, quote, inputAmount, outputAmountPerEth, feeSchedule, exchangeProxyOverhead, fillAdjustor))
        .reduce((prev, curr, i) => curr.isGreaterThan(prev.adjustedRate) ? { adjustedRate: curr, quote: filteredQuotes[i] } : prev, {
        adjustedRate: (0, rate_utils_1.getTwoHopAdjustedRate)(side, filteredQuotes[0], inputAmount, outputAmountPerEth, feeSchedule, exchangeProxyOverhead, fillAdjustor),
        quote: filteredQuotes[0],
    });
    return best;
}
exports.getBestTwoHopQuote = getBestTwoHopQuote;
//# sourceMappingURL=multihop_utils.js.map