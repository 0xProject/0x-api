"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contract_addresses_1 = require("@0x/contract-addresses");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const TypeMoq = require("typemoq");
const asset_swapper_1 = require("../../src/asset-swapper");
const types_1 = require("../../src/asset-swapper/types");
const market_operation_utils_1 = require("../../src/asset-swapper/utils/market_operation_utils/");
const constants_1 = require("../../src/asset-swapper/utils/market_operation_utils/constants");
const pools_cache_1 = require("../../src/asset-swapper/utils/market_operation_utils/pools_cache");
const sampler_operations_1 = require("../../src/asset-swapper/utils/market_operation_utils/sampler_operations");
const types_2 = require("../../src/asset-swapper/utils/market_operation_utils/types");
const rfq_client_1 = require("../../src/utils/rfq_client");
const MAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
const TAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
const DEFAULT_INCLUDED = [
    types_1.ERC20BridgeSource.SushiSwap,
    types_1.ERC20BridgeSource.Native,
    types_1.ERC20BridgeSource.Uniswap,
    types_1.ERC20BridgeSource.Curve,
];
const DEFAULT_EXCLUDED = constants_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Mainnet].sources.filter((s) => !DEFAULT_INCLUDED.includes(s));
const BUY_SOURCES = constants_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Mainnet].sources;
const SELL_SOURCES = constants_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Mainnet].sources;
const TOKEN_ADJACENCY_GRAPH = asset_swapper_1.TokenAdjacencyGraph.getEmptyGraph();
const NO_OP_FEE_SCHEDULE = Object.fromEntries(Object.values(types_1.ERC20BridgeSource).map((source) => [source, _.constant({ gas: 0, fee: new utils_1.BigNumber(0) })]));
const SIGNATURE = { v: 1, r: utils_1.NULL_BYTES, s: utils_1.NULL_BYTES, signatureType: protocol_utils_1.SignatureType.EthSign };
const FOO_INTEGRATOR = {
    integratorId: 'foo',
    label: 'foo',
};
const MAKER_URI = 'https://foo.bar';
/**
 * gets the orders required for a market sell operation by (potentially) merging native orders with
 * generated bridge orders.
 * @param limitOrders Native limit orders.
 * @param takerAmount Amount of taker asset to sell.
 * @param opts Options object.
 * @return object with optimized orders and a QuoteReport
 */
async function getMarketSellOrdersAsync(utils, limitOrders, takerAmount, opts) {
    return utils.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, limitOrders, takerAmount, asset_swapper_1.MarketOperation.Sell, opts);
}
/**
 * gets the orders required for a market buy operation by (potentially) merging native orders with
 * generated bridge orders.
 * @param limitOrders Native limit orders.
 * @param makerAmount Amount of maker asset to buy.
 * @param opts Options object.
 * @return object with optimized orders and a QuoteReport
 */
