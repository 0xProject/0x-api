"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractPoolsCache = void 0;
const constants_1 = require("../constants");
// Cache results for 30mins
const DEFAULT_CACHE_TIME_MS = (constants_1.ONE_HOUR_IN_SECONDS / 2) * constants_1.ONE_SECOND_MS;
const DEFAULT_TIMEOUT_MS = 3000;
class AbstractPoolsCache {
    constructor(_cache, _cacheTimeMs = DEFAULT_CACHE_TIME_MS) {
        this._cache = _cache;
        this._cacheTimeMs = _cacheTimeMs;
    }
    static _getKey(takerToken, makerToken) {
        return `${takerToken}-${makerToken}`;
    }
    static _isExpired(value) {
        if (value === undefined) {
            return true;
        }
        return Date.now() >= value.expiresAt;
    }
    async getFreshPoolsForPairAsync(takerToken, makerToken, timeoutMs = DEFAULT_TIMEOUT_MS) {
        const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs, []));
        return Promise.race([this._getAndSaveFreshPoolsForPairAsync(takerToken, makerToken), timeout]);
    }
    /**
     * Returns pool addresses (can be stale) for a pair.
     *
     * An empty array will be returned if cache does not exist.
     */
    getPoolAddressesForPair(takerToken, makerToken) {
        const value = this._getValue(takerToken, makerToken);
        return value === undefined ? [] : value.pools.map((pool) => pool.id);
    }
    isFresh(takerToken, makerToken) {
        const value = this._getValue(takerToken, makerToken);
        return !AbstractPoolsCache._isExpired(value);
    }
    _getValue(takerToken, makerToken) {
        const key = AbstractPoolsCache._getKey(takerToken, makerToken);
        return this._cache.get(key);
    }
    async _getAndSaveFreshPoolsForPairAsync(takerToken, makerToken) {
        const key = AbstractPoolsCache._getKey(takerToken, makerToken);
        const value = this._cache.get(key);
        if (!AbstractPoolsCache._isExpired(value)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            return value.pools;
        }
        const pools = await this._fetchPoolsForPairAsync(takerToken, makerToken);
        const expiresAt = Date.now() + this._cacheTimeMs;
        this._cachePoolsForPair(takerToken, makerToken, pools, expiresAt);
        return pools;
    }
    _cachePoolsForPair(takerToken, makerToken, pools, expiresAt) {
        const key = AbstractPoolsCache._getKey(takerToken, makerToken);
        this._cache.set(key, { pools, expiresAt });
    }
}
exports.AbstractPoolsCache = AbstractPoolsCache;
//# sourceMappingURL=pools_cache.js.map