import { BridgeReportSource, ERC20BridgeSource } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { GAS_SCHEDULE_V0, GAS_SCHEDULE_V1 } from '../config';
import { ZERO } from '../constants';
import { logger } from '../logger';
import {
    CalculateMetaTransactionPriceResponse,
    CalculateMetaTransactionQuoteParams,
    GetSwapQuoteRequestParams,
    GetSwapQuoteResponse,
    GetTransactionRequestParams,
    SourceComparison,
    SwapVersion,
} from '../types';

const excludedLiquiditySources = [
    ERC20BridgeSource.Native,
    ERC20BridgeSource.MultiHop,
    ERC20BridgeSource.MultiBridge,
    ERC20BridgeSource.LiquidityProvider,
];

const gasSchedule = {
    [SwapVersion.V0]: GAS_SCHEDULE_V0,
    [SwapVersion.V1]: GAS_SCHEDULE_V1,
};

export const priceComparisonUtils = {
    getPriceComparisonFromQuote(
        params: GetSwapQuoteRequestParams | CalculateMetaTransactionQuoteParams | GetTransactionRequestParams,
        swapVersion: SwapVersion,
        quote: GetSwapQuoteResponse | CalculateMetaTransactionPriceResponse,
    ): SourceComparison[] | undefined {
        if (!quote.quoteReport) {
            logger.warn('Missing quote report, cannot calculate price comparison');
            return undefined;
        }

        let direction: 'buying' | 'selling';
        let amount: BigNumber;
        if (params.buyAmount) {
            direction = 'buying';
            amount = quote.buyAmount;
        } else if (params.sellAmount) {
            direction = 'selling';
            amount = quote.sellAmount;
        } else {
            logger.error('Missing buyAmount and sellAmount params cannot calculate price comparison');
            return undefined;
        }

        const { sourcesConsidered } = quote.quoteReport;

        // Filter matching amount samples with a valid result
        const fullTradeSources = sourcesConsidered.filter(s =>
            direction === 'selling'
                ? s.takerAmount.isEqualTo(amount) && s.makerAmount.isGreaterThan(ZERO)
                : s.makerAmount.isEqualTo(amount) && s.takerAmount.isGreaterThan(ZERO),
        );

        // Strip out internal sources
        const relevantSources = fullTradeSources.filter(s => !excludedLiquiditySources.includes(s.liquiditySource));

        // Sort by amount the user will receive and deduplicate to only take the best option for e.g. Kyber
        const uniqueRelevantSources = _.uniqBy(
            relevantSources
                .slice()
                .sort((a, b) =>
                    direction === 'selling'
                        ? a.makerAmount.comparedTo(b.makerAmount)
                        : a.takerAmount.comparedTo(b.takerAmount),
                ),
            'liquiditySource',
        );

        const quotePriceDecimalPlaces = quote.price.decimalPlaces();

        const sourcePrices: SourceComparison[] = uniqueRelevantSources.map(source => {
            const { liquiditySource, makerAmount, takerAmount } = source;
            const gas = new BigNumber(
                gasSchedule[swapVersion][source.liquiditySource]!((source as BridgeReportSource).fillData),
            );

            const price =
                direction === 'selling' ? makerAmount.dividedBy(takerAmount) : takerAmount.dividedBy(makerAmount);

            return {
                name: liquiditySource,
                price: price.decimalPlaces(quotePriceDecimalPlaces),
                gas,
            };
        });

        return sourcePrices;
    },
};
