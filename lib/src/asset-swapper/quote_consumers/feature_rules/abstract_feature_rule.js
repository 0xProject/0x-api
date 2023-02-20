"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractFeatureRule = void 0;
const utils_1 = require("@0x/utils");
const quote_consumer_utils_1 = require("../quote_consumer_utils");
class AbstractFeatureRule {
    /** Returns a commonly needed context.*/
    getSwapContext(quote, opts) {
        // Take the bounds from the worst case
        const sellAmount = utils_1.BigNumber.max(quote.bestCaseQuoteInfo.totalTakerAmount, quote.worstCaseQuoteInfo.totalTakerAmount);
        const ethAmount = quote.worstCaseQuoteInfo.protocolFeeInWeiAmount.plus(opts.isFromETH ? sellAmount : 0);
        const maxSlippage = (0, quote_consumer_utils_1.getMaxQuoteSlippageRate)(quote);
        return {
            sellToken: quote.takerToken,
            buyToken: quote.makerToken,
            sellAmount,
            minBuyAmount: quote.worstCaseQuoteInfo.makerAmount,
            ethAmount,
            maxSlippage,
        };
    }
}
exports.AbstractFeatureRule = AbstractFeatureRule;
//# sourceMappingURL=abstract_feature_rule.js.map