import { FillQuoteTransformerOrderType, RfqOrder } from '@0x/protocol-utils';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import * as _ from 'lodash';
import { Counter } from 'prom-client';

import { SAMPLER_METRICS } from '../../../utils/sampler_metrics';
import { DEFAULT_INFO_LOGGER, INVALID_SIGNATURE } from '../../constants';
import {
    AltRfqMakerAssetOfferings,
    AssetSwapperContractAddresses,
    MarketOperation,
    NativeOrderWithFillableAmounts,
    ERC20BridgeSource,
    GetMarketOrdersOpts,
    ExtendedQuoteReportSources,
    QuoteReport,
    SignedLimitOrder,
} from '../../types';
import { getAltMarketInfo } from '../alt_mm_implementation_utils';
import { QuoteRequestor, V4RFQIndicativeQuoteMM } from '../quote_requestor';
import { toSignedNativeOrder, toSignedNativeOrderWithFillableAmounts } from '../rfq_client_mappers';
import {
    getNativeAdjustedFillableAmountsFromMakerAmount,
    getNativeAdjustedFillableAmountsFromTakerAmount,
    getNativeAdjustedMakerFillAmount,
} from '../utils';

import { generateExtendedQuoteReportSources, generateQuoteReport } from './../quote_report_generator';
import { getComparisonPrices } from './comparison_price';
import {
    BUY_SOURCE_FILTER_BY_CHAIN_ID,
    DEFAULT_GET_MARKET_ORDERS_OPTS,
    FEE_QUOTE_SOURCES_BY_CHAIN_ID,
    NATIVE_FEE_TOKEN_AMOUNT_BY_CHAIN_ID,
    NATIVE_FEE_TOKEN_BY_CHAIN_ID,
    SELL_SOURCE_FILTER_BY_CHAIN_ID,
    ZERO_AMOUNT,
} from './constants';
import { IdentityFillAdjustor } from './identity_fill_adjustor';
import { Path } from './path';
import { PathOptimizer } from './path_optimizer';
import { DexOrderSampler, getSampleAmounts } from './sampler';
import { SourceFilters } from './source_filters';
import {
    AggregationError,
    DexSample,
    GenerateOptimizedOrdersOpts,
    MarketSideLiquidity,
    MultiHopFillData,
} from './types';

const NO_CONVERSION_TO_NATIVE_FOUND = new Counter({
    name: 'no_conversion_to_native_found',
    help: 'unable to get conversion to native token',
    labelNames: ['source', 'endpoint'],
});

interface OptimizerResult {
    path: Path;
    marketSideLiquidity: MarketSideLiquidity;
    takerAmountPerEth: BigNumber;
    makerAmountPerEth: BigNumber;
}

export interface OptimizerResultWithReport extends OptimizerResult {
    quoteReport?: QuoteReport;
    extendedQuoteReportSources?: ExtendedQuoteReportSources;
}

export class MarketOperationUtils {
    private readonly _sellSources: SourceFilters;
    private readonly _buySources: SourceFilters;
    private readonly _feeSources: ERC20BridgeSource[];
    private readonly _nativeFeeToken: string;
    private readonly _nativeFeeTokenAmount: BigNumber;

    private static _computeQuoteReport(
        quoteRequestor: QuoteRequestor | undefined,
        marketSideLiquidity: MarketSideLiquidity,
        optimizerResult: OptimizerResult,
        comparisonPrice?: BigNumber | undefined,
    ): QuoteReport {
        const { side, quotes } = marketSideLiquidity;
        return generateQuoteReport(
            side,
            quotes.nativeOrders,
            optimizerResult.path.fills,
            comparisonPrice,
            quoteRequestor,
        );
    }

    private static _computeExtendedQuoteReportSources(
        quoteRequestor: QuoteRequestor | undefined,
        marketSideLiquidity: MarketSideLiquidity,
        amount: BigNumber,
        optimizerResult: OptimizerResult,
        comparisonPrice?: BigNumber | undefined,
    ): ExtendedQuoteReportSources {
        const { side, quotes } = marketSideLiquidity;
        return generateExtendedQuoteReportSources(
            side,
            quotes,
            optimizerResult.path.fills,
            amount,
            comparisonPrice,
            quoteRequestor,
        );
    }

