"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancerV2SwapInfoCache = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const utils_1 = require("@0x/utils");
const sor_1 = require("@balancer-labs/sor");
const providers_1 = require("@ethersproject/providers");
const constants_1 = require("../../../constants");
const constants_2 = require("../constants");
const pair_swaps_cache_1 = require("./pair_swaps_cache");
const sgPoolDataService_1 = require("./sgPoolDataService");
const ONE_DAY_MS = 24 * 60 * 60 * constants_2.ONE_SECOND_MS;
const SOR_CONFIG = {
    [contract_addresses_1.ChainId.Mainnet]: {
        chainId: contract_addresses_1.ChainId.Mainnet,
        vault: '0xba12222222228d8ba445958a75a0704d566bf2c8',
        weth: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        wETHwstETH: {
            id: '0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080',
            address: '0x32296969ef14eb0c6d29669c550d4a0449130230',
        },
        connectingTokens: [
            {
                symbol: 'wEth',
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            },
            {
                symbol: 'wstEth',
                address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
            },
            {
                symbol: 'DOLA',
                address: '0x865377367054516e17014ccded1e7d814edc9ce4',
            },
        ],
        poolsToIgnore: [
            '0xbd482ffb3e6e50dc1c437557c3bea2b68f3683ee', // a pool made by an external dev who was playing with a novel rate provider mechanism in production.
        ],
    },
    [contract_addresses_1.ChainId.Polygon]: {
        chainId: contract_addresses_1.ChainId.Polygon,
        vault: '0xba12222222228d8ba445958a75a0704d566bf2c8',
        weth: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        connectingTokens: [
            {
                symbol: 'weth',
                address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
            },
            {
                symbol: 'bbrz2',
                address: '0xe22483774bd8611be2ad2f4194078dac9159f4ba',
            }, // Joins Stables<>BRZ via https://app.balancer.fi/#/polygon/pool/0x4a0b73f0d13ff6d43e304a174697e3d5cfd310a400020000000000000000091c
        ],
        poolsToIgnore: [
            '0x600bd01b6526611079e12e1ff93aba7a3e34226f', // This pool has rateProviders with incorrect scaling
        ],
    },
    [contract_addresses_1.ChainId.Arbitrum]: {
        chainId: contract_addresses_1.ChainId.Arbitrum,
        vault: '0xba12222222228d8ba445958a75a0704d566bf2c8',
        weth: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        connectingTokens: [
            {
                symbol: 'weth',
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
            },
        ],
    },
    [contract_addresses_1.ChainId.Goerli]: {
        chainId: contract_addresses_1.ChainId.Goerli,
        vault: '0x65748e8287ce4b9e6d83ee853431958851550311',
        weth: '0x9a1000d492d40bfccbc03f413a48f5b6516ec0fd',
        connectingTokens: [
            {
                symbol: 'weth',
                address: '0xdfcea9088c8a88a76ff74892c1457c17dfeef9c1',
            },
        ],
    },
    [contract_addresses_1.ChainId.Optimism]: {
        chainId: contract_addresses_1.ChainId.Optimism,
        vault: '0xba12222222228d8ba445958a75a0704d566bf2c8',
        weth: '0x4200000000000000000000000000000000000006',
        connectingTokens: [
            {
                symbol: 'weth',
                address: '0x4200000000000000000000000000000000000006',
            },
        ],
    },
    [contract_addresses_1.ChainId.Fantom]: {
        chainId: contract_addresses_1.ChainId.Fantom,
        vault: '0x20dd72ed959b6147912c2e529f0a0c651c33c9ce',
        weth: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
        connectingTokens: [
            {
                symbol: 'weth',
                address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
            },
        ],
    },
};
class MockTokenPriceService {
    async getNativeAssetPriceInToken() {
        return '';
    }
}
class BalancerV2SwapInfoCache extends pair_swaps_cache_1.SwapInfoCache {
    constructor(chainId, subgraphUrl = constants_2.BALANCER_V2_SUBGRAPH_URL_BY_CHAIN[chainId], _warningLogger = constants_1.DEFAULT_WARNING_LOGGER, cache = {}) {
        super(cache);
        this._warningLogger = _warningLogger;
        const provider = new providers_1.JsonRpcProvider('');
        this._poolDataService = new sgPoolDataService_1.SubgraphPoolDataService({
            chainId,
            subgraphUrl,
            poolsToIgnore: SOR_CONFIG[chainId].poolsToIgnore,
        });
        const sor = new sor_1.SOR(provider, SOR_CONFIG[chainId], this._poolDataService, new MockTokenPriceService());
        // The RouteProposer finds paths between a token pair using direct/multihop/linearPool routes
        this._routeProposer = sor.routeProposer;
        // Uses Subgraph to retrieve up to date pool data required for routeProposer
        void this._loadTopPoolsAsync();
        // Reload the top pools every 12 hours
        setInterval(async () => void this._loadTopPoolsAsync(), ONE_DAY_MS / 2);
    }
    async _loadTopPoolsAsync() {
        const fromToSwapInfo = {};
        // Retrieve pool data from Subgraph
        const pools = await this._poolDataService.getPools();
        // timestamp is used for Element pools
        const timestamp = Math.floor(Date.now() / constants_2.ONE_SECOND_MS);
        const poolsDict = (0, sor_1.parseToPoolsDict)(pools, timestamp);
        for (const pool of pools) {
            const { tokensList } = pool;
            await null; // This loop can be CPU heavy so yield to event loop.
            for (const from of tokensList) {
                for (const to of tokensList.filter((t) => t.toLowerCase() !== from.toLowerCase())) {
                    fromToSwapInfo[from] = fromToSwapInfo[from] || {};
                    // If a record for pair already exists skip as all paths alreay found
                    if (fromToSwapInfo[from][to]) {
                        continue;
                    }
                    else {
                        try {
                            const expiresAt = Date.now() + this._cacheTimeMs;
                            // Retrieve swap steps and assets for a token pair
                            // This only needs to be called once per pair as all paths will be created from single call
                            const pairSwapInfo = this._getPoolPairSwapInfo(poolsDict, from, to);
                            fromToSwapInfo[from][to] = pairSwapInfo;
                            this._cacheSwapInfoForPair(from, to, fromToSwapInfo[from][to], expiresAt);
                        }
                        catch (err) {
                            this._warningLogger(err, `Failed to load Balancer V2 top pools`);
                            // soldier on
                        }
                    }
                }
            }
        }
    }
    /**
     * Will retrieve fresh pair and path data from Subgraph and return and array of swap info for pair..
     * @param takerToken Address of takerToken.
     * @param makerToken Address of makerToken.
     * @returns Swap data for pair consisting of assets and swap steps for ExactIn and ExactOut swap types.
     */
    async _fetchSwapInfoForPairAsync(takerToken, makerToken) {
        try {
            // retrieve up to date pools from SG
            const pools = await this._poolDataService.getPools();
            // timestamp is used for Element pools
            const timestamp = Math.floor(Date.now() / constants_2.ONE_SECOND_MS);
            const poolDictionary = (0, sor_1.parseToPoolsDict)(pools, timestamp);
            return this._getPoolPairSwapInfo(poolDictionary, takerToken, makerToken);
        }
        catch (e) {
            return pair_swaps_cache_1.EMPTY_BALANCER_SWAPS;
        }
    }
    /**
     * Uses pool data from provided dictionary to find top swap paths for token pair.
     * @param pools Dictionary of pool data.
     * @param takerToken Address of taker token.
     * @param makerToken Address of maker token.
     * @returns Swap data for pair consisting of assets and swap steps for ExactIn and ExactOut swap types.
     */
    _getPoolPairSwapInfo(pools, takerToken, makerToken) {
        /*
        Uses Balancer SDK to construct available paths for pair.
        Paths can be direct, i.e. both tokens are in same pool or multihop.
        Will also create paths for the new Balancer Linear pools.
        These are returned in order of available liquidity which is useful for filtering.
        */
        const paths = this._routeProposer.getCandidatePathsFromDict(takerToken, makerToken, sor_1.SwapTypes.SwapExactIn, pools, BalancerV2SwapInfoCache._MAX_POOLS_PER_PATH);
        if (paths.length === 0) {
            return pair_swaps_cache_1.EMPTY_BALANCER_SWAPS;
        }
        // Convert paths data to swap information suitable for queryBatchSwap. Only use top 2 liquid paths
        return formatSwaps(paths.slice(0, BalancerV2SwapInfoCache._MAX_CANDIDATE_PATHS_PER_PAIR));
    }
}
exports.BalancerV2SwapInfoCache = BalancerV2SwapInfoCache;
BalancerV2SwapInfoCache._MAX_POOLS_PER_PATH = 4;
// TODO: Balancer V2 Multiplexing results in an increased revert rate
// re-enable multiplexing and set _MAX_CANDIDATE_PATHS_PER_PAIR to 2
// when resolved.
BalancerV2SwapInfoCache._MAX_CANDIDATE_PATHS_PER_PAIR = 1;
/**
 * Given an array of Balancer paths, returns swap information that can be passed to queryBatchSwap.
 * @param paths Array of Balancer paths.
 * @returns Formatted swap data consisting of assets and swap steps for ExactIn and ExactOut swap types.
 */
