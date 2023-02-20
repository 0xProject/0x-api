"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomSellQuote = void 0;
const utils_1 = require("@0x/utils");
const asset_swapper_1 = require("../../src/asset-swapper");
const bestCaseQuoteInfo = {
    feeTakerTokenAmount: new utils_1.BigNumber('383288145500497440'),
    makerAmount: new utils_1.BigNumber('213528060573258946'),
    gas: 3857345,
    protocolFeeInWeiAmount: new utils_1.BigNumber('569793054675519573'),
    takerAmount: new utils_1.BigNumber('933887973800245567'),
    totalTakerAmount: new utils_1.BigNumber('709708376093637456'),
    slippage: 0,
};
exports.randomSellQuote = {
    gasPrice: new utils_1.BigNumber('201111549'),
    type: asset_swapper_1.MarketOperation.Sell,
    makerToken: '0xb9302bbc853c3e3480a1eefc2bb6bf4cdca809e6',
    takerToken: '0x5471a5833768d1151d34701eba1c9123d1ba2f8a',
    path: undefined,
    bestCaseQuoteInfo,
    worstCaseQuoteInfo: {
        makerAmount: new utils_1.BigNumber('195425597817301501'),
        gas: 277671,
        protocolFeeInWeiAmount: new utils_1.BigNumber('526097088876239888'),
        takerAmount: new utils_1.BigNumber('227180691057406275'),
        totalTakerAmount: new utils_1.BigNumber('858719009621193719'),
        slippage: 0,
    },
    sourceBreakdown: { singleSource: {}, multihop: [] },
    takerTokenFillAmount: new utils_1.BigNumber('401019713908867904'),
    makerTokenDecimals: 18,
    takerTokenDecimals: 18,
    takerAmountPerEth: new utils_1.BigNumber(0),
    makerAmountPerEth: new utils_1.BigNumber(0),
    blockNumber: 1337420,
    samplerGasUsage: 1000000,
};
//# sourceMappingURL=mocks.js.map