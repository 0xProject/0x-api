"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AaveReservesCache = void 0;
const utils_1 = require("@0x/utils");
const graphql_request_1 = require("graphql-request");
const constants_1 = require("../../constants");
const AAVE_V2_RESERVES_GQL_QUERY = (0, graphql_request_1.gql) `
    {
        reserves(
            first: 300
            where: { isActive: true, isFrozen: false }
            orderBy: totalLiquidity
            orderDirection: desc
        ) {
            id
            underlyingAsset
            aToken {
                id
            }
            pool {
                id
                lendingPool
            }
        }
    }
`;
const AAVE_V3_RESERVES_GQL_QUERY = (0, graphql_request_1.gql) `
    {
        reserves(
            first: 300
            where: { isActive: true, isFrozen: false }
            orderBy: totalLiquidity
            orderDirection: desc
        ) {
            id
            underlyingAsset
            aToken {
                id
            }
            pool {
                id
                pool
            }
        }
    }
`;
const RESERVES_REFRESH_INTERVAL_MS = 30 * constants_1.constants.ONE_MINUTE_MS;
/**
 * Fetches Aave V2/V3 reserve information from the official subgraph(s).
 * The reserve information is updated every 30 minutes and cached
 * so that it can be accessed with the underlying token's address
 */
class AaveReservesCache {
    constructor(_subgraphUrl, _isV3) {
        this._subgraphUrl = _subgraphUrl;
        this._isV3 = _isV3;
        this._cache = {};
        const resfreshReserves = async () => this.fetchAndUpdateReservesAsync();
        resfreshReserves();
        setInterval(resfreshReserves, RESERVES_REFRESH_INTERVAL_MS);
    }
    /**
     * Fetches Aave V2/V3 reserves from the subgraph and updates the cache
     */
    async fetchAndUpdateReservesAsync() {
        try {
            let reserves;
            if (this._isV3) {
                ({ reserves } = await (0, graphql_request_1.request)(this._subgraphUrl, AAVE_V3_RESERVES_GQL_QUERY));
            }
            else {
                ({ reserves } = await (0, graphql_request_1.request)(this._subgraphUrl, AAVE_V2_RESERVES_GQL_QUERY));
            }
            const newCache = reserves.reduce((memo, reserve) => {
                const underlyingAsset = reserve.underlyingAsset.toLowerCase();
                if (!memo[underlyingAsset]) {
                    memo[underlyingAsset] = [];
                }
                memo[underlyingAsset].push(reserve);
                return memo;
            }, {});
            this._cache = newCache;
        }
        catch (err) {
            utils_1.logUtils.warn(`Failed to update Aave V2 reserves cache: ${err.message}`);
            // Empty cache just to be safe
            this._cache = {};
        }
    }
    get(takerToken, makerToken) {
        // Deposit takerToken into reserve
        if (this._cache[takerToken.toLowerCase()]) {
            const matchingReserve = this._cache[takerToken.toLowerCase()].find((r) => r.aToken.id === makerToken.toLowerCase());
            if (matchingReserve) {
                return matchingReserve;
            }
        }
        // Withdraw makerToken from reserve
        if (this._cache[makerToken.toLowerCase()]) {
            const matchingReserve = this._cache[makerToken.toLowerCase()].find((r) => r.aToken.id === takerToken.toLowerCase());
            if (matchingReserve) {
                return matchingReserve;
            }
        }
        // No match
        return undefined;
    }
}
exports.AaveReservesCache = AaveReservesCache;
//# sourceMappingURL=aave_reserves_cache.js.map