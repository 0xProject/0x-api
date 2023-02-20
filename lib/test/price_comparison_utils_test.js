"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const token_metadata_1 = require("@0x/token-metadata");
const types_1 = require("@0x/types");
const utils_1 = require("@0x/utils");
const asset_swapper_1 = require("../src/asset-swapper");
const constants_1 = require("../src/constants");
const price_comparison_utils_1 = require("../src/utils/price_comparison_utils");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
const WETH = (0, token_metadata_1.getTokenMetadataIfExists)('WETH', asset_swapper_1.ChainId.Mainnet);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
const DAI = (0, token_metadata_1.getTokenMetadataIfExists)('DAI', asset_swapper_1.ChainId.Mainnet);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
const USDC = (0, token_metadata_1.getTokenMetadataIfExists)('USDC', asset_swapper_1.ChainId.Mainnet);
const buyAmount = new utils_1.BigNumber('23318242912334152626');
const sellAmount = new utils_1.BigNumber('70100000000000000');
const ethToDaiRate = buyAmount.div(sellAmount).decimalPlaces(18);
const ethToWethRate = new utils_1.BigNumber(1);
const gasPrice = new utils_1.BigNumber(100000000000); // 100 GWEI
const estimatedGas = new utils_1.BigNumber(136000);
const SUITE_NAME = 'priceComparisonUtils';
const daiWethQuoteBase = {
    buyTokenAddress: DAI.tokenAddress,
    sellTokenAddress: WETH.tokenAddress,
    buyAmount,
    sellAmount,
    sellTokenToEthRate: ethToWethRate,
    buyTokenToEthRate: ethToDaiRate,
    gasPrice,
    estimatedGas,
};
describe(SUITE_NAME, () => {
    describe('getPriceComparisonFromQuote', () => {
        const savingsInEthVsUniswapV1 = new utils_1.BigNumber('-0.001263636363636364');
        const savingsInEthVsUniswapV2 = new utils_1.BigNumber('0.004736363636363636');
        it('returns comparison prices for quote reporter sources when quoting sellAmount', () => {
            const price = buyAmount.div(sellAmount).decimalPlaces(18);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Sell, {
                ...daiWethQuoteBase,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.Uniswap,
                            fillData: {},
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                // Uniswap sample found
                {
                    name: asset_swapper_1.ERC20BridgeSource.Uniswap,
                    price,
                    sellAmount,
                    buyAmount,
                    gas: new utils_1.BigNumber(111e3),
                    savingsInEth: savingsInEthVsUniswapV1,
                    expectedSlippage: null,
                },
                // Native sample not found
                {
                    name: asset_swapper_1.ERC20BridgeSource.Native,
                    price: null,
                    gas: null,
                    savingsInEth: null,
                    sellAmount: null,
                    buyAmount: null,
                    expectedSlippage: null,
                },
            ]);
        });
        it('returns comparison prices for quote reporter sources when quoting buyAmount', () => {
            const price = sellAmount.div(buyAmount).decimalPlaces(18);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Buy, {
                ...daiWethQuoteBase,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.Uniswap,
                            fillData: {},
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                // Uniswap sample found
                {
                    name: asset_swapper_1.ERC20BridgeSource.Uniswap,
                    price,
                    sellAmount,
                    buyAmount,
                    gas: new utils_1.BigNumber(111e3),
                    savingsInEth: savingsInEthVsUniswapV1,
                    expectedSlippage: null,
                },
                // Native sample not found
                {
                    name: asset_swapper_1.ERC20BridgeSource.Native,
                    price: null,
                    gas: null,
                    savingsInEth: null,
                    sellAmount: null,
                    buyAmount: null,
                    expectedSlippage: null,
                },
            ]);
        });
        it('filters out incomplete samples with 0 makerAmount when quoting sellAmount', () => {
            const price = buyAmount.div(sellAmount).decimalPlaces(18);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Sell, {
                ...daiWethQuoteBase,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.Uniswap,
                            fillData: {},
                        },
                        {
                            makerAmount: constants_1.ZERO,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.MStable,
                            fillData: {},
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                // Uniswap sample found
                {
                    name: asset_swapper_1.ERC20BridgeSource.Uniswap,
                    price,
                    sellAmount,
                    buyAmount,
                    gas: new utils_1.BigNumber(111e3),
                    savingsInEth: savingsInEthVsUniswapV1,
                    expectedSlippage: null,
                },
                // Native placeholder instead of invalid 0 amount result
                {
                    name: asset_swapper_1.ERC20BridgeSource.Native,
                    price: null,
                    gas: null,
                    savingsInEth: null,
                    sellAmount: null,
                    buyAmount: null,
                    expectedSlippage: null,
                },
            ]);
        });
        it('filters out incomplete samples with 0 takerAmount when quoting buyAmount', () => {
            const price = sellAmount.div(buyAmount).decimalPlaces(18);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Buy, {
                ...daiWethQuoteBase,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.Uniswap,
                            fillData: {},
                        },
                        {
                            makerAmount: buyAmount,
                            takerAmount: constants_1.ZERO,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.MStable,
                            fillData: {},
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                // Uniswap sample found
                {
                    name: asset_swapper_1.ERC20BridgeSource.Uniswap,
                    price,
                    sellAmount,
                    buyAmount,
                    gas: new utils_1.BigNumber(111e3),
                    savingsInEth: savingsInEthVsUniswapV1,
                    expectedSlippage: null,
                },
                // Native placeholder instead of invalid 0 amount result
                {
                    name: asset_swapper_1.ERC20BridgeSource.Native,
                    price: null,
                    gas: null,
                    savingsInEth: null,
                    sellAmount: null,
                    buyAmount: null,
                    expectedSlippage: null,
                },
            ]);
        });
        it('should match price decimal places to maker asset for sell quotes', () => {
            const wethAmount = new utils_1.BigNumber(1 / 3).times(1e18).decimalPlaces(0, utils_1.BigNumber.ROUND_FLOOR);
            const usdcAmount = new utils_1.BigNumber(100e6);
            const price = wethAmount.div(usdcAmount).div(1e12).decimalPlaces(18);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Sell, {
                buyTokenAddress: WETH.tokenAddress,
                sellTokenAddress: USDC.tokenAddress,
                buyAmount: wethAmount,
                sellAmount: usdcAmount,
                sellTokenToEthRate: ethToDaiRate,
                buyTokenToEthRate: ethToDaiRate,
                gasPrice,
                estimatedGas,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: wethAmount,
                            takerAmount: usdcAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.Uniswap,
                            fillData: {},
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                // Uniswap sample found
                {
                    name: asset_swapper_1.ERC20BridgeSource.Uniswap,
                    price,
                    sellAmount: usdcAmount,
                    buyAmount: wethAmount,
                    gas: new utils_1.BigNumber(111e3),
                    savingsInEth: savingsInEthVsUniswapV1,
                    expectedSlippage: null,
                },
            ]);
        });
        it('should match price decimal places to taker asset for buy quotes', () => {
            const usdcAmount = new utils_1.BigNumber(100e6);
            const wethAmount = new utils_1.BigNumber(7 / 3).times(1e18).decimalPlaces(0, utils_1.BigNumber.ROUND_FLOOR);
            const price = usdcAmount.div(wethAmount).times(1e12).decimalPlaces(6);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Buy, {
                buyTokenAddress: WETH.tokenAddress,
                sellTokenAddress: USDC.tokenAddress,
                buyAmount: wethAmount,
                sellAmount: usdcAmount,
                sellTokenToEthRate: ethToDaiRate,
                buyTokenToEthRate: ethToDaiRate,
                gasPrice,
                estimatedGas,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: wethAmount,
                            takerAmount: usdcAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.Uniswap,
                            fillData: {},
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                // Uniswap sample found
                {
                    name: asset_swapper_1.ERC20BridgeSource.Uniswap,
                    price,
                    sellAmount: usdcAmount,
                    buyAmount: wethAmount,
                    gas: new utils_1.BigNumber(111e3),
                    savingsInEth: savingsInEthVsUniswapV1,
                    expectedSlippage: null,
                },
            ]);
        });
        it('handles selling tokens with a different number of decimals', () => {
            const price = new utils_1.BigNumber(1).decimalPlaces(18);
            const daiAmount = new utils_1.BigNumber(1e18);
            const usdcAmount = new utils_1.BigNumber(1e6);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Sell, {
                buyTokenAddress: DAI.tokenAddress,
                sellTokenAddress: USDC.tokenAddress,
                buyAmount: daiAmount,
                sellAmount: usdcAmount,
                sellTokenToEthRate: ethToWethRate,
                buyTokenToEthRate: ethToDaiRate,
                gasPrice,
                estimatedGas,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: daiAmount,
                            takerAmount: usdcAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.Uniswap,
                            fillData: {},
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                // Uniswap sample found
                {
                    name: asset_swapper_1.ERC20BridgeSource.Uniswap,
                    price,
                    sellAmount: usdcAmount,
                    buyAmount: daiAmount,
                    gas: new utils_1.BigNumber(111e3),
                    savingsInEth: savingsInEthVsUniswapV1,
                    expectedSlippage: null,
                },
            ]);
        });
        it('returns the sample with lowest gas usage for the same output amounts when quoting buyAmount', () => {
            const price = sellAmount.div(buyAmount).decimalPlaces(18);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Buy, {
                ...daiWethQuoteBase,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                // Path length > 2 receives a higher gas estimate
                                tokenAddressPath: [{}, {}, {}],
                            },
                        },
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                tokenAddressPath: [],
                            },
                        },
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                // Path length > 2 receives a higher gas estimate
                                tokenAddressPath: [{}, {}, {}],
                            },
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                {
                    name: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                    price,
                    buyAmount,
                    sellAmount,
                    gas: new utils_1.BigNumber(1.71e5),
                    savingsInEth: savingsInEthVsUniswapV2,
                    expectedSlippage: null,
                },
            ]);
        });
        it('returns the sample with lowest gas usage for the same output amounts when quoting sellAmount', () => {
            const price = buyAmount.div(sellAmount).decimalPlaces(18);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Sell, {
                ...daiWethQuoteBase,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                // Path length > 2 receives a higher gas estimate
                                tokenAddressPath: [{}, {}, {}],
                            },
                        },
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                tokenAddressPath: [],
                            },
                        },
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                // Path length > 2 receives a higher gas estimate
                                tokenAddressPath: [{}, {}, {}],
                            },
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                {
                    name: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                    price,
                    buyAmount,
                    sellAmount,
                    gas: new utils_1.BigNumber(1.71e5),
                    savingsInEth: savingsInEthVsUniswapV2,
                    expectedSlippage: null,
                },
            ]);
        });
        it('returns the overall cheapest sample taking gas into account for sellAmount quotes', () => {
            const price = buyAmount.div(sellAmount).decimalPlaces(18);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Sell, {
                ...daiWethQuoteBase,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount.plus(1e18),
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                // Path length > 2 receives a higher gas estimate
                                tokenAddressPath: [{}, {}, {}],
                            },
                        },
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                tokenAddressPath: [],
                            },
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                {
                    name: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                    price,
                    buyAmount,
                    sellAmount,
                    gas: new utils_1.BigNumber(1.71e5),
                    savingsInEth: savingsInEthVsUniswapV2,
                    expectedSlippage: null,
                },
            ]);
        });
        it('returns the overall cheapest sample taking gas into account for buyAmount quotes', () => {
            const price = sellAmount.div(buyAmount).decimalPlaces(18);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Buy, {
                ...daiWethQuoteBase,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount.minus(0.004e18),
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                // Path length > 2 receives a higher gas estimate
                                tokenAddressPath: [{}, {}, {}],
                            },
                        },
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                tokenAddressPath: [],
                            },
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                {
                    name: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                    price,
                    buyAmount,
                    sellAmount,
                    gas: new utils_1.BigNumber(1.71e5),
                    savingsInEth: savingsInEthVsUniswapV2,
                    expectedSlippage: null,
                },
            ]);
        });
        it('ignores gas cost when buyTokenToEthRate is 0 for sellAmount quotes', () => {
            const price = buyAmount.plus(1e18).div(sellAmount).decimalPlaces(18, utils_1.BigNumber.ROUND_FLOOR);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Sell, {
                ...daiWethQuoteBase,
                buyTokenToEthRate: constants_1.ZERO,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount.plus(1e18),
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                // Path length > 2 receives a higher gas estimate
                                tokenAddressPath: [{}, {}, {}],
                            },
                        },
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                tokenAddressPath: [],
                            },
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                {
                    name: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                    price,
                    gas: new utils_1.BigNumber(2.21e5),
                    savingsInEth: constants_1.ZERO,
                    buyAmount: buyAmount.plus(1e18),
                    sellAmount,
                    expectedSlippage: null,
                },
            ]);
        });
        it('ignores gas cost when sellTokenToEthRate is 0 for buyAmount quotes', () => {
            const price = sellAmount.minus(0.004e18).div(buyAmount).decimalPlaces(18, utils_1.BigNumber.ROUND_CEIL);
            const comparisons = price_comparison_utils_1.priceComparisonUtils.getPriceComparisonFromQuote(asset_swapper_1.ChainId.Mainnet, types_1.MarketOperation.Buy, {
                ...daiWethQuoteBase,
                sellTokenToEthRate: constants_1.ZERO,
                priceComparisonsReport: {
                    dexSources: [
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount.minus(0.004e18),
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                // Path length > 2 receives a higher gas estimate
                                tokenAddressPath: [{}, {}, {}],
                            },
                        },
                        {
                            makerAmount: buyAmount,
                            takerAmount: sellAmount,
                            liquiditySource: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                            fillData: {
                                tokenAddressPath: [],
                            },
                        },
                    ],
                    multiHopSources: [],
                    nativeSources: [],
                },
            }, undefined, 0);
            (0, contracts_test_utils_1.expect)(comparisons).to.deep.include.members([
                {
                    name: asset_swapper_1.ERC20BridgeSource.UniswapV2,
                    price,
                    gas: new utils_1.BigNumber(2.21e5),
                    savingsInEth: constants_1.ZERO,
                    buyAmount,
                    sellAmount: sellAmount.minus(0.004e18),
                    expectedSlippage: null,
                },
            ]);
        });
    });
});
//# sourceMappingURL=price_comparison_utils_test.js.map