function formatSwaps(paths) {
    const formattedSwapsExactIn = [];
    const formattedSwapsExactOut = [];
    let assets;
    paths.forEach((path) => {
        // Add a swap amount for each swap so we can use formatSequence. (This will be overwritten with actual amount during query)
        path.swaps.forEach((s) => (s.swapAmount = '0'));
        const tokenAddresses = (0, sor_1.getTokenAddressesForSwap)(path.swaps);
        // Formats for both ExactIn and ExactOut swap types
        const swapsExactIn = (0, sor_1.formatSequence)(sor_1.SwapTypes.SwapExactIn, path.swaps, tokenAddresses);
        const swapsExactOut = (0, sor_1.formatSequence)(sor_1.SwapTypes.SwapExactOut, path.swaps, tokenAddresses);
        assets = tokenAddresses;
        formattedSwapsExactIn.push({
            assets,
            swapSteps: swapsExactIn.map((s) => ({
                ...s,
                amount: new utils_1.BigNumber(s.amount),
            })),
        });
        formattedSwapsExactOut.push({
            assets,
            swapSteps: swapsExactOut.map((s) => ({
                ...s,
                amount: new utils_1.BigNumber(s.amount),
            })),
        });
    });
    const formattedSwaps = {
        swapInfoExactIn: formattedSwapsExactIn,
        swapInfoExactOut: formattedSwapsExactOut,
    };
    return formattedSwaps;
}
//# sourceMappingURL=balancer_v2_swap_info_cache.js.map