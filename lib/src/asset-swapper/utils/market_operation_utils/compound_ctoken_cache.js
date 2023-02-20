"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompoundCTokenCache = void 0;
const utils_1 = require("@0x/utils");
const axios_1 = require("axios");
const constants_1 = require("../../constants");
const CTOKEN_REFRESH_INTERVAL_MS = 30 * constants_1.constants.ONE_MINUTE_MS;
/**
 * Fetches a list of CTokens from Compound's official API.
 * The token information is updated every 30 minutes and cached
 * so that it can be accessed with the underlying token's address.
 */
class CompoundCTokenCache {
    constructor(_apiUrl, _wethAddress) {
        this._apiUrl = _apiUrl;
        this._wethAddress = _wethAddress;
        this._cache = {};
        const refreshCTokenCache = async () => this.fetchAndUpdateCTokensAsync();
        refreshCTokenCache();
        setInterval(refreshCTokenCache, CTOKEN_REFRESH_INTERVAL_MS);
    }
    async fetchAndUpdateCTokensAsync() {
        try {
            const { data } = await axios_1.default.get(`${this._apiUrl}/ctoken`);
            const newCache = data === null || data === void 0 ? void 0 : data.cToken.reduce((memo, cToken) => {
                // NOTE: Re-map cETH with null underlying token address to WETH address (we only handle WETH internally)
                const underlyingAddressClean = cToken.underlying_address
                    ? cToken.underlying_address.toLowerCase()
                    : this._wethAddress;
                const tokenData = {
                    tokenAddress: cToken.token_address.toLowerCase(),
                    underlyingAddress: underlyingAddressClean,
                };
                memo[underlyingAddressClean] = tokenData;
                return memo;
            }, {});
            this._cache = newCache;
        }
        catch (err) {
            utils_1.logUtils.warn(`Failed to update Compound cToken cache: ${err.message}`);
            // NOTE: Safe to keep already cached data as tokens should only be added to the list
        }
    }
    get(takerToken, makerToken) {
        // mint cToken
        let cToken = this._cache[takerToken.toLowerCase()];
        if (cToken && makerToken.toLowerCase() === cToken.tokenAddress.toLowerCase()) {
            return cToken;
        }
        // redeem cToken
        cToken = this._cache[makerToken.toLowerCase()];
        if (cToken && takerToken.toLowerCase() === cToken.tokenAddress.toLowerCase()) {
            return cToken;
        }
        // No match
        return undefined;
    }
}
exports.CompoundCTokenCache = CompoundCTokenCache;
//# sourceMappingURL=compound_ctoken_cache.js.map