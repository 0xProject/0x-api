"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathOptimizer = void 0;
const assert_1 = require("@0x/assert");
const neon_router_1 = require("@0x/neon-router");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const perf_hooks_1 = require("perf_hooks");
const sampler_metrics_1 = require("../../../utils/sampler_metrics");
const constants_1 = require("../../constants");
const types_1 = require("../../types");
const constants_2 = require("./constants");
const fills_1 = require("./fills");
const path_1 = require("./path");
// NOTE: The Rust router will panic with less than 3 samples
const MIN_NUM_SAMPLE_INPUTS = 3;
const isDexSample = (obj) => !!obj.source;
const ONE_BASE_UNIT = new utils_1.BigNumber(1);
function nativeOrderToNormalizedAmounts(side, nativeOrder) {
    const { fillableTakerAmount, fillableTakerFeeAmount, fillableMakerAmount } = nativeOrder;
    const makerAmount = fillableMakerAmount;
    const takerAmount = fillableTakerAmount.plus(fillableTakerFeeAmount);
    const input = side === types_1.MarketOperation.Sell ? takerAmount : makerAmount;
    const output = side === types_1.MarketOperation.Sell ? makerAmount : takerAmount;
    return { input, output };
}
class PathOptimizer {
    constructor(context) {
        this.pathContext = context.pathContext;
        this.chainId = context.chainId;
        this.feeSchedule = context.feeSchedule;
        this.neonRouterNumSamples = context.neonRouterNumSamples;
        this.fillAdjustor = context.fillAdjustor;
        this.pathPenaltyOpts = context.pathPenaltyOpts;
        this.inputAmount = context.inputAmount;
    }
    findOptimalPathFromSamples(samples, twoHopQuotes, nativeOrders) {
        const beforeTimeMs = perf_hooks_1.performance.now();
        const sendMetrics = () => {
            sampler_metrics_1.SAMPLER_METRICS.logRouterDetails({
                router: 'neon-router',
                type: 'total',
                timingMs: perf_hooks_1.performance.now() - beforeTimeMs,
            });
        };
        const paths = this.findRoutesAndCreateOptimalPath(samples, twoHopQuotes, nativeOrders);
        if (!paths) {
            sendMetrics();
            return undefined;
        }
        const { allSourcesPath, vipSourcesPath } = paths;
        if (!allSourcesPath || (vipSourcesPath === null || vipSourcesPath === void 0 ? void 0 : vipSourcesPath.isAdjustedBetterThan(allSourcesPath))) {
            sendMetrics();
            return vipSourcesPath;
        }
        sendMetrics();
        return allSourcesPath;
    }
    findRoutesAndCreateOptimalPath(samples, twoHopSamples, nativeOrders) {
        // Currently the rust router is unable to handle 1 base unit sized quotes and will error out
        // To avoid flooding the logs with these errors we just return an insufficient liquidity error
        // which is how the JS router handles these quotes today
        const inputAmount = this.inputAmount;
        if (inputAmount.isLessThanOrEqualTo(ONE_BASE_UNIT)) {
            return undefined;
        }
        // Ensure the expected data we require exists. In the case where all hops reverted
        // or there were no sources included that allowed for multi hop,
        // we can end up with an empty, but not undefined, fill data.
        const validTwoHopSamples = twoHopSamples.map((samples) => {
            return samples.filter((sample) => sample &&
                sample.fillData &&
                sample.fillData.firstHopSource &&
                sample.fillData.secondHopSource &&
                sample.output.isGreaterThan(constants_2.ZERO_AMOUNT));
        });
        const singleSourceRoutablePaths = this.singleSourceSamplesToRoutablePaths(samples);
        const twoHopRoutablePaths = this.twoHopSamplesToRoutablePaths(validTwoHopSamples);
        const nativeOrderRoutablePaths = this.nativeOrdersToRoutablePaths(nativeOrders);
        const allRoutablePaths = [...singleSourceRoutablePaths, ...twoHopRoutablePaths, ...nativeOrderRoutablePaths];
        const serializedPaths = allRoutablePaths.map((path) => path.serializedPath);
        if (serializedPaths.length === 0) {
            return undefined;
        }
        const optimizerCapture = {
            side: this.pathContext.side,
            targetInput: inputAmount.toNumber(),
            pathsIn: serializedPaths,
        };
        const { allSourcesRoute, vipSourcesRoute } = routeFromNeonRouter({
            optimizerCapture,
            numSamples: this.neonRouterNumSamples,
        });
        const allSourcesPath = this.createPathFromRoute(allRoutablePaths, allSourcesRoute, optimizerCapture);
        const vipSourcesPath = this.createPathFromRoute(allRoutablePaths, vipSourcesRoute, optimizerCapture);
        return {
            allSourcesPath,
            vipSourcesPath,
        };
    }
    singleSourceSamplesToRoutablePaths(samples) {
        var _a;
        const routablePaths = [];
        const vipSourcesSet = constants_2.VIP_ERC20_BRIDGE_SOURCES_BY_CHAIN_ID[this.chainId];
        for (const singleSourceSamples of samples) {
            if (singleSourceSamples.length === 0) {
                continue;
            }
            const singleSourceSamplesWithOutput = [...singleSourceSamples];
            for (let i = singleSourceSamples.length - 1; i >= 0; i--) {
                const currentOutput = singleSourceSamples[i].output;
                if (currentOutput.isZero() || !currentOutput.isFinite()) {
                    // Remove trailing 0/invalid output samples
                    singleSourceSamplesWithOutput.pop();
                }
                else {
                    break;
                }
            }
            if (singleSourceSamplesWithOutput.length < MIN_NUM_SAMPLE_INPUTS) {
                continue;
            }
            // TODO: Do we need to handle 0 entries, from eg Kyber?
            const serializedPath = singleSourceSamplesWithOutput.reduce((memo, sample, sampleIdx) => {
                // Use the fill from createFillFromDexSample to apply
                // any user supplied adjustments
                const f = this.createFillFromDexSample(sample);
                memo.ids.push(`${f.source}-${routablePaths.length}-${sampleIdx}`);
                memo.inputs.push(f.input.integerValue().toNumber());
                memo.outputs.push(f.output.integerValue().toNumber());
                // Calculate the penalty of this sample as the diff between the
                // output and the adjusted output
                const outputFee = f.output.minus(f.adjustedOutput).absoluteValue().integerValue().toNumber();
                memo.outputFees.push(outputFee);
                return memo;
            }, {
                ids: [],
                inputs: [],
                outputs: [],
                outputFees: [],
                isVip: vipSourcesSet.has((_a = singleSourceSamplesWithOutput[0]) === null || _a === void 0 ? void 0 : _a.source),
            });
            const pathId = utils_1.hexUtils.random();
            routablePaths.push({
                pathId,
                samplesOrNativeOrders: singleSourceSamplesWithOutput,
                serializedPath,
            });
        }
        return routablePaths;
    }
    twoHopSamplesToRoutablePaths(twoHopSamples) {
        return twoHopSamples.map((samples, i) => {
            const fills = samples.map((sample) => this.createFillFromTwoHopSample(sample));
            const outputFees = fills.map((fill) => fill.output.minus(fill.adjustedOutput).absoluteValue().integerValue().toNumber());
            const serializedPath = {
                ids: fills.map((fill) => fill.sourcePathId),
                inputs: fills.map((fill) => fill.input.integerValue().toNumber()),
                outputs: fills.map((fill) => fill.output.integerValue().toNumber()),
                outputFees,
                isVip: false,
            };
            return {
                pathId: `two-hop-${i}`,
                samplesOrNativeOrders: samples,
                serializedPath,
            };
        });
    }
    nativeOrdersToRoutablePaths(nativeOrders) {
        const routablePaths = [];
        const nativeOrderSourcePathId = utils_1.hexUtils.random();
        for (const [idx, nativeOrder] of nativeOrders.entries()) {
            const { input: normalizedOrderInput, output: normalizedOrderOutput } = nativeOrderToNormalizedAmounts(this.pathContext.side, nativeOrder);
            // NOTE: skip dummy order created in swap_quoter
            // TODO: remove dummy order and this logic once we don't need the JS router
            if (normalizedOrderInput.isLessThanOrEqualTo(0) || normalizedOrderOutput.isLessThanOrEqualTo(0)) {
                continue;
            }
            const fee = this.calculateOutputFee(nativeOrder).integerValue().toNumber();
            // HACK: due to an issue with the Rust router interpolation we need to create exactly 13 samples from the native order
            const ids = [];
            const inputs = [];
            const outputs = [];
            const outputFees = [];
            // NOTE: Limit orders can be both larger or smaller than the input amount
            // If the order is larger than the input we can scale the order to the size of
            // the quote input (order pricing is constant) and then create 13 "samples" up to
            // and including the full quote input amount.
            // If the order is smaller we don't need to scale anything, we will just end up
            // with trailing duplicate samples for the order input as we cannot go higher
            const scaleToInput = utils_1.BigNumber.min(this.inputAmount.dividedBy(normalizedOrderInput), 1);
            // TODO: replace constant with a proper sample size.
            for (let i = 1; i <= 13; i++) {
                const fraction = i / 13;
                const currentInput = utils_1.BigNumber.min(normalizedOrderInput.times(scaleToInput).times(fraction), normalizedOrderInput);
                const currentOutput = utils_1.BigNumber.min(normalizedOrderOutput.times(scaleToInput).times(fraction), normalizedOrderOutput);
                const id = `${types_1.ERC20BridgeSource.Native}-${nativeOrder.type}-${routablePaths.length}-${idx}-${i}`;
                inputs.push(currentInput.integerValue().toNumber());
                outputs.push(currentOutput.integerValue().toNumber());
                outputFees.push(fee);
                ids.push(id);
            }
            // We have a VIP for the Rfq and Otc order types, Limit order currently goes through FQT
            const isVip = nativeOrder.type !== protocol_utils_1.FillQuoteTransformerOrderType.Limit;
            const serializedPath = {
                ids,
                inputs,
                outputs,
                outputFees,
                isVip,
            };
            routablePaths.push({
                pathId: nativeOrderSourcePathId,
                samplesOrNativeOrders: [nativeOrder],
                serializedPath: serializedPath,
            });
        }
        return routablePaths;
    }
    calculateOutputFee(sampleOrNativeOrder) {
        var _a, _b, _c, _d;
        const { inputAmountPerEth, outputAmountPerEth } = this.pathPenaltyOpts;
        if (isDexSample(sampleOrNativeOrder)) {
            const { input, output, source, fillData } = sampleOrNativeOrder;
            const fee = ((_b = (_a = this.feeSchedule)[source]) === null || _b === void 0 ? void 0 : _b.call(_a, fillData).fee) || constants_2.ZERO_AMOUNT;
            const outputFee = (0, fills_1.ethToOutputAmount)({
                input,
                output,
                inputAmountPerEth,
                outputAmountPerEth,
                ethAmount: fee,
            });
            return outputFee;
        }
        else {
            const { input, output } = nativeOrderToNormalizedAmounts(this.pathContext.side, sampleOrNativeOrder);
            const fee = ((_d = (_c = this.feeSchedule)[types_1.ERC20BridgeSource.Native]) === null || _d === void 0 ? void 0 : _d.call(_c, sampleOrNativeOrder).fee) || constants_2.ZERO_AMOUNT;
            const outputFee = (0, fills_1.ethToOutputAmount)({
                input,
                output,
                inputAmountPerEth,
                outputAmountPerEth,
                ethAmount: fee,
            });
            return outputFee;
        }
    }
    // Create a `Fill` from a dex sample and adjust it with any passed in
    // adjustor
    createFillFromDexSample(sample) {
        const fill = (0, fills_1.dexSampleToFill)(this.pathContext.side, sample, this.pathPenaltyOpts.outputAmountPerEth, this.pathPenaltyOpts.inputAmountPerEth, this.feeSchedule);
        const adjustedFills = this.fillAdjustor.adjustFills(this.pathContext.side, [fill]);
        return adjustedFills[0];
    }
    createFillFromTwoHopSample(sample) {
        const { fillData } = sample;
        const side = this.pathContext.side;
        const multihopFeeEstimate = this.feeSchedule[types_1.ERC20BridgeSource.MultiHop];
        const fill = (0, fills_1.twoHopSampleToFill)(side, sample, this.pathPenaltyOpts.outputAmountPerEth, multihopFeeEstimate);
        const fillAdjustor = this.fillAdjustor;
        // Adjust the individual Fill
        // HACK: Chose the worst of slippage between the two sources in multihop
        const adjustedFillFirstHop = fillAdjustor.adjustFills(side, [
            { ...fill, source: fillData.firstHopSource.source },
        ])[0];
        const adjustedFillSecondHop = fillAdjustor.adjustFills(side, [
            { ...fill, source: fillData.secondHopSource.source },
        ])[0];
        // In Sells, output smaller is worse (you're getting less out)
        if (side === types_1.MarketOperation.Sell) {
            if (adjustedFillFirstHop.adjustedOutput.lt(adjustedFillSecondHop.adjustedOutput)) {
                return adjustedFillFirstHop;
            }
            return adjustedFillSecondHop;
        }
        // In Buys, output larger is worse (it's costing you more)
        if (adjustedFillFirstHop.adjustedOutput.lt(adjustedFillSecondHop.adjustedOutput)) {
            return adjustedFillSecondHop;
        }
        return adjustedFillFirstHop;
    }
    // TODO: `optimizerCapture` is only used for logging -- consider removing it.
    createPathFromRoute(routablePaths, route, optimizerCapture) {
        /**
         * inputs are the amounts to fill at each source index
         * e.g fill 2076 at index 4
         *  [ 0, 0, 0, 0, 2076, 464, 230,
         *    230, 0, 0, 0 ]
         *  the sum represents the total input amount
         *
         *  outputs are the amounts we expect out at each source index
         *  [ 0, 0, 0, 0, 42216, 9359, 4677,
         *    4674, 0, 0, 0 ]
         *  the sum represents the total expected output amount
         */
        var _a, _b, _c;
        const routesAndPath = _.zip(route.inputAmounts, route.outputAmounts, routablePaths);
        const adjustedFills = [];
        const totalRoutedAmount = utils_1.BigNumber.sum(...route.inputAmounts);
        const inputAmount = this.inputAmount;
        // Due to precision errors we can end up with a totalRoutedAmount that is not exactly equal to the input
        const precisionErrorScalar = inputAmount.dividedBy(totalRoutedAmount);
        for (const [routeInputAmount, outputAmount, routablePath] of routesAndPath) {
            if (!Number.isFinite(outputAmount)) {
                (0, constants_1.DEFAULT_WARNING_LOGGER)(optimizerCapture, `neon-router: invalid route outputAmount ${outputAmount}`);
                return undefined;
            }
            if (!routeInputAmount || !routablePath || !outputAmount) {
                continue;
            }
            const { samplesOrNativeOrders, pathId } = routablePath;
            // TODO: [TKR-241] amounts are sometimes clipped in the router due to precision loss for number/f64
            // we can work around it by scaling it and rounding up. However now we end up with a total amount of a couple base units too much
            const routeInputCorrected = utils_1.BigNumber.min(precisionErrorScalar.multipliedBy(routeInputAmount).integerValue(utils_1.BigNumber.ROUND_CEIL), inputAmount);
            const current = samplesOrNativeOrders[samplesOrNativeOrders.length - 1];
            // If it is a native single order we only have one Input/output
            // we want to convert this to an array of samples
            if (!isDexSample(current)) {
                const nativeFill = (0, fills_1.nativeOrderToFill)(this.pathContext.side, current, routeInputCorrected, this.pathPenaltyOpts.outputAmountPerEth, this.pathPenaltyOpts.inputAmountPerEth, this.feeSchedule, false);
                // Note: If the order has an adjusted rate of less than or equal to 0 it will be undefined
                if (nativeFill) {
                    // NOTE: For Limit/RFQ orders we are done here. No need to scale output
                    adjustedFills.push({ ...nativeFill, sourcePathId: pathId !== null && pathId !== void 0 ? pathId : utils_1.hexUtils.random() });
                }
                continue;
            }
            // NOTE: For DexSamples only
            let fill = this.createFillFromDexSample(current);
            if (!fill) {
                continue;
            }
            const routeSamples = samplesOrNativeOrders;
            // From the output of the router, find the closest Sample in terms of input.
            // The Router may have chosen an amount to fill that we do not have a measured sample of
            // Choosing this accurately is required in some sources where the `FillData` may change depending
            // on the size of the trade. For example, UniswapV3 has variable gas cost
            // which increases with input.
            assert_1.assert.assert(routeSamples.length >= 1, 'Found no sample to use for source');
            for (let k = routeSamples.length - 1; k >= 0; k--) {
                // If we're at the last remaining sample that's all we have left to use
                if (k === 0) {
                    fill = (_a = this.createFillFromDexSample(routeSamples[0])) !== null && _a !== void 0 ? _a : fill;
                }
                if (routeInputCorrected.isGreaterThan(routeSamples[k].input)) {
                    const left = routeSamples[k];
                    const right = routeSamples[k + 1];
                    if (left && right) {
                        fill =
                            (_b = this.createFillFromDexSample({
                                ...right,
                                input: routeInputCorrected,
                                output: new utils_1.BigNumber(outputAmount).integerValue(),
                            })) !== null && _b !== void 0 ? _b : fill;
                    }
                    else {
                        assert_1.assert.assert(Boolean(left || right), 'No valid sample to use');
                        fill = (_c = this.createFillFromDexSample(left || right)) !== null && _c !== void 0 ? _c : fill;
                    }
                    break;
                }
            }
            // TODO: remove once we have solved the rounding/precision loss issues in the Rust router
            const maxSampledOutput = utils_1.BigNumber.max(...routeSamples.map((s) => s.output)).integerValue();
            // Scale output by scale factor but never go above the largest sample in sell quotes (unknown liquidity)  or below 1 base unit (unfillable)
            const scaleOutput = (output) => {
                const capped = utils_1.BigNumber.min(output.integerValue(), maxSampledOutput);
                return utils_1.BigNumber.max(capped, 1);
            };
            adjustedFills.push({
                ...fill,
                input: routeInputCorrected,
                output: scaleOutput(fill.output),
                adjustedOutput: scaleOutput(fill.adjustedOutput),
                sourcePathId: pathId !== null && pathId !== void 0 ? pathId : utils_1.hexUtils.random(),
            });
        }
        if (adjustedFills.length === 0) {
            return undefined;
        }
        return path_1.Path.create(this.pathContext, adjustedFills, inputAmount, this.pathPenaltyOpts);
    }
}
exports.PathOptimizer = PathOptimizer;
function routeFromNeonRouter(params) {
    const { optimizerCapture, numSamples } = params;
    const numPathsIn = optimizerCapture.pathsIn.length;
    // Output holders:
    const allSourcesInputAmounts = new Float64Array(numPathsIn);
    const allSourcesOutputAmounts = new Float64Array(numPathsIn);
    const vipSourcesInputAmounts = new Float64Array(numPathsIn);
    const vipSourcesOutputAmounts = new Float64Array(numPathsIn);
    (0, neon_router_1.route)(optimizerCapture, allSourcesInputAmounts, allSourcesOutputAmounts, vipSourcesInputAmounts, vipSourcesOutputAmounts, numSamples);
    assert_1.assert.assert(numPathsIn === allSourcesInputAmounts.length, 'different number of sources in the Router output than the input');
    assert_1.assert.assert(numPathsIn === allSourcesOutputAmounts.length, 'different number of sources in the Router output amounts results than the input');
    assert_1.assert.assert(numPathsIn === vipSourcesInputAmounts.length, 'different number of sources in the Router output than the input');
    assert_1.assert.assert(numPathsIn === vipSourcesOutputAmounts.length, 'different number of sources in the Router output amounts results than the input');
    return {
        allSourcesRoute: {
            inputAmounts: allSourcesInputAmounts,
            outputAmounts: allSourcesOutputAmounts,
        },
        vipSourcesRoute: {
            inputAmounts: vipSourcesInputAmounts,
            outputAmounts: vipSourcesOutputAmounts,
        },
    };
}
//# sourceMappingURL=path_optimizer.js.map