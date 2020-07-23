import {
    DexSample,
    ERC20BridgeSource,
    MarketDepthSide,
    NativeFillData,
} from '@0x/asset-swapper/lib/src/utils/market_operation_utils/types';
import { MarketOperation } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import _ = require('lodash');

import { ZERO } from '../constants';
import { TokenMetadata } from '../types';

export const marketDepthUtils = {
    getBucketPrices: (
        startAmount: BigNumber,
        endAmount: BigNumber,
        numSamples: number,
        sampleDistributionBase: number = 1,
    ): BigNumber[] => {
        const amount = endAmount.minus(startAmount);
        const distribution = [...Array<BigNumber>(numSamples)].map((_v, i) =>
            new BigNumber(sampleDistributionBase).pow(i),
        );
        const stepSizes = distribution.map(d => d.div(BigNumber.sum(...distribution)));
        const amounts = stepSizes.map((_s, i) => {
            return amount.times(BigNumber.sum(...[0, ...stepSizes.slice(0, i + 1)])).plus(startAmount);
        });
        return [startAmount, ...amounts, endAmount];
    },
    calculateUnitPrice: (
        input: BigNumber,
        output: BigNumber,
        outputToken: TokenMetadata,
        inputToken: TokenMetadata,
    ): BigNumber => {
        if (output && input && output.isGreaterThan(0)) {
            return Web3Wrapper.toUnitAmount(output, outputToken.decimals).dividedBy(
                Web3Wrapper.toUnitAmount(input, inputToken.decimals),
            );
        }
        return ZERO;
    },
    getSampleAmountsFromDepthSide: (depthSide: MarketDepthSide): BigNumber[] => {
        // Native is not a "sampled" output, here we convert it to be a accumulated sample output
        const nativeIndexIfExists = depthSide.findIndex(s => s[0] && s[0].source === ERC20BridgeSource.Native);
        // Find an on-chain source which has samples, if possible
        const nonNativeIndexIfExists = depthSide.findIndex(s => s[0] && s[0].source !== ERC20BridgeSource.Native);
        // If we don't have a on-chain samples, just use the native orders inputs for a super rough guide
        const sampleAmounts =
            nonNativeIndexIfExists !== -1
                ? depthSide[nonNativeIndexIfExists].map(s => s.input)
                : _.uniqBy<BigNumber>(
                      depthSide[nativeIndexIfExists].map(s => s.input),
                      a => a.toString(),
                  );
        return sampleAmounts;
    },
    sampleNativeOrders: (path: Array<DexSample<NativeFillData>>, targetInput: BigNumber): BigNumber => {
        const sortedPath = path.sort((a, b) => a.output.dividedBy(a.input).comparedTo(b.output.dividedBy(b.input)));
        let totalOutput = ZERO;
        let totalInput = ZERO;
        for (const fill of sortedPath) {
            if (totalInput.gte(targetInput)) {
                break;
            }
            const input = BigNumber.min(targetInput.minus(totalInput), fill.input);
            const output = input.times(fill.output.dividedBy(fill.input)).integerValue();
            totalOutput = totalOutput.plus(output);
            totalInput = totalInput.plus(input);
        }
        if (totalInput.isLessThan(targetInput)) {
            return ZERO;
        }
        return totalOutput;
    },
    normalizeMarketDepthToSampleOutput: (depthSide: MarketDepthSide, _operation: MarketOperation): MarketDepthSide => {
        // Native is not a "sampled" output, here we convert it to be a accumulated sample output
        const nativeIndexIfExists = depthSide.findIndex(
            s => s[0] && s[0].source === ERC20BridgeSource.Native && s[0].output,
        );
        if (nativeIndexIfExists === -1) {
            return depthSide.filter(s => s && s.length > 0);
        }
        // We should now have [1, 10, 100] sample amounts
        const sampleAmounts = marketDepthUtils.getSampleAmountsFromDepthSide(depthSide);
        const nativeSamples = sampleAmounts.map(a => ({
            input: a,
            output: marketDepthUtils.sampleNativeOrders(
                depthSide[nativeIndexIfExists] as Array<DexSample<NativeFillData>>,
                a,
            ),
            source: ERC20BridgeSource.Native,
        }));
        const normalizedDepth = [
            ...depthSide.filter(s => s[0] && s[0].source !== ERC20BridgeSource.Native),
            nativeSamples,
        ].filter(s => s.length > 0);
        return normalizedDepth;
    },

    calculateStartEndBucketPrice: (depthSide: MarketDepthSide, side: MarketOperation): [BigNumber, BigNumber] => {
        const pricesByAmount = depthSide
            .map(samples =>
                samples
                    .map(s => (!s.output.isZero() ? s.output.dividedBy(s.input) : ZERO))
                    .filter(s => s.isGreaterThan(ZERO)),
            )
            .filter(samples => samples.length > 0);
        let bestInBracket: BigNumber;
        let worstBestInBracket: BigNumber;
        if (side === MarketOperation.Sell) {
            // Sell we want to sell for a higher price as possible
            console.log(pricesByAmount);
            bestInBracket = BigNumber.max(...pricesByAmount.map(s => BigNumber.max(...s)));
            worstBestInBracket = BigNumber.min(...pricesByAmount.map(s => BigNumber.max(...s)));
        } else {
            // Buy we want to buy for the lowest price possible
            bestInBracket = BigNumber.min(...pricesByAmount.map(s => BigNumber.min(...s)));
            worstBestInBracket = BigNumber.max(...pricesByAmount.map(s => BigNumber.min(...s)));
        }
        // return [bestInBracket, worstBestInBracket.minus(bestInBracket).plus(worstBestInBracket)];
        return [bestInBracket, worstBestInBracket];
    },

    distributeSamplesToBuckets: (depthSide: MarketDepthSide, buckets: BigNumber[], side: MarketOperation) => {
        const allocatedBuckets = buckets.map((b, i) => ({ price: b, bucket: i, bucketTotal: ZERO }));
        const getBucketId = (price: BigNumber): number => {
            return buckets.findIndex(b =>
                side === MarketOperation.Sell ? price.isGreaterThanOrEqualTo(b) : price.isLessThanOrEqualTo(b),
            );
        };
        for (const samples of depthSide) {
            const source = samples[0].source;
            for (const sample of samples) {
                if (sample.output.isZero()) {
                    continue;
                }
                const price = sample.output.dividedBy(sample.input);
                const bucketId = getBucketId(price);
                if (bucketId === -1) {
                    console.log('No bucket for price', price, source);
                    continue;
                }
                const bucket = allocatedBuckets[bucketId];
                bucket.bucketTotal = bucket.bucketTotal.plus(sample.output);
                bucket[source] = bucket[source] ? bucket[source].plus(sample.output) : sample.output;
            }
        }
        let totalCumulative = ZERO;
        const cumulativeBuckets = allocatedBuckets.map(b => {
            totalCumulative = totalCumulative.plus(b.bucketTotal);
            return { ...b, cumulative: totalCumulative };
        });
        return cumulativeBuckets;
    },
};
