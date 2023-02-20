"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const types_1 = require("../../src/asset-swapper/types");
const quote_simulation_1 = require("../../src/asset-swapper/utils/quote_simulation");
describe('quote_simulation tests', async () => {
    const { NULL_ADDRESS } = contracts_test_utils_1.constants;
    const ZERO = new utils_1.BigNumber(0);
    const ONE = new utils_1.BigNumber(1);
    const MAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const TAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const GAS_SCHEDULE = (() => {
        const sources = Object.values(types_1.ERC20BridgeSource);
        return _.zipObject(sources, new Array(sources.length).fill(_.constant(1)));
    })();
    // Check if two numbers are within `maxError` error rate within each other.
    function assertRoughlyEquals(n1, n2, maxError = 1e-10) {
        // |n2-n1| / max(|n1|, |n2|)
        const err = n2.minus(n1).abs().div(utils_1.BigNumber.max(n1.abs(), n2.abs()));
        (0, contracts_test_utils_1.expect)(err).to.bignumber.lt(maxError);
    }
    function createQuoteFillOrders(opts = {}) {
        const { fillableInput, fillableOutput, inputFeeRate, outputFeeRate, count, side, type } = {
            fillableInput: getRandomOrderSize(),
            fillableOutput: getRandomOrderSize(),
            inputFeeRate: 0,
            outputFeeRate: 0,
            count: 3,
            side: types_1.MarketOperation.Sell,
            ...opts,
        };
        const _inputFeeRate = side === types_1.MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
        const _outputFeeRate = side === types_1.MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
        const fillableInputs = subdivideAmount(fillableInput, count);
        const fillableOutputs = subdivideAmount(fillableOutput, count);
        const filledInputs = subdivideAmount(fillableInput.times(0.5), count);
        const filledOutputs = [];
        const totalInputs = [];
        const totalOutputs = [];
        const inputFees = [];
        const outputFees = [];
        _.times(count).forEach((i) => {
            const f = filledInputs[i].div(fillableInputs[i]);
            filledOutputs.push(fillableOutputs[i].times(f).integerValue(utils_1.BigNumber.ROUND_DOWN));
            totalInputs.push(fillableInputs[i].plus(filledInputs[i]));
            totalOutputs.push(fillableOutputs[i].plus(filledOutputs[i]));
            inputFees.push(totalInputs[i].times(_inputFeeRate).integerValue());
            outputFees.push(totalOutputs[i].times(_outputFeeRate).integerValue());
        });
        return _.times(count, (i) => {
            return {
                order: createQuoteFillOrderOrder(totalInputs[i], totalOutputs[i], {
                    side,
                    filledInput: filledInputs[i],
                    takerInputFee: inputFees[i].abs(),
                    takerOutputFee: outputFees[i].abs(),
                    type,
                }),
                totalOrderInput: totalInputs[i],
                totalOrderOutput: totalOutputs[i],
                totalOrderInputFee: inputFees[i],
                totalOrderOutputFee: outputFees[i],
            };
        });
    }
    function createQuoteFillOrderOrder(input, output, opts = {}) {
        const { filledInput, side, takerInputFee, takerOutputFee, type } = _.merge({}, {
            side: types_1.MarketOperation.Sell,
            filledInput: ZERO,
            takerInputFee: ZERO,
            takerOutputFee: ZERO,
            type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
        }, opts);
        const filledOutput = filledInput.div(input).times(output).integerValue(utils_1.BigNumber.ROUND_DOWN);
        const fillableInput = input.minus(filledInput);
        const fillableOutput = output.minus(filledOutput);
        const makerAmount = side === types_1.MarketOperation.Sell ? output : input;
        const takerAmount = side === types_1.MarketOperation.Sell ? input : output;
        const fillableMakerAmount = side === types_1.MarketOperation.Sell ? fillableOutput : fillableInput;
        const fillableTakerAmount = side === types_1.MarketOperation.Sell ? fillableInput : fillableOutput;
        const takerFee = utils_1.BigNumber.max(takerInputFee, takerOutputFee);
        switch (type) {
            case protocol_utils_1.FillQuoteTransformerOrderType.Bridge:
                throw new Error('unimplemented');
            case protocol_utils_1.FillQuoteTransformerOrderType.Limit:
                return {
                    source: types_1.ERC20BridgeSource.Native,
                    makerToken: MAKER_TOKEN,
                    takerToken: TAKER_TOKEN,
                    makerAmount: fillableMakerAmount,
                    takerAmount: fillableTakerAmount,
                    fillData: {
                        order: {
                            makerToken: MAKER_TOKEN,
                            makerAmount,
                            takerToken: TAKER_TOKEN,
                            takerAmount,
                            maker: NULL_ADDRESS,
                            taker: NULL_ADDRESS,
                            sender: NULL_ADDRESS,
                            salt: ZERO,
                            chainId: 1,
                            pool: utils_1.NULL_BYTES,
                            verifyingContract: NULL_ADDRESS,
                            expiry: ZERO,
                            feeRecipient: NULL_ADDRESS,
                            takerTokenFeeAmount: takerFee,
                        },
                        signature: { v: 1, r: utils_1.NULL_BYTES, s: utils_1.NULL_BYTES, signatureType: protocol_utils_1.SignatureType.EthSign },
                        maxTakerTokenFillAmount: fillableTakerAmount,
                    },
                    type,
                    fill: createOrderFill(fillableInput, fillableOutput),
                };
            case protocol_utils_1.FillQuoteTransformerOrderType.Rfq:
                return {
                    source: types_1.ERC20BridgeSource.Native,
                    makerToken: MAKER_TOKEN,
                    takerToken: TAKER_TOKEN,
                    makerAmount: fillableMakerAmount,
                    takerAmount: fillableTakerAmount,
                    fillData: {
                        order: {
                            makerToken: MAKER_TOKEN,
                            makerAmount,
                            takerToken: TAKER_TOKEN,
                            takerAmount,
                            maker: NULL_ADDRESS,
                            taker: NULL_ADDRESS,
                            txOrigin: NULL_ADDRESS,
                            salt: ZERO,
                            chainId: 1,
                            pool: utils_1.NULL_BYTES,
                            verifyingContract: NULL_ADDRESS,
                            expiry: ZERO,
                        },
                        signature: { v: 1, r: utils_1.NULL_BYTES, s: utils_1.NULL_BYTES, signatureType: protocol_utils_1.SignatureType.EthSign },
                        maxTakerTokenFillAmount: fillableTakerAmount,
                    },
                    type,
                    fill: createOrderFill(fillableInput, fillableOutput),
                };
            case protocol_utils_1.FillQuoteTransformerOrderType.Otc:
                throw new Error('unimplemented');
            default:
                ((_) => {
                    throw new Error('unreachable');
                })(type);
        }
    }
    const nativeSourcePathId = utils_1.hexUtils.random();
    function createOrderFill(input, output) {
        return {
            type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
            sourcePathId: nativeSourcePathId,
            source: types_1.ERC20BridgeSource.Uniswap,
            fillData: {},
            input,
            output,
            flags: BigInt(0),
            adjustedOutput: output,
            gas: 1,
        };
    }
    function randomSide() {
        return _.sampleSize(Object.values(types_1.MarketOperation), 1)[0];
    }
    function getRandomOrderSize() {
        return (0, contracts_test_utils_1.getRandomInteger)('100e18', '1000e18');
    }
    function getRandomFeeRate() {
        return _.random(0.01, 0.25, true);
    }
    function assertEqualRates(actual, expected) {
        (0, contracts_test_utils_1.expect)(new utils_1.BigNumber(actual).times(1e4).integerValue()).to.bignumber.eq(new utils_1.BigNumber(expected).times(1e4).integerValue());
    }
    function subdivideAmount(amount, count) {
        const amounts = [];
        for (let i = 0; i < count; ++i) {
            const remaining = amount.minus(utils_1.BigNumber.sum(0, ...amounts));
            if (i !== count - 1) {
                amounts.push(remaining.times(Math.random()).integerValue());
            }
            else {
                amounts.push(remaining.integerValue());
            }
        }
        return amounts;
    }
    describe('fillQuoteOrders()', () => {
        describe('single order', () => {
            it('can exactly fill one order', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    side,
                    count: 1,
                });
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, fillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                (0, contracts_test_utils_1.expect)(totalFilledInput).to.bignumber.eq(fillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('can partially fill one simple order', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    side,
                    count: 1,
                });
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                (0, contracts_test_utils_1.expect)(totalFilledInput).to.bignumber.eq(inputFillAmount);
                const expectedOutputFilledAmount = inputFillAmount
                    .div(fillableInput)
                    .times(fillableOutput)
                    .integerValue();
                assertRoughlyEquals(totalFilledOutput, expectedOutputFilledAmount);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('can partially fill one batched order', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    side,
                    count: 1,
                });
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                (0, contracts_test_utils_1.expect)(totalFilledInput).to.bignumber.eq(inputFillAmount);
                (0, contracts_test_utils_1.expect)(totalFilledOutput).to.bignumber.lt(fillableOutput);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('does not over fill one order', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    side,
                    count: 1,
                });
                const inputFillAmount = fillableInput.times(3 / 2).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                (0, contracts_test_utils_1.expect)(totalFilledInput).to.bignumber.eq(fillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('can exactly fill one order with input fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                    count: 1,
                });
                const signedInputFeeRate = side === types_1.MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, totalFillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, totalFillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('can partially fill one order with input fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                    count: 1,
                });
                const signedInputFeeRate = side === types_1.MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const inputFillAmount = totalFillableInput.times(2 / 3).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, inputFillAmount);
                (0, contracts_test_utils_1.expect)(totalFilledOutput).to.bignumber.lt(fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('does not over fill one order with input fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                    count: 1,
                });
                const signedInputFeeRate = side === types_1.MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const inputFillAmount = totalFillableInput.times(3 / 2).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, totalFillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('can exactly fill one order with output fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                    count: 1,
                });
                const signedOutputFeeRate = side === types_1.MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, fillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, fillableInput);
                assertRoughlyEquals(totalFilledOutput, totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('can partial fill one order with output fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                    count: 1,
                });
                const signedOutputFeeRate = side === types_1.MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, inputFillAmount);
                (0, contracts_test_utils_1.expect)(totalFilledOutput).to.bignumber.lt(totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('does not over fill one order with output fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                    count: 1,
                });
                const signedOutputFeeRate = side === types_1.MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const inputFillAmount = fillableInput.times(3 / 2).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, fillableInput);
                assertRoughlyEquals(totalFilledOutput, totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(1);
            });
            it('does not charge a protocol fee for rfq orders', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    side,
                    count: 1,
                    type: protocol_utils_1.FillQuoteTransformerOrderType.Rfq,
                });
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, fillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                (0, contracts_test_utils_1.expect)(totalFilledInput).to.bignumber.eq(fillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(0);
            });
        });
        describe('multiple orders', () => {
            it('can exactly fill orders', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const fillOrders = createQuoteFillOrders({ fillableInput, fillableOutput, side });
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, fillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                (0, contracts_test_utils_1.expect)(totalFilledInput).to.bignumber.eq(fillableInput);
                (0, contracts_test_utils_1.expect)(totalFilledOutput).to.bignumber.eq(fillableOutput);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(fillOrders.length);
            });
            it('can partial fill orders', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const fillOrders = createQuoteFillOrders({ fillableInput, fillableOutput, side });
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                (0, contracts_test_utils_1.expect)(totalFilledInput).to.bignumber.eq(inputFillAmount);
                (0, contracts_test_utils_1.expect)(totalFilledOutput).to.bignumber.lt(fillableOutput);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.gte(1);
            });
            it('does not over fill orders', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFillAmount = fillableInput.times(3 / 2).integerValue();
                const fillOrders = createQuoteFillOrders({ fillableInput, fillableOutput, side });
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                (0, contracts_test_utils_1.expect)(totalFilledInput).to.bignumber.eq(fillableInput);
                (0, contracts_test_utils_1.expect)(totalFilledOutput).to.bignumber.eq(fillableOutput);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(fillOrders.length);
            });
            it('can exactly fill orders with input fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                });
                const signedInputFeeRate = side === types_1.MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, totalFillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, totalFillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(fillOrders.length);
            });
            it('can partial fill orders with input fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                });
                const signedInputFeeRate = side === types_1.MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const inputFillAmount = totalFillableInput.times(2 / 3).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, inputFillAmount);
                (0, contracts_test_utils_1.expect)(totalFilledOutput).to.bignumber.lt(fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.lte(fillOrders.length);
            });
            it('does not over fill orders with input fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const inputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    inputFeeRate,
                    side,
                });
                const signedInputFeeRate = side === types_1.MarketOperation.Sell ? inputFeeRate : -inputFeeRate;
                const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
                const inputFillAmount = totalFillableInput.times(3 / 2).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, totalFillableInput);
                assertRoughlyEquals(totalFilledOutput, fillableOutput);
                assertEqualRates(result.inputFee.div(result.input), signedInputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(fillOrders.length);
            });
            it('can exactly fill orders with output fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                });
                const signedOutputFeeRate = side === types_1.MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, fillableInput, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, fillableInput);
                assertRoughlyEquals(totalFilledOutput, totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(fillOrders.length);
            });
            it('can partial fill orders with output fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                });
                const signedOutputFeeRate = side === types_1.MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const inputFillAmount = fillableInput.times(2 / 3).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, inputFillAmount);
                (0, contracts_test_utils_1.expect)(totalFilledOutput).to.bignumber.lt(totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.lte(fillOrders.length);
            });
            it('does not over fill orders with output fees', () => {
                const side = randomSide();
                const fillableInput = getRandomOrderSize();
                const fillableOutput = getRandomOrderSize();
                const outputFeeRate = getRandomFeeRate();
                const fillOrders = createQuoteFillOrders({
                    fillableInput,
                    fillableOutput,
                    outputFeeRate,
                    side,
                });
                const signedOutputFeeRate = side === types_1.MarketOperation.Sell ? -outputFeeRate : outputFeeRate;
                const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
                const inputFillAmount = fillableInput.times(3 / 2).integerValue();
                const result = (0, quote_simulation_1.fillQuoteOrders)(fillOrders, inputFillAmount, ONE, GAS_SCHEDULE);
                const totalFilledInput = result.input.plus(result.inputFee);
                const totalFilledOutput = result.output.plus(result.outputFee);
                assertRoughlyEquals(totalFilledInput, fillableInput);
                assertRoughlyEquals(totalFilledOutput, totalFillableOutput);
                assertEqualRates(result.outputFee.div(result.output), signedOutputFeeRate);
                (0, contracts_test_utils_1.expect)(result.protocolFee).to.bignumber.eq(fillOrders.length);
            });
        });
    });
    function slipOrder(order, orderSlippage, side) {
        const makerScaling = side === types_1.MarketOperation.Sell ? 1 - orderSlippage : 1;
        const takerScaling = side === types_1.MarketOperation.Sell ? 1 : orderSlippage + 1;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
        const nativeFillData = order.fillData;
        const slippedFillData = {
            order: {
                ...nativeFillData.order,
                takerAmount: nativeFillData.order.takerAmount.times(takerScaling),
                makerAmount: nativeFillData.order.makerAmount.times(makerScaling),
            },
            signature: nativeFillData.signature,
            maxTakerTokenFillAmount: nativeFillData.maxTakerTokenFillAmount.times(takerScaling),
        };
        return {
            ...order,
            makerAmount: order.makerAmount.times(makerScaling),
            takerAmount: order.takerAmount.times(takerScaling),
            fillData: slippedFillData,
        };
    }
    describe('simulateBestCaseFill()', () => {
        it('ignores order slippage', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const orderSlippage = getRandomFeeRate();
            const fillOrders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                side,
            });
            const orders = fillOrders.map((fo) => slipOrder(fo.order, orderSlippage, side));
            const result = (0, quote_simulation_1.simulateBestCaseFill)({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, protocolFeeMultiplier: ONE },
            });
            if (side === types_1.MarketOperation.Sell) {
                (0, contracts_test_utils_1.expect)(result.totalMakerAssetAmount).to.be.bignumber.eq(fillableOutput);
                (0, contracts_test_utils_1.expect)(result.totalTakerAssetAmount).to.be.bignumber.eq(fillableInput);
            }
            else {
                (0, contracts_test_utils_1.expect)(result.totalMakerAssetAmount).to.be.bignumber.eq(fillableInput);
                (0, contracts_test_utils_1.expect)(result.totalTakerAssetAmount).to.be.bignumber.eq(fillableOutput);
            }
        });
        it('can fully fill orders', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                side,
            }).map((fo) => fo.order);
            const result = (0, quote_simulation_1.simulateBestCaseFill)({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, protocolFeeMultiplier: ONE },
            });
            (0, contracts_test_utils_1.expect)(result.protocolFeeAmount).to.bignumber.eq(orders.length);
            (0, contracts_test_utils_1.expect)(result.takerFeeTakerAssetAmount).to.bignumber.eq(0);
            (0, contracts_test_utils_1.expect)(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
            (0, contracts_test_utils_1.expect)(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
            (0, contracts_test_utils_1.expect)(result.takerAssetAmount).to.bignumber.eq(result.totalTakerAssetAmount);
            if (side === types_1.MarketOperation.Sell) {
                (0, contracts_test_utils_1.expect)(result.totalMakerAssetAmount).to.be.bignumber.eq(fillableOutput);
                (0, contracts_test_utils_1.expect)(result.totalTakerAssetAmount).to.be.bignumber.eq(fillableInput);
            }
            else {
                (0, contracts_test_utils_1.expect)(result.totalMakerAssetAmount).to.be.bignumber.eq(fillableInput);
                (0, contracts_test_utils_1.expect)(result.totalTakerAssetAmount).to.be.bignumber.eq(fillableOutput);
            }
        });
        it('can partial fill orders', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                side,
            }).map((fo) => fo.order);
            const inputFillAmount = fillableInput.times(Math.random()).integerValue();
            const result = (0, quote_simulation_1.simulateBestCaseFill)({
                orders,
                side,
                fillAmount: inputFillAmount,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, protocolFeeMultiplier: ONE },
            });
            (0, contracts_test_utils_1.expect)(result.gas).to.gt(0);
            (0, contracts_test_utils_1.expect)(result.protocolFeeAmount).to.bignumber.gt(0);
            (0, contracts_test_utils_1.expect)(result.takerFeeTakerAssetAmount).to.bignumber.eq(0);
            (0, contracts_test_utils_1.expect)(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
            (0, contracts_test_utils_1.expect)(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
            (0, contracts_test_utils_1.expect)(result.takerAssetAmount).to.bignumber.eq(result.totalTakerAssetAmount);
            if (side === types_1.MarketOperation.Sell) {
                (0, contracts_test_utils_1.expect)(result.totalMakerAssetAmount).to.be.bignumber.lt(fillableOutput);
                (0, contracts_test_utils_1.expect)(result.totalTakerAssetAmount).to.be.bignumber.eq(inputFillAmount);
            }
            else {
                (0, contracts_test_utils_1.expect)(result.totalMakerAssetAmount).to.be.bignumber.eq(inputFillAmount);
                (0, contracts_test_utils_1.expect)(result.totalTakerAssetAmount).to.be.bignumber.lt(fillableOutput);
            }
        });
        it('can fully fill sell orders with "input" fees', async () => {
            const side = types_1.MarketOperation.Sell;
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const inputFeeRate = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                inputFeeRate,
            }).map((fo) => fo.order);
            const signedInputFeeRate = inputFeeRate;
            const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
            const result = (0, quote_simulation_1.simulateBestCaseFill)({
                orders,
                side,
                fillAmount: totalFillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, protocolFeeMultiplier: ONE },
            });
            assertRoughlyEquals(result.takerAssetAmount, fillableInput);
            assertRoughlyEquals(result.totalTakerAssetAmount, totalFillableInput);
            assertRoughlyEquals(result.makerAssetAmount, fillableOutput);
            assertRoughlyEquals(result.totalMakerAssetAmount, fillableOutput);
            (0, contracts_test_utils_1.expect)(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
            (0, contracts_test_utils_1.expect)(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
        });
        it('can partially fill sell orders with "input" fees', async () => {
            const side = types_1.MarketOperation.Sell;
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const inputFeeRate = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                inputFeeRate,
                side,
            }).map((fo) => fo.order);
            const signedInputFeeRate = inputFeeRate;
            const totalFillableInput = fillableInput.times(signedInputFeeRate + 1).integerValue();
            const inputFillAmount = totalFillableInput.times(2 / 3).integerValue();
            const result = (0, quote_simulation_1.simulateBestCaseFill)({
                orders,
                side,
                fillAmount: inputFillAmount,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, protocolFeeMultiplier: ONE },
            });
            (0, contracts_test_utils_1.expect)(result.gas).to.gt(0);
            (0, contracts_test_utils_1.expect)(result.protocolFeeAmount).to.bignumber.gt(0);
            assertRoughlyEquals(result.totalTakerAssetAmount, inputFillAmount);
            (0, contracts_test_utils_1.expect)(result.makerAssetAmount).to.bignumber.lt(fillableOutput);
            (0, contracts_test_utils_1.expect)(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
            (0, contracts_test_utils_1.expect)(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
        });
        it('can fully fill buy orders with "output" fees', async () => {
            const side = types_1.MarketOperation.Buy;
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const outputFeeRate = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                outputFeeRate,
                side,
            }).map((fo) => fo.order);
            const signedOutputFeeRate = outputFeeRate;
            const totalFillableOutput = fillableOutput.times(signedOutputFeeRate + 1).integerValue();
            const result = (0, quote_simulation_1.simulateBestCaseFill)({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, protocolFeeMultiplier: ONE },
            });
            (0, contracts_test_utils_1.expect)(result.protocolFeeAmount).to.bignumber.eq(orders.length);
            assertRoughlyEquals(result.makerAssetAmount, fillableInput);
            assertRoughlyEquals(result.totalMakerAssetAmount, fillableInput);
            assertRoughlyEquals(result.takerAssetAmount, fillableOutput);
            assertRoughlyEquals(result.totalTakerAssetAmount, totalFillableOutput);
            (0, contracts_test_utils_1.expect)(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
            (0, contracts_test_utils_1.expect)(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
        });
        it('can partially fill buy orders with "output" fees', async () => {
            const side = types_1.MarketOperation.Buy;
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const outputFeeRate = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                outputFeeRate,
                side,
            }).map((fo) => fo.order);
            const inputFillAmount = fillableInput.times(2 / 3).integerValue();
            const result = (0, quote_simulation_1.simulateBestCaseFill)({
                orders,
                side,
                fillAmount: inputFillAmount,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, protocolFeeMultiplier: ONE },
            });
            (0, contracts_test_utils_1.expect)(result.gas).to.gt(0);
            (0, contracts_test_utils_1.expect)(result.protocolFeeAmount).to.bignumber.gt(0);
            assertRoughlyEquals(result.totalMakerAssetAmount, inputFillAmount);
            (0, contracts_test_utils_1.expect)(result.takerAssetAmount).to.bignumber.lt(fillableOutput);
            (0, contracts_test_utils_1.expect)(result.makerAssetAmount).to.bignumber.eq(result.totalMakerAssetAmount);
            (0, contracts_test_utils_1.expect)(result.takerFeeMakerAssetAmount).to.bignumber.eq(0);
        });
    });
    describe('simulateWorstCaseFill()', () => {
        it('includes order slippage', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const slippage = getRandomFeeRate();
            const orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                side,
            }).map((fo) => fo.order);
            const result = (0, quote_simulation_1.simulateWorstCaseFill)({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, protocolFeeMultiplier: ONE, slippage },
            });
            if (side === types_1.MarketOperation.Sell) {
                const slippedOutput = fillableOutput.times(1 - slippage).integerValue();
                assertRoughlyEquals(result.totalMakerAssetAmount, slippedOutput);
                assertRoughlyEquals(result.totalTakerAssetAmount, fillableInput);
            }
            else {
                const slippedOutput = fillableOutput.times(slippage + 1).integerValue();
                assertRoughlyEquals(result.totalMakerAssetAmount, fillableInput);
                assertRoughlyEquals(result.totalTakerAssetAmount, slippedOutput);
            }
        });
        it('expects worse price than the best case, even if orders are unsorted', async () => {
            const side = randomSide();
            const fillableInput = getRandomOrderSize();
            const fillableOutput = getRandomOrderSize();
            const orderSlippage = getRandomFeeRate();
            let orders = createQuoteFillOrders({
                fillableInput,
                fillableOutput,
                side,
            }).map((fo) => slipOrder(fo.order, orderSlippage, side));
            orders = [...orders.slice(1), orders[0]];
            const bestCase = (0, quote_simulation_1.simulateBestCaseFill)({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, protocolFeeMultiplier: ONE },
            });
            const worstCase = (0, quote_simulation_1.simulateWorstCaseFill)({
                orders,
                side,
                fillAmount: fillableInput,
                gasPrice: ONE,
                opts: { gasSchedule: GAS_SCHEDULE, slippage: orderSlippage },
            });
            const bestPrice = bestCase.makerAssetAmount.div(bestCase.totalTakerAssetAmount);
            const worstPrice = worstCase.makerAssetAmount.div(worstCase.totalTakerAssetAmount);
            (0, contracts_test_utils_1.expect)(worstPrice).to.be.bignumber.lt(bestPrice);
        });
    });
});
//# sourceMappingURL=quote_simulation_test.js.map