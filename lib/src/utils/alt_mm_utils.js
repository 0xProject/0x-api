"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.altMarketResponseToAltOfferings = void 0;
/**
 * Parses an alt RFQ MM markets response into AltRfqtMakerAssetOfferings
 * @param altRfqMarketsResponse response from an alt RFQ MM markets request
 * @param altRfqUrl base URL
 */
function altMarketResponseToAltOfferings(altRfqMarketsResponse, altRfqUrl) {
    const offerings = altRfqMarketsResponse.items.map((market) => {
        return {
            id: market.id,
            baseAsset: market.base.address.toLowerCase(),
            baseAssetDecimals: market.base.decimals,
            quoteAsset: market.quote.address.toLowerCase(),
            quoteAssetDecimals: market.quote.decimals,
        };
    });
    return { [altRfqUrl]: offerings };
}
exports.altMarketResponseToAltOfferings = altMarketResponseToAltOfferings;
//# sourceMappingURL=alt_mm_utils.js.map