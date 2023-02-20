"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketOperationUtils = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const prom_client_1 = require("prom-client");
const sampler_metrics_1 = require("../../../utils/sampler_metrics");
const constants_1 = require("../../constants");
const types_1 = require("../../types");
const alt_mm_implementation_utils_1 = require("../alt_mm_implementation_utils");
const rfq_client_mappers_1 = require("../rfq_client_mappers");
const utils_2 = require("../utils");
const quote_report_generator_1 = require("./../quote_report_generator");
const comparison_price_1 = require("./comparison_price");
const constants_2 = require("./constants");
const identity_fill_adjustor_1 = require("./identity_fill_adjustor");
const path_optimizer_1 = require("./path_optimizer");
const sampler_1 = require("./sampler");
const source_filters_1 = require("./source_filters");
const types_2 = require("./types");
const NO_CONVERSION_TO_NATIVE_FOUND = new prom_client_1.Counter({
    name: 'no_conversion_to_native_found',
    help: 'unable to get conversion to native token',
    labelNames: ['source', 'endpoint'],
});
class MarketOperationUtils {
    constructor(sampler, contractAddresses) {
        this.sampler = sampler;
        this.contractAddresses = contractAddresses;
        this._buySources = constants_2.BUY_SOURCE_FILTER_BY_CHAIN_ID[sampler.chainId];
        this._sellSources = constants_2.SELL_SOURCE_FILTER_BY_CHAIN_ID[sampler.chainId];
        this._feeSources = constants_2.FEE_QUOTE_SOURCES_BY_CHAIN_ID[sampler.chainId];
        this._nativeFeeToken = constants_2.NATIVE_FEE_TOKEN_BY_CHAIN_ID[sampler.chainId];
        this._nativeFeeTokenAmount = constants_2.NATIVE_FEE_TOKEN_AMOUNT_BY_CHAIN_ID[sampler.chainId];
    }
    static _computeQuoteReport(quoteRequestor, marketSideLiquidity, optimizerResult, comparisonPrice) {
        const { side, quotes } = marketSideLiquidity;
        return (0, quote_report_generator_1.generateQuoteReport)(side, quotes.nativeOrders, optimizerResult.path.fills, comparisonPrice, quoteRequestor);
    }
    static _computeExtendedQuoteReportSources(quoteRequestor, marketSideLiquidity, amount, optimizerResult, comparisonPrice) {
        const { side, quotes } = marketSideLiquidity;
        return (0, quote_report_generator_1.generateExtendedQuoteReportSources)(side, quotes, optimizerResult.path.fills, amount, comparisonPrice, quoteRequestor);
    }
    async getMarketLiquidity(side, makerToken, takerToken, limitOrders, amount, opts) {
        if (side === types_1.MarketOperation.Sell) {
            return this.getMarketSellLiquidity(makerToken, takerToken, limitOrders, amount, opts);
        }
        return this.getMarketBuyLiquidity(makerToken, takerToken, limitOrders, amount, opts);
    }
    /**
     * Gets the liquidity available for a market sell operation
     * @param makerToken Maker token address
     * @param takerToken Taker token address
     * @param limitOrders Native limit orders.
     * @param takerAmount Amount of taker asset to sell.
     * @param opts Options object.
     * @return MarketSideLiquidity.
     */
    async getMarketSellLiquidity(makerToken, takerToken, limitOrders, takerAmount, opts) {
        const _opts = { ...constants_2.DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const sampleAmounts = (0, sampler_1.getSampleAmounts)(takerAmount, _opts.numSamples, _opts.sampleDistributionBase);
        const requestFilters = new source_filters_1.SourceFilters().exclude(_opts.excludedSources).include(_opts.includedSources);
        const quoteSourceFilters = this._sellSources.merge(requestFilters);
        // Used to determine whether the tx origin is an EOA or a contract
        const txOrigin = (_opts.rfqt && _opts.rfqt.txOrigin) || utils_1.NULL_ADDRESS;
        // Call the sampler contract.
        const samplerPromise = this.sampler.executeAsync(this.sampler.getBlockNumber(), this.sampler.getGasLeft(), this.sampler.getTokenDecimals([makerToken, takerToken]), 
        // Get native order fillable amounts.
        this.sampler.getLimitOrderFillableTakerAmounts(limitOrders, this.contractAddresses.exchangeProxy), 
        // Get ETH -> maker token price.
        this.sampler.getBestNativeTokenSellRate(this._feeSources, makerToken, this._nativeFeeToken, this._nativeFeeTokenAmount, _opts.feeSchedule), 
        // Get ETH -> taker token price.
        this.sampler.getBestNativeTokenSellRate(this._feeSources, takerToken, this._nativeFeeToken, this._nativeFeeTokenAmount, _opts.feeSchedule), 
        // Get sell quotes for taker -> maker.
        this.sampler.getSellQuotes(quoteSourceFilters.sources, makerToken, takerToken, sampleAmounts), this.sampler.getTwoHopSellQuotes(quoteSourceFilters.isAllowed(types_1.ERC20BridgeSource.MultiHop) ? quoteSourceFilters.sources : [], makerToken, takerToken, [takerAmount]), this.sampler.isAddressContract(txOrigin), this.sampler.getGasLeft());
        // Refresh the cached pools asynchronously if required
        this._refreshPoolCacheIfRequiredAsync(takerToken, makerToken);
        const [blockNumber, gasLimit, tokenDecimals, orderFillableTakerAmounts, 
        // TODO: rename inputAmountPerEth, outputAmountPerEth (the unit is wei and also it's per native token)
        outputAmountPerEth, inputAmountPerEth, dexQuotes, rawTwoHopQuotes, isTxOriginContract, gasLeft,] = await samplerPromise;
        const defaultLabels = ['getMarketSellLiquidityAsync', (opts === null || opts === void 0 ? void 0 : opts.endpoint) || 'N/A'];
        if (outputAmountPerEth.isZero()) {
            (0, constants_1.DEFAULT_INFO_LOGGER)({ token: makerToken, endpoint: opts === null || opts === void 0 ? void 0 : opts.endpoint, inOut: 'output' }, 'conversion to native token is zero');
            NO_CONVERSION_TO_NATIVE_FOUND.labels(...defaultLabels).inc();
        }
        if (inputAmountPerEth.isZero()) {
            (0, constants_1.DEFAULT_INFO_LOGGER)({ token: takerToken, endpoint: opts === null || opts === void 0 ? void 0 : opts.endpoint, inOut: 'input' }, 'conversion to native token is zero');
            NO_CONVERSION_TO_NATIVE_FOUND.labels(...defaultLabels).inc();
        }
        const gasUsed = MarketOperationUtils.computeGasUsed({ gasLimit, gasLeft });
        MarketOperationUtils.exportSamplerMetric({ side: 'sell', gasLimit, gasUsed, blockNumber });
        const [makerTokenDecimals, takerTokenDecimals] = tokenDecimals;
        const isMicroSwap = this.isMicroSwap(takerAmount, inputAmountPerEth);
        const isRfqSupported = !!(_opts.rfqt && !isTxOriginContract);
        const limitOrdersWithFillableAmounts = limitOrders.map((order, i) => ({
            ...order,
            ...(0, utils_2.getNativeAdjustedFillableAmountsFromTakerAmount)(order, orderFillableTakerAmounts[i]),
        }));
        return {
            side: types_1.MarketOperation.Sell,
            inputAmount: takerAmount,
            inputToken: takerToken,
            outputToken: makerToken,
            outputAmountPerEth,
            inputAmountPerEth,
            quoteSourceFilters,
            makerTokenDecimals: makerTokenDecimals.toNumber(),
            takerTokenDecimals: takerTokenDecimals.toNumber(),
            quotes: {
                nativeOrders: limitOrdersWithFillableAmounts,
                rfqtIndicativeQuotes: [],
                twoHopQuotes: MarketOperationUtils.filterTwoHopQuotes(rawTwoHopQuotes, isMicroSwap),
                dexQuotes: this.filterOutDexQuotes(dexQuotes, isMicroSwap),
            },
            isRfqSupported,
            blockNumber: blockNumber.toNumber(),
            samplerGasUsage: gasUsed.toNumber(),
        };
    }
    /**
     * Gets the liquidity available for a market buy operation
     * @param makerToken Maker token address
     * @param takerToken Taker token address
     * @param limitOrders Native limit orders
     * @param makerAmount Amount of maker asset to buy.
     * @param opts Options object.
     * @return MarketSideLiquidity.
     */
    async getMarketBuyLiquidity(makerToken, takerToken, limitOrders, makerAmount, opts) {
        const _opts = { ...constants_2.DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const sampleAmounts = (0, sampler_1.getSampleAmounts)(makerAmount, _opts.numSamples, _opts.sampleDistributionBase);
        const requestFilters = new source_filters_1.SourceFilters().exclude(_opts.excludedSources).include(_opts.includedSources);
        const quoteSourceFilters = this._buySources.merge(requestFilters);
        // Used to determine whether the tx origin is an EOA or a contract
        const txOrigin = (_opts.rfqt && _opts.rfqt.txOrigin) || utils_1.NULL_ADDRESS;
        // Call the sampler contract.
        const samplerPromise = this.sampler.executeAsync(this.sampler.getBlockNumber(), this.sampler.getGasLeft(), this.sampler.getTokenDecimals([makerToken, takerToken]), 
        // Get native order fillable amounts.
        this.sampler.getLimitOrderFillableMakerAmounts(limitOrders, this.contractAddresses.exchangeProxy), 
        // Get ETH -> makerToken token price.
        this.sampler.getBestNativeTokenSellRate(this._feeSources, makerToken, this._nativeFeeToken, this._nativeFeeTokenAmount, _opts.feeSchedule), 
        // Get ETH -> taker token price.
        this.sampler.getBestNativeTokenSellRate(this._feeSources, takerToken, this._nativeFeeToken, this._nativeFeeTokenAmount, _opts.feeSchedule), 
        // Get buy quotes for taker -> maker.
        this.sampler.getBuyQuotes(quoteSourceFilters.sources, makerToken, takerToken, sampleAmounts), this.sampler.getTwoHopBuyQuotes(quoteSourceFilters.isAllowed(types_1.ERC20BridgeSource.MultiHop) ? quoteSourceFilters.sources : [], makerToken, takerToken, [makerAmount]), this.sampler.isAddressContract(txOrigin), this.sampler.getGasLeft());
        // Refresh the cached pools asynchronously if required
        this._refreshPoolCacheIfRequiredAsync(takerToken, makerToken);
        const [blockNumber, gasLimit, tokenDecimals, orderFillableMakerAmounts, ethToMakerAssetRate, ethToTakerAssetRate, dexQuotes, rawTwoHopQuotes, isTxOriginContract, gasLeft,] = await samplerPromise;
        const defaultLabels = ['getMarketBuyLiquidityAsync', (opts === null || opts === void 0 ? void 0 : opts.endpoint) || 'N/A'];
        if (ethToMakerAssetRate.isZero()) {
            (0, constants_1.DEFAULT_INFO_LOGGER)({ token: makerToken, endpoint: opts === null || opts === void 0 ? void 0 : opts.endpoint, inOut: 'output' }, 'conversion to native token is zero');
            NO_CONVERSION_TO_NATIVE_FOUND.labels(...defaultLabels).inc();
        }
        if (ethToTakerAssetRate.isZero()) {
            (0, constants_1.DEFAULT_INFO_LOGGER)({ token: takerToken, endpoint: opts === null || opts === void 0 ? void 0 : opts.endpoint, inOut: 'input' }, 'conversion to native token is zero');
            NO_CONVERSION_TO_NATIVE_FOUND.labels(...defaultLabels).inc();
        }
        const gasUsed = MarketOperationUtils.computeGasUsed({ gasLimit, gasLeft });
        MarketOperationUtils.exportSamplerMetric({ side: 'buy', gasLimit, gasUsed, blockNumber });
        const [makerTokenDecimals, takerTokenDecimals] = tokenDecimals;
        const isMicroSwap = this.isMicroSwap(makerAmount, ethToMakerAssetRate);
        const isRfqSupported = !isTxOriginContract;
        const limitOrdersWithFillableAmounts = limitOrders.map((order, i) => ({
            ...order,
            ...(0, utils_2.getNativeAdjustedFillableAmountsFromMakerAmount)(order, orderFillableMakerAmounts[i]),
        }));
        return {
            side: types_1.MarketOperation.Buy,
            inputAmount: makerAmount,
            inputToken: makerToken,
            outputToken: takerToken,
            outputAmountPerEth: ethToTakerAssetRate,
            inputAmountPerEth: ethToMakerAssetRate,
            quoteSourceFilters,
            makerTokenDecimals: makerTokenDecimals.toNumber(),
            takerTokenDecimals: takerTokenDecimals.toNumber(),
            quotes: {
                nativeOrders: limitOrdersWithFillableAmounts,
                rfqtIndicativeQuotes: [],
                twoHopQuotes: MarketOperationUtils.filterTwoHopQuotes(rawTwoHopQuotes, isMicroSwap),
                dexQuotes: this.filterOutDexQuotes(dexQuotes, isMicroSwap),
            },
            isRfqSupported,
            blockNumber: blockNumber.toNumber(),
            samplerGasUsage: gasUsed.toNumber(),
        };
    }
    generateOptimizedOrders(marketSideLiquidity, opts) {
        const { inputToken, outputToken, side, inputAmount, quotes, outputAmountPerEth, inputAmountPerEth } = marketSideLiquidity;
        const { nativeOrders, rfqtIndicativeQuotes, dexQuotes, twoHopQuotes } = quotes;
        const augmentedRfqtIndicativeQuotes = rfqtIndicativeQuotes.map((q) => ({
            order: { ...new protocol_utils_1.RfqOrder({ ...q }) },
            signature: constants_1.INVALID_SIGNATURE,
            fillableMakerAmount: new utils_1.BigNumber(q.makerAmount),
            fillableTakerAmount: new utils_1.BigNumber(q.takerAmount),
            fillableTakerFeeAmount: constants_2.ZERO_AMOUNT,
            type: protocol_utils_1.FillQuoteTransformerOrderType.Rfq,
        }));
        // NOTE: For sell quotes input is the taker asset and for buy quotes input is the maker asset
        const takerAmountPerEth = side === types_1.MarketOperation.Sell ? inputAmountPerEth : outputAmountPerEth;
        const makerAmountPerEth = side === types_1.MarketOperation.Sell ? outputAmountPerEth : inputAmountPerEth;
        // Find the optimal path using Rust router.
        const pathOptimizer = new path_optimizer_1.PathOptimizer({
            pathContext: {
                side,
                inputToken,
                outputToken,
            },
            feeSchedule: opts.feeSchedule,
            chainId: this.sampler.chainId,
            neonRouterNumSamples: opts.neonRouterNumSamples,
            fillAdjustor: opts.fillAdjustor,
            pathPenaltyOpts: {
                outputAmountPerEth,
                inputAmountPerEth,
                exchangeProxyOverhead: opts.exchangeProxyOverhead,
            },
            inputAmount,
        });
        const optimalPath = pathOptimizer.findOptimalPathFromSamples(dexQuotes, twoHopQuotes, [
            ...nativeOrders,
            ...augmentedRfqtIndicativeQuotes,
        ]);
        // If there is no optimal path then throw.
        if (optimalPath === undefined) {
            //temporary logging for INSUFFICIENT_ASSET_LIQUIDITY
            (0, constants_1.DEFAULT_INFO_LOGGER)({}, 'NoOptimalPath thrown in _generateOptimizedOrdersAsync');
            throw new Error(types_2.AggregationError.NoOptimalPath);
        }
        return {
            path: optimalPath,
            marketSideLiquidity,
            takerAmountPerEth,
            makerAmountPerEth,
        };
    }
    async getOptimizerResultAsync(makerToken, takerToken, limitOrders, amount, side, opts) {
        const _opts = { ...constants_2.DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const optimizerOpts = {
            feeSchedule: _opts.feeSchedule,
            exchangeProxyOverhead: _opts.exchangeProxyOverhead,
            gasPrice: _opts.gasPrice,
            neonRouterNumSamples: _opts.neonRouterNumSamples,
            fillAdjustor: _opts.fillAdjustor,
        };
        const marketSideLiquidity = await this.getMarketLiquidity(side, makerToken, takerToken, limitOrders, amount, _opts);
        // Phase 1 Routing
        // We find an optimized path for ALL the DEX and open-orderbook liquidity (no RFQ liquidity)
        const phaseOneResult = this.getPhaseOneRoutingResult({
            marketSideLiquidity,
            amount,
            optimizerOpts: { ...optimizerOpts, fillAdjustor: new identity_fill_adjustor_1.IdentityFillAdjustor() },
            nativeOrderFeeEstimate: _opts.feeSchedule.Native,
            exchangeProxyOverhead: _opts.exchangeProxyOverhead,
        });
        let { optimizerResult } = phaseOneResult;
        // If RFQ liquidity is enabled, make a request to check RFQ liquidity against the first optimizer result
        // Phase 2 Routing
        // Mix in any off-chain RFQ quotes
        // Apply any fill adjustments i
        const phaseTwoOptimizerOpts = {
            ...optimizerOpts,
            // Pass in the FillAdjustor for Phase 2 adjustment, in the future we may perform this adjustment
            // in Phase 1.
            fillAdjustor: _opts.fillAdjustor,
        };
        const { rfqt } = _opts;
        if (marketSideLiquidity.isRfqSupported &&
            rfqt &&
            rfqt.quoteRequestor && // only needed for quote report
            marketSideLiquidity.quoteSourceFilters.isAllowed(types_1.ERC20BridgeSource.Native)) {
            // Timing of RFQT lifecycle
            const timeStart = new Date().getTime();
            // Filter Alt Rfq Maker Asset Offerings to the current pair
            const filteredOfferings = {};
            if (rfqt.altRfqAssetOfferings) {
                const endpoints = Object.keys(rfqt.altRfqAssetOfferings);
                for (const endpoint of endpoints) {
                    // Get the current pair if being offered
                    const offering = (0, alt_mm_implementation_utils_1.getAltMarketInfo)(rfqt.altRfqAssetOfferings[endpoint], makerToken, takerToken);
                    if (offering) {
                        filteredOfferings[endpoint] = [offering];
                    }
                }
            }
            if (rfqt.isIndicative) {
                // An indicative quote is being requested, and indicative quotes price-aware enabled
                // Make the RFQT request and then re-run the sampler if new orders come back.
                const [v1Prices, v2Prices] = rfqt.rfqClient === undefined
                    ? [[], []]
                    : await Promise.all([
                        rfqt.rfqClient
                            .getV1PricesAsync({
                            altRfqAssetOfferings: filteredOfferings,
                            assetFillAmount: amount,
                            chainId: this.sampler.chainId,
                            comparisonPrice: phaseOneResult.wholeOrderPrice,
                            integratorId: rfqt.integrator.integratorId,
                            intentOnFilling: rfqt.intentOnFilling,
                            makerToken,
                            marketOperation: side,
                            takerAddress: rfqt.takerAddress,
                            takerToken,
                            txOrigin: rfqt.txOrigin,
                        })
                            .then((res) => res.prices),
                        rfqt.rfqClient.getV2PricesAsync({
                            assetFillAmount: amount,
                            chainId: this.sampler.chainId,
                            integratorId: rfqt.integrator.integratorId,
                            intentOnFilling: rfqt.intentOnFilling,
                            makerToken,
                            marketOperation: side,
                            takerAddress: rfqt.takerAddress,
                            takerToken,
                            txOrigin: rfqt.txOrigin,
                        }),
                    ]);
                (0, constants_1.DEFAULT_INFO_LOGGER)({ v2Prices, isEmpty: (v2Prices === null || v2Prices === void 0 ? void 0 : v2Prices.length) === 0 }, 'v2Prices from RFQ Client');
                const indicativeQuotes = [
                    ...v1Prices,
                    ...v2Prices,
                ];
                const deltaTime = new Date().getTime() - timeStart;
                (0, constants_1.DEFAULT_INFO_LOGGER)({
                    rfqQuoteType: 'indicative',
                    deltaTime,
                });
                // Re-run optimizer with the new indicative quote
                if (indicativeQuotes.length > 0) {
                    // Attach the indicative quotes to the market side liquidity
                    marketSideLiquidity.quotes.rfqtIndicativeQuotes = indicativeQuotes;
                    // Phase 2 Routing
                    const phase1OptimalSources = optimizerResult
                        ? optimizerResult.path.getOrders().map((o) => o.source)
                        : [];
                    const phase2MarketSideLiquidity = {
                        ...marketSideLiquidity,
                        quotes: {
                            ...marketSideLiquidity.quotes,
                            // Select only the quotes that were chosen in Phase 1
                            dexQuotes: marketSideLiquidity.quotes.dexQuotes.filter((q) => q.length > 0 && phase1OptimalSources.includes(q[0].source)),
                        },
                    };
                    optimizerResult = await this.generateOptimizedOrders(phase2MarketSideLiquidity, phaseTwoOptimizerOpts);
                }
            }
            else {
                // A firm quote is being requested, and firm quotes price-aware enabled.
                // Ensure that `intentOnFilling` is enabled and make the request.
                const [v1Quotes, v2Quotes] = rfqt.rfqClient === undefined
                    ? [[], []]
                    : await Promise.all([
                        rfqt.rfqClient
                            .getV1QuotesAsync({
                            altRfqAssetOfferings: filteredOfferings,
                            assetFillAmount: amount,
                            chainId: this.sampler.chainId,
                            comparisonPrice: phaseOneResult.wholeOrderPrice,
                            integratorId: rfqt.integrator.integratorId,
                            intentOnFilling: rfqt.intentOnFilling,
                            makerToken,
                            marketOperation: side,
                            takerAddress: rfqt.takerAddress,
                            takerToken,
                            txOrigin: rfqt.txOrigin,
                        })
                            .then((res) => res.quotes),
                        rfqt.rfqClient.getV2QuotesAsync({
                            assetFillAmount: amount,
                            chainId: this.sampler.chainId,
                            integratorId: rfqt.integrator.integratorId,
                            intentOnFilling: rfqt.intentOnFilling,
                            makerToken,
                            marketOperation: side,
                            takerAddress: rfqt.takerAddress,
                            takerToken,
                            txOrigin: rfqt.txOrigin,
                        }),
                    ]);
                (0, constants_1.DEFAULT_INFO_LOGGER)({ v2Quotes, isEmpty: (v2Quotes === null || v2Quotes === void 0 ? void 0 : v2Quotes.length) === 0 }, 'v2Quotes from RFQ Client');
                const v1FirmQuotes = v1Quotes.map((quote) => {
                    var _a;
                    // HACK: set the signature on quoteRequestor for future lookup (i.e. in Quote Report)
                    (_a = rfqt.quoteRequestor) === null || _a === void 0 ? void 0 : _a.setMakerUriForSignature(quote.signature, quote.makerUri);
                    return (0, rfq_client_mappers_1.toSignedNativeOrder)(quote);
                });
                const v2QuotesWithOrderFillableAmounts = v2Quotes.map((quote) => {
                    var _a;
                    // HACK: set the signature on quoteRequestor for future lookup (i.e. in Quote Report)
                    (_a = rfqt.quoteRequestor) === null || _a === void 0 ? void 0 : _a.setMakerUriForSignature(quote.signature, quote.makerUri);
                    return (0, rfq_client_mappers_1.toSignedNativeOrderWithFillableAmounts)(quote);
                });
                const deltaTime = new Date().getTime() - timeStart;
                (0, constants_1.DEFAULT_INFO_LOGGER)({
                    rfqQuoteType: 'firm',
                    deltaTime,
                });
                if (v1FirmQuotes.length > 0 || v2QuotesWithOrderFillableAmounts.length > 0) {
                    // Compute the RFQ order fillable amounts. This is done by performing a "soft" order
                    // validation and by checking order balances that are monitored by our worker.
                    // If a firm quote validator does not exist, then we assume that all orders are valid.
                    const v1RfqTakerFillableAmounts = rfqt.firmQuoteValidator === undefined
                        ? v1FirmQuotes.map((signedOrder) => signedOrder.order.takerAmount)
                        : await rfqt.firmQuoteValidator.getRfqtTakerFillableAmountsAsync(v1FirmQuotes.map((q) => new protocol_utils_1.RfqOrder(q.order)));
                    const v1QuotesWithOrderFillableAmounts = v1FirmQuotes.map((order, i) => ({
                        ...order,
                        fillableTakerAmount: v1RfqTakerFillableAmounts[i],
                        // Adjust the maker amount by the available taker fill amount
                        fillableMakerAmount: (0, utils_2.getNativeAdjustedMakerFillAmount)(order.order, v1RfqTakerFillableAmounts[i]),
                        fillableTakerFeeAmount: constants_2.ZERO_AMOUNT,
                    }));
                    const quotesWithOrderFillableAmounts = [
                        ...v1QuotesWithOrderFillableAmounts,
                        ...v2QuotesWithOrderFillableAmounts,
                    ];
                    // Attach the firm RFQt quotes to the market side liquidity
                    marketSideLiquidity.quotes.nativeOrders = [
                        ...quotesWithOrderFillableAmounts,
                        ...marketSideLiquidity.quotes.nativeOrders,
                    ];
                    // Re-run optimizer with the new firm quote. This is the second and last time
                    // we run the optimized in a block of code. In this case, we don't catch a potential `NoOptimalPath` exception
                    // and we let it bubble up if it happens.
                    // Phase 2 Routing
                    // Optimization: Filter by what is already currently in the Phase1 output as it doesn't
                    // seem possible that inclusion of RFQT could impact the sources chosen from Phase 1.
                    const phase1OptimalSources = (optimizerResult === null || optimizerResult === void 0 ? void 0 : optimizerResult.path.getOrders().map((o) => o.source)) || [];
                    const phase2MarketSideLiquidity = {
                        ...marketSideLiquidity,
                        quotes: {
                            ...marketSideLiquidity.quotes,
                            // Select only the quotes that were chosen in Phase 1
                            dexQuotes: marketSideLiquidity.quotes.dexQuotes.filter((q) => q.length > 0 && phase1OptimalSources.includes(q[0].source)),
                        },
                    };
                    optimizerResult = this.generateOptimizedOrders(phase2MarketSideLiquidity, phaseTwoOptimizerOpts);
                }
            }
        }
        // At this point we should have at least one valid optimizer result, therefore we manually raise
        // `NoOptimalPath` if no optimizer result was ever set.
        if (optimizerResult === undefined) {
            //temporary logging for INSUFFICIENT_ASSET_LIQUIDITY
            (0, constants_1.DEFAULT_INFO_LOGGER)({}, 'NoOptimalPath thrown in phase 2 routing');
            throw new Error(types_2.AggregationError.NoOptimalPath);
        }
        // Compute Quote Report and return the results.
        let quoteReport;
        if (_opts.shouldGenerateQuoteReport) {
            quoteReport = MarketOperationUtils._computeQuoteReport(_opts.rfqt ? _opts.rfqt.quoteRequestor : undefined, marketSideLiquidity, optimizerResult, phaseOneResult.wholeOrderPrice);
        }
        // Always compute the Extended Quote Report
        const extendedQuoteReportSources = MarketOperationUtils._computeExtendedQuoteReportSources(_opts.rfqt ? _opts.rfqt.quoteRequestor : undefined, marketSideLiquidity, amount, optimizerResult, phaseOneResult.wholeOrderPrice);
        return { ...optimizerResult, quoteReport, extendedQuoteReportSources };
    }
    getPhaseOneRoutingResult({ marketSideLiquidity, amount, optimizerOpts, nativeOrderFeeEstimate, exchangeProxyOverhead, }) {
        let optimizerResult;
        try {
            optimizerResult = this.generateOptimizedOrders(marketSideLiquidity, optimizerOpts);
        }
        catch (e) {
            // If no on-chain or off-chain Open Orderbook orders are present, a `NoOptimalPath` will be thrown.
            // If this happens at this stage, there is still a chance that an RFQ order is fillable, therefore
            // we catch the error and continue.
            if (e.message !== types_2.AggregationError.NoOptimalPath) {
                throw e;
            }
            //temporary logging for INSUFFICIENT_ASSET_LIQUIDITY
            (0, constants_1.DEFAULT_INFO_LOGGER)({}, 'NoOptimalPath caught in phase 1 routing');
        }
        let wholeOrderPrice;
        if (optimizerResult) {
            wholeOrderPrice = (0, comparison_price_1.getComparisonPrices)(optimizerResult.path.adjustedRate(), amount, marketSideLiquidity, nativeOrderFeeEstimate, exchangeProxyOverhead).wholeOrder;
        }
        return { optimizerResult, wholeOrderPrice };
    }
    /**
     * Returns whether a swap is considered extremely small (for simpler routing to avoid over optimization which causes high revert rate)
     *
     * @param inputAmount : taker amount for sell, maker amount for buy
     * @param inputAmountPerNativeWei : taker amount per native token in (wei) for sell, maker amount per native token in (wei) for buy
     */
    isMicroSwap(inputAmount, inputAmountPerNativeWei) {
        // Only enable it on Optimism as it's experimental.
        if (this.sampler.chainId !== contract_addresses_1.ChainId.Optimism) {
            return false;
        }
        const inputTokenValueInNativeWei = inputAmount.div(inputAmountPerNativeWei);
        // If the value of input token amount is less than 1/100 of `this._nativeFeeTokenAmount`
        // then it is considered as a micro swap.
        // NOTE: gt is used because `inputTokenValueInNativeWei` can be 0 when it's not available.
        return this._nativeFeeTokenAmount.times(0.01).gt(inputTokenValueInNativeWei);
    }
    async _refreshPoolCacheIfRequiredAsync(takerToken, makerToken) {
        _.values(this.sampler.poolsCaches)
            .filter((cache) => cache !== undefined && !cache.isFresh(takerToken, makerToken))
            .forEach((cache) => cache === null || cache === void 0 ? void 0 : cache.getFreshPoolsForPairAsync(takerToken, makerToken));
    }
    static exportSamplerMetric({ side, gasLimit, gasUsed, blockNumber, }) {
        sampler_metrics_1.SAMPLER_METRICS.logGasDetails({ side, gasLimit, gasUsed });
        sampler_metrics_1.SAMPLER_METRICS.logBlockNumber(blockNumber);
    }
    static computeGasUsed({ gasLimit, gasLeft }) {
        return gasLimit.minus(gasLeft);
    }
    static filterTwoHopQuotes(twoHopQuotesList, isMicroSwap) {
        if (isMicroSwap) {
            return [];
        }
        return twoHopQuotesList
            .map((twoHopQuotes) => twoHopQuotes.filter((q) => q && q.fillData && q.fillData.firstHopSource && q.fillData.secondHopSource))
            .filter((quotes) => quotes.length > 0);
    }
    filterOutDexQuotes(dexQuotes, isMicroSwap) {
        return dexQuotes.filter((samples) => {
            if (samples.length == 0) {
                return false;
            }
            if (!isMicroSwap) {
                return true;
            }
            // Only use fee sources if it's a micro swap.
            return this._feeSources.includes(samples[0].source);
        });
    }
}
exports.MarketOperationUtils = MarketOperationUtils;
//# sourceMappingURL=index.js.map