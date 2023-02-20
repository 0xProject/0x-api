"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubgraphPoolDataService = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const utils_1 = require("@0x/utils");
const graphql_request_1 = require("graphql-request");
const isSameAddress = (address1, address2) => address1.toLowerCase() === address2.toLowerCase();
const queryWithLinear = (0, graphql_request_1.gql) `
    query fetchTopPoolsWithLinear($maxPoolsFetched: Int!) {
        pools: pools(
            first: $maxPoolsFetched
            where: { swapEnabled: true, totalShares_not_in: ["0", "0.000000000001"] }
            orderBy: totalLiquidity
            orderDirection: desc
        ) {
            id
            address
            poolType
            swapFee
            totalShares
            tokens {
                address
                balance
                decimals
                weight
                priceRate
            }
            tokensList
            totalWeight
            amp
            expiryTime
            unitSeconds
            principalToken
            baseToken
            swapEnabled
            wrappedIndex
            mainIndex
            lowerTarget
            upperTarget
            sqrtAlpha
            sqrtBeta
            root3Alpha
            alpha
            beta
            c
            s
            lambda
            tauAlphaX
            tauAlphaY
            tauBetaX
            tauBetaY
            u
            v
            w
            z
            dSq
        }
    }
`;
const QUERY_BY_CHAIN_ID = {
    [contract_addresses_1.ChainId.Mainnet]: queryWithLinear,
    [contract_addresses_1.ChainId.Polygon]: queryWithLinear,
    [contract_addresses_1.ChainId.Arbitrum]: queryWithLinear,
    [contract_addresses_1.ChainId.Optimism]: queryWithLinear,
    [contract_addresses_1.ChainId.Fantom]: queryWithLinear,
};
const DEFAULT_MAX_POOLS_FETCHED = 96;
/**
 * Simple service to query required info from Subgraph for Balancer Pools.
 * Because Balancer Subgraphs have slightly different schema depending on network the queries are adjusted as needed.
 */
class SubgraphPoolDataService {
    constructor(_config) {
        this._config = _config;
        this._config.maxPoolsFetched = this._config.maxPoolsFetched || DEFAULT_MAX_POOLS_FETCHED;
        this._gqlQuery = QUERY_BY_CHAIN_ID[this._config.chainId];
    }
    async getPools() {
        if (!this._gqlQuery || !this._config.subgraphUrl) {
            return [];
        }
        try {
            const { pools } = await (0, graphql_request_1.request)(this._config.subgraphUrl, this._gqlQuery, {
                maxPoolsFetched: this._config.maxPoolsFetched,
            });
            // Filter out any pools that were set to ignore in config
            const filteredPools = pools.filter((p) => {
                if (!this._config.poolsToIgnore)
                    return true;
                const index = this._config.poolsToIgnore.findIndex((addr) => isSameAddress(addr, p.address));
                return index === -1;
            });
            return filteredPools;
        }
        catch (err) {
            utils_1.logUtils.warn(`Failed to fetch BalancerV2 subgraph pools: ${err.message}`);
            return [];
        }
    }
}
exports.SubgraphPoolDataService = SubgraphPoolDataService;
//# sourceMappingURL=sgPoolDataService.js.map