    constructor(
        private readonly sampler: DexOrderSampler,
        private readonly contractAddresses: AssetSwapperContractAddresses,
    ) {
        this._buySources = BUY_SOURCE_FILTER_BY_CHAIN_ID[sampler.chainId];
        this._sellSources = SELL_SOURCE_FILTER_BY_CHAIN_ID[sampler.chainId];
        this._feeSources = FEE_QUOTE_SOURCES_BY_CHAIN_ID[sampler.chainId];
        this._nativeFeeToken = NATIVE_FEE_TOKEN_BY_CHAIN_ID[sampler.chainId];
        this._nativeFeeTokenAmount = NATIVE_FEE_TOKEN_AMOUNT_BY_CHAIN_ID[sampler.chainId];
    }

    private async getMarketLiquidity(
        side: MarketOperation,
        makerToken: string,
        takerToken: string,
        limitOrders: SignedLimitOrder[],
        amount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<MarketSideLiquidity> {
        if (side === MarketOperation.Sell) {
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
    private async getMarketSellLiquidity(
        makerToken: string,
        takerToken: string,
        limitOrders: SignedLimitOrder[],
        takerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<MarketSideLiquidity> {
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const sampleAmounts = getSampleAmounts(takerAmount, _opts.numSamples, _opts.sampleDistributionBase);

        const requestFilters = new SourceFilters().exclude(_opts.excludedSources).include(_opts.includedSources);
        const quoteSourceFilters = this._sellSources.merge(requestFilters);

        // Used to determine whether the tx origin is an EOA or a contract
        const txOrigin = (_opts.rfqt && _opts.rfqt.txOrigin) || NULL_ADDRESS;

        // Call the sampler contract.
        const samplerPromise = this.sampler.executeAsync(
            this.sampler.getBlockNumber(),
            this.sampler.getGasLeft(),
            this.sampler.getTokenDecimals([makerToken, takerToken]),
            // Get native order fillable amounts.
            this.sampler.getLimitOrderFillableTakerAmounts(limitOrders, this.contractAddresses.exchangeProxy),
            // Get ETH -> maker token price.
            this.sampler.getBestNativeTokenSellRate(
                this._feeSources,
                makerToken,
                this._nativeFeeToken,
                this._nativeFeeTokenAmount,
                _opts.feeSchedule,
            ),
            // Get ETH -> taker token price.
            this.sampler.getBestNativeTokenSellRate(
                this._feeSources,
                takerToken,
                this._nativeFeeToken,
                this._nativeFeeTokenAmount,
                _opts.feeSchedule,
            ),
            // Get sell quotes for taker -> maker.
            this.sampler.getSellQuotes(quoteSourceFilters.sources, makerToken, takerToken, sampleAmounts),
            this.sampler.getTwoHopSellQuotes(
                quoteSourceFilters.isAllowed(ERC20BridgeSource.MultiHop) ? quoteSourceFilters.sources : [],
                makerToken,
                takerToken,
                [takerAmount],
            ),
            this.sampler.isAddressContract(txOrigin),
            this.sampler.getGasLeft(),
        );

        // Refresh the cached pools asynchronously if required
        this._refreshPoolCacheIfRequiredAsync(takerToken, makerToken);

        const [
            blockNumber,
            gasBefore,
            tokenDecimals,
            orderFillableTakerAmounts,
            outputAmountPerEth,
            inputAmountPerEth,
            dexQuotes,
            rawTwoHopQuotes,
            isTxOriginContract,
            gasAfter,
        ] = await samplerPromise;

        const defaultLabels = ['getMarketSellLiquidityAsync', opts?.endpoint || 'N/A'];

        if (outputAmountPerEth.isZero()) {
            DEFAULT_INFO_LOGGER(
                { token: makerToken, endpoint: opts?.endpoint, inOut: 'output' },
                'conversion to native token is zero',
            );
            NO_CONVERSION_TO_NATIVE_FOUND.labels(...defaultLabels).inc();
        }
        if (inputAmountPerEth.isZero()) {
            DEFAULT_INFO_LOGGER(
                { token: takerToken, endpoint: opts?.endpoint, inOut: 'input' },
                'conversion to native token is zero',
            );
            NO_CONVERSION_TO_NATIVE_FOUND.labels(...defaultLabels).inc();
        }

        // Log the gas metrics
        SAMPLER_METRICS.logGasDetails({ side: 'sell', gasBefore, gasAfter });
        SAMPLER_METRICS.logBlockNumber(blockNumber);

        const [makerTokenDecimals, takerTokenDecimals] = tokenDecimals;

        const isRfqSupported = !!(_opts.rfqt && !isTxOriginContract);
        const limitOrdersWithFillableAmounts = limitOrders.map((order, i) => ({
            ...order,
            ...getNativeAdjustedFillableAmountsFromTakerAmount(order, orderFillableTakerAmounts[i]),
        }));

        return {
            side: MarketOperation.Sell,
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
                twoHopQuotes: MarketOperationUtils.filterInvalidTwoHopQuotes(rawTwoHopQuotes),
                dexQuotes,
            },
            isRfqSupported,
            blockNumber: blockNumber.toNumber(),
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
    private async getMarketBuyLiquidity(
        makerToken: string,
        takerToken: string,
        limitOrders: SignedLimitOrder[],
        makerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<MarketSideLiquidity> {
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const sampleAmounts = getSampleAmounts(makerAmount, _opts.numSamples, _opts.sampleDistributionBase);

        const requestFilters = new SourceFilters().exclude(_opts.excludedSources).include(_opts.includedSources);
        const quoteSourceFilters = this._buySources.merge(requestFilters);

        // Used to determine whether the tx origin is an EOA or a contract
        const txOrigin = (_opts.rfqt && _opts.rfqt.txOrigin) || NULL_ADDRESS;

        // Call the sampler contract.
        const samplerPromise = this.sampler.executeAsync(
            this.sampler.getBlockNumber(),
            this.sampler.getGasLeft(),
            this.sampler.getTokenDecimals([makerToken, takerToken]),
            // Get native order fillable amounts.
            this.sampler.getLimitOrderFillableMakerAmounts(limitOrders, this.contractAddresses.exchangeProxy),
            // Get ETH -> makerToken token price.
            this.sampler.getBestNativeTokenSellRate(
                this._feeSources,
                makerToken,
                this._nativeFeeToken,
                this._nativeFeeTokenAmount,
                _opts.feeSchedule,
            ),
            // Get ETH -> taker token price.
            this.sampler.getBestNativeTokenSellRate(
                this._feeSources,
                takerToken,
                this._nativeFeeToken,
                this._nativeFeeTokenAmount,
                _opts.feeSchedule,
            ),
            // Get buy quotes for taker -> maker.
            this.sampler.getBuyQuotes(quoteSourceFilters.sources, makerToken, takerToken, sampleAmounts),
            this.sampler.getTwoHopBuyQuotes(
                quoteSourceFilters.isAllowed(ERC20BridgeSource.MultiHop) ? quoteSourceFilters.sources : [],
                makerToken,
                takerToken,
                [makerAmount],
            ),
            this.sampler.isAddressContract(txOrigin),
            this.sampler.getGasLeft(),
        );

        // Refresh the cached pools asynchronously if required
        this._refreshPoolCacheIfRequiredAsync(takerToken, makerToken);

        const [
            blockNumber,
            gasBefore,
            tokenDecimals,
            orderFillableMakerAmounts,
            ethToMakerAssetRate,
            ethToTakerAssetRate,
            dexQuotes,
            rawTwoHopQuotes,
            isTxOriginContract,
            gasAfter,
        ] = await samplerPromise;

        const defaultLabels = ['getMarketBuyLiquidityAsync', opts?.endpoint || 'N/A'];

        if (ethToMakerAssetRate.isZero()) {
            DEFAULT_INFO_LOGGER(
                { token: makerToken, endpoint: opts?.endpoint, inOut: 'output' },
                'conversion to native token is zero',
            );
            NO_CONVERSION_TO_NATIVE_FOUND.labels(...defaultLabels).inc();
        }
        if (ethToTakerAssetRate.isZero()) {
            DEFAULT_INFO_LOGGER(
                { token: takerToken, endpoint: opts?.endpoint, inOut: 'input' },
                'conversion to native token is zero',
            );
            NO_CONVERSION_TO_NATIVE_FOUND.labels(...defaultLabels).inc();
        }

        SAMPLER_METRICS.logGasDetails({ side: 'buy', gasBefore, gasAfter });
        SAMPLER_METRICS.logBlockNumber(blockNumber);

        const [makerTokenDecimals, takerTokenDecimals] = tokenDecimals;
        const isRfqSupported = !isTxOriginContract;

        const limitOrdersWithFillableAmounts = limitOrders.map((order, i) => ({
            ...order,
            ...getNativeAdjustedFillableAmountsFromMakerAmount(order, orderFillableMakerAmounts[i]),
        }));

        return {
            side: MarketOperation.Buy,
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
                twoHopQuotes: MarketOperationUtils.filterInvalidTwoHopQuotes(rawTwoHopQuotes),
                dexQuotes,
            },
            isRfqSupported,
            blockNumber: blockNumber.toNumber(),
        };
    }

    public generateOptimizedOrders(
        marketSideLiquidity: MarketSideLiquidity,
        opts: GenerateOptimizedOrdersOpts,
    ): OptimizerResult {
        const { inputToken, outputToken, side, inputAmount, quotes, outputAmountPerEth, inputAmountPerEth } =
            marketSideLiquidity;
        const { nativeOrders, rfqtIndicativeQuotes, dexQuotes, twoHopQuotes } = quotes;

        const augmentedRfqtIndicativeQuotes: NativeOrderWithFillableAmounts[] = rfqtIndicativeQuotes.map(
            (q) =>
                ({
                    order: { ...new RfqOrder({ ...q }) },
                    signature: INVALID_SIGNATURE,
                    fillableMakerAmount: new BigNumber(q.makerAmount),
                    fillableTakerAmount: new BigNumber(q.takerAmount),
                    fillableTakerFeeAmount: ZERO_AMOUNT,
                    type: FillQuoteTransformerOrderType.Rfq,
                } as NativeOrderWithFillableAmounts),
        );

        // NOTE: For sell quotes input is the taker asset and for buy quotes input is the maker asset
        const takerAmountPerEth = side === MarketOperation.Sell ? inputAmountPerEth : outputAmountPerEth;
        const makerAmountPerEth = side === MarketOperation.Sell ? outputAmountPerEth : inputAmountPerEth;

        // Find the optimal path using Rust router.
        const pathOptimizer = new PathOptimizer({
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
            DEFAULT_INFO_LOGGER({}, 'NoOptimalPath thrown in _generateOptimizedOrdersAsync');
            throw new Error(AggregationError.NoOptimalPath);
        }

        return {
            path: optimalPath,
            marketSideLiquidity,
            takerAmountPerEth,
            makerAmountPerEth,
        };
    }

    public async getOptimizerResultAsync(
        makerToken: string,
        takerToken: string,
        limitOrders: SignedLimitOrder[],
        amount: BigNumber,
        side: MarketOperation,
        opts: Partial<GetMarketOrdersOpts> & { gasPrice: BigNumber },
    ): Promise<OptimizerResultWithReport> {
        const _opts: GetMarketOrdersOpts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const optimizerOpts: GenerateOptimizedOrdersOpts = {
            feeSchedule: _opts.feeSchedule,
            exchangeProxyOverhead: _opts.exchangeProxyOverhead,
            gasPrice: _opts.gasPrice,
            neonRouterNumSamples: _opts.neonRouterNumSamples,
            fillAdjustor: _opts.fillAdjustor,
        };

        const marketSideLiquidity = await this.getMarketLiquidity(
            side,
            makerToken,
            takerToken,
            limitOrders,
            amount,
            _opts,
        );

        // Phase 1 Routing
        // We find an optimized path for ALL the DEX and open-orderbook liquidity (no RFQ liquidity)
        let optimizerResult: OptimizerResult | undefined;
        try {
            optimizerResult = await this.generateOptimizedOrders(marketSideLiquidity, {
                ...optimizerOpts,
                fillAdjustor: new IdentityFillAdjustor(),
            });
        } catch (e) {
            // If no on-chain or off-chain Open Orderbook orders are present, a `NoOptimalPath` will be thrown.
            // If this happens at this stage, there is still a chance that an RFQ order is fillable, therefore
            // we catch the error and continue.
            if (e.message !== AggregationError.NoOptimalPath) {
                throw e;
            }
            //temporary logging for INSUFFICIENT_ASSET_LIQUIDITY
            DEFAULT_INFO_LOGGER({}, 'NoOptimalPath caught in phase 1 routing');
        }

        // Calculate a suggested price. For now, this is simply the overall price of the aggregation.
        // We can use this as a comparison price for RFQ
        let wholeOrderPrice: BigNumber | undefined;
        if (optimizerResult) {
            wholeOrderPrice = getComparisonPrices(
                optimizerResult.path.adjustedRate(),
                amount,
                marketSideLiquidity,
                _opts.feeSchedule.Native,
                _opts.exchangeProxyOverhead,
            ).wholeOrder;
        }

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
        if (
            marketSideLiquidity.isRfqSupported &&
            rfqt &&
            rfqt.quoteRequestor && // only needed for quote report
            marketSideLiquidity.quoteSourceFilters.isAllowed(ERC20BridgeSource.Native)
        ) {
            // Timing of RFQT lifecycle
            const timeStart = new Date().getTime();
            // Filter Alt Rfq Maker Asset Offerings to the current pair
            const filteredOfferings: AltRfqMakerAssetOfferings = {};
            if (rfqt.altRfqAssetOfferings) {
                const endpoints = Object.keys(rfqt.altRfqAssetOfferings);
                for (const endpoint of endpoints) {
                    // Get the current pair if being offered
                    const offering = getAltMarketInfo(rfqt.altRfqAssetOfferings[endpoint], makerToken, takerToken);
                    if (offering) {
                        filteredOfferings[endpoint] = [offering];
                    }
                }
            }

            if (rfqt.isIndicative) {
                // An indicative quote is being requested, and indicative quotes price-aware enabled
                // Make the RFQT request and then re-run the sampler if new orders come back.

                const [v1Prices, v2Prices] =
                    rfqt.rfqClient === undefined
                        ? [[], []]
                        : await Promise.all([
                              rfqt.rfqClient
                                  .getV1PricesAsync({
                                      altRfqAssetOfferings: filteredOfferings,
                                      assetFillAmount: amount,
                                      chainId: this.sampler.chainId,
                                      comparisonPrice: wholeOrderPrice,
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

                DEFAULT_INFO_LOGGER({ v2Prices, isEmpty: v2Prices?.length === 0 }, 'v2Prices from RFQ Client');

                const indicativeQuotes = [
                    ...(v1Prices as V4RFQIndicativeQuoteMM[]),
                    ...(v2Prices as V4RFQIndicativeQuoteMM[]),
                ];
                const deltaTime = new Date().getTime() - timeStart;
                DEFAULT_INFO_LOGGER({
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
                    const phase2MarketSideLiquidity: MarketSideLiquidity = {
                        ...marketSideLiquidity,
                        quotes: {
                            ...marketSideLiquidity.quotes,
                            // Select only the quotes that were chosen in Phase 1
                            dexQuotes: marketSideLiquidity.quotes.dexQuotes.filter(
                                (q) => q.length > 0 && phase1OptimalSources.includes(q[0].source),
                            ),
                        },
                    };

                    optimizerResult = await this.generateOptimizedOrders(
                        phase2MarketSideLiquidity,
                        phaseTwoOptimizerOpts,
                    );
                }
            } else {
                // A firm quote is being requested, and firm quotes price-aware enabled.
                // Ensure that `intentOnFilling` is enabled and make the request.

                const [v1Quotes, v2Quotes] =
                    rfqt.rfqClient === undefined
                        ? [[], []]
                        : await Promise.all([
                              rfqt.rfqClient
                                  .getV1QuotesAsync({
                                      altRfqAssetOfferings: filteredOfferings,
                                      assetFillAmount: amount,
                                      chainId: this.sampler.chainId,
                                      comparisonPrice: wholeOrderPrice,
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

                DEFAULT_INFO_LOGGER({ v2Quotes, isEmpty: v2Quotes?.length === 0 }, 'v2Quotes from RFQ Client');

                const v1FirmQuotes = v1Quotes.map((quote) => {
                    // HACK: set the signature on quoteRequestor for future lookup (i.e. in Quote Report)
                    rfqt.quoteRequestor?.setMakerUriForSignature(quote.signature, quote.makerUri);
                    return toSignedNativeOrder(quote);
                });

                const v2QuotesWithOrderFillableAmounts = v2Quotes.map((quote) => {
                    // HACK: set the signature on quoteRequestor for future lookup (i.e. in Quote Report)
                    rfqt.quoteRequestor?.setMakerUriForSignature(quote.signature, quote.makerUri);
                    return toSignedNativeOrderWithFillableAmounts(quote);
                });

                const deltaTime = new Date().getTime() - timeStart;
                DEFAULT_INFO_LOGGER({
                    rfqQuoteType: 'firm',
                    deltaTime,
                });
                if (v1FirmQuotes.length > 0 || v2QuotesWithOrderFillableAmounts.length > 0) {
                    // Compute the RFQ order fillable amounts. This is done by performing a "soft" order
                    // validation and by checking order balances that are monitored by our worker.
                    // If a firm quote validator does not exist, then we assume that all orders are valid.
                    const v1RfqTakerFillableAmounts =
                        rfqt.firmQuoteValidator === undefined
                            ? v1FirmQuotes.map((signedOrder) => signedOrder.order.takerAmount)
                            : await rfqt.firmQuoteValidator.getRfqtTakerFillableAmountsAsync(
                                  v1FirmQuotes.map((q) => new RfqOrder(q.order)),
                              );

                    const v1QuotesWithOrderFillableAmounts: NativeOrderWithFillableAmounts[] = v1FirmQuotes.map(
                        (order, i) => ({
                            ...order,
                            fillableTakerAmount: v1RfqTakerFillableAmounts[i],
                            // Adjust the maker amount by the available taker fill amount
                            fillableMakerAmount: getNativeAdjustedMakerFillAmount(
                                order.order,
                                v1RfqTakerFillableAmounts[i],
                            ),
                            fillableTakerFeeAmount: ZERO_AMOUNT,
                        }),
                    );

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
                    const phase1OptimalSources = optimizerResult?.path.getOrders().map((o) => o.source) || [];
                    const phase2MarketSideLiquidity: MarketSideLiquidity = {
                        ...marketSideLiquidity,
                        quotes: {
                            ...marketSideLiquidity.quotes,
                            // Select only the quotes that were chosen in Phase 1
                            dexQuotes: marketSideLiquidity.quotes.dexQuotes.filter(
                                (q) => q.length > 0 && phase1OptimalSources.includes(q[0].source),
                            ),
                        },
                    };
                    optimizerResult = await this.generateOptimizedOrders(
                        phase2MarketSideLiquidity,
                        phaseTwoOptimizerOpts,
                    );
                }
            }
        }

        // At this point we should have at least one valid optimizer result, therefore we manually raise
        // `NoOptimalPath` if no optimizer result was ever set.
        if (optimizerResult === undefined) {
            //temporary logging for INSUFFICIENT_ASSET_LIQUIDITY
            DEFAULT_INFO_LOGGER({}, 'NoOptimalPath thrown in phase 2 routing');
            throw new Error(AggregationError.NoOptimalPath);
        }

        // Compute Quote Report and return the results.
        let quoteReport: QuoteReport | undefined;
        if (_opts.shouldGenerateQuoteReport) {
            quoteReport = MarketOperationUtils._computeQuoteReport(
                _opts.rfqt ? _opts.rfqt.quoteRequestor : undefined,
                marketSideLiquidity,
                optimizerResult,
                wholeOrderPrice,
            );
        }

        // Always compute the Extended Quote Report
        const extendedQuoteReportSources: ExtendedQuoteReportSources | undefined =
            MarketOperationUtils._computeExtendedQuoteReportSources(
                _opts.rfqt ? _opts.rfqt.quoteRequestor : undefined,
                marketSideLiquidity,
                amount,
                optimizerResult,
                wholeOrderPrice,
            );

        return { ...optimizerResult, quoteReport, extendedQuoteReportSources };
    }

    private async _refreshPoolCacheIfRequiredAsync(takerToken: string, makerToken: string): Promise<void> {
        _.values(this.sampler.poolsCaches)
            .filter((cache) => cache !== undefined && !cache.isFresh(takerToken, makerToken))
            .forEach((cache) => cache?.getFreshPoolsForPairAsync(takerToken, makerToken));
    }

    private static filterInvalidTwoHopQuotes(
        twoHopQuotesList: DexSample<MultiHopFillData>[][],
    ): DexSample<MultiHopFillData>[][] {
        return twoHopQuotesList
            .map((twoHopQuotes) =>
                twoHopQuotes.filter((q) => q && q.fillData && q.fillData.firstHopSource && q.fillData.secondHopSource),
            )
            .filter((quotes) => quotes.length > 0);
    }
}
