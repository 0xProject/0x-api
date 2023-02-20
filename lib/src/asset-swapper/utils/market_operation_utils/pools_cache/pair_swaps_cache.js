"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapInfoCache = exports.EMPTY_BALANCER_SWAPS = void 0;
const constants_1 = require("../constants");
// Cache results for 30mins
const DEFAULT_CACHE_TIME_MS = (constants_1.ONE_HOUR_IN_SECONDS / 2) * constants_1.ONE_SECOND_MS;
const DEFAULT_TIMEOUT_MS = constants_1.ONE_SECOND_MS;
exports.EMPTY_BALANCER_SWAPS = { swapInfoExactIn: [], swapInfoExactOut: [] };
/**
 * Caches SwapInfo for a pair of tokens.
 * SwapInfo includes swap steps and asset information for those swap steps.
 */
class SwapInfoCache {
    constructor(_cache, _cacheTimeMs = DEFAULT_CACHE_TIME_MS) {
        this._cache = _cache;
        this._cacheTimeMs = _cacheTimeMs;
    }
    static _isExpired(value) {
        return Date.now() >= value.expiresAt;
    }
    async getFreshPoolsForPairAsync(takerToken, makerToken, timeoutMs = DEFAULT_TIMEOUT_MS) {
        const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs, []));
        return Promise.race([this._getAndSaveFreshSwapInfoForPairAsync(takerToken, makerToken), timeout]);
    }
    getCachedSwapInfoForPair(takerToken, makerToken, ignoreExpired = true) {
        const key = JSON.stringify([takerToken, makerToken]);
        const value = this._cache[key];
        if (ignoreExpired) {
            return value === undefined ? exports.EMPTY_BALANCER_SWAPS : value.balancerSwaps;
        }
        if (!value) {
            return undefined;
        }
        if (SwapInfoCache._isExpired(value)) {
            return undefined;
        }
        return value.balancerSwaps;
    }
    isFresh(takerToken, makerToken) {
        const cached = this.getCachedSwapInfoForPair(takerToken, makerToken, false);
        return cached !== undefined;
    }
    async _getAndSaveFreshSwapInfoForPairAsync(takerToken, makerToken) {
        const key = JSON.stringify([takerToken, makerToken]);
        const value = this._cache[key];
        if (value === undefined || value.expiresAt >= Date.now()) {
            const swapInfo = await this._fetchSwapInfoForPairAsync(takerToken, makerToken);
            const expiresAt = Date.now() + this._cacheTimeMs;
            this._cacheSwapInfoForPair(takerToken, makerToken, swapInfo, expiresAt);
        }
        return this._cache[key].balancerSwaps;
    }
    _cacheSwapInfoForPair(takerToken, makerToken, swapInfo, expiresAt) {
        const key = JSON.stringify([takerToken, makerToken]);
        this._cache[key] = {
            expiresAt,
            balancerSwaps: swapInfo,
        };
    }
}
exports.SwapInfoCache = SwapInfoCache;
//# sourceMappingURL=pair_swaps_cache.js.map