"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@0x/utils");
const chai = require("chai");
const _ = require("lodash");
require("mocha");
const asset_swapper_1 = require("../../src/asset-swapper");
const types_1 = require("../../src/asset-swapper/types");
const comparison_price_1 = require("../../src/asset-swapper/utils/market_operation_utils/comparison_price");
const source_filters_1 = require("../../src/asset-swapper/utils/market_operation_utils/source_filters");
const chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
const DAI_TOKEN = '0x6b175474e89094c44da98b954eedeac495271d0f';
const ETH_TOKEN = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const GAS_PRICE = new utils_1.BigNumber(50e9); // 50 gwei
const NATIVE_ORDER_GAS = 220e3; // 220K gas
// DEX samples to fill in MarketSideLiquidity
const curveSample = {
    source: types_1.ERC20BridgeSource.Curve,
    input: new utils_1.BigNumber(10000),
    output: new utils_1.BigNumber(10001),
    fillData: {},
};
const uniswapSample1 = {
    source: types_1.ERC20BridgeSource.UniswapV2,
    input: new utils_1.BigNumber(10003),
    output: new utils_1.BigNumber(10004),
    fillData: {},
};
const dexQuotes = [curveSample, uniswapSample1];
const nativeOrderFeeEstimate = _.constant({
    gas: NATIVE_ORDER_GAS,
    fee: GAS_PRICE.times(NATIVE_ORDER_GAS),
});
const exchangeProxyOverhead = (sourceFlags) => {
    if ([asset_swapper_1.SOURCE_FLAGS.RfqOrder].includes(sourceFlags)) {
        return new utils_1.BigNumber(20e3).times(GAS_PRICE);
    }
    else {
        return new utils_1.BigNumber(200e3).times(GAS_PRICE);
    }
};
const buyMarketSideLiquidity = {
    // needed params
    outputAmountPerEth: new utils_1.BigNumber(500),
    inputAmountPerEth: new utils_1.BigNumber(1),
    side: types_1.MarketOperation.Buy,
    makerTokenDecimals: 18,
    takerTokenDecimals: 18,
    // extra
    inputAmount: new utils_1.BigNumber(0),
    inputToken: ETH_TOKEN,
    outputToken: DAI_TOKEN,
    quotes: {
        twoHopQuotes: [],
        rfqtIndicativeQuotes: [],
        dexQuotes: [dexQuotes],
        nativeOrders: [],
    },
    quoteSourceFilters: new source_filters_1.SourceFilters(),
    isRfqSupported: false,
    blockNumber: 1337420,
    samplerGasUsage: 1000000,
};
const sellMarketSideLiquidity = {
    // needed params
    outputAmountPerEth: new utils_1.BigNumber(500),
    inputAmountPerEth: new utils_1.BigNumber(1),
    side: types_1.MarketOperation.Sell,
    makerTokenDecimals: 18,
    takerTokenDecimals: 18,
    // extra
    inputAmount: new utils_1.BigNumber(0),
    inputToken: ETH_TOKEN,
    outputToken: DAI_TOKEN,
    quotes: {
        dexQuotes: [dexQuotes],
        nativeOrders: [],
        twoHopQuotes: [],
        rfqtIndicativeQuotes: [],
    },
    quoteSourceFilters: new source_filters_1.SourceFilters(),
    isRfqSupported: false,
    blockNumber: 1337420,
    samplerGasUsage: 1000000,
};
describe('getComparisonPrices', async () => {
    it('should create a proper comparison price for Sells', () => {
        // test selling 10 ETH for DAI
        // here, ETH is the input token
        // and DAI is the output token
        const AMOUNT = new utils_1.BigNumber(10 * 1e18);
        // raw maker over taker rate, let's say is 500 flat
        const adjustedRate = new utils_1.BigNumber(500);
        const comparisonPrices = (0, comparison_price_1.getComparisonPrices)(adjustedRate, AMOUNT, sellMarketSideLiquidity, nativeOrderFeeEstimate, exchangeProxyOverhead);
        // expected outcome
        const EXPECTED_PRICE = new utils_1.BigNumber('500.6');
        expect(comparisonPrices.wholeOrder).to.deep.eq(EXPECTED_PRICE);
    });
    it('should create a proper comparison price for Buys', () => {
        // test buying 10 ETH with DAI
        // here, ETH is the input token
        // and DAI is the output token (now from the maker's perspective)
        const AMOUNT = new utils_1.BigNumber(10 * 1e18);
        // raw maker over taker rate, let's say is ETH/DAI rate is 500 flat
        const adjustedRate = new utils_1.BigNumber(1).dividedBy(new utils_1.BigNumber(500));
        const comparisonPrices = (0, comparison_price_1.getComparisonPrices)(adjustedRate, AMOUNT, buyMarketSideLiquidity, nativeOrderFeeEstimate, exchangeProxyOverhead);
        // expected outcome
        const EXPECTED_PRICE = new utils_1.BigNumber('0.0020024029');
        expect(comparisonPrices.wholeOrder).to.deep.eq(EXPECTED_PRICE);
    });
    it('should not return a price if takerAmount is < 0', () => {
        // test selling 0.00001 ETH for DAI
        // this will result in a negative comparison price, but here we should return undefined
        const AMOUNT = new utils_1.BigNumber(0.00001 * 1e18);
        // raw maker over taker rate, let's say is 500 flat
        const adjustedRate = new utils_1.BigNumber(500);
        const comparisonPrices = (0, comparison_price_1.getComparisonPrices)(adjustedRate, AMOUNT, sellMarketSideLiquidity, nativeOrderFeeEstimate, exchangeProxyOverhead);
        expect(comparisonPrices.wholeOrder === undefined);
    });
});
//# sourceMappingURL=comparison_price_test.js.map