"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestQuote = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
const asset_swapper_1 = require("../asset-swapper");
const constants_1 = require("../constants");
/**
 * Selects the best quote from an array of quotes.
 */
function getBestQuote(quotes, isSelling, takerToken, makerToken, assetFillAmount, validityWindowMs) {
    // Filter out quotes that:
    // - are for the wrong pair
    // - cannot fill 100 % of the requested amount
    // - expire in less than the validity window
    //
    // And sort by best price
    const now = new asset_swapper_1.BigNumber(Date.now());
    const expirationCutoff = now.plus(validityWindowMs).div(constants_1.ONE_SECOND_MS);
    const sortedQuotes = quotes
        .filter((q) => getTakerToken(q) === takerToken && getMakerToken(q) === makerToken)
        .filter((q) => {
        const requestedAmount = isSelling ? getTakerAmount(q) : getMakerAmount(q);
        return requestedAmount.gte(assetFillAmount);
    })
        .filter((q) => getExpiry(q).gte(expirationCutoff))
        .sort((a, b) => {
        // Want the most amount of maker tokens for each taker token
        const aPrice = getMakerAmount(a).div(getTakerAmount(a));
        const bPrice = getMakerAmount(b).div(getTakerAmount(b));
        return bPrice.minus(aPrice).toNumber();
    });
    // No quotes found
    if (sortedQuotes.length === 0) {
        return null;
    }
    // Get the best quote
    return sortedQuotes[0];
}
exports.getBestQuote = getBestQuote;
/// Private Getter functions
const getTakerToken = (quote) => {
    if (isSignedNativeOrder(quote)) {
        return quote.order.takerToken;
    }
    return quote.takerToken;
};
const getMakerToken = (quote) => {
    if (isSignedNativeOrder(quote)) {
        return quote.order.makerToken;
    }
    return quote.makerToken;
};
const getTakerAmount = (quote) => {
    if (isSignedNativeOrder(quote)) {
        return quote.order.takerAmount;
    }
    return quote.takerAmount;
};
const getMakerAmount = (quote) => {
    if (isSignedNativeOrder(quote)) {
        return quote.order.makerAmount;
    }
    return quote.makerAmount;
};
const getExpiry = (quote) => {
    if (isSignedNativeOrder(quote)) {
        if (isOtcOrder(quote)) {
            const { expiry } = protocol_utils_1.OtcOrder.parseExpiryAndNonce(quote.order.expiryAndNonce);
            return expiry;
        }
        return quote.order.expiry;
    }
    return quote.expiry;
};
const isSignedNativeOrder = (quote) => {
    return quote.order !== undefined;
};
const isOtcOrder = (order) => {
    return order.type === protocol_utils_1.FillQuoteTransformerOrderType.Otc;
};
//# sourceMappingURL=quote_comparison_utils.js.map