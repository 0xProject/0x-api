"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSignedNativeOrderWithFillableAmounts = exports.toSignedNativeOrder = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
/**
 * Converts a RfqClientRfqOrderFirmQuote to a SignedNativeOrder
 */
const toSignedNativeOrder = (quote) => {
    return {
        type: protocol_utils_1.FillQuoteTransformerOrderType.Rfq,
        order: quote.order,
        signature: quote.signature,
    };
};
exports.toSignedNativeOrder = toSignedNativeOrder;
/**
 * Converts a RfqtV2Quote to a NativeOrderWithFillableAmounts
 */
const toSignedNativeOrderWithFillableAmounts = (quote) => {
    return {
        type: protocol_utils_1.FillQuoteTransformerOrderType.Otc,
        order: quote.order,
        signature: quote.signature,
        fillableTakerAmount: quote.fillableTakerAmount,
        fillableMakerAmount: quote.fillableMakerAmount,
        fillableTakerFeeAmount: quote.fillableTakerFeeAmount,
    };
};
exports.toSignedNativeOrderWithFillableAmounts = toSignedNativeOrderWithFillableAmounts;
//# sourceMappingURL=rfq_client_mappers.js.map