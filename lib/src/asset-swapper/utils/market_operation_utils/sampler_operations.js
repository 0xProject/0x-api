"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamplerOperations = exports.BATCH_SOURCE_FILTERS = void 0;
const utils_1 = require("@0x/utils");
const strings_1 = require("@ethersproject/strings");
const _ = require("lodash");
const uniswapv3_sampler_1 = require("../../../samplers/uniswapv3_sampler");
const types_1 = require("../../types");
const token_adjacency_graph_1 = require("../token_adjacency_graph");
const aave_reserves_cache_1 = require("./aave_reserves_cache");
const bridge_source_utils_1 = require("./bridge_source_utils");
const compound_ctoken_cache_1 = require("./compound_ctoken_cache");
const constants_1 = require("./constants");
const pools_cache_1 = require("./pools_cache");
const balancer_v2_swap_info_cache_1 = require("./pools_cache/balancer_v2_swap_info_cache");
const sampler_contract_operation_1 = require("./sampler_contract_operation");
const source_filters_1 = require("./source_filters");
/**
 * Source filters for `getTwoHopBuyQuotes()` and `getTwoHopSellQuotes()`.
 */
const TWO_HOP_SOURCE_FILTERS = source_filters_1.SourceFilters.all().exclude([types_1.ERC20BridgeSource.MultiHop, types_1.ERC20BridgeSource.Native]);
/**
 * Source filters for `getSellQuotes()` and `getBuyQuotes()`.
 */
exports.BATCH_SOURCE_FILTERS = source_filters_1.SourceFilters.all().exclude([types_1.ERC20BridgeSource.MultiHop, types_1.ERC20BridgeSource.Native]);
/**
 * Composable operations that can be batched in a single transaction,
 * for use with `DexOrderSampler.executeAsync()`.
 */
