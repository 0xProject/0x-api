"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonifyFillData = exports.generateExtendedQuoteReportSources = exports.generateQuoteReport = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
const _ = require("lodash");
const types_1 = require("../types");
/**
 * Generates a report of sources considered while computing the optimized
 * swap quote, and the sources ultimately included in the computed quote.
 */
function generateQuoteReport(marketOperation, nativeOrders, liquidityDelivered, comparisonPrice, quoteRequestor) {
    const nativeOrderSourcesConsidered = nativeOrders.map((order) => 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
    nativeOrderToReportEntry(order.type, order, order.fillableTakerAmount, comparisonPrice, quoteRequestor));
    const sourcesConsidered = [...nativeOrderSourcesConsidered.filter((order) => order.isRFQ)];
    let sourcesDelivered;
    if (Array.isArray(liquidityDelivered)) {
        // create easy way to look up fillable amounts
        const nativeOrderSignaturesToFillableAmounts = _.fromPairs(nativeOrders.map((o) => {
            return [_nativeDataToId(o), o.fillableTakerAmount];
        }));
        // map sources delivered
        sourcesDelivered = liquidityDelivered.map((collapsedFill) => {
            if (_isNativeOrderFromCollapsedFill(collapsedFill)) {
                return nativeOrderToReportEntry(collapsedFill.type, collapsedFill.fillData, nativeOrderSignaturesToFillableAmounts[_nativeDataToId(collapsedFill.fillData)], comparisonPrice, quoteRequestor);
            }
            else {
                return dexSampleToReportSource(collapsedFill, marketOperation);
            }
        });
    }
    else {
        sourcesDelivered = [
            multiHopSampleToReportSource(liquidityDelivered, marketOperation),
        ];
    }
    return {
        sourcesConsidered,
        sourcesDelivered,
    };
}
exports.generateQuoteReport = generateQuoteReport;
/**
 * Generates a report of sources considered while computing the optimized
 * swap quote, the sources ultimately included in the computed quote. This
 * extende version incudes all considered quotes, not only native liquidity.
 */
function generateExtendedQuoteReportSources(marketOperation, quotes, liquidityDelivered, amount, comparisonPrice, quoteRequestor) {
    const sourcesConsidered = [];
    // NativeOrders
    sourcesConsidered.push(...quotes.nativeOrders.map((order) => nativeOrderToReportEntry(order.type, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
    order, order.fillableTakerAmount, comparisonPrice, quoteRequestor)));
    // IndicativeQuotes
    sourcesConsidered.push(...quotes.rfqtIndicativeQuotes.map((order) => indicativeQuoteToReportEntry(order, comparisonPrice)));
    // MultiHop
    sourcesConsidered.push(..._.flatMap(quotes.twoHopQuotes, (samples) => {
        return samples.map((sample) => multiHopSampleToReportSource(sample, marketOperation));
    }));
    // Dex Quotes
    sourcesConsidered.push(..._.flatten(quotes.dexQuotes.map((dex) => dex
        .filter((quote) => isDexSampleFilter(quote, amount))
        .map((quote) => dexSampleToReportSource(quote, marketOperation)))));
    const sourcesConsideredIndexed = sourcesConsidered.map((quote, index) => {
        return {
            ...quote,
            quoteEntryIndex: index,
            isDelivered: false,
        };
    });
    let sourcesDelivered;
    if (Array.isArray(liquidityDelivered)) {
        // create easy way to look up fillable amounts
        const nativeOrderSignaturesToFillableAmounts = _.fromPairs(quotes.nativeOrders.map((o) => {
            return [_nativeDataToId(o), o.fillableTakerAmount];
        }));
        // map sources delivered
        sourcesDelivered = liquidityDelivered.map((collapsedFill) => {
            if (_isNativeOrderFromCollapsedFill(collapsedFill)) {
                return nativeOrderToReportEntry(collapsedFill.type, collapsedFill.fillData, nativeOrderSignaturesToFillableAmounts[_nativeDataToId(collapsedFill.fillData)], comparisonPrice, quoteRequestor);
            }
            else {
                return dexSampleToReportSource(collapsedFill, marketOperation);
            }
        });
    }
    else {
        sourcesDelivered = [
            multiHopSampleToReportSource(liquidityDelivered, marketOperation),
        ];
    }
    const sourcesDeliveredIndexed = sourcesDelivered.map((quote, index) => {
        return {
            ...quote,
            quoteEntryIndex: index,
            isDelivered: false,
        };
    });
    return {
        sourcesConsidered: sourcesConsideredIndexed,
        sourcesDelivered: sourcesDeliveredIndexed,
    };
}
exports.generateExtendedQuoteReportSources = generateExtendedQuoteReportSources;
function _nativeDataToId(data) {
    const { v, r, s } = data.signature;
    return `${v}${r}${s}`;
}
/**
 * Generates a report sample for a DEX source
 * NOTE: this is used for the QuoteReport.
 */
