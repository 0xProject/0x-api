"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteRequestor = void 0;
function nativeDataToId(data) {
    const { v, r, s } = data.signature;
    return `${v}${r}${s}`;
}
/**
 * QuoteRequestor is a deprecated class and is maintained for its legacy usage by QuoteReport
 */
class QuoteRequestor {
    constructor() {
        this._orderSignatureToMakerUri = {};
    }
    /**
     * Given an order signature, returns the makerUri that the order originated from
     */
    getMakerUriForSignature(signature) {
        return this._orderSignatureToMakerUri[nativeDataToId({ signature })];
    }
    /**
     * Set the makerUri for a given signature for future lookup by signature
     */
    setMakerUriForSignature(signature, makerUri) {
        this._orderSignatureToMakerUri[nativeDataToId({ signature })] = makerUri;
    }
}
exports.QuoteRequestor = QuoteRequestor;
//# sourceMappingURL=quote_requestor.js.map