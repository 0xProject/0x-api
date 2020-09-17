import { BridgeReportSource, ERC20BridgeSource, QuoteReportSource } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { GAS_SCHEDULE_V1 } from '../config';
import { ZERO } from '../constants';
import { logger } from '../logger';
import { ChainId, SourceComparison } from '../types';

import { getTokenMetadataIfExists } from './token_metadata_utils';

// Exclude internal sources from comparison
// NOTE: asset-swapper does not return fillData for Native & MultiHop sources
const excludedLiquiditySources = new Set([
    ERC20BridgeSource.Native,
    ERC20BridgeSource.MultiHop,
    ERC20BridgeSource.MultiBridge,
    ERC20BridgeSource.LiquidityProvider,
]);

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
    buyAmount: BigNumber;
    sellAmount: BigNumber;
    buyTokenAddress: string;
    sellTokenAddress: string;
    quoteReport?: { sourcesConsidered: QuoteReportSource[] };
}

export const priceComparisonUtils = {
    getPriceComparisonFromQuote(
        chainId: ChainId,
        params: PartialRequestParams,
        quote: PartialQuote,
    ): SourceComparison[] | undefined {
        if (!quote.quoteReport) {
            logger.error('Missing quote report, cannot calculate price comparison');
            return undefined;
        }

        // NOTE: don't fail quote request if comparison calculations error out
        try {
            const buyToken = getTokenMetadataIfExists(quote.buyTokenAddress, chainId);
            const sellToken = getTokenMetadataIfExists(quote.sellTokenAddress, chainId);

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

            const sourcePrices: SourceComparison[] = uniqueRelevantSources.map(source => {
                const { liquiditySource, makerAmount, takerAmount } = source;
                const gas = new BigNumber(
                    GAS_SCHEDULE_V1[source.liquiditySource]!((source as BridgeReportSource).fillData),
                );

                const unitMakerAmount = Web3Wrapper.toUnitAmount(makerAmount, buyToken.decimals);
                const unitTakerAmount = Web3Wrapper.toUnitAmount(takerAmount, sellToken.decimals);

                const price = isSelling
                    ? unitMakerAmount.dividedBy(unitTakerAmount).decimalPlaces(sellToken.decimals)
                    : unitTakerAmount.dividedBy(unitMakerAmount).decimalPlaces(buyToken.decimals);

                return {
                    name: liquiditySource,
                    price,
                    gas,
                };
            });

            // Add null values for all sources we don't have a result for so that we always have a full result set in the response
            const allSourcePrices = _.uniqBy<SourceComparison>([...sourcePrices, ...emptyPlaceholderSources], 'name');

            return allSourcePrices;
        } catch (err) {
            logger.error(err, `Failed to calculate price comparisons`);
        }
    },
};
