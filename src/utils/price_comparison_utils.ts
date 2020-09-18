import { BridgeReportSource, ERC20BridgeSource, MultiHopReportSource, QuoteReportSource } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { FEE_SCHEDULE_V1, GAS_SCHEDULE_V1 } from '../config';
import { ZERO } from '../constants';
import { logger } from '../logger';
import { ChainId, SourceComparison } from '../types';

import { getTokenMetadataIfExists } from './token_metadata_utils';

const renameIfNativeSource = (source: ERC20BridgeSource) => (source === ERC20BridgeSource.Native ? '0x' : source);

const emptyPlaceholderSources = Object.values(ERC20BridgeSource).reduce<SourceComparison[]>((memo, liquiditySource) => {
    memo.push({
        name: renameIfNativeSource(liquiditySource),
        price: null,
        protocolFee: null,
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

            // Sort by amount the user will receive and deduplicate to only take the best option for e.g. Kyber
            const uniqueSources = _.uniqBy(
                fullTradeSources
                    .slice()
                    .sort((a, b) =>
                        isSelling ? b.makerAmount.comparedTo(a.makerAmount) : a.takerAmount.comparedTo(b.takerAmount),
                    ),
                'liquiditySource',
            );

            const sourcePrices: SourceComparison[] = uniqueSources.map(source => {
                const { liquiditySource, makerAmount, takerAmount } = source;
                let gas: BigNumber;
                let protocolFee: BigNumber | undefined;
                if (liquiditySource === ERC20BridgeSource.Native) {
                    protocolFee = new BigNumber(FEE_SCHEDULE_V1[source.liquiditySource]());
                    gas = new BigNumber(GAS_SCHEDULE_V1[source.liquiditySource]());
                } else if (liquiditySource === ERC20BridgeSource.MultiHop) {
                    const typedSource = source as MultiHopReportSource;
                    gas = new BigNumber(GAS_SCHEDULE_V1[typedSource.liquiditySource](typedSource.fillData));
                } else {
                    const typedSource = source as BridgeReportSource;
                    gas = new BigNumber(GAS_SCHEDULE_V1[typedSource.liquiditySource](typedSource.fillData));
                }

                const unitMakerAmount = Web3Wrapper.toUnitAmount(makerAmount, buyToken.decimals);
                const unitTakerAmount = Web3Wrapper.toUnitAmount(takerAmount, sellToken.decimals);

                const price = isSelling
                    ? unitMakerAmount.dividedBy(unitTakerAmount).decimalPlaces(sellToken.decimals)
                    : unitTakerAmount.dividedBy(unitMakerAmount).decimalPlaces(buyToken.decimals);

                return {
                    name: renameIfNativeSource(liquiditySource),
                    price,
                    protocolFee: protocolFee || null,
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
