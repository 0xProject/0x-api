import { BridgeReportSource, ERC20BridgeSource, QuoteReportSource } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { GAS_SCHEDULE_V0, GAS_SCHEDULE_V1 } from '../config';
import { ZERO } from '../constants';
import { logger } from '../logger';
import { SourceComparison, SwapVersion } from '../types';

// Exclude internal sources from comparison
// NOTE: asset-swapper does not return fillData for Native & MultiHop sources
const excludedLiquiditySources = new Set([
    ERC20BridgeSource.Native,
    ERC20BridgeSource.MultiHop,
    ERC20BridgeSource.MultiBridge,
    ERC20BridgeSource.LiquidityProvider,
]);

const gasSchedule = {
    [SwapVersion.V0]: GAS_SCHEDULE_V0,
    [SwapVersion.V1]: GAS_SCHEDULE_V1,
};

const emptyPlaceholderSources = Object.values(ERC20BridgeSource)
    .filter(liquiditySource => !excludedLiquiditySources.has(liquiditySource))
    .reduce<SourceComparison[]>((memo, liquiditySource) => {
        memo.push({
            name: liquiditySource,
            price: null,
            gas: null,
        });

        return memo;
    }, []);

interface PartialRequestParams {
    buyAmount?: BigNumber;
    sellAmount?: BigNumber;
}

interface PartialQuote {
    price: BigNumber;
    buyAmount: BigNumber;
    sellAmount: BigNumber;
    // TODO: handle token addresses
    // buyTokenAddress: string;
    // sellTokenAddress: string;
    quoteReport?: { sourcesConsidered: QuoteReportSource[] };
}

export const priceComparisonUtils = {
    getPriceComparisonFromQuote(
        swapVersion: SwapVersion,
        params: PartialRequestParams,
        quote: PartialQuote,
    ): SourceComparison[] | undefined {
        if (!quote.quoteReport) {
            logger.error('Missing quote report, cannot calculate price comparison');
            return undefined;
        }

        const isSelling = !!params.sellAmount;

        const { sourcesConsidered } = quote.quoteReport;

        // Filter matching amount samples with a valid result
        const fullTradeSources = sourcesConsidered.filter(s =>
            isSelling
                ? s.takerAmount.isEqualTo(quote.sellAmount) && s.makerAmount.isGreaterThan(ZERO)
                : s.makerAmount.isEqualTo(quote.buyAmount) && s.takerAmount.isGreaterThan(ZERO),
        );

        // Strip out internal sources
        const relevantSources = fullTradeSources.filter(s => !excludedLiquiditySources.has(s.liquiditySource));

        // Sort by amount the user will receive and deduplicate to only take the best option for e.g. Kyber
        const uniqueRelevantSources = _.uniqBy(
            relevantSources
                .slice()
                .sort((a, b) =>
                    isSelling ? b.makerAmount.comparedTo(a.makerAmount) : a.takerAmount.comparedTo(b.takerAmount),
                ),
            'liquiditySource',
        );

        const quotePriceDecimalPlaces = quote.price.decimalPlaces();

        const sourcePrices: SourceComparison[] = uniqueRelevantSources.map(source => {
            const { liquiditySource, makerAmount, takerAmount } = source;
            const gas = new BigNumber(
                gasSchedule[swapVersion][source.liquiditySource]!((source as BridgeReportSource).fillData),
            );

            const price = isSelling ? makerAmount.dividedBy(takerAmount) : takerAmount.dividedBy(makerAmount);

            return {
                name: liquiditySource,
                price: price.decimalPlaces(quotePriceDecimalPlaces),
                gas,
            };
        });

        // Add null values for all sources we don't have a result for so that we always have a full result set in the response
        const allSourcePrices = _.uniqBy<SourceComparison>([...sourcePrices, ...emptyPlaceholderSources], 'name');

        return allSourcePrices;
    },
};