async function getMarketBuyOrdersAsync(utils, limitOrders, makerAmount, opts) {
    return utils.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, limitOrders, makerAmount, asset_swapper_1.MarketOperation.Buy, opts);
}
function toRfqClientV1Price(order) {
    return {
        expiry: order.order.expiry,
        kind: 'rfq',
        makerAmount: order.order.makerAmount,
        makerToken: order.order.makerToken,
        makerUri: MAKER_URI,
        takerAmount: order.order.takerAmount,
        takerToken: order.order.takerToken,
    };
}
function toRfqClientV1Quote(order) {
    return {
        order: new protocol_utils_1.RfqOrder(order.order),
        signature: order.signature,
        makerUri: MAKER_URI,
    };
}
class MockPoolsCache extends pools_cache_1.AbstractPoolsCache {
    constructor(_handler) {
        super(new Map());
        this._handler = _handler;
    }
    async _fetchPoolsForPairAsync(takerToken, makerToken) {
        return this._handler(takerToken, makerToken);
    }
}
// Return some pool so that sampling functions are called for Balancer and BalancerV2
const mockPoolsCache = new MockPoolsCache((_takerToken, _makerToken) => {
    return [
        {
            id: '0xe4b2554b622cc342ac7d6dc19b594553577941df000200000000000000000003',
            balanceIn: new utils_1.BigNumber('13655.491506618973154788'),
            balanceOut: new utils_1.BigNumber('8217005.926472'),
            weightIn: new utils_1.BigNumber('0.5'),
            weightOut: new utils_1.BigNumber('0.5'),
            swapFee: new utils_1.BigNumber('0.008'),
            spotPrice: new utils_1.BigNumber(596.92685),
        },
    ];
});
describe('MarketOperationUtils tests', () => {
    const CHAIN_ID = contract_addresses_1.ChainId.Mainnet;
    const contractAddresses = {
        ...(0, contract_addresses_1.getContractAddressesForChainOrThrow)(CHAIN_ID),
    };
    function getMockedQuoteRequestor(_type, _results, _verifiable) {
        const requestor = TypeMoq.Mock.ofType(asset_swapper_1.QuoteRequestor, TypeMoq.MockBehavior.Loose, true);
        requestor.setup((r) => r.getMakerUriForSignature(TypeMoq.It.isValue(SIGNATURE))).returns(() => MAKER_URI);
        requestor
            .setup((r) => r.setMakerUriForSignature(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
            .returns(() => undefined);
        return requestor;
    }
    function createOrdersFromSellRates(takerAmount, rates) {
        const singleTakerAmount = takerAmount.div(rates.length).integerValue(utils_1.BigNumber.ROUND_UP);
        return rates.map((r) => {
            const o = {
                order: {
                    ...new protocol_utils_1.LimitOrder({
                        makerAmount: singleTakerAmount.times(r).integerValue(),
                        takerAmount: singleTakerAmount,
                    }),
                },
                signature: SIGNATURE,
                type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
            };
            return o;
        });
    }
    function createOrdersFromBuyRates(makerAmount, rates) {
        const singleMakerAmount = makerAmount.div(rates.length).integerValue(utils_1.BigNumber.ROUND_UP);
        return rates.map((r) => {
            const o = {
                order: {
                    ...new protocol_utils_1.LimitOrder({
                        makerAmount: singleMakerAmount,
                        takerAmount: singleMakerAmount.div(r).integerValue(),
                    }),
                },
                signature: SIGNATURE,
                type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
            };
            return o;
        });
    }
    function createSamplesFromRates(source, inputs, rates, fillData) {
        const samples = [];
        inputs.forEach((input, i) => {
            const rate = rates[i];
            samples.push({
                source,
                fillData: fillData || DEFAULT_FILL_DATA[source],
                input: new utils_1.BigNumber(input),
                output: new utils_1.BigNumber(input)
                    .minus(i === 0 ? 0 : samples[i - 1].input)
                    .times(rate)
                    .plus(i === 0 ? 0 : samples[i - 1].output)
                    .integerValue(),
            });
        });
        return samples;
    }
    function createGetMultipleSellQuotesOperationFromRates(rates) {
        return (sources, _makerToken, _takerToken, fillAmounts, _wethAddress) => {
            return sampler_operations_1.BATCH_SOURCE_FILTERS.getAllowed(sources).map((s) => createSamplesFromRates(s, fillAmounts, rates[s]));
        };
    }
    function createGetMultipleBuyQuotesOperationFromRates(rates) {
        return (sources, _makerToken, _takerToken, fillAmounts, _wethAddress) => {
            return sampler_operations_1.BATCH_SOURCE_FILTERS.getAllowed(sources).map((s) => createSamplesFromRates(s, fillAmounts, rates[s].map((r) => new utils_1.BigNumber(1).div(r))));
        };
    }
    function createGetBestNativeSellRate(rate) {
        return (_sources, _makerToken, _takerToken, _fillAmounts, _wethAddress) => {
            return new utils_1.BigNumber(rate);
        };
    }
    function createDecreasingRates(count) {
        const rates = [];
        const initialRate = (0, contracts_test_utils_1.getRandomFloat)(1e-3, 1e2);
        _.times(count, () => (0, contracts_test_utils_1.getRandomFloat)(0.95, 1)).forEach((r, i) => {
            const prevRate = i === 0 ? initialRate : rates[i - 1];
            rates.push(prevRate.times(r));
        });
        return rates;
    }
    const NUM_SAMPLES = 3;
    const ZERO_RATES = Object.assign({}, ...Object.values(types_1.ERC20BridgeSource).map((source) => ({
        [source]: _.times(NUM_SAMPLES, () => 0),
    })));
    const DEFAULT_RATES = {
        ...ZERO_RATES,
        [types_1.ERC20BridgeSource.Native]: createDecreasingRates(NUM_SAMPLES),
        [types_1.ERC20BridgeSource.SushiSwap]: createDecreasingRates(NUM_SAMPLES),
        [types_1.ERC20BridgeSource.Uniswap]: createDecreasingRates(NUM_SAMPLES),
        [types_1.ERC20BridgeSource.Curve]: createDecreasingRates(NUM_SAMPLES),
    };
    const DEFAULT_FILL_DATA = {
        [types_1.ERC20BridgeSource.UniswapV2]: { tokenAddressPath: [] },
        [types_1.ERC20BridgeSource.Balancer]: { poolAddress: (0, contracts_test_utils_1.randomAddress)() },
        [types_1.ERC20BridgeSource.BalancerV2]: {
            vault: (0, contracts_test_utils_1.randomAddress)(),
            poolId: (0, contracts_test_utils_1.randomAddress)(),
            deadline: Math.floor(Date.now() / 1000) + 300,
        },
        [types_1.ERC20BridgeSource.Bancor]: { path: [], networkAddress: (0, contracts_test_utils_1.randomAddress)() },
        [types_1.ERC20BridgeSource.Curve]: {
            pool: {
                poolAddress: (0, contracts_test_utils_1.randomAddress)(),
                tokens: [TAKER_TOKEN, MAKER_TOKEN],
                exchangeFunctionSelector: utils_1.hexUtils.random(4),
                sellQuoteFunctionSelector: utils_1.hexUtils.random(4),
                buyQuoteFunctionSelector: utils_1.hexUtils.random(4),
            },
            fromTokenIdx: 0,
            toTokenIdx: 1,
        },
        [types_1.ERC20BridgeSource.Saddle]: {
            pool: {
                poolAddress: (0, contracts_test_utils_1.randomAddress)(),
                tokens: [TAKER_TOKEN, MAKER_TOKEN],
                exchangeFunctionSelector: utils_1.hexUtils.random(4),
                sellQuoteFunctionSelector: utils_1.hexUtils.random(4),
                buyQuoteFunctionSelector: utils_1.hexUtils.random(4),
            },
            fromTokenIdx: 0,
            toTokenIdx: 1,
        },
        [types_1.ERC20BridgeSource.SushiSwap]: { tokenAddressPath: [] },
        [types_1.ERC20BridgeSource.Mooniswap]: { poolAddress: (0, contracts_test_utils_1.randomAddress)() },
        [types_1.ERC20BridgeSource.Native]: { order: new protocol_utils_1.LimitOrder() },
        [types_1.ERC20BridgeSource.MultiHop]: {},
        [types_1.ERC20BridgeSource.Shell]: { poolAddress: (0, contracts_test_utils_1.randomAddress)() },
        [types_1.ERC20BridgeSource.Component]: { poolAddress: (0, contracts_test_utils_1.randomAddress)() },
        [types_1.ERC20BridgeSource.Dodo]: {},
        [types_1.ERC20BridgeSource.DodoV2]: {},
        [types_1.ERC20BridgeSource.CryptoCom]: { tokenAddressPath: [] },
        [types_1.ERC20BridgeSource.Uniswap]: { router: (0, contracts_test_utils_1.randomAddress)() },
        [types_1.ERC20BridgeSource.MakerPsm]: {},
        [types_1.ERC20BridgeSource.KyberDmm]: { tokenAddressPath: [], router: (0, contracts_test_utils_1.randomAddress)(), poolsPath: [] },
    };
    const DEFAULT_OPS = {
        getTokenDecimals(_makerAddress, _takerAddress) {
            const result = new utils_1.BigNumber(18);
            return [result, result];
        },
        getLimitOrderFillableTakerAmounts(orders) {
            return orders.map((o) => o.order.takerAmount);
        },
        getLimitOrderFillableMakerAmounts(orders) {
            return orders.map((o) => o.order.makerAmount);
        },
        getSellQuotes: createGetMultipleSellQuotesOperationFromRates(DEFAULT_RATES),
        getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(DEFAULT_RATES),
        getBestNativeTokenSellRate: createGetBestNativeSellRate(1),
        isAddressContract: (..._params) => false,
        getTwoHopSellQuotes: (_sources, _makerToken, _takerToken, _sellAmount) => [],
        getTwoHopBuyQuotes: (_sources, _makerToken, _takerToken, _buyAmount) => [],
        getGasLeft: () => constants_1.ZERO_AMOUNT,
        getBlockNumber: () => constants_1.ZERO_AMOUNT,
    };
    const MOCK_SAMPLER = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async executeAsync(...ops) {
            return MOCK_SAMPLER.executeBatchAsync(ops);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async executeBatchAsync(ops) {
            return ops;
        },
        poolsCaches: {
            [types_1.ERC20BridgeSource.BalancerV2]: mockPoolsCache,
            [types_1.ERC20BridgeSource.Balancer]: mockPoolsCache,
        },
        chainId: CHAIN_ID,
    };
    function replaceSamplerOps(ops = {}) {
        Object.assign(MOCK_SAMPLER, DEFAULT_OPS);
        Object.assign(MOCK_SAMPLER, ops);
    }
    describe('MarketOperationUtils', () => {
        let marketOperationUtils;
        before(async () => {
            marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(MOCK_SAMPLER, contractAddresses);
        });
        describe('getMarketSellOrdersAsync()', () => {
            const FILL_AMOUNT = new utils_1.BigNumber('100e18');
            const ORDERS = createOrdersFromSellRates(FILL_AMOUNT, _.times(NUM_SAMPLES, (i) => DEFAULT_RATES[types_1.ERC20BridgeSource.Native][i]));
            const DEFAULT_OPTS = {
                numSamples: NUM_SAMPLES,
                sampleDistributionBase: 1,
                bridgeSlippage: 0,
                excludedSources: DEFAULT_EXCLUDED,
                gasPrice: new utils_1.BigNumber(30e9),
            };
            beforeEach(() => {
                replaceSamplerOps();
            });
            it('queries `numSamples` samples', async () => {
                // neon-router requires at least 3 samples
                const numSamples = _.random(3, NUM_SAMPLES);
                let actualNumSamples = 0;
                replaceSamplerOps({
                    getSellQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        actualNumSamples = amounts.length;
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts, wethAddress, TOKEN_ADJACENCY_GRAPH);
                    },
                });
                await getMarketSellOrdersAsync(marketOperationUtils, ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    numSamples,
                    neonRouterNumSamples: numSamples,
                });
                (0, contracts_test_utils_1.expect)(actualNumSamples).eq(numSamples);
            });
            it('polls all DEXes if `excludedSources` is empty', async () => {
                let sourcesPolled = [];
                replaceSamplerOps({
                    getSellQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sourcesPolled.concat(sources.slice());
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts, wethAddress, TOKEN_ADJACENCY_GRAPH);
                    },
                    getTwoHopSellQuotes: (sources, makerToken, takerToken, buyAmount) => {
                        if (sources.length !== 0) {
                            sourcesPolled.push(types_1.ERC20BridgeSource.MultiHop);
                            sourcesPolled.push(...sources);
                        }
                        return DEFAULT_OPS.getTwoHopSellQuotes(sources, makerToken, takerToken, buyAmount);
                    },
                });
                await getMarketSellOrdersAsync(marketOperationUtils, ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                (0, contracts_test_utils_1.expect)(_.uniq(sourcesPolled).sort()).to.deep.equals(SELL_SOURCES.slice().sort());
            });
            it('does not poll DEXes in `excludedSources`', async () => {
                const excludedSources = [types_1.ERC20BridgeSource.Uniswap, types_1.ERC20BridgeSource.SushiSwap];
                let sourcesPolled = [];
                replaceSamplerOps({
                    getSellQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sourcesPolled.concat(sources.slice());
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts, wethAddress, TOKEN_ADJACENCY_GRAPH);
                    },
                    getTwoHopSellQuotes: (sources, makerToken, takerToken, buyAmount) => {
                        if (sources.length !== 0) {
                            sourcesPolled.push(types_1.ERC20BridgeSource.MultiHop);
                            sourcesPolled.push(...sources);
                        }
                        return DEFAULT_OPS.getTwoHopSellQuotes(sources, makerToken, takerToken, buyAmount);
                    },
                });
                await getMarketSellOrdersAsync(marketOperationUtils, ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources,
                });
                (0, contracts_test_utils_1.expect)(_.uniq(sourcesPolled).sort()).to.deep.equals(_.without(SELL_SOURCES, ...excludedSources).sort());
            });
            it('only polls DEXes in `includedSources`', async () => {
                const includedSources = [types_1.ERC20BridgeSource.Uniswap, types_1.ERC20BridgeSource.SushiSwap];
                let sourcesPolled = [];
                replaceSamplerOps({
                    getSellQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sourcesPolled.concat(sources.slice());
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts, wethAddress, TOKEN_ADJACENCY_GRAPH);
                    },
                    getTwoHopSellQuotes: (sources, makerToken, takerToken, buyAmount) => {
                        if (sources.length !== 0) {
                            sourcesPolled.push(types_1.ERC20BridgeSource.MultiHop);
                            sourcesPolled.push(...sources);
                        }
                        return DEFAULT_OPS.getTwoHopSellQuotes(sources, makerToken, takerToken, buyAmount);
                    },
                });
                await getMarketSellOrdersAsync(marketOperationUtils, ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                    includedSources,
                });
                (0, contracts_test_utils_1.expect)(_.uniq(sourcesPolled).sort()).to.deep.equals(includedSources.sort());
            });
            // // TODO (xianny): v4 will have a new way of representing bridge data
            // it('generates bridge orders with correct asset data', async () => {
            //     const improvedOrdersResponse = await getMarketSellOrdersAsync(
            //         marketOperationUtils,
            //         // Pass in empty orders to prevent native orders from being used.
            //         ORDERS.map(o => ({ ...o, makerAmount: constants.ZERO_AMOUNT })),
            //         FILL_AMOUNT,
            //         DEFAULT_OPTS,
            //     );
            //     const improvedOrders = improvedOrdersResponse.path.createOrders();
            //     expect(improvedOrders).to.not.be.length(0);
            //     for (const order of improvedOrders) {
            //         expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
            //         const makerAssetDataPrefix = hexUtils.slice(
            //             assetDataUtils.encodeERC20BridgeAssetData(
            //                 MAKER_TOKEN,
            //                 constants.NULL_ADDRESS,
            //                 constants.NULL_BYTES,
            //             ),
            //             0,
            //             36,
            //         );
            //         assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
            //         expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
            //     }
            // });
            it('getMarketSellOrdersAsync() optimizer will be called once only if price-aware RFQ is disabled', async () => {
                const mockedMarketOpUtils = TypeMoq.Mock.ofType(market_operation_utils_1.MarketOperationUtils, TypeMoq.MockBehavior.Loose, false, MOCK_SAMPLER, contractAddresses);
                mockedMarketOpUtils.callBase = true;
                // Ensure that `_generateOptimizedOrdersAsync` is only called once
                mockedMarketOpUtils
                    .setup((m) => m.generateOptimizedOrders(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
                    .returns((a, b) => mockedMarketOpUtils.target.generateOptimizedOrders(a, b))
                    .verifiable(TypeMoq.Times.once());
                const totalAssetAmount = ORDERS.map((o) => o.order.takerAmount).reduce((a, b) => a.plus(b));
                await mockedMarketOpUtils.object.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, ORDERS, totalAssetAmount, asset_swapper_1.MarketOperation.Sell, DEFAULT_OPTS);
                mockedMarketOpUtils.verifyAll();
            });
            it('getMarketSellOrdersAsync() will not rerun the optimizer if no orders are returned', async () => {
                // Ensure that `_generateOptimizedOrdersAsync` is only called once
                const mockedMarketOpUtils = TypeMoq.Mock.ofType(market_operation_utils_1.MarketOperationUtils, TypeMoq.MockBehavior.Loose, false, MOCK_SAMPLER, contractAddresses);
                mockedMarketOpUtils.callBase = true;
                mockedMarketOpUtils
                    .setup((m) => m.generateOptimizedOrders(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
                    .returns((a, b) => mockedMarketOpUtils.target.generateOptimizedOrders(a, b))
                    .verifiable(TypeMoq.Times.once());
                const rfqClient = TypeMoq.Mock.ofType(rfq_client_1.RfqClient, TypeMoq.MockBehavior.Loose, true);
                rfqClient
                    .setup((client) => client.getV1QuotesAsync(TypeMoq.It.isAny()))
                    .returns(async () => ({ quotes: [] }))
                    .verifiable(TypeMoq.Times.once());
                rfqClient
                    .setup((client) => client.getV2QuotesAsync(TypeMoq.It.isAny()))
                    .returns(async () => [])
                    .verifiable(TypeMoq.Times.once());
                const totalAssetAmount = ORDERS.map((o) => o.order.takerAmount).reduce((a, b) => a.plus(b));
                await mockedMarketOpUtils.object.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, ORDERS, totalAssetAmount, asset_swapper_1.MarketOperation.Sell, {
                    ...DEFAULT_OPTS,
                    rfqt: {
                        isIndicative: false,
                        integrator: FOO_INTEGRATOR,
                        takerAddress: (0, contracts_test_utils_1.randomAddress)(),
                        intentOnFilling: true,
                        txOrigin: (0, contracts_test_utils_1.randomAddress)(),
                        rfqClient: {
                            getV1PricesAsync: rfqClient.object.getV1PricesAsync,
                            getV1QuotesAsync: rfqClient.object.getV1QuotesAsync,
                            getV2PricesAsync: rfqClient.object.getV2PricesAsync,
                            getV2QuotesAsync: rfqClient.object.getV2QuotesAsync,
                        },
                        quoteRequestor: {},
                    },
                });
                mockedMarketOpUtils.verifyAll();
                rfqClient.verifyAll();
            });
            it('getMarketSellOrdersAsync() will rerun the optimizer if one or more indicative are returned', async () => {
                const requestor = getMockedQuoteRequestor('indicative', [ORDERS[0], ORDERS[1]], TypeMoq.Times.once());
                const rfqClient = TypeMoq.Mock.ofType(rfq_client_1.RfqClient, TypeMoq.MockBehavior.Loose, true);
                rfqClient
                    .setup((client) => client.getV1PricesAsync(TypeMoq.It.isAny()))
                    .returns(async () => ({ prices: [ORDERS[0], ORDERS[1]].map(toRfqClientV1Price) }))
                    .verifiable(TypeMoq.Times.once());
                rfqClient
                    .setup((client) => client.getV2PricesAsync(TypeMoq.It.isAny()))
                    .returns(async () => [])
                    .verifiable(TypeMoq.Times.once());
                const numOrdersInCall = [];
                const numIndicativeQuotesInCall = [];
                const mockedMarketOpUtils = TypeMoq.Mock.ofType(market_operation_utils_1.MarketOperationUtils, TypeMoq.MockBehavior.Loose, false, MOCK_SAMPLER, contractAddresses);
                mockedMarketOpUtils.callBase = true;
                mockedMarketOpUtils
                    .setup((m) => m.generateOptimizedOrders(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
                    .callback(async (msl, _opts) => {
                    numOrdersInCall.push(msl.quotes.nativeOrders.length);
                    numIndicativeQuotesInCall.push(msl.quotes.rfqtIndicativeQuotes.length);
                })
                    .returns((a, b) => mockedMarketOpUtils.target.generateOptimizedOrders(a, b))
                    .verifiable(TypeMoq.Times.exactly(2));
                const totalAssetAmount = ORDERS.map((o) => o.order.takerAmount).reduce((a, b) => a.plus(b));
                await mockedMarketOpUtils.object.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, ORDERS.slice(2, ORDERS.length), totalAssetAmount, asset_swapper_1.MarketOperation.Sell, {
                    ...DEFAULT_OPTS,
                    rfqt: {
                        isIndicative: true,
                        integrator: FOO_INTEGRATOR,
                        takerAddress: (0, contracts_test_utils_1.randomAddress)(),
                        txOrigin: (0, contracts_test_utils_1.randomAddress)(),
                        intentOnFilling: true,
                        rfqClient: {
                            getV1PricesAsync: rfqClient.object.getV1PricesAsync,
                            getV1QuotesAsync: rfqClient.object.getV1QuotesAsync,
                            getV2PricesAsync: rfqClient.object.getV2PricesAsync,
                            getV2QuotesAsync: rfqClient.object.getV2QuotesAsync,
                        },
                        quoteRequestor: {
                            getMakerUriForSignature: requestor.object.getMakerUriForSignature,
                        },
                    },
                });
                mockedMarketOpUtils.verifyAll();
                rfqClient.verifyAll();
                // The first and second optimizer call contains same number of RFQ orders.
                (0, contracts_test_utils_1.expect)(numOrdersInCall.length).to.eql(2);
                (0, contracts_test_utils_1.expect)(numOrdersInCall[0]).to.eql(1);
                (0, contracts_test_utils_1.expect)(numOrdersInCall[1]).to.eql(1);
                // The first call to optimizer will have no RFQ indicative quotes. The second call will have
                // two indicative quotes.
                (0, contracts_test_utils_1.expect)(numIndicativeQuotesInCall.length).to.eql(2);
                (0, contracts_test_utils_1.expect)(numIndicativeQuotesInCall[0]).to.eql(0);
                (0, contracts_test_utils_1.expect)(numIndicativeQuotesInCall[1]).to.eql(2);
            });
            it('getMarketSellOrdersAsync() will rerun the optimizer if one or more RFQ orders are returned', async () => {
                const requestor = getMockedQuoteRequestor('firm', [ORDERS[0]], TypeMoq.Times.once());
                const rfqClient = TypeMoq.Mock.ofType(rfq_client_1.RfqClient, TypeMoq.MockBehavior.Loose, true);
                rfqClient
                    .setup((client) => client.getV1QuotesAsync(TypeMoq.It.isAny()))
                    .returns(async () => ({ quotes: [ORDERS[0]].map(toRfqClientV1Quote) }))
                    .verifiable(TypeMoq.Times.once());
                rfqClient
                    .setup((client) => client.getV2QuotesAsync(TypeMoq.It.isAny()))
                    .returns(async () => [])
                    .verifiable(TypeMoq.Times.once());
                // Ensure that `_generateOptimizedOrdersAsync` is only called once
                // TODO: Ensure fillable amounts increase too
                const numOrdersInCall = [];
                const mockedMarketOpUtils = TypeMoq.Mock.ofType(market_operation_utils_1.MarketOperationUtils, TypeMoq.MockBehavior.Loose, false, MOCK_SAMPLER, contractAddresses);
                mockedMarketOpUtils.callBase = true;
                mockedMarketOpUtils
                    .setup((m) => m.generateOptimizedOrders(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
                    .callback(async (msl, _opts) => {
                    numOrdersInCall.push(msl.quotes.nativeOrders.length);
                })
                    .returns((a, b) => mockedMarketOpUtils.target.generateOptimizedOrders(a, b))
                    .verifiable(TypeMoq.Times.exactly(2));
                const totalAssetAmount = ORDERS.map((o) => o.order.takerAmount).reduce((a, b) => a.plus(b));
                await mockedMarketOpUtils.object.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, ORDERS.slice(1, ORDERS.length), totalAssetAmount, asset_swapper_1.MarketOperation.Sell, {
                    ...DEFAULT_OPTS,
                    rfqt: {
                        isIndicative: false,
                        integrator: {
                            integratorId: 'foo',
                            label: 'foo',
                        },
                        takerAddress: (0, contracts_test_utils_1.randomAddress)(),
                        intentOnFilling: true,
                        txOrigin: (0, contracts_test_utils_1.randomAddress)(),
                        rfqClient: {
                            getV1PricesAsync: rfqClient.object.getV1PricesAsync,
                            getV1QuotesAsync: rfqClient.object.getV1QuotesAsync,
                            getV2PricesAsync: rfqClient.object.getV2PricesAsync,
                            getV2QuotesAsync: rfqClient.object.getV2QuotesAsync,
                        },
                        quoteRequestor: {
                            setMakerUriForSignature: requestor.object.setMakerUriForSignature,
                            getMakerUriForSignature: requestor.object.getMakerUriForSignature,
                        },
                    },
                });
                mockedMarketOpUtils.verifyAll();
                rfqClient.verifyAll();
                (0, contracts_test_utils_1.expect)(numOrdersInCall.length).to.eql(2);
                // The first call to optimizer was without an RFQ order.
                // The first call to optimizer was with an extra RFQ order.
                (0, contracts_test_utils_1.expect)(numOrdersInCall[0]).to.eql(2);
                (0, contracts_test_utils_1.expect)(numOrdersInCall[1]).to.eql(3);
            });
            it('getMarketSellOrdersAsync() will not raise a NoOptimalPath error if no initial path was found during on-chain DEX optimization, but a path was found after RFQ optimization', async () => {
                let hasFirstOptimizationRun = false;
                let hasSecondOptimizationRun = false;
                const requestor = getMockedQuoteRequestor('firm', [ORDERS[0], ORDERS[1]], TypeMoq.Times.once());
                const rfqClient = TypeMoq.Mock.ofType(rfq_client_1.RfqClient, TypeMoq.MockBehavior.Loose, true);
                rfqClient
                    .setup((client) => client.getV1QuotesAsync(TypeMoq.It.isAny()))
                    .returns(async () => ({ quotes: [ORDERS[0], ORDERS[1]].map(toRfqClientV1Quote) }))
                    .verifiable(TypeMoq.Times.once());
                rfqClient
                    .setup((client) => client.getV2QuotesAsync(TypeMoq.It.isAny()))
                    .returns(async () => [])
                    .verifiable(TypeMoq.Times.once());
                const mockedMarketOpUtils = TypeMoq.Mock.ofType(market_operation_utils_1.MarketOperationUtils, TypeMoq.MockBehavior.Loose, false, MOCK_SAMPLER, contractAddresses);
                mockedMarketOpUtils.callBase = true;
                mockedMarketOpUtils
                    .setup((m) => m.generateOptimizedOrders(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
                    .returns((msl, _opts) => {
                    if (msl.quotes.nativeOrders.length === 1) {
                        hasFirstOptimizationRun = true;
                        throw new Error(types_2.AggregationError.NoOptimalPath);
                    }
                    else if (msl.quotes.nativeOrders.length === 3) {
                        hasSecondOptimizationRun = true;
                        return mockedMarketOpUtils.target.generateOptimizedOrders(msl, _opts);
                    }
                    else {
                        throw new Error('Invalid path. this error message should never appear');
                    }
                })
                    .verifiable(TypeMoq.Times.exactly(2));
                const totalAssetAmount = ORDERS.map((o) => o.order.takerAmount).reduce((a, b) => a.plus(b));
                await mockedMarketOpUtils.object.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, ORDERS.slice(2, ORDERS.length), totalAssetAmount, asset_swapper_1.MarketOperation.Sell, {
                    ...DEFAULT_OPTS,
                    rfqt: {
                        isIndicative: false,
                        integrator: FOO_INTEGRATOR,
                        takerAddress: (0, contracts_test_utils_1.randomAddress)(),
                        txOrigin: (0, contracts_test_utils_1.randomAddress)(),
                        intentOnFilling: true,
                        rfqClient: {
                            getV1PricesAsync: rfqClient.object.getV1PricesAsync,
                            getV1QuotesAsync: rfqClient.object.getV1QuotesAsync,
                            getV2PricesAsync: rfqClient.object.getV2PricesAsync,
                            getV2QuotesAsync: rfqClient.object.getV2QuotesAsync,
                        },
                        quoteRequestor: {
                            setMakerUriForSignature: requestor.object.setMakerUriForSignature,
                            getMakerUriForSignature: requestor.object.getMakerUriForSignature,
                        },
                    },
                });
                mockedMarketOpUtils.verifyAll();
                rfqClient.verifyAll();
                (0, contracts_test_utils_1.expect)(hasFirstOptimizationRun).to.eql(true);
                (0, contracts_test_utils_1.expect)(hasSecondOptimizationRun).to.eql(true);
            });
            it('getMarketSellOrdersAsync() will raise a NoOptimalPath error if no path was found during on-chain DEX optimization and RFQ optimization', async () => {
                const mockedMarketOpUtils = TypeMoq.Mock.ofType(market_operation_utils_1.MarketOperationUtils, TypeMoq.MockBehavior.Loose, false, MOCK_SAMPLER, contractAddresses);
                mockedMarketOpUtils.callBase = true;
                mockedMarketOpUtils
                    .setup((m) => m.generateOptimizedOrders(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
                    .returns((_msl, _opts) => {
                    throw new Error(types_2.AggregationError.NoOptimalPath);
                })
                    .verifiable(TypeMoq.Times.exactly(1));
                try {
                    await mockedMarketOpUtils.object.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, ORDERS.slice(2, ORDERS.length), ORDERS[0].order.takerAmount, asset_swapper_1.MarketOperation.Sell, DEFAULT_OPTS);
                    contracts_test_utils_1.expect.fail(`Call should have thrown "${types_2.AggregationError.NoOptimalPath}" but instead succeded`);
                }
                catch (e) {
                    if (e.message !== types_2.AggregationError.NoOptimalPath) {
                        contracts_test_utils_1.expect.fail(e);
                    }
                }
                mockedMarketOpUtils.verifyAll();
            });
            it('generates bridge orders with correct taker amount', async () => {
                const improvedOrdersResponse = await getMarketSellOrdersAsync(marketOperationUtils, 
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map((o) => ({ ...o, makerAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })), FILL_AMOUNT, DEFAULT_OPTS);
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const totalTakerAmount = utils_1.BigNumber.sum(...improvedOrders.map((o) => o.takerAmount));
                (0, contracts_test_utils_1.expect)(totalTakerAmount).to.bignumber.gte(FILL_AMOUNT);
            });
            it('generates bridge orders with correct taker amount when limit order is empty', async () => {
                const improvedOrdersResponse = await getMarketSellOrdersAsync(marketOperationUtils, [], FILL_AMOUNT, DEFAULT_OPTS);
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const totalTakerAmount = utils_1.BigNumber.sum(...improvedOrders.map((o) => o.takerAmount));
                (0, contracts_test_utils_1.expect)(totalTakerAmount).to.bignumber.gte(FILL_AMOUNT);
            });
            it('generates bridge orders with max slippage of `bridgeSlippage`', async () => {
                const bridgeSlippage = _.random(0.1, true);
                const improvedOrdersResponse = await getMarketSellOrdersAsync(marketOperationUtils, 
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map((o) => ({ ...o, makerAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })), FILL_AMOUNT, { ...DEFAULT_OPTS, bridgeSlippage });
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                (0, contracts_test_utils_1.expect)(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    const expectedMakerAmount = order.fill.output;
                    const slippage = new utils_1.BigNumber(1).minus(order.makerAmount.div(expectedMakerAmount.plus(1)));
                    (0, contracts_test_utils_1.assertRoughlyEquals)(slippage, bridgeSlippage, 1);
                }
            });
            it('can mix convex sources', async () => {
                const rates = { ...DEFAULT_RATES };
                rates[types_1.ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
                rates[types_1.ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
                rates[types_1.ERC20BridgeSource.SushiSwap] = [0.6, 0.05, 0.05, 0.05];
                rates[types_1.ERC20BridgeSource.Curve] = [0, 0, 0, 0]; // unused
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                });
                const improvedOrdersResponse = await getMarketSellOrdersAsync(marketOperationUtils, createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, { ...DEFAULT_OPTS, numSamples: 4 });
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const orderSources = improvedOrders.map((o) => o.source);
                const expectedSources = [
                    types_1.ERC20BridgeSource.SushiSwap,
                    types_1.ERC20BridgeSource.Uniswap,
                    types_1.ERC20BridgeSource.Native,
                    types_1.ERC20BridgeSource.Native,
                ];
                (0, contracts_test_utils_1.expect)(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });
            const ETH_TO_MAKER_RATE = 1.5;
            // TODO: disabled as this is not supported by neon-router
            it.skip('factors in fees for native orders', async () => {
                // Native orders will have the best rates but have fees,
                // dropping their effective rates.
                const nativeFeeRate = 0.06;
                const rates = {
                    [types_1.ERC20BridgeSource.Native]: [1, 0.99, 0.98, 0.97],
                    [types_1.ERC20BridgeSource.Uniswap]: [0.96, 0.1, 0.1, 0.1],
                    [types_1.ERC20BridgeSource.SushiSwap]: [0.95, 0.1, 0.1, 0.1],
                };
                const feeSchedule = {
                    ...NO_OP_FEE_SCHEDULE,
                    [types_1.ERC20BridgeSource.Native]: _.constant({
                        gas: 1,
                        fee: FILL_AMOUNT.div(4).times(nativeFeeRate).dividedToIntegerBy(ETH_TO_MAKER_RATE),
                    }),
                };
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                    getBestNativeTokenSellRate: createGetBestNativeSellRate(ETH_TO_MAKER_RATE),
                });
                const improvedOrdersResponse = await getMarketSellOrdersAsync(marketOperationUtils, createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, { ...DEFAULT_OPTS, numSamples: 4, feeSchedule });
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const orderSources = improvedOrders.map((o) => o.source);
                const expectedSources = [
                    types_1.ERC20BridgeSource.Native,
                    types_1.ERC20BridgeSource.Uniswap,
                    types_1.ERC20BridgeSource.SushiSwap,
                    types_1.ERC20BridgeSource.Native,
                ];
                (0, contracts_test_utils_1.expect)(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });
            it('factors in fees for dexes', async () => {
                const uniswapFeeRate = 0.2;
                const rates = {
                    [types_1.ERC20BridgeSource.Native]: [0.95, 0.1, 0.1, 0.1],
                    [types_1.ERC20BridgeSource.Curve]: [0.1, 0.1, 0.1, 0.1],
                    [types_1.ERC20BridgeSource.SushiSwap]: [0.92, 0.1, 0.1, 0.1],
                    // Effectively [0.8, ~0.5, ~0, ~0]
                    [types_1.ERC20BridgeSource.Uniswap]: [1, 0.7, 0.2, 0.2],
                };
                const feeSchedule = {
                    ...NO_OP_FEE_SCHEDULE,
                    [types_1.ERC20BridgeSource.Uniswap]: _.constant({
                        gas: 1,
                        fee: FILL_AMOUNT.div(4).times(uniswapFeeRate).dividedToIntegerBy(ETH_TO_MAKER_RATE),
                    }),
                };
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                    getBestNativeTokenSellRate: createGetBestNativeSellRate(ETH_TO_MAKER_RATE),
                });
                const improvedOrdersResponse = await getMarketSellOrdersAsync(marketOperationUtils, createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, { ...DEFAULT_OPTS, numSamples: 4, feeSchedule });
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const orderSources = improvedOrders.map((o) => o.source);
                const expectedSources = [
                    types_1.ERC20BridgeSource.Native,
                    types_1.ERC20BridgeSource.SushiSwap,
                    types_1.ERC20BridgeSource.Uniswap,
                ];
                (0, contracts_test_utils_1.expect)(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });
            it('can mix one concave source', async () => {
                const rates = {
                    [types_1.ERC20BridgeSource.Curve]: [0, 0, 0, 0],
                    [types_1.ERC20BridgeSource.SushiSwap]: [0.5, 0.85, 0.75, 0.75],
                    [types_1.ERC20BridgeSource.Uniswap]: [0.96, 0.2, 0.1, 0.1],
                    [types_1.ERC20BridgeSource.Native]: [0.95, 0.2, 0.2, 0.1],
                };
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                    getBestNativeTokenSellRate: createGetBestNativeSellRate(ETH_TO_MAKER_RATE),
                });
                const improvedOrdersResponse = await getMarketSellOrdersAsync(marketOperationUtils, createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, { ...DEFAULT_OPTS, numSamples: 4 });
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const orderSources = improvedOrders.map((o) => o.source);
                const expectedSources = [
                    types_1.ERC20BridgeSource.SushiSwap,
                    types_1.ERC20BridgeSource.Uniswap,
                    types_1.ERC20BridgeSource.Native,
                ];
                (0, contracts_test_utils_1.expect)(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });
            it('factors in exchange proxy gas overhead', async () => {
                // Uniswap has a slightly better rate than Curve (via LiquidityProvider),
                // but Curve is better accounting for the EP gas overhead.
                const rates = {
                    [types_1.ERC20BridgeSource.Native]: [0.01, 0.01, 0.01, 0.01],
                    [types_1.ERC20BridgeSource.Uniswap]: [1, 1, 1, 1],
                    [types_1.ERC20BridgeSource.Curve]: [0.9999, 0.9999, 0.9999, 0.9999],
                };
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                    getBestNativeTokenSellRate: createGetBestNativeSellRate(ETH_TO_MAKER_RATE),
                });
                const optimizer = new market_operation_utils_1.MarketOperationUtils(MOCK_SAMPLER, contractAddresses);
                const gasPrice = 100e9; // 100 gwei
                const exchangeProxyOverhead = (sourceFlags) => sourceFlags === constants_1.SOURCE_FLAGS.Curve ? contracts_test_utils_1.constants.ZERO_AMOUNT : new utils_1.BigNumber(1.3e5).times(gasPrice);
                const improvedOrdersResponse = await optimizer.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, asset_swapper_1.MarketOperation.Sell, {
                    ...DEFAULT_OPTS,
                    numSamples: 4,
                    includedSources: [types_1.ERC20BridgeSource.Native, types_1.ERC20BridgeSource.Uniswap, types_1.ERC20BridgeSource.Curve],
                    excludedSources: [],
                    exchangeProxyOverhead,
                });
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const orderSources = improvedOrders.map((o) => o.source);
                const expectedSources = [types_1.ERC20BridgeSource.Curve];
                (0, contracts_test_utils_1.expect)(orderSources).to.deep.eq(expectedSources);
            });
        });
        describe('getMarketBuyOrdersAsync()', () => {
            const FILL_AMOUNT = new utils_1.BigNumber('100e18');
            const ORDERS = createOrdersFromBuyRates(FILL_AMOUNT, _.times(NUM_SAMPLES, () => DEFAULT_RATES[types_1.ERC20BridgeSource.Native][0]));
            const GAS_PRICE = new utils_1.BigNumber(100e9); // 100 gwei
            const DEFAULT_OPTS = {
                numSamples: NUM_SAMPLES,
                sampleDistributionBase: 1,
                bridgeSlippage: 0,
                excludedSources: DEFAULT_EXCLUDED,
                gasPrice: GAS_PRICE,
            };
            beforeEach(() => {
                replaceSamplerOps();
            });
            it('queries `numSamples` samples', async () => {
                // neon-router requires at least 3 samples
                const numSamples = _.random(3, 16);
                let actualNumSamples = 0;
                replaceSamplerOps({
                    getBuyQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        actualNumSamples = amounts.length;
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts, wethAddress, TOKEN_ADJACENCY_GRAPH);
                    },
                });
                await getMarketBuyOrdersAsync(marketOperationUtils, ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    numSamples,
                    // Make sure to use same number of samples in neon-router for compatibility
                    neonRouterNumSamples: numSamples,
                });
                (0, contracts_test_utils_1.expect)(actualNumSamples).eq(numSamples);
            });
            it('polls all DEXes if `excludedSources` is empty', async () => {
                let sourcesPolled = [];
                replaceSamplerOps({
                    getBuyQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sourcesPolled.concat(sources.slice());
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts, wethAddress, TOKEN_ADJACENCY_GRAPH);
                    },
                    getTwoHopBuyQuotes: (sources, makerToken, takerToken, buyAmount) => {
                        if (sources.length !== 0) {
                            sourcesPolled.push(types_1.ERC20BridgeSource.MultiHop);
                            sourcesPolled.push(...sources);
                        }
                        return DEFAULT_OPS.getTwoHopBuyQuotes(sources, makerToken, takerToken, buyAmount);
                    },
                });
                await getMarketBuyOrdersAsync(marketOperationUtils, ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                (0, contracts_test_utils_1.expect)(_.uniq(sourcesPolled).sort()).to.deep.equals(BUY_SOURCES.sort());
            });
            it('does not poll DEXes in `excludedSources`', async () => {
                const excludedSources = [types_1.ERC20BridgeSource.Uniswap, types_1.ERC20BridgeSource.SushiSwap];
                let sourcesPolled = [];
                replaceSamplerOps({
                    getBuyQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sourcesPolled.concat(sources.slice());
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts, wethAddress, TOKEN_ADJACENCY_GRAPH);
                    },
                    getTwoHopBuyQuotes: (sources, makerToken, takerToken, buyAmount) => {
                        if (sources.length !== 0) {
                            sourcesPolled.push(types_1.ERC20BridgeSource.MultiHop);
                            sourcesPolled.push(...sources);
                        }
                        return DEFAULT_OPS.getTwoHopBuyQuotes(sources, makerToken, takerToken, buyAmount);
                    },
                });
                await getMarketBuyOrdersAsync(marketOperationUtils, ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources,
                });
                (0, contracts_test_utils_1.expect)(_.uniq(sourcesPolled).sort()).to.deep.eq(_.without(BUY_SOURCES, ...excludedSources).sort());
            });
            it('only polls DEXes in `includedSources`', async () => {
                const includedSources = [types_1.ERC20BridgeSource.Uniswap, types_1.ERC20BridgeSource.SushiSwap];
                let sourcesPolled = [];
                replaceSamplerOps({
                    getBuyQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sourcesPolled.concat(sources.slice());
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts, wethAddress, TOKEN_ADJACENCY_GRAPH);
                    },
                    getTwoHopBuyQuotes: (sources, makerToken, takerToken, buyAmount) => {
                        if (sources.length !== 0) {
                            sourcesPolled.push(types_1.ERC20BridgeSource.MultiHop);
                            sourcesPolled.push(...sources);
                        }
                        return DEFAULT_OPS.getTwoHopBuyQuotes(sources, makerToken, takerToken, buyAmount);
                    },
                });
                await getMarketBuyOrdersAsync(marketOperationUtils, ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                    includedSources,
                });
                (0, contracts_test_utils_1.expect)(_.uniq(sourcesPolled).sort()).to.deep.eq(includedSources.sort());
            });
            // it('generates bridge orders with correct asset data', async () => {
            //     const improvedOrdersResponse = await getMarketBuyOrdersAsync(
            //         marketOperationUtils,
            //         // Pass in empty orders to prevent native orders from being used.
            //         ORDERS.map(o => ({ ...o, makerAmount: constants.ZERO_AMOUNT })),
            //         FILL_AMOUNT,
            //         DEFAULT_OPTS,
            //     );
            //     const improvedOrders = improvedOrdersResponse.path.createOrders();
            //     expect(improvedOrders).to.not.be.length(0);
            //     for (const order of improvedOrders) {
            //         expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
            //         const makerAssetDataPrefix = hexUtils.slice(
            //             assetDataUtils.encodeERC20BridgeAssetData(
            //                 MAKER_TOKEN,
            //                 constants.NULL_ADDRESS,
            //                 constants.NULL_BYTES,
            //             ),
            //             0,
            //             36,
            //         );
            //         assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
            //         expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
            //     }
            // });
            it('generates bridge orders with correct maker amount', async () => {
                const improvedOrdersResponse = await getMarketBuyOrdersAsync(marketOperationUtils, 
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map((o) => ({ ...o, makerAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })), FILL_AMOUNT, DEFAULT_OPTS);
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const totalMakerAmount = utils_1.BigNumber.sum(...improvedOrders.map((o) => o.makerAmount));
                (0, contracts_test_utils_1.expect)(totalMakerAmount).to.bignumber.gte(FILL_AMOUNT);
            });
            it('generates bridge orders with max slippage of `bridgeSlippage`', async () => {
                const bridgeSlippage = _.random(0.1, true);
                const improvedOrdersResponse = await getMarketBuyOrdersAsync(marketOperationUtils, 
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map((o) => ({ ...o, makerAmount: contracts_test_utils_1.constants.ZERO_AMOUNT })), FILL_AMOUNT, { ...DEFAULT_OPTS, bridgeSlippage });
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                (0, contracts_test_utils_1.expect)(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    const expectedTakerAmount = order.fill.output;
                    const slippage = order.takerAmount.div(expectedTakerAmount.plus(1)).minus(1);
                    (0, contracts_test_utils_1.assertRoughlyEquals)(slippage, bridgeSlippage, 1);
                }
            });
            const ETH_TO_TAKER_RATE = 1.5;
            it('factors in fees for dexes', async () => {
                // Uniswap will have the best rates but will have fees,
                // dropping its effective rates.
                const uniswapFeeRate = 0.2;
                const rates = {
                    ...ZERO_RATES,
                    [types_1.ERC20BridgeSource.Native]: [0.95, 0.1, 0.1, 0.1],
                    // Effectively [0.8, ~0.5, ~0, ~0]
                    [types_1.ERC20BridgeSource.Uniswap]: [1, 0.7, 0.2, 0.2],
                    [types_1.ERC20BridgeSource.SushiSwap]: [0.92, 0.1, 0.1, 0.1],
                };
                const feeSchedule = {
                    ...NO_OP_FEE_SCHEDULE,
                    [types_1.ERC20BridgeSource.Uniswap]: _.constant({
                        gas: 1,
                        fee: FILL_AMOUNT.div(4).times(uniswapFeeRate).dividedToIntegerBy(ETH_TO_TAKER_RATE),
                    }),
                };
                replaceSamplerOps({
                    getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                    getBestNativeTokenSellRate: createGetBestNativeSellRate(ETH_TO_TAKER_RATE),
                });
                const improvedOrdersResponse = await getMarketBuyOrdersAsync(marketOperationUtils, createOrdersFromBuyRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, { ...DEFAULT_OPTS, numSamples: 4, feeSchedule });
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const orderSources = improvedOrders.map((o) => o.source);
                const expectedSources = [
                    types_1.ERC20BridgeSource.Native,
                    types_1.ERC20BridgeSource.SushiSwap,
                    types_1.ERC20BridgeSource.Uniswap,
                ];
                (0, contracts_test_utils_1.expect)(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });
            it('factors in exchange proxy gas overhead', async () => {
                // Uniswap has a slightly better rate than Curve (via LiquidityProvider),
                // but Curve is better accounting for the EP gas overhead.
                const rates = {
                    [types_1.ERC20BridgeSource.Native]: [0.01, 0.01, 0.01, 0.01],
                    [types_1.ERC20BridgeSource.Uniswap]: [1, 1, 1, 1],
                    [types_1.ERC20BridgeSource.Curve]: [0.9999, 0.9999, 0.9999, 0.9999],
                };
                replaceSamplerOps({
                    getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                    getBestNativeTokenSellRate: createGetBestNativeSellRate(ETH_TO_TAKER_RATE),
                });
                const optimizer = new market_operation_utils_1.MarketOperationUtils(MOCK_SAMPLER, contractAddresses);
                const exchangeProxyOverhead = (sourceFlags) => sourceFlags === constants_1.SOURCE_FLAGS.Curve ? contracts_test_utils_1.constants.ZERO_AMOUNT : new utils_1.BigNumber(1.3e5).times(GAS_PRICE);
                const improvedOrdersResponse = await optimizer.getOptimizerResultAsync(MAKER_TOKEN, TAKER_TOKEN, createOrdersFromSellRates(FILL_AMOUNT, rates[types_1.ERC20BridgeSource.Native]), FILL_AMOUNT, asset_swapper_1.MarketOperation.Buy, {
                    ...DEFAULT_OPTS,
                    numSamples: 4,
                    includedSources: [types_1.ERC20BridgeSource.Native, types_1.ERC20BridgeSource.Uniswap, types_1.ERC20BridgeSource.Curve],
                    excludedSources: [],
                    exchangeProxyOverhead,
                });
                const improvedOrders = improvedOrdersResponse.path.getOrders();
                const orderSources = improvedOrders.map((o) => o.source);
                const expectedSources = [types_1.ERC20BridgeSource.Curve];
                (0, contracts_test_utils_1.expect)(orderSources).to.deep.eq(expectedSources);
            });
        });
    });
});
//# sourceMappingURL=market_operation_utils_test.js.map