class SamplerOperations {
    constructor(chainId, _samplerContract, poolsCaches, tokenAdjacencyGraph = token_adjacency_graph_1.TokenAdjacencyGraph.getEmptyGraph(), bancorServiceFn = async () => undefined) {
        this.chainId = chainId;
        this._samplerContract = _samplerContract;
        this.tokenAdjacencyGraph = tokenAdjacencyGraph;
        this.poolsCaches = poolsCaches
            ? poolsCaches
            : {
                [types_1.ERC20BridgeSource.Balancer]: pools_cache_1.BalancerPoolsCache.create(chainId),
                [types_1.ERC20BridgeSource.BalancerV2]: constants_1.BALANCER_V2_VAULT_ADDRESS_BY_CHAIN[chainId] === constants_1.NULL_ADDRESS
                    ? undefined
                    : new balancer_v2_swap_info_cache_1.BalancerV2SwapInfoCache(chainId),
            };
        const aaveV2SubgraphUrl = constants_1.AAVE_V2_SUBGRAPH_URL_BY_CHAIN_ID[chainId];
        if (aaveV2SubgraphUrl) {
            this.aaveV2ReservesCache = new aave_reserves_cache_1.AaveReservesCache(aaveV2SubgraphUrl, false);
        }
        const aaveV3SubgraphUrl = constants_1.AAVE_V3_SUBGRAPH_URL_BY_CHAIN_ID[chainId];
        if (aaveV3SubgraphUrl) {
            this.aaveV3ReservesCache = new aave_reserves_cache_1.AaveReservesCache(aaveV3SubgraphUrl, true);
        }
        const compoundApiUrl = constants_1.COMPOUND_API_URL_BY_CHAIN_ID[chainId];
        if (compoundApiUrl) {
            this.compoundCTokenCache = new compound_ctoken_cache_1.CompoundCTokenCache(compoundApiUrl, constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId]);
        }
        // Initialize the Bancor service, fetching paths in the background
        bancorServiceFn()
            .then((service) => (this._bancorService = service))
            .catch( /* do nothing */);
        this.uniswapV3Sampler = new uniswapv3_sampler_1.UniswapV3Sampler(this.chainId, this._samplerContract);
    }
    static constant(result) {
        return {
            encodeCall: () => '0x',
            handleCallResults: (_callResults) => result,
            handleRevert: (_callResults) => result,
        };
    }
    getTokenDecimals(tokens) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Native,
            contract: this._samplerContract,
            function: this._samplerContract.getTokenDecimals,
            params: [tokens],
        });
    }
    isAddressContract(address) {
        return {
            encodeCall: () => this._samplerContract.isContract(address).getABIEncodedTransactionData(),
            handleCallResults: (callResults) => this._samplerContract.getABIDecodedReturnData('isContract', callResults),
            handleRevert: () => {
                /* should never happen */
                throw new Error('Invalid address for isAddressContract');
            },
        };
    }
    getGasLeft() {
        return {
            encodeCall: () => this._samplerContract.getGasLeft().getABIEncodedTransactionData(),
            handleCallResults: (callResults) => this._samplerContract.getABIDecodedReturnData('getGasLeft', callResults),
            handleRevert: () => {
                /* should never happen */
                throw new Error('Invalid result for getGasLeft');
            },
        };
    }
    getBlockNumber() {
        return {
            encodeCall: () => this._samplerContract.getBlockNumber().getABIEncodedTransactionData(),
            handleCallResults: (callResults) => this._samplerContract.getABIDecodedReturnData('getBlockNumber', callResults),
            handleRevert: () => {
                /* should never happen */
                throw new Error('Invalid result for getBlockNumber');
            },
        };
    }
    getLimitOrderFillableTakerAmounts(orders, exchangeAddress) {
        // Skip checking empty or invalid orders on-chain, returning a constant
        if (orders.length === 0) {
            return SamplerOperations.constant([]);
        }
        if (orders.length === 1 && orders[0].order.maker === constants_1.NULL_ADDRESS) {
            return SamplerOperations.constant([constants_1.ZERO_AMOUNT]);
        }
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Native,
            contract: this._samplerContract,
            function: this._samplerContract.getLimitOrderFillableTakerAssetAmounts,
            params: [orders.map((o) => o.order), orders.map((o) => o.signature), exchangeAddress],
        });
    }
    getLimitOrderFillableMakerAmounts(orders, exchangeAddress) {
        // Skip checking empty or invalid orders on-chain, returning a constant
        if (orders.length === 0) {
            return SamplerOperations.constant([]);
        }
        if (orders.length === 1 && orders[0].order.maker === constants_1.NULL_ADDRESS) {
            return SamplerOperations.constant([constants_1.ZERO_AMOUNT]);
        }
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Native,
            contract: this._samplerContract,
            function: this._samplerContract.getLimitOrderFillableMakerAssetAmounts,
            params: [orders.map((o) => o.order), orders.map((o) => o.signature), exchangeAddress],
        });
    }
    getKyberDmmSellQuotes(router, tokenAddressPath, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.KyberDmm,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromKyberDmm,
            params: [router, tokenAddressPath, takerFillAmounts],
            callback: (callResults, fillData) => {
                const [pools, samples] = this._samplerContract.getABIDecodedReturnData('sampleSellsFromKyberDmm', callResults);
                fillData.poolsPath = pools;
                fillData.router = router;
                fillData.tokenAddressPath = tokenAddressPath;
                return samples;
            },
        });
    }
    getKyberDmmBuyQuotes(router, tokenAddressPath, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.KyberDmm,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromKyberDmm,
            params: [router, tokenAddressPath, makerFillAmounts],
            callback: (callResults, fillData) => {
                const [pools, samples] = this._samplerContract.getABIDecodedReturnData('sampleBuysFromKyberDmm', callResults);
                fillData.poolsPath = pools;
                fillData.router = router;
                fillData.tokenAddressPath = tokenAddressPath;
                return samples;
            },
        });
    }
    getUniswapSellQuotes(router, makerToken, takerToken, takerFillAmounts) {
        // Uniswap uses ETH instead of WETH, represented by address(0)
        const uniswapTakerToken = takerToken === constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId] ? constants_1.NULL_ADDRESS : takerToken;
        const uniswapMakerToken = makerToken === constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId] ? constants_1.NULL_ADDRESS : makerToken;
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Uniswap,
            fillData: { router },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromUniswap,
            params: [router, uniswapTakerToken, uniswapMakerToken, takerFillAmounts],
        });
    }
    getUniswapBuyQuotes(router, makerToken, takerToken, makerFillAmounts) {
        // Uniswap uses ETH instead of WETH, represented by address(0)
        const uniswapTakerToken = takerToken === constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId] ? constants_1.NULL_ADDRESS : takerToken;
        const uniswapMakerToken = makerToken === constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId] ? constants_1.NULL_ADDRESS : makerToken;
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Uniswap,
            fillData: { router },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromUniswap,
            params: [router, uniswapTakerToken, uniswapMakerToken, makerFillAmounts],
        });
    }
    getUniswapV2SellQuotes(router, tokenAddressPath, takerFillAmounts, source = types_1.ERC20BridgeSource.UniswapV2) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: { tokenAddressPath, router },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromUniswapV2,
            params: [router, tokenAddressPath, takerFillAmounts],
        });
    }
    getUniswapV2BuyQuotes(router, tokenAddressPath, makerFillAmounts, source = types_1.ERC20BridgeSource.UniswapV2) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: { tokenAddressPath, router },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromUniswapV2,
            params: [router, tokenAddressPath, makerFillAmounts],
        });
    }
    getCurveSellQuotes(pool, fromTokenIdx, toTokenIdx, takerFillAmounts, source = types_1.ERC20BridgeSource.Curve) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: {
                pool,
                fromTokenIdx,
                toTokenIdx,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromCurve,
            params: [
                {
                    poolAddress: pool.poolAddress,
                    sellQuoteFunctionSelector: pool.sellQuoteFunctionSelector,
                    buyQuoteFunctionSelector: pool.buyQuoteFunctionSelector,
                },
                new utils_1.BigNumber(fromTokenIdx),
                new utils_1.BigNumber(toTokenIdx),
                takerFillAmounts,
            ],
        });
    }
    getCurveBuyQuotes(pool, fromTokenIdx, toTokenIdx, makerFillAmounts, source = types_1.ERC20BridgeSource.Curve) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: {
                pool,
                fromTokenIdx,
                toTokenIdx,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromCurve,
            params: [
                {
                    poolAddress: pool.poolAddress,
                    sellQuoteFunctionSelector: pool.sellQuoteFunctionSelector,
                    buyQuoteFunctionSelector: pool.buyQuoteFunctionSelector,
                },
                new utils_1.BigNumber(fromTokenIdx),
                new utils_1.BigNumber(toTokenIdx),
                makerFillAmounts,
            ],
        });
    }
    getBalancerV2MultihopSellQuotes(vault, quoteSwaps, // Should always be sell swap steps.
    fillSwaps, // Should always be sell swap steps.
    takerFillAmounts, source) {
        const quoteSwapSteps = quoteSwaps.swapSteps.map((s) => ({
            ...s,
            assetInIndex: new utils_1.BigNumber(s.assetInIndex),
            assetOutIndex: new utils_1.BigNumber(s.assetOutIndex),
        }));
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: { vault, swapSteps: fillSwaps.swapSteps, assets: fillSwaps.assets, chainId: this.chainId },
            contract: this._samplerContract,
            function: this._samplerContract.sampleMultihopSellsFromBalancerV2,
            params: [vault, quoteSwapSteps, quoteSwaps.assets, takerFillAmounts],
            callback: (callResults, _fillData) => {
                const samples = this._samplerContract.getABIDecodedReturnData('sampleMultihopSellsFromBalancerV2', callResults);
                // ignore sample if there are 0s in output, bug in router causes non-optimal routing
                // refer to [LIT-668] for more information
                if (_.every(samples, (v) => !v.isZero())) {
                    return samples;
                }
                return [];
            },
        });
    }
    getBalancerV2MultihopBuyQuotes(vault, quoteSwaps, // Should always be buy swap steps.
    fillSwaps, // Should always be a sell quote.
    makerFillAmounts, source) {
        const quoteSwapSteps = quoteSwaps.swapSteps.map((s) => ({
            ...s,
            assetInIndex: new utils_1.BigNumber(s.assetInIndex),
            assetOutIndex: new utils_1.BigNumber(s.assetOutIndex),
        }));
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            // NOTE: fillData is set up for sells but quote function is set up for buys.
            fillData: { vault, swapSteps: fillSwaps.swapSteps, assets: fillSwaps.assets, chainId: this.chainId },
            contract: this._samplerContract,
            function: this._samplerContract.sampleMultihopBuysFromBalancerV2,
            params: [vault, quoteSwapSteps, quoteSwaps.assets, makerFillAmounts],
            callback: (callResults, _fillData) => {
                const samples = this._samplerContract.getABIDecodedReturnData('sampleMultihopBuysFromBalancerV2', callResults);
                // ignore sample if there are 0s in output, bug in router causes non-optimal routing
                // refer to [LIT-668] for more information
                if (_.every(samples, (v) => !v.isZero())) {
                    return samples;
                }
                return [];
            },
        });
    }
    getBalancerV2SellQuotes(poolInfo, makerToken, takerToken, takerFillAmounts, source) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: poolInfo,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromBalancerV2,
            params: [poolInfo, takerToken, makerToken, takerFillAmounts],
        });
    }
    getBalancerV2BuyQuotes(poolInfo, makerToken, takerToken, makerFillAmounts, source) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: poolInfo,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromBalancerV2,
            params: [poolInfo, takerToken, makerToken, makerFillAmounts],
        });
    }
    getBalancerSellQuotes(poolAddress, makerToken, takerToken, takerFillAmounts, source) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: { poolAddress },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromBalancer,
            params: [poolAddress, takerToken, makerToken, takerFillAmounts],
        });
    }
    getBalancerBuyQuotes(poolAddress, makerToken, takerToken, makerFillAmounts, source) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: { poolAddress },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromBalancer,
            params: [poolAddress, takerToken, makerToken, makerFillAmounts],
        });
    }
    getMStableSellQuotes(router, makerToken, takerToken, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.MStable,
            fillData: { router },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromMStable,
            params: [router, takerToken, makerToken, takerFillAmounts],
        });
    }
    getMStableBuyQuotes(router, makerToken, takerToken, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.MStable,
            fillData: { router },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromMStable,
            params: [router, takerToken, makerToken, makerFillAmounts],
        });
    }
    getBancorSellQuotes(registry, makerToken, takerToken, takerFillAmounts) {
        const paths = this._bancorService ? this._bancorService.getPaths(takerToken, makerToken) : [];
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Bancor,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromBancor,
            params: [{ registry, paths }, takerToken, makerToken, takerFillAmounts],
            callback: (callResults, fillData) => {
                const [networkAddress, path, samples] = this._samplerContract.getABIDecodedReturnData('sampleSellsFromBancor', callResults);
                fillData.networkAddress = networkAddress;
                fillData.path = path;
                return samples;
            },
        });
    }
    // Unimplemented
    getBancorBuyQuotes(registry, makerToken, takerToken, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Bancor,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromBancor,
            params: [{ registry, paths: [] }, takerToken, makerToken, makerFillAmounts],
            callback: (callResults, fillData) => {
                const [networkAddress, path, samples] = this._samplerContract.getABIDecodedReturnData('sampleBuysFromBancor', callResults);
                fillData.networkAddress = networkAddress;
                fillData.path = path;
                return samples;
            },
        });
    }
    getBancorV3SellQuotes(networkAddress, networkInfoAddress, path, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.BancorV3,
            fillData: { networkAddress, path },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromBancorV3,
            params: [constants_1.MAINNET_TOKENS.WETH, networkInfoAddress, path, takerFillAmounts],
        });
    }
    getBancorV3BuyQuotes(networkAddress, networkInfoAddress, path, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.BancorV3,
            fillData: { networkAddress, path },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromBancorV3,
            params: [constants_1.MAINNET_TOKENS.WETH, networkInfoAddress, path, makerFillAmounts],
        });
    }
    getMooniswapSellQuotes(registry, makerToken, takerToken, takerFillAmounts) {
        // Mooniswap uses ETH instead of WETH, represented by address(0)
        const mooniswapTakerToken = takerToken === constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId] ? constants_1.NULL_ADDRESS : takerToken;
        const mooniswapMakerToken = makerToken === constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId] ? constants_1.NULL_ADDRESS : makerToken;
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Mooniswap,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromMooniswap,
            params: [registry, mooniswapTakerToken, mooniswapMakerToken, takerFillAmounts],
            callback: (callResults, fillData) => {
                const [poolAddress, samples] = this._samplerContract.getABIDecodedReturnData('sampleSellsFromMooniswap', callResults);
                fillData.poolAddress = poolAddress;
                return samples;
            },
        });
    }
    getMooniswapBuyQuotes(registry, makerToken, takerToken, makerFillAmounts) {
        // Mooniswap uses ETH instead of WETH, represented by address(0)
        const mooniswapTakerToken = takerToken === constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId] ? constants_1.NULL_ADDRESS : takerToken;
        const mooniswapMakerToken = makerToken === constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId] ? constants_1.NULL_ADDRESS : makerToken;
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Mooniswap,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromMooniswap,
            params: [registry, mooniswapTakerToken, mooniswapMakerToken, makerFillAmounts],
            callback: (callResults, fillData) => {
                const [poolAddress, samples] = this._samplerContract.getABIDecodedReturnData('sampleBuysFromMooniswap', callResults);
                fillData.poolAddress = poolAddress;
                return samples;
            },
        });
    }
    getTwoHopSellQuotes(sources, makerToken, takerToken, sellAmounts) {
        const _sources = TWO_HOP_SOURCE_FILTERS.getAllowed(sources);
        if (_sources.length === 0) {
            return SamplerOperations.constant([]);
        }
        const intermediateTokens = this.tokenAdjacencyGraph.getIntermediateTokens(makerToken, takerToken);
        const subOps = intermediateTokens.map((intermediateToken) => {
            const firstHopOps = this._getSellQuoteOperations(_sources, intermediateToken, takerToken, sellAmounts);
            const secondHopOps = this._getSellQuoteOperations(_sources, makerToken, intermediateToken, new Array(sellAmounts.length).fill(constants_1.ZERO_AMOUNT));
            return new sampler_contract_operation_1.SamplerContractOperation({
                contract: this._samplerContract,
                source: types_1.ERC20BridgeSource.MultiHop,
                function: this._samplerContract.sampleTwoHopSell,
                params: [
                    firstHopOps.map((op) => op.encodeCall()),
                    secondHopOps.map((op) => op.encodeCall()),
                    new utils_1.BigNumber(sellAmounts.length),
                ],
                fillData: { intermediateToken },
                callback: (callResults, fillData) => {
                    const [firstHop, secondHop, buyAmounts] = this._samplerContract.getABIDecodedReturnData('sampleTwoHopSell', callResults);
                    // Ensure the hop sources are set even when the buy amount is zero
                    if (buyAmounts[buyAmounts.length - 1].isZero()) {
                        return new Array(buyAmounts.length).fill(constants_1.ZERO_AMOUNT);
                    }
                    const firstHopOp = firstHopOps[firstHop.sourceIndex.toNumber()];
                    const secondHopOp = secondHopOps[secondHop.sourceIndex.toNumber()];
                    firstHopOp.handleCallResults(firstHop.returnData);
                    secondHopOp.handleCallResults(secondHop.returnData);
                    fillData.firstHopSource = { source: firstHopOp.source, fillData: firstHopOp.fillData };
                    fillData.secondHopSource = { source: secondHopOp.source, fillData: secondHopOp.fillData };
                    return buyAmounts;
                },
            });
        });
        return this._createBatch(subOps, (samples) => {
            return subOps.map((op, subOpsIndex) => {
                return samples[subOpsIndex].map((output, sampleIndex) => ({
                    source: op.source,
                    output,
                    input: sellAmounts[sampleIndex],
                    fillData: op.fillData,
                }));
            });
        }, () => {
            utils_1.logUtils.warn('SamplerContractOperation: Two hop sampler reverted');
            return [];
        });
    }
    getTwoHopBuyQuotes(sources, makerToken, takerToken, buyAmounts) {
        const _sources = TWO_HOP_SOURCE_FILTERS.getAllowed(sources);
        if (_sources.length === 0) {
            return SamplerOperations.constant([]);
        }
        const intermediateTokens = this.tokenAdjacencyGraph.getIntermediateTokens(makerToken, takerToken);
        const subOps = intermediateTokens.map((intermediateToken) => {
            const firstHopOps = this._getBuyQuoteOperations(_sources, intermediateToken, takerToken, new Array(buyAmounts.length).fill(new utils_1.BigNumber(0)));
            const secondHopOps = this._getBuyQuoteOperations(_sources, makerToken, intermediateToken, buyAmounts);
            return new sampler_contract_operation_1.SamplerContractOperation({
                contract: this._samplerContract,
                source: types_1.ERC20BridgeSource.MultiHop,
                function: this._samplerContract.sampleTwoHopBuy,
                params: [
                    firstHopOps.map((op) => op.encodeCall()),
                    secondHopOps.map((op) => op.encodeCall()),
                    new utils_1.BigNumber(buyAmounts.length),
                ],
                fillData: { intermediateToken },
                callback: (callResults, fillData) => {
                    const [firstHop, secondHop, sellAmounts] = this._samplerContract.getABIDecodedReturnData('sampleTwoHopBuy', callResults);
                    if (sellAmounts[sellAmounts.length - 1].isEqualTo(constants_1.MAX_UINT256)) {
                        return new Array(sellAmounts.length).fill(constants_1.MAX_UINT256);
                    }
                    const firstHopOp = firstHopOps[firstHop.sourceIndex.toNumber()];
                    const secondHopOp = secondHopOps[secondHop.sourceIndex.toNumber()];
                    firstHopOp.handleCallResults(firstHop.returnData);
                    secondHopOp.handleCallResults(secondHop.returnData);
                    fillData.firstHopSource = { source: firstHopOp.source, fillData: firstHopOp.fillData };
                    fillData.secondHopSource = { source: secondHopOp.source, fillData: secondHopOp.fillData };
                    return sellAmounts;
                },
            });
        });
        return this._createBatch(subOps, (samples) => {
            return subOps.map((op, subOpIndex) => {
                return samples[subOpIndex].map((output, sampleIndex) => {
                    return {
                        source: op.source,
                        output,
                        input: buyAmounts[sampleIndex],
                        fillData: op.fillData,
                    };
                });
            });
        }, () => {
            utils_1.logUtils.warn('SamplerContractOperation: Two hop sampler reverted');
            return [];
        });
    }
    getShellSellQuotes(poolAddress, makerToken, takerToken, takerFillAmounts, source = types_1.ERC20BridgeSource.Shell) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: { poolAddress },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromShell,
            params: [poolAddress, takerToken, makerToken, takerFillAmounts],
        });
    }
    getShellBuyQuotes(poolAddress, makerToken, takerToken, makerFillAmounts, source = types_1.ERC20BridgeSource.Shell) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            fillData: { poolAddress },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromShell,
            params: [poolAddress, takerToken, makerToken, makerFillAmounts],
        });
    }
    getDODOSellQuotes(opts, makerToken, takerToken, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Dodo,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromDODO,
            params: [opts, takerToken, makerToken, takerFillAmounts],
            callback: (callResults, fillData) => {
                const [isSellBase, pool, samples] = this._samplerContract.getABIDecodedReturnData('sampleSellsFromDODO', callResults);
                fillData.isSellBase = isSellBase;
                fillData.poolAddress = pool;
                fillData.helperAddress = opts.helper;
                return samples;
            },
        });
    }
    getDODOBuyQuotes(opts, makerToken, takerToken, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Dodo,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromDODO,
            params: [opts, takerToken, makerToken, makerFillAmounts],
            callback: (callResults, fillData) => {
                const [isSellBase, pool, samples] = this._samplerContract.getABIDecodedReturnData('sampleBuysFromDODO', callResults);
                fillData.isSellBase = isSellBase;
                fillData.poolAddress = pool;
                fillData.helperAddress = opts.helper;
                return samples;
            },
        });
    }
    getDODOV2SellQuotes(registry, offset, makerToken, takerToken, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.DodoV2,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromDODOV2,
            params: [registry, offset, takerToken, makerToken, takerFillAmounts],
            callback: (callResults, fillData) => {
                const [isSellBase, pool, samples] = this._samplerContract.getABIDecodedReturnData('sampleSellsFromDODOV2', callResults);
                fillData.isSellBase = isSellBase;
                fillData.poolAddress = pool;
                return samples;
            },
        });
    }
    getDODOV2BuyQuotes(registry, offset, makerToken, takerToken, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.DodoV2,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromDODOV2,
            params: [registry, offset, takerToken, makerToken, makerFillAmounts],
            callback: (callResults, fillData) => {
                const [isSellBase, pool, samples] = this._samplerContract.getABIDecodedReturnData('sampleSellsFromDODOV2', callResults);
                fillData.isSellBase = isSellBase;
                fillData.poolAddress = pool;
                return samples;
            },
        });
    }
    getMakerPsmSellQuotes(psmInfo, makerToken, takerToken, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.MakerPsm,
            fillData: {
                isSellOperation: true,
                takerToken,
                makerToken,
                ...psmInfo,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromMakerPsm,
            params: [psmInfo, takerToken, makerToken, takerFillAmounts],
        });
    }
    getMakerPsmBuyQuotes(psmInfo, makerToken, takerToken, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.MakerPsm,
            fillData: {
                isSellOperation: false,
                takerToken,
                makerToken,
                ...psmInfo,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromMakerPsm,
            params: [psmInfo, takerToken, makerToken, makerFillAmounts],
        });
    }
    getLidoSellQuotes(lidoInfo, makerToken, takerToken, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Lido,
            fillData: {
                makerToken,
                takerToken,
                stEthTokenAddress: lidoInfo.stEthToken,
                wstEthTokenAddress: lidoInfo.wstEthToken,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromLido,
            params: [lidoInfo, takerToken, makerToken, takerFillAmounts],
        });
    }
    getLidoBuyQuotes(lidoInfo, makerToken, takerToken, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Lido,
            fillData: {
                makerToken,
                takerToken,
                stEthTokenAddress: lidoInfo.stEthToken,
                wstEthTokenAddress: lidoInfo.wstEthToken,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromLido,
            params: [lidoInfo, takerToken, makerToken, makerFillAmounts],
        });
    }
    getAaveV2SellQuotes(aaveInfo, makerToken, takerToken, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.AaveV2,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromAaveV2,
            params: [aaveInfo.aToken, aaveInfo.underlyingToken, takerToken, makerToken, takerFillAmounts],
            callback: (callResults, fillData) => {
                const samples = this._samplerContract.getABIDecodedReturnData('sampleSellsFromAaveV2', callResults);
                fillData.lendingPool = aaveInfo.lendingPool;
                fillData.aToken = aaveInfo.aToken;
                return samples;
            },
        });
    }
    getAaveV2BuyQuotes(aaveInfo, makerToken, takerToken, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.AaveV2,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromAaveV2,
            params: [aaveInfo.aToken, aaveInfo.underlyingToken, takerToken, makerToken, makerFillAmounts],
            callback: (callResults, fillData) => {
                const samples = this._samplerContract.getABIDecodedReturnData('sampleBuysFromAaveV2', callResults);
                fillData.lendingPool = aaveInfo.lendingPool;
                fillData.aToken = aaveInfo.aToken;
                return samples;
            },
        });
    }
    getAaveV3SellQuotes(aaveInfo, makerToken, takerToken, takerFillAmounts, l2EncoderAddress) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.AaveV3,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromAaveV3,
            params: [
                l2EncoderAddress,
                aaveInfo.aToken,
                aaveInfo.underlyingToken,
                takerToken,
                makerToken,
                takerFillAmounts,
            ],
            callback: (callResults, fillData) => {
                const [l2Params, samples] = this._samplerContract.getABIDecodedReturnData('sampleSellsFromAaveV3', callResults);
                fillData.l2EncodedParams = l2Params.map((l2Param, i) => ({
                    inputAmount: takerFillAmounts[i],
                    l2Parameter: l2Param,
                }));
                fillData.lendingPool = aaveInfo.lendingPool;
                fillData.aToken = aaveInfo.aToken;
                return samples;
            },
        });
    }
    getAaveV3BuyQuotes(aaveInfo, makerToken, takerToken, makerFillAmounts, l2EncoderAddress) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.AaveV3,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromAaveV3,
            params: [
                l2EncoderAddress,
                aaveInfo.aToken,
                aaveInfo.underlyingToken,
                takerToken,
                makerToken,
                makerFillAmounts,
            ],
            callback: (callResults, fillData) => {
                const [l2Params, samples] = this._samplerContract.getABIDecodedReturnData('sampleBuysFromAaveV3', callResults);
                fillData.l2EncodedParams = l2Params.map((l2Param, i) => ({
                    inputAmount: makerFillAmounts[i],
                    l2Parameter: l2Param,
                }));
                fillData.lendingPool = aaveInfo.lendingPool;
                fillData.aToken = aaveInfo.aToken;
                return samples;
            },
        });
    }
    getCompoundSellQuotes(cToken, makerToken, takerToken, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Compound,
            fillData: { cToken, takerToken, makerToken },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromCompound,
            params: [cToken, takerToken, makerToken, takerFillAmounts],
        });
    }
    getCompoundBuyQuotes(cToken, makerToken, takerToken, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Compound,
            fillData: { cToken, takerToken, makerToken },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromCompound,
            params: [cToken, takerToken, makerToken, makerFillAmounts],
        });
    }
    getGMXSellQuotes(router, reader, vault, tokenAddressPath, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.GMX,
            fillData: { router, reader, vault, tokenAddressPath },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromGMX,
            params: [reader, vault, tokenAddressPath, takerFillAmounts],
        });
    }
    getGMXBuyQuotes(router, reader, vault, tokenAddressPath, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.GMX,
            fillData: { router, reader, vault, tokenAddressPath },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromGMX,
            params: [reader, vault, tokenAddressPath, makerFillAmounts],
        });
    }
    getPlatypusSellQuotes(router, pool, tokenAddressPath, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Platypus,
            fillData: { router, pool, tokenAddressPath },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromPlatypus,
            params: [pool[0], tokenAddressPath, takerFillAmounts],
        });
    }
    getPlatypusBuyQuotes(router, pool, tokenAddressPath, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Platypus,
            fillData: { router, pool, tokenAddressPath },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromPlatypus,
            params: [pool[0], tokenAddressPath, makerFillAmounts],
        });
    }
    getSolidlySellQuotes(source, router, takerToken, makerToken, takerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromVelodrome,
            params: [router, takerToken, makerToken, takerFillAmounts],
            callback: (callResults, fillData) => {
                const [isStable, samples] = this._samplerContract.getABIDecodedReturnData('sampleSellsFromVelodrome', callResults);
                fillData.router = router;
                fillData.stable = isStable;
                return samples;
            },
        });
    }
    getSolidlyBuyQuotes(source, router, takerToken, makerToken, makerFillAmounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: source,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromVelodrome,
            params: [router, takerToken, makerToken, makerFillAmounts],
            callback: (callResults, fillData) => {
                const [isStable, samples] = this._samplerContract.getABIDecodedReturnData('sampleBuysFromVelodrome', callResults);
                fillData.router = router;
                fillData.stable = isStable;
                return samples;
            },
        });
    }
    getSynthetixSellQuotes(readProxy, takerTokenSymbol, makerTokenSymbol, takerFillAmounts) {
        const takerTokenSymbolBytes32 = (0, strings_1.formatBytes32String)(takerTokenSymbol);
        const makerTokenSymbolBytes32 = (0, strings_1.formatBytes32String)(makerTokenSymbol);
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Synthetix,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromSynthetix,
            params: [readProxy, takerTokenSymbolBytes32, makerTokenSymbolBytes32, takerFillAmounts],
            callback: (callResults, fillData) => {
                const [synthetix, samples] = this._samplerContract.getABIDecodedReturnData('sampleSellsFromSynthetix', callResults);
                fillData.synthetix = synthetix;
                fillData.takerTokenSymbolBytes32 = takerTokenSymbolBytes32;
                fillData.makerTokenSymbolBytes32 = makerTokenSymbolBytes32;
                fillData.chainId = this.chainId;
                return samples;
            },
        });
    }
    getSynthetixBuyQuotes(readProxy, takerTokenSymbol, makerTokenSymbol, makerFillAmounts) {
        const takerTokenSymbolBytes32 = (0, strings_1.formatBytes32String)(takerTokenSymbol);
        const makerTokenSymbolBytes32 = (0, strings_1.formatBytes32String)(makerTokenSymbol);
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: types_1.ERC20BridgeSource.Synthetix,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromSynthetix,
            params: [readProxy, takerTokenSymbolBytes32, makerTokenSymbolBytes32, makerFillAmounts],
            callback: (callResults, fillData) => {
                const [synthetix, samples] = this._samplerContract.getABIDecodedReturnData('sampleBuysFromSynthetix', callResults);
                fillData.synthetix = synthetix;
                fillData.takerTokenSymbolBytes32 = takerTokenSymbolBytes32;
                fillData.makerTokenSymbolBytes32 = makerTokenSymbolBytes32;
                fillData.chainId = this.chainId;
                return samples;
            },
        });
    }
    getWOOFiSellQuotes(router, takerToken, makerToken, makerFillAmounts) {
        const chainId = this.chainId;
        return new sampler_contract_operation_1.SamplerContractOperation({
            fillData: { router, takerToken, makerToken, chainId },
            source: types_1.ERC20BridgeSource.WOOFi,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromWooPP,
            params: [router, takerToken, makerToken, makerFillAmounts],
        });
    }
    getWOOFiBuyQuotes(router, takerToken, makerToken, makerFillAmounts) {
        const chainId = this.chainId;
        return new sampler_contract_operation_1.SamplerContractOperation({
            fillData: { router, takerToken, makerToken, chainId },
            source: types_1.ERC20BridgeSource.WOOFi,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromWooPP,
            params: [router, takerToken, makerToken, makerFillAmounts],
        });
    }
    /**
     * Returns the best price for the native token
     * Best is calculated according to the fee schedule, so the price of the
     * best source, fee adjusted, will be returned.
     */
    getBestNativeTokenSellRate(sources, makerToken, nativeToken, nativeFillAmount, feeSchedule) {
        if (makerToken.toLowerCase() === nativeToken.toLowerCase()) {
            return SamplerOperations.constant(new utils_1.BigNumber(1));
        }
        const subOps = this._getSellQuoteOperations(sources, makerToken, nativeToken, [nativeFillAmount]);
        return this._createBatch(subOps, (samples) => {
            if (samples.length === 0) {
                return constants_1.ZERO_AMOUNT;
            }
            const adjustedPrices = subOps.map((s, i) => {
                // If the source gave us nothing, skip it and return a default
                if (samples[i].length === 0 || samples[i][0].isZero()) {
                    return { adjustedPrice: constants_1.ZERO_AMOUNT, source: s.source, price: constants_1.ZERO_AMOUNT };
                }
                const v = samples[i][0];
                const price = v.dividedBy(nativeFillAmount);
                // Create an adjusted price to avoid selecting the following:
                // * a source that is too expensive to arbitrage given the gas environment
                // * when a number of sources are poorly priced or liquidity is low
                // Fee is already gas * gasPrice
                const fee = feeSchedule[subOps[i].source]
                    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                        feeSchedule[subOps[i].source](subOps[i].fillData).fee
                    : constants_1.ZERO_AMOUNT;
                const adjustedNativeAmount = nativeFillAmount.plus(fee);
                const adjustedPrice = v.div(adjustedNativeAmount);
                return {
                    adjustedPrice,
                    source: subOps[i].source,
                    price,
                };
            });
            const sortedPrices = adjustedPrices.sort((a, b) => a.adjustedPrice.comparedTo(b.adjustedPrice));
            const selectedPrice = sortedPrices[sortedPrices.length - 1].price;
            return selectedPrice;
        }, () => constants_1.ZERO_AMOUNT);
    }
    getSellQuotes(sources, makerToken, takerToken, takerFillAmounts) {
        const subOps = this._getSellQuoteOperations(sources, makerToken, takerToken, takerFillAmounts);
        return this._createBatch(subOps, (samples) => {
            return subOps.map((op, i) => {
                return samples[i].map((output, j) => ({
                    source: op.source,
                    output,
                    input: takerFillAmounts[j],
                    fillData: op.fillData,
                }));
            });
        }, () => []);
    }
    getBuyQuotes(sources, makerToken, takerToken, makerFillAmounts) {
        const subOps = this._getBuyQuoteOperations(sources, makerToken, takerToken, makerFillAmounts);
        return this._createBatch(subOps, (samples) => {
            return subOps.map((op, i) => {
                return samples[i].map((output, j) => ({
                    source: op.source,
                    output,
                    input: makerFillAmounts[j],
                    fillData: op.fillData,
                }));
            });
        }, () => []);
    }
    _getSellQuoteOperations(sources, makerToken, takerToken, takerFillAmounts, tokenAdjacencyGraph = this.tokenAdjacencyGraph) {
        // Find the adjacent tokens in the provided token adjacency graph,
        // e.g if this is DAI->USDC we may check for DAI->WETH->USDC
        const intermediateTokens = tokenAdjacencyGraph.getIntermediateTokens(makerToken, takerToken);
        // Drop out MultiHop and Native as we do not query those here.
        const _sources = constants_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[this.chainId]
            .exclude([types_1.ERC20BridgeSource.MultiHop, types_1.ERC20BridgeSource.Native])
            .getAllowed(sources);
        const allOps = _.flatten(_sources.map((source) => {
            if ((0, bridge_source_utils_1.isBadTokenForSource)(makerToken, source) || (0, bridge_source_utils_1.isBadTokenForSource)(takerToken, source)) {
                return [];
            }
            switch (source) {
                case types_1.ERC20BridgeSource.Uniswap:
                    return (0, bridge_source_utils_1.isValidAddress)(constants_1.UNISWAPV1_ROUTER_BY_CHAIN_ID[this.chainId])
                        ? this.getUniswapSellQuotes(constants_1.UNISWAPV1_ROUTER_BY_CHAIN_ID[this.chainId], makerToken, takerToken, takerFillAmounts)
                        : [];
                case types_1.ERC20BridgeSource.UniswapV2:
                case types_1.ERC20BridgeSource.SushiSwap:
                case types_1.ERC20BridgeSource.CryptoCom:
                case types_1.ERC20BridgeSource.PancakeSwap:
                case types_1.ERC20BridgeSource.PancakeSwapV2:
                case types_1.ERC20BridgeSource.BakerySwap:
                case types_1.ERC20BridgeSource.ApeSwap:
                case types_1.ERC20BridgeSource.QuickSwap:
                case types_1.ERC20BridgeSource.Dfyn:
                case types_1.ERC20BridgeSource.WaultSwap:
                case types_1.ERC20BridgeSource.ShibaSwap:
                case types_1.ERC20BridgeSource.Pangolin:
                case types_1.ERC20BridgeSource.TraderJoe:
                case types_1.ERC20BridgeSource.UbeSwap:
                case types_1.ERC20BridgeSource.SpiritSwap:
                case types_1.ERC20BridgeSource.SpookySwap:
                case types_1.ERC20BridgeSource.Yoshi:
                case types_1.ERC20BridgeSource.MorpheusSwap:
                case types_1.ERC20BridgeSource.BiSwap:
                case types_1.ERC20BridgeSource.MDex:
                case types_1.ERC20BridgeSource.KnightSwap:
                case types_1.ERC20BridgeSource.MeshSwap: {
                    // Skip sampling when it involves a known rebasing token as it results in high revert rate.
                    // https://docs.uniswap.org/protocol/V2/reference/smart-contracts/common-errors#rebasing-tokens
                    if (constants_1.REBASING_TOKENS.has(takerToken) || constants_1.REBASING_TOKENS.has(makerToken)) {
                        return [];
                    }
                    const uniLikeRouter = (0, bridge_source_utils_1.uniswapV2LikeRouterAddress)(this.chainId, source);
                    if (!(0, bridge_source_utils_1.isValidAddress)(uniLikeRouter)) {
                        return [];
                    }
                    return [
                        [takerToken, makerToken],
                        ...intermediateTokens.map((t) => [takerToken, t, makerToken]),
                    ].map((path) => this.getUniswapV2SellQuotes(uniLikeRouter, path, takerFillAmounts, source));
                }
                case types_1.ERC20BridgeSource.KyberDmm: {
                    const kyberDmmRouter = constants_1.KYBER_DMM_ROUTER_BY_CHAIN_ID[this.chainId];
                    if (!(0, bridge_source_utils_1.isValidAddress)(kyberDmmRouter)) {
                        return [];
                    }
                    return this.getKyberDmmSellQuotes(kyberDmmRouter, [takerToken, makerToken], takerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Curve:
                case types_1.ERC20BridgeSource.CurveV2:
                case types_1.ERC20BridgeSource.Nerve:
                case types_1.ERC20BridgeSource.Synapse:
                case types_1.ERC20BridgeSource.Belt:
                case types_1.ERC20BridgeSource.Ellipsis:
                case types_1.ERC20BridgeSource.Saddle:
                case types_1.ERC20BridgeSource.FirebirdOneSwap:
                case types_1.ERC20BridgeSource.IronSwap:
                case types_1.ERC20BridgeSource.ACryptos:
                case types_1.ERC20BridgeSource.MobiusMoney:
                    return (0, bridge_source_utils_1.getCurveLikeInfosForPair)(this.chainId, takerToken, makerToken, source).map((pool) => this.getCurveSellQuotes(pool, pool.takerTokenIdx, pool.makerTokenIdx, takerFillAmounts, source));
                case types_1.ERC20BridgeSource.Shell:
                case types_1.ERC20BridgeSource.Component:
                    return (0, bridge_source_utils_1.getShellLikeInfosForPair)(this.chainId, takerToken, makerToken, source).map((pool) => this.getShellSellQuotes(pool, makerToken, takerToken, takerFillAmounts, source));
                case types_1.ERC20BridgeSource.MStable:
                    return (0, bridge_source_utils_1.getShellLikeInfosForPair)(this.chainId, takerToken, makerToken, source).map((pool) => this.getMStableSellQuotes(pool, makerToken, takerToken, takerFillAmounts));
                case types_1.ERC20BridgeSource.Mooniswap:
                    return [
                        ...constants_1.MOONISWAP_REGISTRIES_BY_CHAIN_ID[this.chainId]
                            .filter((r) => (0, bridge_source_utils_1.isValidAddress)(r))
                            .map((registry) => this.getMooniswapSellQuotes(registry, makerToken, takerToken, takerFillAmounts)),
                    ];
                case types_1.ERC20BridgeSource.Balancer:
                    return this.poolsCaches[types_1.ERC20BridgeSource.Balancer]
                        .getPoolAddressesForPair(takerToken, makerToken)
                        .map((balancerPool) => this.getBalancerSellQuotes(balancerPool, makerToken, takerToken, takerFillAmounts, types_1.ERC20BridgeSource.Balancer));
                case types_1.ERC20BridgeSource.Beethovenx:
                case types_1.ERC20BridgeSource.BalancerV2: {
                    const cache = this.poolsCaches[types_1.ERC20BridgeSource.BalancerV2];
                    if (!cache) {
                        return [];
                    }
                    const swaps = cache.getCachedSwapInfoForPair(takerToken, makerToken);
                    const vault = constants_1.BALANCER_V2_VAULT_ADDRESS_BY_CHAIN[this.chainId];
                    if (!swaps || vault === constants_1.NULL_ADDRESS) {
                        return [];
                    }
                    // Changed to retrieve queryBatchSwap for swap steps > 1 of length
                    return swaps.swapInfoExactIn.map((swapInfo) => this.getBalancerV2MultihopSellQuotes(vault, swapInfo, swapInfo, takerFillAmounts, source));
                }
                case types_1.ERC20BridgeSource.Dodo:
                    if (!(0, bridge_source_utils_1.isValidAddress)(constants_1.DODOV1_CONFIG_BY_CHAIN_ID[this.chainId].registry)) {
                        return [];
                    }
                    return this.getDODOSellQuotes(constants_1.DODOV1_CONFIG_BY_CHAIN_ID[this.chainId], makerToken, takerToken, takerFillAmounts);
                case types_1.ERC20BridgeSource.DodoV2:
                    return _.flatten(constants_1.DODOV2_FACTORIES_BY_CHAIN_ID[this.chainId]
                        .filter((factory) => (0, bridge_source_utils_1.isValidAddress)(factory))
                        .map((factory) => (0, bridge_source_utils_1.getDodoV2Offsets)().map((offset) => this.getDODOV2SellQuotes(factory, offset, makerToken, takerToken, takerFillAmounts))));
                case types_1.ERC20BridgeSource.Bancor:
                    if (!(0, bridge_source_utils_1.isValidAddress)(constants_1.BANCOR_REGISTRY_BY_CHAIN_ID[this.chainId])) {
                        return [];
                    }
                    return this.getBancorSellQuotes(constants_1.BANCOR_REGISTRY_BY_CHAIN_ID[this.chainId], makerToken, takerToken, takerFillAmounts);
                case types_1.ERC20BridgeSource.MakerPsm: {
                    const psmInfo = constants_1.MAKER_PSM_INFO_BY_CHAIN_ID[this.chainId];
                    if (!(0, bridge_source_utils_1.isValidAddress)(psmInfo.psmAddress)) {
                        return [];
                    }
                    return this.getMakerPsmSellQuotes(psmInfo, makerToken, takerToken, takerFillAmounts);
                }
                case types_1.ERC20BridgeSource.UniswapV3: {
                    // Rebasing tokens lead to a high revert rate.
                    if (constants_1.REBASING_TOKENS.has(takerToken) || constants_1.REBASING_TOKENS.has(makerToken)) {
                        return [];
                    }
                    const { factory, router } = constants_1.UNISWAPV3_CONFIG_BY_CHAIN_ID[this.chainId];
                    if (!(0, bridge_source_utils_1.isValidAddress)(router) || !(0, bridge_source_utils_1.isValidAddress)(factory)) {
                        return [];
                    }
                    return [
                        [takerToken, makerToken],
                        ...intermediateTokens.map((t) => [takerToken, t, makerToken]),
                    ].map((path) => this.uniswapV3Sampler.createSampleSellsOperation(path, takerFillAmounts));
                }
                case types_1.ERC20BridgeSource.Lido: {
                    if (!this._isLidoSupported(takerToken, makerToken)) {
                        return [];
                    }
                    const lidoInfo = constants_1.LIDO_INFO_BY_CHAIN[this.chainId];
                    return this.getLidoSellQuotes(lidoInfo, makerToken, takerToken, takerFillAmounts);
                }
                case types_1.ERC20BridgeSource.AaveV3: {
                    if (!this.aaveV3ReservesCache) {
                        return [];
                    }
                    const reserve = this.aaveV3ReservesCache.get(takerToken, makerToken);
                    if (!reserve) {
                        return [];
                    }
                    const info = {
                        lendingPool: reserve.pool.pool,
                        aToken: reserve.aToken.id,
                        underlyingToken: reserve.underlyingAsset,
                    };
                    const l2Encoder = constants_1.AAVE_V3_L2_ENCODERS_BY_CHAIN_ID[this.chainId];
                    return this.getAaveV3SellQuotes(info, makerToken, takerToken, takerFillAmounts, l2Encoder);
                }
                case types_1.ERC20BridgeSource.AaveV2: {
                    if (!this.aaveV2ReservesCache) {
                        return [];
                    }
                    const reserve = this.aaveV2ReservesCache.get(takerToken, makerToken);
                    if (!reserve) {
                        return [];
                    }
                    const info = {
                        lendingPool: reserve.pool.lendingPool,
                        aToken: reserve.aToken.id,
                        underlyingToken: reserve.underlyingAsset,
                    };
                    return this.getAaveV2SellQuotes(info, makerToken, takerToken, takerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Compound: {
                    if (!this.compoundCTokenCache) {
                        return [];
                    }
                    const cToken = this.compoundCTokenCache.get(takerToken, makerToken);
                    if (!cToken) {
                        return [];
                    }
                    return this.getCompoundSellQuotes(cToken.tokenAddress, makerToken, takerToken, takerFillAmounts);
                }
                case types_1.ERC20BridgeSource.GMX: {
                    // MIM has no liquidity.
                    if (takerToken === constants_1.AVALANCHE_TOKENS.MIM || makerToken === constants_1.AVALANCHE_TOKENS.MIM) {
                        return [];
                    }
                    return this.getGMXSellQuotes(constants_1.GMX_ROUTER_BY_CHAIN_ID[this.chainId], constants_1.GMX_READER_BY_CHAIN_ID[this.chainId], constants_1.GMX_VAULT_BY_CHAIN_ID[this.chainId], [takerToken, makerToken], takerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Platypus: {
                    return (0, bridge_source_utils_1.getPlatypusInfoForPair)(this.chainId, takerToken, makerToken).map((pool) => this.getPlatypusSellQuotes(constants_1.PLATYPUS_ROUTER_BY_CHAIN_ID[this.chainId], [pool.poolAddress], [takerToken, makerToken], takerFillAmounts));
                }
                case types_1.ERC20BridgeSource.BancorV3: {
                    return this.getBancorV3SellQuotes(constants_1.BANCORV3_NETWORK_BY_CHAIN_ID[this.chainId], constants_1.BANCORV3_NETWORK_INFO_BY_CHAIN_ID[this.chainId], [takerToken, makerToken], takerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Dystopia:
                case types_1.ERC20BridgeSource.Velodrome: {
                    let address;
                    if (source === types_1.ERC20BridgeSource.Dystopia) {
                        address = constants_1.DYSTOPIA_ROUTER_BY_CHAIN_ID[this.chainId];
                    }
                    else {
                        address = constants_1.VELODROME_ROUTER_BY_CHAIN_ID[this.chainId];
                    }
                    return this.getSolidlySellQuotes(source, address, takerToken, makerToken, takerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Synthetix: {
                    const readProxy = constants_1.SYNTHETIX_READ_PROXY_BY_CHAIN_ID[this.chainId];
                    const currencyKeyMap = constants_1.SYNTHETIX_CURRENCY_KEYS_BY_CHAIN_ID[this.chainId];
                    const takerTokenSymbol = currencyKeyMap.get(takerToken.toLowerCase());
                    const makerTokenSymbol = currencyKeyMap.get(makerToken.toLowerCase());
                    if (takerTokenSymbol === undefined || makerTokenSymbol === undefined) {
                        return [];
                    }
                    return this.getSynthetixSellQuotes(readProxy, takerTokenSymbol, makerTokenSymbol, takerFillAmounts);
                }
                case types_1.ERC20BridgeSource.WOOFi: {
                    if (!(constants_1.WOOFI_SUPPORTED_TOKENS.has(takerToken) && constants_1.WOOFI_SUPPORTED_TOKENS.has(makerToken))) {
                        return [];
                    }
                    return this.getWOOFiSellQuotes(constants_1.WOOFI_ROUTER_BY_CHAIN_ID[this.chainId], takerToken, makerToken, takerFillAmounts);
                }
                default:
                    throw new Error(`Unsupported sell sample source: ${source}`);
            }
        }));
        return allOps;
    }
    _isLidoSupported(takerTokenAddress, makerTokenAddress) {
        const lidoInfo = constants_1.LIDO_INFO_BY_CHAIN[this.chainId];
        if (lidoInfo.wethToken === constants_1.NULL_ADDRESS) {
            return false;
        }
        const takerToken = takerTokenAddress.toLowerCase();
        const makerToken = makerTokenAddress.toLowerCase();
        const wethToken = lidoInfo.wethToken.toLowerCase();
        const stEthToken = lidoInfo.stEthToken.toLowerCase();
        const wstEthToken = lidoInfo.wstEthToken.toLowerCase();
        if (takerToken === wethToken && makerToken === stEthToken) {
            return true;
        }
        return _.difference([stEthToken, wstEthToken], [takerToken, makerToken]).length === 0;
    }
    _getBuyQuoteOperations(sources, makerToken, takerToken, makerFillAmounts) {
        // Find the adjacent tokens in the provided token adjacency graph,
        // e.g if this is DAI->USDC we may check for DAI->WETH->USDC
        const intermediateTokens = this.tokenAdjacencyGraph.getIntermediateTokens(makerToken, takerToken);
        const _sources = exports.BATCH_SOURCE_FILTERS.getAllowed(sources);
        return _.flatten(_sources.map((source) => {
            switch (source) {
                case types_1.ERC20BridgeSource.Uniswap:
                    return (0, bridge_source_utils_1.isValidAddress)(constants_1.UNISWAPV1_ROUTER_BY_CHAIN_ID[this.chainId])
                        ? this.getUniswapBuyQuotes(constants_1.UNISWAPV1_ROUTER_BY_CHAIN_ID[this.chainId], makerToken, takerToken, makerFillAmounts)
                        : [];
                case types_1.ERC20BridgeSource.UniswapV2:
                case types_1.ERC20BridgeSource.SushiSwap:
                case types_1.ERC20BridgeSource.CryptoCom:
                case types_1.ERC20BridgeSource.PancakeSwap:
                case types_1.ERC20BridgeSource.PancakeSwapV2:
                case types_1.ERC20BridgeSource.BakerySwap:
                case types_1.ERC20BridgeSource.ApeSwap:
                case types_1.ERC20BridgeSource.QuickSwap:
                case types_1.ERC20BridgeSource.Dfyn:
                case types_1.ERC20BridgeSource.WaultSwap:
                case types_1.ERC20BridgeSource.ShibaSwap:
                case types_1.ERC20BridgeSource.Pangolin:
                case types_1.ERC20BridgeSource.TraderJoe:
                case types_1.ERC20BridgeSource.UbeSwap:
                case types_1.ERC20BridgeSource.SpiritSwap:
                case types_1.ERC20BridgeSource.SpookySwap:
                case types_1.ERC20BridgeSource.Yoshi:
                case types_1.ERC20BridgeSource.MorpheusSwap:
                case types_1.ERC20BridgeSource.BiSwap:
                case types_1.ERC20BridgeSource.MDex:
                case types_1.ERC20BridgeSource.KnightSwap:
                case types_1.ERC20BridgeSource.MeshSwap: {
                    // Skip sampling when it involves a known rebasing token as it results in high revert rate.
                    // https://docs.uniswap.org/protocol/V2/reference/smart-contracts/common-errors#rebasing-tokens
                    if (constants_1.REBASING_TOKENS.has(takerToken) || constants_1.REBASING_TOKENS.has(makerToken)) {
                        return [];
                    }
                    const uniLikeRouter = (0, bridge_source_utils_1.uniswapV2LikeRouterAddress)(this.chainId, source);
                    if (!(0, bridge_source_utils_1.isValidAddress)(uniLikeRouter)) {
                        return [];
                    }
                    return [
                        [takerToken, makerToken],
                        ...intermediateTokens.map((t) => [takerToken, t, makerToken]),
                    ].map((path) => this.getUniswapV2BuyQuotes(uniLikeRouter, path, makerFillAmounts, source));
                }
                case types_1.ERC20BridgeSource.KyberDmm: {
                    const kyberDmmRouter = constants_1.KYBER_DMM_ROUTER_BY_CHAIN_ID[this.chainId];
                    if (!(0, bridge_source_utils_1.isValidAddress)(kyberDmmRouter)) {
                        return [];
                    }
                    return this.getKyberDmmBuyQuotes(kyberDmmRouter, [takerToken, makerToken], makerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Curve:
                case types_1.ERC20BridgeSource.CurveV2:
                case types_1.ERC20BridgeSource.Nerve:
                case types_1.ERC20BridgeSource.Synapse:
                case types_1.ERC20BridgeSource.Belt:
                case types_1.ERC20BridgeSource.Ellipsis:
                case types_1.ERC20BridgeSource.Saddle:
                case types_1.ERC20BridgeSource.FirebirdOneSwap:
                case types_1.ERC20BridgeSource.IronSwap:
                case types_1.ERC20BridgeSource.ACryptos:
                case types_1.ERC20BridgeSource.MobiusMoney:
                    return (0, bridge_source_utils_1.getCurveLikeInfosForPair)(this.chainId, takerToken, makerToken, source).map((pool) => this.getCurveBuyQuotes(pool, pool.takerTokenIdx, pool.makerTokenIdx, makerFillAmounts, source));
                case types_1.ERC20BridgeSource.Shell:
                case types_1.ERC20BridgeSource.Component:
                    return (0, bridge_source_utils_1.getShellLikeInfosForPair)(this.chainId, takerToken, makerToken, source).map((pool) => this.getShellBuyQuotes(pool, makerToken, takerToken, makerFillAmounts, source));
                case types_1.ERC20BridgeSource.MStable:
                    return (0, bridge_source_utils_1.getShellLikeInfosForPair)(this.chainId, takerToken, makerToken, source).map((pool) => this.getMStableBuyQuotes(pool, makerToken, takerToken, makerFillAmounts));
                case types_1.ERC20BridgeSource.Mooniswap:
                    return [
                        ...constants_1.MOONISWAP_REGISTRIES_BY_CHAIN_ID[this.chainId]
                            .filter((r) => (0, bridge_source_utils_1.isValidAddress)(r))
                            .map((registry) => this.getMooniswapBuyQuotes(registry, makerToken, takerToken, makerFillAmounts)),
                    ];
                case types_1.ERC20BridgeSource.Balancer:
                    return this.poolsCaches[types_1.ERC20BridgeSource.Balancer]
                        .getPoolAddressesForPair(takerToken, makerToken)
                        .map((poolAddress) => this.getBalancerBuyQuotes(poolAddress, makerToken, takerToken, makerFillAmounts, types_1.ERC20BridgeSource.Balancer));
                case types_1.ERC20BridgeSource.Beethovenx:
                case types_1.ERC20BridgeSource.BalancerV2: {
                    const cache = this.poolsCaches[types_1.ERC20BridgeSource.BalancerV2];
                    if (!cache) {
                        return [];
                    }
                    const swaps = cache.getCachedSwapInfoForPair(takerToken, makerToken);
                    const vault = constants_1.BALANCER_V2_VAULT_ADDRESS_BY_CHAIN[this.chainId];
                    if (!swaps || vault === constants_1.NULL_ADDRESS) {
                        return [];
                    }
                    // Changed to retrieve queryBatchSwap for swap steps > 1 of length
                    return swaps.swapInfoExactOut.map((quoteSwapInfo, i) => this.getBalancerV2MultihopBuyQuotes(vault, quoteSwapInfo, swaps.swapInfoExactIn[i], makerFillAmounts, source));
                }
                case types_1.ERC20BridgeSource.Dodo:
                    if (!(0, bridge_source_utils_1.isValidAddress)(constants_1.DODOV1_CONFIG_BY_CHAIN_ID[this.chainId].registry)) {
                        return [];
                    }
                    return this.getDODOBuyQuotes(constants_1.DODOV1_CONFIG_BY_CHAIN_ID[this.chainId], makerToken, takerToken, makerFillAmounts);
                case types_1.ERC20BridgeSource.DodoV2:
                    return _.flatten(constants_1.DODOV2_FACTORIES_BY_CHAIN_ID[this.chainId]
                        .filter((factory) => (0, bridge_source_utils_1.isValidAddress)(factory))
                        .map((factory) => (0, bridge_source_utils_1.getDodoV2Offsets)().map((offset) => this.getDODOV2BuyQuotes(factory, offset, makerToken, takerToken, makerFillAmounts))));
                case types_1.ERC20BridgeSource.Bancor:
                    // Unimplemented
                    // return this.getBancorBuyQuotes(makerToken, takerToken, makerFillAmounts);
                    return [];
                case types_1.ERC20BridgeSource.MakerPsm: {
                    const psmInfo = constants_1.MAKER_PSM_INFO_BY_CHAIN_ID[this.chainId];
                    if (!(0, bridge_source_utils_1.isValidAddress)(psmInfo.psmAddress)) {
                        return [];
                    }
                    return this.getMakerPsmBuyQuotes(psmInfo, makerToken, takerToken, makerFillAmounts);
                }
                case types_1.ERC20BridgeSource.UniswapV3: {
                    // Rebasing tokens lead to a high revert rate.
                    if (constants_1.REBASING_TOKENS.has(takerToken) || constants_1.REBASING_TOKENS.has(makerToken)) {
                        return [];
                    }
                    const { factory, router } = constants_1.UNISWAPV3_CONFIG_BY_CHAIN_ID[this.chainId];
                    if (!(0, bridge_source_utils_1.isValidAddress)(router) || !(0, bridge_source_utils_1.isValidAddress)(factory)) {
                        return [];
                    }
                    return [
                        [takerToken, makerToken],
                        ...intermediateTokens.map((t) => [takerToken, t, makerToken]),
                    ].map((path) => this.uniswapV3Sampler.createSampleBuysOperation(path, makerFillAmounts));
                }
                case types_1.ERC20BridgeSource.Lido: {
                    if (!this._isLidoSupported(takerToken, makerToken)) {
                        return [];
                    }
                    const lidoInfo = constants_1.LIDO_INFO_BY_CHAIN[this.chainId];
                    return this.getLidoBuyQuotes(lidoInfo, makerToken, takerToken, makerFillAmounts);
                }
                case types_1.ERC20BridgeSource.AaveV3: {
                    if (!this.aaveV3ReservesCache) {
                        return [];
                    }
                    const reserve = this.aaveV3ReservesCache.get(takerToken, makerToken);
                    if (!reserve) {
                        return [];
                    }
                    const info = {
                        lendingPool: reserve.pool.pool,
                        aToken: reserve.aToken.id,
                        underlyingToken: reserve.underlyingAsset,
                    };
                    const l2Encoder = constants_1.AAVE_V3_L2_ENCODERS_BY_CHAIN_ID[this.chainId];
                    return this.getAaveV3BuyQuotes(info, makerToken, takerToken, makerFillAmounts, l2Encoder);
                }
                case types_1.ERC20BridgeSource.AaveV2: {
                    if (!this.aaveV2ReservesCache) {
                        return [];
                    }
                    const reserve = this.aaveV2ReservesCache.get(takerToken, makerToken);
                    if (!reserve) {
                        return [];
                    }
                    const info = {
                        lendingPool: reserve.pool.lendingPool,
                        aToken: reserve.aToken.id,
                        underlyingToken: reserve.underlyingAsset,
                    };
                    return this.getAaveV2BuyQuotes(info, makerToken, takerToken, makerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Compound: {
                    if (!this.compoundCTokenCache) {
                        return [];
                    }
                    const cToken = this.compoundCTokenCache.get(takerToken, makerToken);
                    if (!cToken) {
                        return [];
                    }
                    return this.getCompoundBuyQuotes(cToken.tokenAddress, makerToken, takerToken, makerFillAmounts);
                }
                case types_1.ERC20BridgeSource.GMX: {
                    // MIM has no liquidity.
                    if (takerToken === constants_1.AVALANCHE_TOKENS.MIM || makerToken === constants_1.AVALANCHE_TOKENS.MIM) {
                        return [];
                    }
                    return this.getGMXBuyQuotes(constants_1.GMX_ROUTER_BY_CHAIN_ID[this.chainId], constants_1.GMX_READER_BY_CHAIN_ID[this.chainId], constants_1.GMX_VAULT_BY_CHAIN_ID[this.chainId], [takerToken, makerToken], makerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Platypus: {
                    return (0, bridge_source_utils_1.getPlatypusInfoForPair)(this.chainId, takerToken, makerToken).map((pool) => this.getPlatypusBuyQuotes(constants_1.PLATYPUS_ROUTER_BY_CHAIN_ID[this.chainId], [pool.poolAddress], [takerToken, makerToken], makerFillAmounts));
                }
                case types_1.ERC20BridgeSource.BancorV3: {
                    return this.getBancorV3BuyQuotes(constants_1.BANCORV3_NETWORK_BY_CHAIN_ID[this.chainId], constants_1.BANCORV3_NETWORK_INFO_BY_CHAIN_ID[this.chainId], [takerToken, makerToken], makerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Dystopia:
                case types_1.ERC20BridgeSource.Velodrome: {
                    let address;
                    if (source === types_1.ERC20BridgeSource.Dystopia) {
                        address = constants_1.DYSTOPIA_ROUTER_BY_CHAIN_ID[this.chainId];
                    }
                    else {
                        address = constants_1.VELODROME_ROUTER_BY_CHAIN_ID[this.chainId];
                    }
                    return this.getSolidlyBuyQuotes(source, address, takerToken, makerToken, makerFillAmounts);
                }
                case types_1.ERC20BridgeSource.Synthetix: {
                    const readProxy = constants_1.SYNTHETIX_READ_PROXY_BY_CHAIN_ID[this.chainId];
                    const currencyKeyMap = constants_1.SYNTHETIX_CURRENCY_KEYS_BY_CHAIN_ID[this.chainId];
                    const takerTokenSymbol = currencyKeyMap.get(takerToken.toLowerCase());
                    const makerTokenSymbol = currencyKeyMap.get(makerToken.toLowerCase());
                    if (takerTokenSymbol === undefined || makerTokenSymbol === undefined) {
                        return [];
                    }
                    return this.getSynthetixBuyQuotes(readProxy, takerTokenSymbol, makerTokenSymbol, makerFillAmounts);
                }
                case types_1.ERC20BridgeSource.WOOFi: {
                    if (!(constants_1.WOOFI_SUPPORTED_TOKENS.has(takerToken) && constants_1.WOOFI_SUPPORTED_TOKENS.has(makerToken))) {
                        return [];
                    }
                    return this.getWOOFiBuyQuotes(constants_1.WOOFI_ROUTER_BY_CHAIN_ID[this.chainId], takerToken, makerToken, makerFillAmounts);
                }
                default:
                    throw new Error(`Unsupported buy sample source: ${source}`);
            }
        }));
    }
    /**
     * Wraps `subOps` operations into a batch call to the sampler
     * @param subOps An array of Sampler operations
     * @param resultHandler The handler of the parsed batch results
     * @param revertHandler The handle for when the batch operation reverts. The result data is provided as an argument
     */
    _createBatch(subOps, resultHandler, revertHandler) {
        return {
            encodeCall: () => {
                const subCalls = subOps.map((op) => op.encodeCall());
                return this._samplerContract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResults: (callResults) => {
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData('batchCall', callResults);
                const results = subOps.map((op, i) => rawSubCallResults[i].success
                    ? op.handleCallResults(rawSubCallResults[i].data)
                    : op.handleRevert(rawSubCallResults[i].data));
                return resultHandler(results);
            },
            handleRevert: revertHandler,
        };
    }
}
exports.SamplerOperations = SamplerOperations;
//# sourceMappingURL=sampler_operations.js.map