function dexSampleToReportSource(ds, marketOperation) {
    const liquiditySource = ds.source;
    if (liquiditySource === types_1.ERC20BridgeSource.Native) {
        throw new Error(`Unexpected liquidity source Native`);
    }
    // input and output map to different values
    // based on the market operation
    if (marketOperation === types_1.MarketOperation.Buy) {
        return {
            makerAmount: ds.input,
            takerAmount: ds.output,
            liquiditySource,
            fillData: ds.fillData,
        };
    }
    else if (marketOperation === types_1.MarketOperation.Sell) {
        return {
            makerAmount: ds.output,
            takerAmount: ds.input,
            liquiditySource,
            fillData: ds.fillData,
        };
    }
    else {
        throw new Error(`Unexpected marketOperation ${marketOperation}`);
    }
}
/**
 * Checks if a DEX sample is the one that represents the whole amount requested by taker
 * NOTE: this is used for the QuoteReport to filter samples
 */
function isDexSampleFilter(ds, amount) {
    // The entry is for the total amont, not a sampler entry && there was liquidity in the source
    return ds.input.eq(amount) && ds.output.isGreaterThan(0);
}
/**
 * Generates a report sample for a MultiHop source
 * NOTE: this is used for the QuoteReport.
 */
function multiHopSampleToReportSource(ds, marketOperation) {
    const { firstHopSource: firstHop, secondHopSource: secondHop } = ds.fillData;
    // input and output map to different values
    // based on the market operation
    if (marketOperation === types_1.MarketOperation.Buy) {
        return {
            liquiditySource: types_1.ERC20BridgeSource.MultiHop,
            makerAmount: ds.input,
            takerAmount: ds.output,
            fillData: ds.fillData,
            hopSources: [firstHop.source, secondHop.source],
        };
    }
    else if (marketOperation === types_1.MarketOperation.Sell) {
        return {
            liquiditySource: types_1.ERC20BridgeSource.MultiHop,
            makerAmount: ds.output,
            takerAmount: ds.input,
            fillData: ds.fillData,
            hopSources: [firstHop.source, secondHop.source],
        };
    }
    else {
        throw new Error(`Unexpected marketOperation ${marketOperation}`);
    }
}
function _isNativeOrderFromCollapsedFill(cf) {
    const { type } = cf;
    switch (type) {
        case protocol_utils_1.FillQuoteTransformerOrderType.Limit:
        case protocol_utils_1.FillQuoteTransformerOrderType.Rfq:
        case protocol_utils_1.FillQuoteTransformerOrderType.Otc:
            return true;
        case protocol_utils_1.FillQuoteTransformerOrderType.Bridge:
            return false;
        default:
            ((_x) => {
                throw new Error('unreachable');
            })(type);
    }
}
function _isRFQOrderfromType(orderType) {
    switch (orderType) {
        case protocol_utils_1.FillQuoteTransformerOrderType.Rfq:
        case protocol_utils_1.FillQuoteTransformerOrderType.Otc:
            return true;
        case protocol_utils_1.FillQuoteTransformerOrderType.Limit:
        case protocol_utils_1.FillQuoteTransformerOrderType.Bridge:
            return false;
        default:
            ((_) => {
                throw new Error('unreachable');
            })(orderType);
    }
}
/**
 * Generates a report entry for a native order
 * NOTE: this is used for the QuoteReport.
 */
function nativeOrderToReportEntry(type, fillData, fillableAmount, comparisonPrice, quoteRequestor) {
    const nativeOrderBase = {
        makerAmount: fillData.order.makerAmount,
        takerAmount: fillData.order.takerAmount,
        fillableTakerAmount: fillableAmount,
    };
    // if we find this is an rfqt order, label it as such and associate makerUri
    const isRFQ = _isRFQOrderfromType(type);
    const rfqtMakerUri = isRFQ && quoteRequestor ? quoteRequestor.getMakerUriForSignature(fillData.signature) : undefined;
    if (isRFQ) {
        const nativeOrder = fillData.order;
        return {
            liquiditySource: types_1.ERC20BridgeSource.Native,
            ...nativeOrderBase,
            isRFQ: true,
            makerUri: rfqtMakerUri || '',
            ...(comparisonPrice ? { comparisonPrice: comparisonPrice.toNumber() } : {}),
            nativeOrder,
            fillData,
        };
    }
    else {
        return {
            liquiditySource: types_1.ERC20BridgeSource.Native,
            ...nativeOrderBase,
            isRFQ: false,
            fillData,
        };
    }
}
/**
 * Generates a report entry for an indicative RFQ Quote
 * NOTE: this is used for the QuoteReport and quote price comparison data
 */
function indicativeQuoteToReportEntry(order, comparisonPrice) {
    const nativeOrderBase = {
        makerAmount: order.makerAmount,
        takerAmount: order.takerAmount,
        fillableTakerAmount: order.takerAmount,
    };
    return {
        liquiditySource: types_1.ERC20BridgeSource.Native,
        ...nativeOrderBase,
        isRFQ: true,
        makerUri: order.makerUri,
        fillData: {},
        ...(comparisonPrice ? { comparisonPrice: comparisonPrice.toNumber() } : {}),
    };
}
/**
 * For the extended quote report, we output the filldata as JSON
 */
function jsonifyFillData(source) {
    return {
        ...source,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
        fillData: JSON.stringify(source.fillData, (key, value) => {
            if (key === '_samplerContract') {
                return {};
            }
            else {
                return value;
            }
        }),
    };
}
exports.jsonifyFillData = jsonifyFillData;
//# sourceMappingURL=quote_report_generator.js.map