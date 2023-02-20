"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoOpPoolsCache = void 0;
class NoOpPoolsCache {
    async getFreshPoolsForPairAsync(_takerToken, _makerToken, _timeoutMs) {
        return [];
    }
    getPoolAddressesForPair(_takerToken, _makerToken) {
        return [];
    }
    isFresh(_takerToken, _makerToken) {
        return true;
    }
}
exports.NoOpPoolsCache = NoOpPoolsCache;
//# sourceMappingURL=no_op_pools_cache.js.map