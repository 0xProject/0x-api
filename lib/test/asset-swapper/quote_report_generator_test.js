"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const chai = require("chai");
const _ = require("lodash");
require("mocha");
const TypeMoq = require("typemoq");
const types_1 = require("../../src/asset-swapper/types");
const quote_report_generator_1 = require("./../../src/asset-swapper/utils/quote_report_generator");
const chai_setup_1 = require("./utils/chai_setup");
const utils_2 = require("./utils/utils");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
function fillFromNativeOrder(order) {
    const fillData = {
        order: order.order,
        signature: order.signature,
        maxTakerTokenFillAmount: order.fillableTakerAmount,
    };
    return {
        sourcePathId: utils_1.hexUtils.random(),
        source: types_1.ERC20BridgeSource.Native,
        type: order.type,
        input: order.order.takerAmount,
        output: order.order.makerAmount,
        fillData: order.type === protocol_utils_1.FillQuoteTransformerOrderType.Limit
            ? fillData
            : fillData,
        adjustedOutput: order.order.makerAmount,
        flags: BigInt(0),
        gas: 1,
    };
}
describe('generateQuoteReport', async () => {
    it('should generate report properly for sell', () => {
        const marketOperation = types_1.MarketOperation.Sell;
        const balancerSample2 = {
            source: types_1.ERC20BridgeSource.BalancerV2,
            input: new utils_1.BigNumber(10003),
            output: new utils_1.BigNumber(10004),
            fillData: {},
        };
        const uniswapSample2 = {
            source: types_1.ERC20BridgeSource.UniswapV2,
            input: new utils_1.BigNumber(10005),
            output: new utils_1.BigNumber(10006),
            fillData: {},
        };
        const orderbookOrder1 = {
            order: new protocol_utils_1.LimitOrder({ takerAmount: new utils_1.BigNumber(1000) }),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
            fillableTakerAmount: new utils_1.BigNumber(1000),
            fillableMakerAmount: (0, utils_2.getRandomAmount)(),
            fillableTakerFeeAmount: (0, utils_2.getRandomAmount)(),
            signature: (0, utils_2.getRandomSignature)(),
        };
        const orderbookOrder2 = {
            order: new protocol_utils_1.LimitOrder({ takerAmount: new utils_1.BigNumber(198) }),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
            fillableTakerAmount: new utils_1.BigNumber(99),
            fillableMakerAmount: (0, utils_2.getRandomAmount)(),
            fillableTakerFeeAmount: (0, utils_2.getRandomAmount)(),
            signature: (0, utils_2.getRandomSignature)(),
        };
        const rfqtOrder1 = {
            order: new protocol_utils_1.RfqOrder({ takerAmount: new utils_1.BigNumber(100) }),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Rfq,
            fillableTakerAmount: new utils_1.BigNumber(100),
            fillableMakerAmount: (0, utils_2.getRandomAmount)(),
            fillableTakerFeeAmount: (0, utils_2.getRandomAmount)(),
            signature: (0, utils_2.getRandomSignature)(),
        };
        const rfqtOrder2 = {
            order: new protocol_utils_1.RfqOrder({ takerAmount: new utils_1.BigNumber(1101) }),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Rfq,
            fillableTakerAmount: new utils_1.BigNumber(1001),
            fillableMakerAmount: (0, utils_2.getRandomAmount)(),
            fillableTakerFeeAmount: (0, utils_2.getRandomAmount)(),
            signature: (0, utils_2.getRandomSignature)(),
        };
        const nativeOrders = [
            orderbookOrder1,
            rfqtOrder1,
            rfqtOrder2,
            orderbookOrder2,
        ];
        // generate path
        const uniswap2Fill = {
            ...uniswapSample2,
            sourcePathId: utils_1.hexUtils.random(),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
            adjustedOutput: uniswapSample2.output,
            flags: BigInt(0),
            gas: 1,
        };
        const balancer2Fill = {
            ...balancerSample2,
            sourcePathId: utils_1.hexUtils.random(),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
            adjustedOutput: balancerSample2.output,
            flags: BigInt(0),
            gas: 1,
        };
        const orderbookOrder2Fill = fillFromNativeOrder(orderbookOrder2);
        const rfqtOrder2Fill = fillFromNativeOrder(rfqtOrder2);
        const pathGenerated = [rfqtOrder2Fill, orderbookOrder2Fill, uniswap2Fill, balancer2Fill];
        // quote generator mock
        const quoteRequestor = TypeMoq.Mock.ofType();
        quoteRequestor
            .setup((qr) => qr.getMakerUriForSignature(rfqtOrder1.signature))
            .returns(() => {
            return 'https://rfqt1.provider.club';
        })
            .verifiable(TypeMoq.Times.atLeastOnce());
        quoteRequestor
            .setup((qr) => qr.getMakerUriForSignature(rfqtOrder2.signature))
            .returns(() => {
            return 'https://rfqt2.provider.club';
        })
            .verifiable(TypeMoq.Times.atLeastOnce());
        const orderReport = (0, quote_report_generator_1.generateQuoteReport)(marketOperation, nativeOrders, pathGenerated, undefined, quoteRequestor.object);
        const rfqtOrder1Source = {
            liquiditySource: types_1.ERC20BridgeSource.Native,
            makerAmount: rfqtOrder1.order.makerAmount,
            takerAmount: rfqtOrder1.order.takerAmount,
            fillableTakerAmount: rfqtOrder1.fillableTakerAmount,
            isRFQ: true,
            makerUri: 'https://rfqt1.provider.club',
            nativeOrder: rfqtOrder1.order,
            fillData: {
                order: rfqtOrder1.order,
            },
        };
        const rfqtOrder2Source = {
            liquiditySource: types_1.ERC20BridgeSource.Native,
            makerAmount: rfqtOrder2.order.makerAmount,
            takerAmount: rfqtOrder2.order.takerAmount,
            fillableTakerAmount: rfqtOrder2.fillableTakerAmount,
            isRFQ: true,
            makerUri: 'https://rfqt2.provider.club',
            nativeOrder: rfqtOrder2.order,
            fillData: {
                order: rfqtOrder2.order,
            },
        };
        const orderbookOrder2Source = {
            liquiditySource: types_1.ERC20BridgeSource.Native,
            makerAmount: orderbookOrder2.order.makerAmount,
            takerAmount: orderbookOrder2.order.takerAmount,
            fillableTakerAmount: orderbookOrder2.fillableTakerAmount,
            isRFQ: false,
            fillData: {
                order: orderbookOrder2.order,
            },
        };
        const uniswap2Source = {
            liquiditySource: types_1.ERC20BridgeSource.UniswapV2,
            makerAmount: uniswapSample2.output,
            takerAmount: uniswapSample2.input,
            fillData: {},
        };
        const balancer2Source = {
            liquiditySource: types_1.ERC20BridgeSource.BalancerV2,
            makerAmount: balancerSample2.output,
            takerAmount: balancerSample2.input,
            fillData: {},
        };
        const expectedSourcesConsidered = [rfqtOrder1Source, rfqtOrder2Source];
        const expectedSourcesDelivered = [
            rfqtOrder2Source,
            orderbookOrder2Source,
            uniswap2Source,
            balancer2Source,
        ];
        expectEqualQuoteReportEntries(orderReport.sourcesConsidered, expectedSourcesConsidered, `sourcesConsidered`);
        expectEqualQuoteReportEntries(orderReport.sourcesDelivered, expectedSourcesDelivered, `sourcesDelivered`);
        quoteRequestor.verifyAll();
    });
    it('should handle properly for buy without quoteRequestor', () => {
        const marketOperation = types_1.MarketOperation.Buy;
        const balancerSample1 = {
            source: types_1.ERC20BridgeSource.BalancerV2,
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
        const orderbookOrder1 = {
            order: new protocol_utils_1.LimitOrder({ takerAmount: new utils_1.BigNumber(1101) }),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
            fillableTakerAmount: new utils_1.BigNumber(1000),
            fillableMakerAmount: (0, utils_2.getRandomAmount)(),
            fillableTakerFeeAmount: (0, utils_2.getRandomAmount)(),
            signature: (0, utils_2.getRandomSignature)(),
        };
        const orderbookOrder2 = {
            order: new protocol_utils_1.LimitOrder({ takerAmount: new utils_1.BigNumber(5101) }),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
            fillableTakerAmount: new utils_1.BigNumber(5000),
            fillableMakerAmount: (0, utils_2.getRandomAmount)(),
            fillableTakerFeeAmount: (0, utils_2.getRandomAmount)(),
            signature: (0, utils_2.getRandomSignature)(),
        };
        const nativeOrders = [orderbookOrder1, orderbookOrder2];
        // generate path
        const orderbookOrder1Fill = fillFromNativeOrder(orderbookOrder1);
        const uniswap1Fill = {
            ...uniswapSample1,
            sourcePathId: utils_1.hexUtils.random(),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
            adjustedOutput: uniswapSample1.output,
            flags: BigInt(0),
            gas: 1,
        };
        const balancer1Fill = {
            ...balancerSample1,
            sourcePathId: utils_1.hexUtils.random(),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
            adjustedOutput: balancerSample1.output,
            flags: BigInt(0),
            gas: 1,
        };
        const pathGenerated = [orderbookOrder1Fill, uniswap1Fill, balancer1Fill];
        const orderReport = (0, quote_report_generator_1.generateQuoteReport)(marketOperation, nativeOrders, pathGenerated);
        const orderbookOrder1Source = {
            liquiditySource: types_1.ERC20BridgeSource.Native,
            makerAmount: orderbookOrder1.order.makerAmount,
            takerAmount: orderbookOrder1.order.takerAmount,
            fillableTakerAmount: orderbookOrder1.fillableTakerAmount,
            isRFQ: false,
            fillData: {
                order: orderbookOrder1.order,
            },
        };
        const uniswap1Source = {
            liquiditySource: types_1.ERC20BridgeSource.UniswapV2,
            makerAmount: uniswapSample1.input,
            takerAmount: uniswapSample1.output,
            fillData: {},
        };
        const balancer1Source = {
            liquiditySource: types_1.ERC20BridgeSource.BalancerV2,
            makerAmount: balancerSample1.input,
            takerAmount: balancerSample1.output,
            fillData: {},
        };
        // No order is considered here because only Native RFQ orders are considered.
        const expectedSourcesConsidered = [];
        const expectedSourcesDelivered = [orderbookOrder1Source, uniswap1Source, balancer1Source];
        expectEqualQuoteReportEntries(orderReport.sourcesConsidered, expectedSourcesConsidered, `sourcesConsidered`);
        expectEqualQuoteReportEntries(orderReport.sourcesDelivered, expectedSourcesDelivered, `sourcesDelivered`);
    });
    it('should correctly generate report for a two-hop quote', () => {
        const marketOperation = types_1.MarketOperation.Sell;
        const orderbookOrder1 = {
            order: new protocol_utils_1.LimitOrder({ takerAmount: new utils_1.BigNumber(1101) }),
            type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
            fillableTakerAmount: new utils_1.BigNumber(1000),
            fillableMakerAmount: (0, utils_2.getRandomAmount)(),
            fillableTakerFeeAmount: (0, utils_2.getRandomAmount)(),
            signature: (0, utils_2.getRandomSignature)(),
        };
        const twoHopFillData = {
            intermediateToken: utils_1.hexUtils.random(20),
            firstHopSource: {
                source: types_1.ERC20BridgeSource.Balancer,
                fillData: {},
            },
            secondHopSource: {
                source: types_1.ERC20BridgeSource.Curve,
                fillData: {},
            },
        };
        const twoHopSample = {
            source: types_1.ERC20BridgeSource.MultiHop,
            input: new utils_1.BigNumber(3005),
            output: new utils_1.BigNumber(3006),
            fillData: twoHopFillData,
        };
        const orderReport = (0, quote_report_generator_1.generateQuoteReport)(marketOperation, [orderbookOrder1], twoHopSample);
        const twoHopSource = {
            liquiditySource: types_1.ERC20BridgeSource.MultiHop,
            makerAmount: twoHopSample.output,
            takerAmount: twoHopSample.input,
            hopSources: [types_1.ERC20BridgeSource.Balancer, types_1.ERC20BridgeSource.Curve],
            fillData: twoHopFillData,
        };
        // No entry is present in considered because No RFQ orders were reported.
        const expectedSourcesConsidered = [];
        expectEqualQuoteReportEntries(orderReport.sourcesConsidered, expectedSourcesConsidered, `sourcesConsidered`);
        expect(orderReport.sourcesDelivered.length).to.eql(1);
        expect(orderReport.sourcesDelivered[0]).to.deep.equal(twoHopSource);
    });
});
function expectEqualQuoteReportEntries(actual, expected, variableName = 'quote report entries') {
    expect(actual.length).to.eql(expected.length);
    actual.forEach((actualEntry, idx) => {
        const expectedEntry = expected[idx];
        // remove fillable values
        if (actualEntry.liquiditySource === types_1.ERC20BridgeSource.Native) {
            actualEntry.fillData.order = _.omit(actualEntry.fillData.order, [
                'fillableMakerAmount',
                'fillableTakerAmount',
                'fillableTakerFeeAmount',
            ]);
            expect(actualEntry.fillData.order).to.eql(expectedEntry.fillData.order, `${variableName} incorrect at index ${idx}`);
        }
        expect(_.omit(actualEntry, 'fillData')).to.eql(_.omit(expectedEntry, 'fillData'), `${variableName} incorrect at index ${idx}`);
    });
}
//# sourceMappingURL=quote_report_generator_test.js.map