// tslint:disable:custom-no-magic-numbers
// tslint:disable:no-empty

import { ERC20BridgeSource } from '@0x/asset-swapper';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { SwapVersion } from '../src/types';
import { priceComparisonUtils } from '../src/utils/price_comparison_utils';

const buyAmount = new BigNumber('23318242912334152626');
const sellAmount = new BigNumber('70100000000000000');

const SUITE_NAME = 'priceComparisonUtils';

// TODO REMOVE
describe.only(SUITE_NAME, () => {
    describe('getPriceComparisonFromQuote', () => {
        it.skip('handles tokens with different decimals', () => {});
        it.skip('returns null values for not considered sources', () => {});

        it.skip('filters out incomplete samples with 0 makerAmount', () => {});

        it.skip('filters out incomplete samples with 0 makerAmount', () => {});

        it.skip('returns the Kyber results with highest makerAmount when quoting sellAmount');

        it.skip('returns the Kyber results with lowest takerAmount when quoting buyAmount');

        it('returns comparison prices for quote reporter sources when quoting sellAmount', () => {
            const price = buyAmount.div(sellAmount).decimalPlaces(4);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                SwapVersion.V1,
                { sellAmount },
                {
                    price,
                    buyAmount,
                    sellAmount,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.Uniswap,
                                fillData: {},
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                // Uniswap sample found
                {
                    name: ERC20BridgeSource.Uniswap,
                    price,
                    gas: new BigNumber(1.1e5),
                },

                // Kyber sample not found
                {
                    name: ERC20BridgeSource.Kyber,
                    price: null,
                    gas: null,
                },
            ]);
        });

        it('returns comparison prices for quote reporter sources when quoting buyAmount', () => {
            const price = sellAmount.div(buyAmount).decimalPlaces(4);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                SwapVersion.V1,
                { buyAmount },
                {
                    price,
                    buyAmount,
                    sellAmount,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.Uniswap,
                                fillData: {},
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                // Uniswap sample found
                {
                    name: ERC20BridgeSource.Uniswap,
                    price,
                    gas: new BigNumber(1.1e5),
                },

                // Balancer sample not found
                {
                    name: ERC20BridgeSource.Balancer,
                    price: null,
                    gas: null,
                },
            ]);
        });
    });
});
