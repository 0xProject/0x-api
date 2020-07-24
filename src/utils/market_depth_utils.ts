import { BalancerFillData, CurveFillData, FillData, UniswapV2FillData } from '@0x/asset-swapper';
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

import {
    MARKET_DEPTH_DEFAULT_DISTRIBUTION,
    MARKET_DEPTH_END_PRICE_SLIPPAGE_PERC,
    MARKET_DEPTH_MAX_SAMPLES,
    ZERO,
} from '../constants';
import { BucketedPriceDepth, TokenMetadata } from '../types';

// tslint:disable:custom-no-magic-numbers
const MAX_DECIMALS = 18;
const ONE_HUNDRED_PERC = 100;

export const marketDepthUtils = {
    getBucketPrices: (
        startAmount: BigNumber,
        endAmount: BigNumber,
        numSamples: number,
        sampleDistributionBase: number = 1,
    ): BigNumber[] => {
        const amount = endAmount.minus(startAmount);
        const distribution = [...Array<BigNumber>(numSamples)].map((_v, i) =>
            new BigNumber(sampleDistributionBase).pow(i).decimalPlaces(MAX_DECIMALS),
        );
        const stepSizes = distribution.map(d => d.div(BigNumber.sum(...distribution)));
        const amounts = stepSizes.map((_s, i) => {
            return amount
                .times(BigNumber.sum(...[0, ...stepSizes.slice(0, i + 1)]))
                .plus(startAmount)
                .decimalPlaces(MAX_DECIMALS);
        });
        return [startAmount, ...amounts];
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
        const sortedPath = path.sort((a, b) => b.output.dividedBy(b.input).comparedTo(a.output.dividedBy(a.input)));
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
            // TODO do I really want to do this
            return ZERO;
        }
        return totalOutput;
    },
    normalizeMarketDepthToSampleOutput: (depthSide: MarketDepthSide): MarketDepthSide => {
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

    calculateStartEndBucketPrice: (
        depthSide: MarketDepthSide,
        side: MarketOperation,
        endSlippagePerc = 20,
    ): [BigNumber, BigNumber] => {
        const pricesByAmount = depthSide
            .map(samples =>
                samples
                    .map(s => (!s.output.isZero() ? s.output.dividedBy(s.input).decimalPlaces(MAX_DECIMALS) : ZERO))
                    .filter(s => s.isGreaterThan(ZERO)),
            )
            .filter(samples => samples.length > 0);
        let bestInBracket: BigNumber;
        let worstBestInBracket: BigNumber;
        if (side === MarketOperation.Sell) {
            // Sell we want to sell for a higher price as possible
            bestInBracket = BigNumber.max(...pricesByAmount.map(s => BigNumber.max(...s)));
            worstBestInBracket = bestInBracket.times((ONE_HUNDRED_PERC - endSlippagePerc) / ONE_HUNDRED_PERC);
        } else {
            // Buy we want to buy for the lowest price possible
            bestInBracket = BigNumber.min(...pricesByAmount.map(s => BigNumber.min(...s)));
            worstBestInBracket = bestInBracket.times((ONE_HUNDRED_PERC + endSlippagePerc) / ONE_HUNDRED_PERC);
        }
        return [bestInBracket, worstBestInBracket];
    },

    distributeSamplesToBuckets: (depthSide: MarketDepthSide, buckets: BigNumber[], side: MarketOperation) => {
        const allocatedBuckets = buckets.map((b, i) => ({ price: b, bucket: i, bucketTotal: ZERO }));
        const getBucketId = (price: BigNumber): number => {
            return buckets.findIndex(b =>
                side === MarketOperation.Sell ? price.isGreaterThanOrEqualTo(b) : price.isLessThanOrEqualTo(b),
            );
        };
        const sampleToSourceKey = (sample: DexSample<FillData>): string => {
            const source = sample.source;
            if (!sample.fillData) {
                return source;
            }
            switch (source) {
                case ERC20BridgeSource.Curve:
                    return `${source}:${(sample.fillData as CurveFillData).curve.poolAddress}`;
                case ERC20BridgeSource.Balancer:
                    return `${source}:${(sample.fillData as BalancerFillData).poolAddress}`;
                case ERC20BridgeSource.UniswapV2:
                    return `${source}:${(sample.fillData as UniswapV2FillData).tokenAddressPath.join('-')}`;
                default:
                    break;
            }
            return source;
        };
        for (const samples of depthSide) {
            // Since multiple samples can fall into a bucket we do not want to
            // double count them.
            // Curve, Balancer etc can have the same source strings but be from different
            // pools, so we modify their source string temporarily to attribute
            // the different pool
            const source = sampleToSourceKey(samples[0]);
            for (const sample of samples) {
                if (sample.output.isZero()) {
                    continue;
                }
                const price = sample.output.dividedBy(sample.input);
                const bucketId = getBucketId(price);
                if (bucketId === -1) {
                    // No bucket available so we ignore
                    continue;
                }
                const bucket = allocatedBuckets[bucketId];
                if (bucket[source]) {
                    bucket.bucketTotal = bucket.bucketTotal.minus(bucket[source]).plus(sample.output);
                    bucket[source] = sample.output;
                } else {
                    bucket.bucketTotal = bucket.bucketTotal.plus(sample.output);
                    bucket[source] = sample.output;
                }
            }
        }
        let totalCumulative = ZERO;
        // Normalize the source names back and create a cumulative total
        const normalizedCumulativeBuckets = allocatedBuckets.map(b => {
            totalCumulative = totalCumulative.plus(b.bucketTotal);
            for (const key of Object.keys(b)) {
                const source = key.split(':')[0];
                if (source !== key && Object.values(ERC20BridgeSource).includes(source as ERC20BridgeSource)) {
                    // Curve:0xabcd,100 -> Curve,100
                    // Add Curve:0abcd to Curve
                    b[source] = b[source] ? b[source].plus(b[key]) : b[key];
                    delete b[key];
                }
            }
            return { ...b, cumulative: totalCumulative };
        });
        return normalizedCumulativeBuckets;
    },

    calculateDepthForSide: (
        rawDepthSide: MarketDepthSide,
        side: MarketOperation,
        numBuckets: number = MARKET_DEPTH_MAX_SAMPLES,
        bucketDistribution: number = MARKET_DEPTH_DEFAULT_DISTRIBUTION,
        maxEndSlippagePercentage: number = MARKET_DEPTH_END_PRICE_SLIPPAGE_PERC,
    ): BucketedPriceDepth[] => {
        const depthSide = marketDepthUtils.normalizeMarketDepthToSampleOutput(rawDepthSide);
        const [startPrice, endPrice] = marketDepthUtils.calculateStartEndBucketPrice(
            depthSide,
            side,
            maxEndSlippagePercentage,
        );
        const buckets = marketDepthUtils.getBucketPrices(startPrice, endPrice, numBuckets, bucketDistribution);
        const distributedBuckets = marketDepthUtils.distributeSamplesToBuckets(depthSide, buckets, side);
        return distributedBuckets;
    },
};
