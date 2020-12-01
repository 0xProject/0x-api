import {
    BridgeReportSource,
    DEFAULT_GAS_SCHEDULE,
    ERC20BridgeSource,
    FeeSchedule,
    MultiHopReportSource,
    NativeRFQTReportSource,
    QuoteReportSource,
    SushiSwapFillData,
    UniswapV2FillData,
} from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { ZERO } from '../constants';
import { logger } from '../logger';
import { ChainId, SourceComparison } from '../types';

import { getTokenMetadataIfExists } from './token_metadata_utils';

// NOTE: Our internal Uniswap gas usage may be lower than the Uniswap UI usage
// Therefore we need to adjust the gas estimates to be representative of using the Uniswap UI.
const gasScheduleWithOverrides: FeeSchedule = {
    ...DEFAULT_GAS_SCHEDULE,
    [ERC20BridgeSource.UniswapV2]: fillData => {
        let gas = 1.5e5;
        // tslint:disable-next-line:custom-no-magic-numbers
        if ((fillData as UniswapV2FillData).tokenAddressPath.length > 2) {
            // tslint:disable-next-line:custom-no-magic-numbers
            gas += 5e4;
        }
        return gas;
    },
    [ERC20BridgeSource.SushiSwap]: fillData => {
        let gas = 1.5e5;
        // tslint:disable-next-line:custom-no-magic-numbers
        if ((fillData as SushiSwapFillData).tokenAddressPath.length > 2) {
            // tslint:disable-next-line:custom-no-magic-numbers
            gas += 5e4;
        }
        return gas;
    },
};

const emptyPlaceholderSources = Object.values(ERC20BridgeSource).reduce<SourceComparison[]>((memo, liquiditySource) => {
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
    buyAmount?: BigNumber;
    sellAmount?: BigNumber;
    gasPrice: BigNumber;
    buyTokenAddress: string;
    sellTokenAddress: string;
    ethToInputRate: BigNumber;
    ethToOutputRate: BigNumber;
    quoteReport: { sourcesConsidered: QuoteReportSource[] };
}

export const priceComparisonUtils = {
    getPriceComparisonFromQuote(
        chainId: ChainId,
        params: PartialRequestParams,
        quote: PartialQuote,
    ): SourceComparison[] | undefined {
        // NOTE: don't fail quote request if comparison calculations error out
        try {
            const buyToken = getTokenMetadataIfExists(quote.buyTokenAddress, chainId);
            const sellToken = getTokenMetadataIfExists(quote.sellTokenAddress, chainId);
            const ethToken = getTokenMetadataIfExists('WETH', chainId)!;

            if (!buyToken || !sellToken || !quote.buyAmount || !quote.sellAmount) {
                return undefined;
            }

            const isSelling = !!params.sellAmount;

            const { sourcesConsidered } = quote.quoteReport;

            // Filter matching amount samples with a valid result
            const fullTradeSources = sourcesConsidered.filter(s =>
                isSelling
                    ? s.takerAmount.isEqualTo(quote.sellAmount!) && s.makerAmount.isGreaterThan(ZERO)
                    : s.makerAmount.isEqualTo(quote.buyAmount!) && s.takerAmount.isGreaterThan(ZERO),
            );

            const tradeSourcesWithGas = fullTradeSources.map(source => {
                const { liquiditySource } = source;
                let gas: BigNumber;
                if (liquiditySource === ERC20BridgeSource.Native) {
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    const typedSource = source as NativeRFQTReportSource;
                    gas = new BigNumber(gasScheduleWithOverrides[typedSource.liquiditySource]!());
                } else if (liquiditySource === ERC20BridgeSource.MultiHop) {
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    const typedSource = source as MultiHopReportSource;
                    gas = new BigNumber(gasScheduleWithOverrides[typedSource.liquiditySource]!(typedSource.fillData));
                } else {
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    const typedSource = source as BridgeReportSource;
                    gas = new BigNumber(gasScheduleWithOverrides[typedSource.liquiditySource]!(typedSource.fillData));
                }

                const unitMakerAmount = Web3Wrapper.toUnitAmount(source.makerAmount, buyToken.decimals);
                const unitTakerAmount = Web3Wrapper.toUnitAmount(source.takerAmount, sellToken.decimals);

                return {
                    ...source,
                    gas,
                    unitTakerAmount,
                    unitMakerAmount,
                };
            });

            const ethUnitAmount = new BigNumber(10).pow(ethToken.decimals);
            // NOTE: Sort sources by the best outcome for the user
            // if the user is selling we want to maximize the maker amount they will receive
            // if the user is buying we want to minimize the taker amount they have to pay
            const sortedSources = isSelling
                ? tradeSourcesWithGas.slice().sort((a, b) => {
                      const aGasCostMakerAssetUnitAmount = a.gas
                          .times(quote.gasPrice)
                          .dividedBy(ethUnitAmount)
                          .times(quote.ethToOutputRate);
                      const bGasCostMakerAssetUnitAmount = b.gas
                          .times(quote.gasPrice)
                          .dividedBy(ethUnitAmount)
                          .times(quote.ethToOutputRate);

                      const aTotal = a.unitMakerAmount.minus(aGasCostMakerAssetUnitAmount);
                      const bTotal = b.unitMakerAmount.minus(bGasCostMakerAssetUnitAmount);

                      return bTotal.comparedTo(aTotal);
                  })
                : tradeSourcesWithGas.slice().sort((a, b) => {
                      const aGasCostTakerAssetUnitAmount = a.gas
                          .times(quote.gasPrice)
                          .dividedBy(ethUnitAmount)
                          .times(quote.ethToInputRate);
                      const bGasCostTakerAssetUnitAmount = b.gas
                          .times(quote.gasPrice)
                          .dividedBy(ethUnitAmount)
                          .times(quote.ethToInputRate);

                      const aTotal = a.unitTakerAmount.plus(aGasCostTakerAssetUnitAmount);
                      const bTotal = b.unitTakerAmount.plus(bGasCostTakerAssetUnitAmount);

                      return aTotal.comparedTo(bTotal);
                  });
            // Select the best (first in the sorted list) option for each source
            const uniqueSources = _.uniqBy(sortedSources, 'liquiditySource');

            const sourcePrices: SourceComparison[] = uniqueSources.map(source => {
                const { liquiditySource, unitMakerAmount, unitTakerAmount, gas } = source;

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
