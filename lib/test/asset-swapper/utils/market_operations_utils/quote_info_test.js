"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const chai = require("chai");
require("mocha");
const types_1 = require("../../../../src/asset-swapper/types");
const constants_1 = require("../../../../src/asset-swapper/utils/market_operation_utils/constants");
const quote_info_1 = require("../../../../src/asset-swapper/utils/quote_info");
const chai_setup_1 = require("../chai_setup");
const _ = require("lodash");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
const FAKE_GAS_SCHEDULE = (() => {
    const sources = Object.values(types_1.ERC20BridgeSource);
    const gasSchedule = _.zipObject(sources, new Array(sources.length).fill(() => 100e3));
    gasSchedule[types_1.ERC20BridgeSource.Native] = () => 50e3;
    gasSchedule[types_1.ERC20BridgeSource.MultiHop] = () => 242e3;
    return gasSchedule;
})();
describe('QuoteInfo', () => {
    describe('calculateQuoteInfo()', () => {
        it('Returns quote info for single hop orders (sell)', async () => {
            const path = createFakePath({
                ordersByType: {
                    nativeOrders: [],
                    bridgeOrders: [
                        {
                            type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
                            source: types_1.ERC20BridgeSource.UniswapV2,
                            makerToken: 'fake-usdc-address',
                            takerToken: 'fake-weth-address',
                            takerAmount: constants_1.ONE_ETHER,
                            makerAmount: constants_1.ONE_ETHER.times(1000),
                            fillData: {},
                            fill: {
                                input: constants_1.ONE_ETHER,
                                output: constants_1.ONE_ETHER.times(1000),
                                adjustedOutput: constants_1.ONE_ETHER.times(990),
                                gas: 0,
                            },
                        },
                        {
                            type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
                            source: types_1.ERC20BridgeSource.Curve,
                            makerToken: 'fake-usdc-address',
                            takerToken: 'fake-weth-address',
                            takerAmount: constants_1.ONE_ETHER,
                            makerAmount: constants_1.ONE_ETHER.times(1000),
                            fillData: {},
                            fill: {
                                input: constants_1.ONE_ETHER,
                                output: constants_1.ONE_ETHER.times(1000),
                                adjustedOutput: constants_1.ONE_ETHER.times(990),
                                gas: 0,
                            },
                        },
                    ],
                    twoHopOrders: [],
                },
            });
            const quoteInfo = (0, quote_info_1.calculateQuoteInfo)({
                path,
                operation: types_1.MarketOperation.Sell,
                assetFillAmount: constants_1.ONE_ETHER.times(2),
                gasPrice: new utils_1.BigNumber(0),
                gasSchedule: FAKE_GAS_SCHEDULE,
                slippage: 0.01,
            });
            expect(quoteInfo.bestCaseQuoteInfo).to.be.deep.eq({
                makerAmount: constants_1.ONE_ETHER.times(2000),
                takerAmount: constants_1.ONE_ETHER.times(2),
                totalTakerAmount: constants_1.ONE_ETHER.times(2),
                protocolFeeInWeiAmount: new utils_1.BigNumber(0),
                gas: 200e3,
                slippage: 0,
            });
            expect(quoteInfo.worstCaseQuoteInfo).to.be.deep.eq({
                makerAmount: constants_1.ONE_ETHER.times(1980),
                takerAmount: constants_1.ONE_ETHER.times(2),
                totalTakerAmount: constants_1.ONE_ETHER.times(2),
                protocolFeeInWeiAmount: new utils_1.BigNumber(0),
                gas: 200e3,
                slippage: 0.01,
            });
            expect(quoteInfo.sourceBreakdown).to.be.deep.eq({
                singleSource: {
                    [types_1.ERC20BridgeSource.UniswapV2]: new utils_1.BigNumber(0.5),
                    [types_1.ERC20BridgeSource.Curve]: new utils_1.BigNumber(0.5),
                },
                multihop: [],
            });
        });
        it('Returns quote info for a two hop order (sell)', async () => {
            const path = createFakePath({
                ordersByType: {
                    nativeOrders: [],
                    twoHopOrders: [
                        {
                            firstHopOrder: {
                                type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
                                source: types_1.ERC20BridgeSource.Curve,
                                takerToken: 'fake-weth-address',
                                makerToken: 'fake-usdt-address',
                                takerAmount: constants_1.ONE_ETHER,
                                makerAmount: new utils_1.BigNumber(0),
                                fillData: {},
                                fill: {
                                    input: constants_1.ONE_ETHER,
                                    output: new utils_1.BigNumber(0),
                                    adjustedOutput: new utils_1.BigNumber(0),
                                    gas: 1,
                                },
                            },
                            secondHopOrder: {
                                type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
                                source: types_1.ERC20BridgeSource.BalancerV2,
                                takerToken: 'fake-usdt-address',
                                makerToken: 'fake-usdc-address',
                                takerAmount: constants_1.MAX_UINT256,
                                makerAmount: constants_1.ONE_ETHER.times(1000),
                                fillData: {},
                                fill: {
                                    input: constants_1.MAX_UINT256,
                                    output: constants_1.ONE_ETHER.times(1000),
                                    adjustedOutput: constants_1.ONE_ETHER.times(1000),
                                    gas: 1,
                                },
                            },
                        },
                    ],
                    bridgeOrders: [],
                },
            });
            const quoteInfo = (0, quote_info_1.calculateQuoteInfo)({
                path,
                operation: types_1.MarketOperation.Sell,
                assetFillAmount: constants_1.ONE_ETHER,
                gasPrice: new utils_1.BigNumber(0),
                gasSchedule: FAKE_GAS_SCHEDULE,
                slippage: 0.01,
            });
            expect(quoteInfo.bestCaseQuoteInfo).to.be.deep.eq({
                makerAmount: constants_1.ONE_ETHER.times(1000),
                takerAmount: constants_1.ONE_ETHER,
                totalTakerAmount: constants_1.ONE_ETHER,
                protocolFeeInWeiAmount: new utils_1.BigNumber(0),
                gas: 242e3,
                slippage: 0,
            });
            expect(quoteInfo.worstCaseQuoteInfo).to.be.deep.eq({
                makerAmount: constants_1.ONE_ETHER.times(990),
                takerAmount: constants_1.ONE_ETHER,
                totalTakerAmount: constants_1.ONE_ETHER,
                protocolFeeInWeiAmount: new utils_1.BigNumber(0),
                gas: 242e3,
                slippage: 0.01,
            });
            expect(quoteInfo.sourceBreakdown).to.be.deep.eq({
                singleSource: {},
                multihop: [
                    {
                        proportion: new utils_1.BigNumber(1),
                        intermediateToken: 'fake-usdt-address',
                        hops: [types_1.ERC20BridgeSource.Curve, types_1.ERC20BridgeSource.BalancerV2],
                    },
                ],
            });
        });
        it('Returns aggregated quote info for all orders (sell)', async () => {
            const path = createFakePath({
                ordersByType: {
                    nativeOrders: [
                        {
                            type: protocol_utils_1.FillQuoteTransformerOrderType.Otc,
                            source: types_1.ERC20BridgeSource.Native,
                            makerToken: 'fake-usdc-address',
                            takerToken: 'fake-weth-address',
                            takerAmount: constants_1.ONE_ETHER,
                            makerAmount: constants_1.ONE_ETHER.times(1000),
                            fillData: {
                                order: {
                                    takerToken: 'fake-weth-address',
                                    makerToken: 'fake-usdc-address',
                                },
                            },
                            fill: {
                                input: constants_1.ONE_ETHER,
                                output: constants_1.ONE_ETHER.times(1000),
                                adjustedOutput: constants_1.ONE_ETHER.times(1000),
                                gas: 0,
                            },
                        },
                    ],
                    bridgeOrders: [
                        {
                            type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
                            source: types_1.ERC20BridgeSource.UniswapV2,
                            makerToken: 'fake-usdc-address',
                            takerToken: 'fake-weth-address',
                            takerAmount: constants_1.ONE_ETHER,
                            makerAmount: constants_1.ONE_ETHER.times(1000),
                            fillData: {},
                            fill: {
                                input: constants_1.ONE_ETHER,
                                output: constants_1.ONE_ETHER.times(1000),
                                adjustedOutput: constants_1.ONE_ETHER.times(990),
                                gas: 0,
                            },
                        },
                        {
                            type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
                            source: types_1.ERC20BridgeSource.Curve,
                            makerToken: 'fake-usdc-address',
                            takerToken: 'fake-weth-address',
                            takerAmount: constants_1.ONE_ETHER,
                            makerAmount: constants_1.ONE_ETHER.times(1000),
                            fillData: {},
                            fill: {
                                input: constants_1.ONE_ETHER,
                                output: constants_1.ONE_ETHER.times(1000),
                                adjustedOutput: constants_1.ONE_ETHER.times(990),
                                gas: 0,
                            },
                        },
                    ],
                    twoHopOrders: [
                        {
                            firstHopOrder: {
                                type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
                                source: types_1.ERC20BridgeSource.Curve,
                                takerToken: 'fake-weth-address',
                                makerToken: 'fake-usdt-address',
                                takerAmount: constants_1.ONE_ETHER,
                                makerAmount: new utils_1.BigNumber(0),
                                fillData: {},
                                fill: {
                                    input: constants_1.ONE_ETHER,
                                    output: new utils_1.BigNumber(0),
                                    adjustedOutput: new utils_1.BigNumber(0),
                                    gas: 1,
                                },
                            },
                            secondHopOrder: {
                                type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
                                source: types_1.ERC20BridgeSource.BalancerV2,
                                takerToken: 'fake-usdt-address',
                                makerToken: 'fake-usdc-address',
                                takerAmount: constants_1.MAX_UINT256,
                                makerAmount: constants_1.ONE_ETHER.times(1000),
                                fillData: {},
                                fill: {
                                    input: constants_1.MAX_UINT256,
                                    output: constants_1.ONE_ETHER.times(1000),
                                    adjustedOutput: constants_1.ONE_ETHER.times(1000),
                                    gas: 1,
                                },
                            },
                        },
                    ],
                },
            });
            const quoteInfo = (0, quote_info_1.calculateQuoteInfo)({
                path,
                operation: types_1.MarketOperation.Sell,
                assetFillAmount: constants_1.ONE_ETHER.times(4),
                gasPrice: new utils_1.BigNumber(0),
                gasSchedule: FAKE_GAS_SCHEDULE,
                slippage: 0.01,
            });
            expect(quoteInfo.bestCaseQuoteInfo).to.be.deep.eq({
                makerAmount: constants_1.ONE_ETHER.times(4000),
                takerAmount: constants_1.ONE_ETHER.times(4),
                totalTakerAmount: constants_1.ONE_ETHER.times(4),
                protocolFeeInWeiAmount: new utils_1.BigNumber(0),
                gas: 50e3 + 200e3 + 242e3,
                slippage: 0,
            });
            expect(quoteInfo.worstCaseQuoteInfo).to.be.deep.eq({
                makerAmount: constants_1.ONE_ETHER.times(3960),
                takerAmount: constants_1.ONE_ETHER.times(4),
                totalTakerAmount: constants_1.ONE_ETHER.times(4),
                protocolFeeInWeiAmount: new utils_1.BigNumber(0),
                gas: 50e3 + 200e3 + 242e3,
                slippage: 0.01,
            });
            expect(quoteInfo.sourceBreakdown).to.be.deep.eq({
                singleSource: {
                    [types_1.ERC20BridgeSource.Native]: new utils_1.BigNumber(0.25),
                    [types_1.ERC20BridgeSource.UniswapV2]: new utils_1.BigNumber(0.25),
                    [types_1.ERC20BridgeSource.Curve]: new utils_1.BigNumber(0.25),
                },
                multihop: [
                    {
                        proportion: new utils_1.BigNumber(0.25),
                        intermediateToken: 'fake-usdt-address',
                        hops: [types_1.ERC20BridgeSource.Curve, types_1.ERC20BridgeSource.BalancerV2],
                    },
                ],
            });
        });
    });
});
function createFakePath(params) {
    return {
        getOrdersByType: () => params.ordersByType,
        // unused
        hasTwoHop: () => false,
        getOrders: () => [],
        getSlippedOrders: () => [],
        getSlippedOrdersByType: () => {
            throw new Error('Unimplemented');
        },
    };
}
//# sourceMappingURL=quote_info_test.js.map