"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancerV2PoolsCache = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const utils_1 = require("@0x/utils");
const graphql_request_1 = require("graphql-request");
const constants_1 = require("../../../constants");
const constants_2 = require("../constants");
const balancer_sor_v2_1 = require("./balancer_sor_v2");
const no_op_pools_cache_1 = require("./no_op_pools_cache");
const pools_cache_1 = require("./pools_cache");
const BEETHOVEN_X_SUBGRAPH_URL_BY_CHAIN = new Map([
    [contract_addresses_1.ChainId.Fantom, 'https://api.thegraph.com/subgraphs/name/beethovenxfi/beethovenx'],
]);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
class BalancerV2PoolsCache extends pools_cache_1.AbstractPoolsCache {
    constructor(subgraphUrl, maxPoolsFetched = constants_2.BALANCER_MAX_POOLS_FETCHED, _topPoolsFetched = constants_2.BALANCER_TOP_POOLS_FETCHED, _warningLogger = constants_1.DEFAULT_WARNING_LOGGER, cache = new Map()) {
        super(cache);
        this.subgraphUrl = subgraphUrl;
        this.maxPoolsFetched = maxPoolsFetched;
        this._topPoolsFetched = _topPoolsFetched;
        this._warningLogger = _warningLogger;
        void this._loadTopPoolsAsync();
        // Reload the top pools every 12 hours
        setInterval(async () => void this._loadTopPoolsAsync(), ONE_DAY_MS / 2);
    }
    static createBeethovenXPoolCache(chainId) {
        const subgraphUrl = BEETHOVEN_X_SUBGRAPH_URL_BY_CHAIN.get(chainId);
        if (subgraphUrl === undefined) {
            return new no_op_pools_cache_1.NoOpPoolsCache();
        }
        return new BalancerV2PoolsCache(subgraphUrl);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
    static _parseSubgraphPoolData(pool, takerToken, makerToken) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
        const tToken = pool.tokens.find((t) => t.address === takerToken);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
        const mToken = pool.tokens.find((t) => t.address === makerToken);
        const swap = pool.swaps && pool.swaps[0];
        const tokenAmountOut = swap ? swap.tokenAmountOut : undefined;
        const tokenAmountIn = swap ? swap.tokenAmountIn : undefined;
        const spotPrice = tokenAmountOut && tokenAmountIn ? new utils_1.BigNumber(tokenAmountOut).div(tokenAmountIn) : undefined; // TODO: xianny check
        return {
            id: pool.id,
            balanceIn: new utils_1.BigNumber(tToken.balance),
            balanceOut: new utils_1.BigNumber(mToken.balance),
            weightIn: new utils_1.BigNumber(tToken.weight),
            weightOut: new utils_1.BigNumber(mToken.weight),
            swapFee: new utils_1.BigNumber(pool.swapFee),
            spotPrice,
        };
    }
    async _fetchTopPoolsAsync() {
        const query = (0, graphql_request_1.gql) `
            query fetchTopPools($topPoolsFetched: Int!) {
                pools(
                    first: $topPoolsFetched
                    where: { totalLiquidity_gt: 0 }
                    orderBy: swapsCount
                    orderDirection: desc
                ) {
                    id
                    swapFee
                    totalWeight
                    tokensList
                    amp
                    totalShares
                    tokens {
                        id
                        address
                        balance
                        decimals
                        symbol
                        weight
                    }
                }
            }
        `;
        const { pools } = await (0, graphql_request_1.request)(this.subgraphUrl, query, {
            topPoolsFetched: this._topPoolsFetched,
        });
        return pools;
    }
    async _loadTopPoolsAsync() {
        const fromToPools = {};
        let pools;
        try {
            pools = await this._fetchTopPoolsAsync();
        }
        catch (err) {
            this._warningLogger(err, 'Failed to fetch top pools for Balancer V2');
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
                        const [poolData] = (0, balancer_sor_v2_1.parsePoolData)({ [pool.id]: pool }, from, to);
                        fromToPools[from][to].push(BalancerV2PoolsCache._parseSubgraphPoolData(poolData[pool.id], from, to));
                        // Cache this as we progress through
                        const expiresAt = Date.now() + this._cacheTimeMs;
                        this._cachePoolsForPair(from, to, fromToPools[from][to], expiresAt);
                    }
                    catch (err) {
                        this._warningLogger(err, `Failed to load Balancer V2 top pools`);
                        // soldier on
                    }
                }
            }
        }
    }
    async _fetchPoolsForPairAsync(takerToken, makerToken) {
        const query = (0, graphql_request_1.gql) `
        query getPools {
            pools(
              first: ${this.maxPoolsFetched},
              where: {
                tokensList_contains: ["${takerToken}", "${makerToken}"]
              }
            ) {
                id
                tokens {
                    address
                    balance
                    weight
                }
              swapFee
              swaps(
                orderBy: timestamp, orderDirection: desc, first: 1,
                  where:{
                  tokenIn: "${takerToken}",
                  tokenOut: "${makerToken}"
                }
              ) {
                tokenAmountIn
                tokenAmountOut
              }
            }
          }
          `;
        try {
            const { pools } = await (0, graphql_request_1.request)(this.subgraphUrl, query);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
            return pools.map((pool) => BalancerV2PoolsCache._parseSubgraphPoolData(pool, takerToken, makerToken));
        }
        catch (e) {
            return [];
        }
    }
}
exports.BalancerV2PoolsCache = BalancerV2PoolsCache;
//# sourceMappingURL=balancer_v2_pools_cache.js.map