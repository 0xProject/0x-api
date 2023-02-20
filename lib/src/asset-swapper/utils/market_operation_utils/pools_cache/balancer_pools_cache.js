"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancerPoolsCache = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const balancer_labs_sor_v1_1 = require("balancer-labs-sor-v1");
const graphql_request_1 = require("graphql-request");
const constants_1 = require("../../../constants");
const constants_2 = require("../constants");
const no_op_pools_cache_1 = require("./no_op_pools_cache");
const pools_cache_1 = require("./pools_cache");
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BALANCER_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer';
class BalancerPoolsCache extends pools_cache_1.AbstractPoolsCache {
    constructor(_subgraphUrl = BALANCER_SUBGRAPH_URL, cache = new Map(), maxPoolsFetched = constants_2.BALANCER_MAX_POOLS_FETCHED, _topPoolsFetched = constants_2.BALANCER_TOP_POOLS_FETCHED, _warningLogger = constants_1.DEFAULT_WARNING_LOGGER) {
        super(cache);
        this._subgraphUrl = _subgraphUrl;
        this.maxPoolsFetched = maxPoolsFetched;
        this._topPoolsFetched = _topPoolsFetched;
        this._warningLogger = _warningLogger;
        void this._loadTopPoolsAsync();
        // Reload the top pools every 12 hours
        setInterval(async () => void this._loadTopPoolsAsync(), ONE_DAY_MS / 2);
    }
    static create(chainId) {
        if (chainId !== contract_addresses_1.ChainId.Mainnet) {
            return new no_op_pools_cache_1.NoOpPoolsCache();
        }
        return new BalancerPoolsCache();
    }
    async _fetchPoolsForPairAsync(takerToken, makerToken) {
        try {
            const poolData = (await (0, balancer_labs_sor_v1_1.getPoolsWithTokens)(takerToken, makerToken)).pools;
            // Sort by maker token balance (descending)
            const pools = (0, balancer_labs_sor_v1_1.parsePoolData)(poolData, takerToken, makerToken).sort((a, b) => b.balanceOut.minus(a.balanceOut).toNumber());
            return pools.length > this.maxPoolsFetched ? pools.slice(0, this.maxPoolsFetched) : pools;
        }
        catch (err) {
            return [];
        }
    }
    async _loadTopPoolsAsync() {
        const fromToPools = {};
        let pools;
        try {
            pools = await this._fetchTopPoolsAsync();
        }
        catch (err) {
            this._warningLogger(err, 'Failed to fetch top pools for Balancer V1');
            return;
        }
        for (const pool of pools) {
            const { tokensList } = pool;
            for (const from of tokensList) {
                for (const to of tokensList.filter((t) => t.toLowerCase() !== from.toLowerCase())) {
                    fromToPools[from] = fromToPools[from] || {};
                    fromToPools[from][to] = fromToPools[from][to] || [];
                    try {
                        // The list of pools must be relevant to `from` and `to`  for `parsePoolData`
                        const poolData = (0, balancer_labs_sor_v1_1.parsePoolData)([pool], from, to);
                        if (poolData.length === 0) {
                            continue;
                        }
                        fromToPools[from][to].push(poolData[0]);
                        // Cache this as we progress through
                        const expiresAt = Date.now() + this._cacheTimeMs;
                        this._cachePoolsForPair(from, to, fromToPools[from][to], expiresAt);
                    }
                    catch {
                        // soldier on
                    }
                }
            }
        }
    }
    async _fetchTopPoolsAsync() {
        const query = (0, graphql_request_1.gql) `
            query fetchTopPools($topPoolsFetched: Int!) {
                pools(
                    first: $topPoolsFetched
                    where: { publicSwap: true, liquidity_gt: 0 }
                    orderBy: swapsCount
                    orderDirection: desc
                ) {
                    id
                    publicSwap
                    swapFee
                    totalWeight
                    tokensList
                    tokens {
                        id
                        address
                        balance
                        decimals
                        symbol
                        denormWeight
                    }
                }
            }
        `;
        try {
            const { pools } = await (0, graphql_request_1.request)(this._subgraphUrl, query, { topPoolsFetched: this._topPoolsFetched });
            return pools;
        }
        catch (err) {
            return [];
        }
    }
}
exports.BalancerPoolsCache = BalancerPoolsCache;
//# sourceMappingURL=balancer_pools_cache.js.map