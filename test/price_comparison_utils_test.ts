// tslint:disable:custom-no-magic-numbers
// tslint:disable:no-empty
// tslint:disable:max-file-line-count

import { ERC20BridgeSource } from '@0x/asset-swapper';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { ZERO } from '../src/constants';
import { ChainId } from '../src/types';
import { priceComparisonUtils } from '../src/utils/price_comparison_utils';
import { getTokenMetadataIfExists } from '../src/utils/token_metadata_utils';

const WETH = getTokenMetadataIfExists('WETH', ChainId.Mainnet)!;
const DAI = getTokenMetadataIfExists('DAI', ChainId.Mainnet)!;
const USDC = getTokenMetadataIfExists('USDC', ChainId.Mainnet)!;
const buyAmount = new BigNumber('23318242912334152626');
const sellAmount = new BigNumber('70100000000000000');
const ethToDaiRate = buyAmount.div(sellAmount).decimalPlaces(18);
const ethToWethRate = new BigNumber(1);
const gasPrice = new BigNumber(100000000000); // 100 GWEI

const SUITE_NAME = 'priceComparisonUtils';

describe(SUITE_NAME, () => {
    describe('getPriceComparisonFromQuote', () => {
        it('returns comparison prices for quote reporter sources when quoting sellAmount', () => {
            const price = buyAmount.div(sellAmount).decimalPlaces(18);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { sellAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
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
                    gas: new BigNumber(90e3),
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
            const price = sellAmount.div(buyAmount).decimalPlaces(18);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { buyAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
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
                    gas: new BigNumber(90e3),
                },

                // Balancer sample not found
                {
                    name: ERC20BridgeSource.Balancer,
                    price: null,
                    gas: null,
                },
            ]);
        });

        it('filters out incomplete samples with 0 makerAmount when quoting sellAmount', () => {
            const price = buyAmount.div(sellAmount).decimalPlaces(18);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { sellAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.Uniswap,
                                fillData: {},
                            },
                            {
                                makerAmount: ZERO,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.MStable,
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
                    gas: new BigNumber(90e3),
                },

                // MStable placeholder instead of invalid 0 amount result
                {
                    name: ERC20BridgeSource.MStable,
                    price: null,
                    gas: null,
                },
            ]);
        });

        it('filters out incomplete samples with 0 takerAmount when quoting buyAmount', () => {
            const price = sellAmount.div(buyAmount).decimalPlaces(18);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { buyAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.Uniswap,
                                fillData: {},
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: ZERO,
                                liquiditySource: ERC20BridgeSource.MStable,
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
                    gas: new BigNumber(90e3),
                },

                // MStable placeholder instead of invalid 0 amount result
                {
                    name: ERC20BridgeSource.MStable,
                    price: null,
                    gas: null,
                },
            ]);
        });

        it('returns the Kyber results with highest makerAmount when quoting sellAmount', () => {
            const higherBuyAmount = buyAmount.plus(1e18);
            const higherPrice = higherBuyAmount.div(sellAmount).decimalPlaces(18);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { sellAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount: higherBuyAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    sellAmount,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.Kyber,
                                fillData: {},
                            },
                            {
                                makerAmount: higherBuyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.Kyber,
                                fillData: {},
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                {
                    name: ERC20BridgeSource.Kyber,
                    price: higherPrice,
                    gas: new BigNumber(4.5e5),
                },
            ]);
        });

        it('returns the Kyber results with lowest takerAmount when quoting buyAmount', () => {
            const lowerSellAmount = sellAmount.minus(0.01e18);
            const lowerSellPrice = lowerSellAmount.div(buyAmount).decimalPlaces(18);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { buyAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount: lowerSellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.Kyber,
                                fillData: {},
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: lowerSellAmount,
                                liquiditySource: ERC20BridgeSource.Kyber,
                                fillData: {},
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                {
                    name: ERC20BridgeSource.Kyber,
                    price: lowerSellPrice,
                    gas: new BigNumber(4.5e5),
                },
            ]);
        });

        it('handles buying tokens with a different number of decimals', () => {
            const price = new BigNumber(1).decimalPlaces(6);
            const daiAmount = new BigNumber(1e18);
            const usdcAmount = new BigNumber(1e6);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { buyAmount: daiAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: USDC.tokenAddress,
                    buyAmount: daiAmount,
                    sellAmount: usdcAmount,
                    sellTokenToEthRate: ethToDaiRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: daiAmount,
                                takerAmount: usdcAmount,
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
                    gas: new BigNumber(90e3),
                },
            ]);
        });

        it('handles selling tokens with a different number of decimals', () => {
            const price = new BigNumber(1).decimalPlaces(18);
            const daiAmount = new BigNumber(1e18);
            const usdcAmount = new BigNumber(1e6);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { sellAmount: usdcAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: USDC.tokenAddress,
                    buyAmount: daiAmount,
                    sellAmount: usdcAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: daiAmount,
                                takerAmount: usdcAmount,
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
                    gas: new BigNumber(90e3),
                },
            ]);
        });

        it('returns the sample with lowest gas usage for the same output amounts when quoting buyAmount', () => {
            const price = sellAmount.div(buyAmount).decimalPlaces(18);
            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { buyAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    // Path length > 2 receives a higher gas estimate
                                    tokenAddressPath: [{}, {}, {}],
                                },
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    tokenAddressPath: [],
                                },
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    // Path length > 2 receives a higher gas estimate
                                    tokenAddressPath: [{}, {}, {}],
                                },
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                {
                    name: ERC20BridgeSource.UniswapV2,
                    price,
                    gas: new BigNumber(1.5e5),
                },
            ]);
        });

        it('returns the sample with lowest gas usage for the same output amounts when quoting sellAmount', () => {
            const price = buyAmount.div(sellAmount).decimalPlaces(18);

            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { sellAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    // Path length > 2 receives a higher gas estimate
                                    tokenAddressPath: [{}, {}, {}],
                                },
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    tokenAddressPath: [],
                                },
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    // Path length > 2 receives a higher gas estimate
                                    tokenAddressPath: [{}, {}, {}],
                                },
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                {
                    name: ERC20BridgeSource.UniswapV2,
                    price,
                    gas: new BigNumber(1.5e5),
                },
            ]);
        });

        it('returns the overall cheapest sample taking gas into account for sellAmount quotes', () => {
            const price = buyAmount.div(sellAmount).decimalPlaces(18);
            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { sellAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount.plus(1e18), // $1 more received but roughly $1.66 higher gas costs
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    // Path length > 2 receives a higher gas estimate
                                    tokenAddressPath: [{}, {}, {}],
                                },
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    tokenAddressPath: [],
                                },
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                {
                    name: ERC20BridgeSource.UniswapV2,
                    price,
                    gas: new BigNumber(1.5e5),
                },
            ]);
        });

        it('returns the overall cheapest sample taking gas into account for buyAmount quotes', () => {
            const price = sellAmount.div(buyAmount).decimalPlaces(18);
            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { buyAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount.minus(0.004e18), // Taker needs to sell $1.33 less but $1.66 higher gas costs
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    // Path length > 2 receives a higher gas estimate
                                    tokenAddressPath: [{}, {}, {}],
                                },
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    tokenAddressPath: [],
                                },
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                {
                    name: ERC20BridgeSource.UniswapV2,
                    price,
                    gas: new BigNumber(1.5e5),
                },
            ]);
        });

        it('ignores gas cost when buyTokenToEthRate is 0 for sellAmount quotes', () => {
            const price = buyAmount
                .plus(1e18)
                .div(sellAmount)
                .decimalPlaces(18);
            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { sellAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ethToWethRate,
                    buyTokenToEthRate: ZERO,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount.plus(1e18), // $1 more received but roughly $1.66 higher gas costs
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    // Path length > 2 receives a higher gas estimate
                                    tokenAddressPath: [{}, {}, {}],
                                },
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    tokenAddressPath: [],
                                },
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                {
                    name: ERC20BridgeSource.UniswapV2,
                    price,
                    gas: new BigNumber(2e5),
                },
            ]);
        });

        it('ignores gas cost when sellTokenToEthRate is 0 for buyAmount quotes', () => {
            const price = sellAmount
                .minus(0.004e18)
                .div(buyAmount)
                .decimalPlaces(18);
            const comparisons = priceComparisonUtils.getPriceComparisonFromQuote(
                ChainId.Mainnet,
                { buyAmount },
                {
                    buyTokenAddress: DAI.tokenAddress,
                    sellTokenAddress: WETH.tokenAddress,
                    buyAmount,
                    sellAmount,
                    sellTokenToEthRate: ZERO,
                    buyTokenToEthRate: ethToDaiRate,
                    gasPrice,
                    quoteReport: {
                        sourcesConsidered: [
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount.minus(0.004e18), // Taker needs to sell $1.33 less but $1.66 higher gas costs
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    // Path length > 2 receives a higher gas estimate
                                    tokenAddressPath: [{}, {}, {}],
                                },
                            },
                            {
                                makerAmount: buyAmount,
                                takerAmount: sellAmount,
                                liquiditySource: ERC20BridgeSource.UniswapV2,
                                fillData: {
                                    tokenAddressPath: [],
                                },
                            },
                        ],
                    },
                },
            );

            expect(comparisons).to.deep.include.members([
                {
                    name: ERC20BridgeSource.UniswapV2,
                    price,
                    gas: new BigNumber(2e5),
                },
            ]);
        });
    });
});
