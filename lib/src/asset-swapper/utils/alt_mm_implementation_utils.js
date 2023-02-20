"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAltMarketInfo = void 0;
/**
 * Returns the AltOffering if it exists for a given pair
 */
function getAltMarketInfo(offerings, buyTokenAddress, sellTokenAddress) {
    for (const offering of offerings) {
        if ((buyTokenAddress.toLowerCase() === offering.baseAsset.toLowerCase() &&
            sellTokenAddress.toLowerCase() === offering.quoteAsset.toLowerCase()) ||
            (sellTokenAddress.toLowerCase() === offering.baseAsset.toLowerCase() &&
                buyTokenAddress.toLowerCase() === offering.quoteAsset.toLowerCase())) {
            return offering;
        }
    }
    return undefined;
}
exports.getAltMarketInfo = getAltMarketInfo;
//# sourceMappingURL=alt_mm_implementation_utils.js.map