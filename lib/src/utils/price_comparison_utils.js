"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceComparisonUtils = void 0;
const token_metadata_1 = require("@0x/token-metadata");
const types_1 = require("@0x/types");
const utils_1 = require("@0x/utils");
const web3_wrapper_1 = require("@0x/web3-wrapper");
const _ = require("lodash");
const asset_swapper_1 = require("../asset-swapper");
const config_1 = require("../config");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
// NOTE: Our internal Uniswap gas usage may be lower than the Uniswap UI usage
// Therefore we need to adjust the gas estimates to be representative of using the Uniswap UI.
const gasScheduleWithOverrides = {
    ...asset_swapper_1.DEFAULT_GAS_SCHEDULE,
    [asset_swapper_1.ERC20BridgeSource.UniswapV2]: (fillData) => {
        let gas = 1.5e5;
        if (fillData.tokenAddressPath.length > 2) {
            gas += 5e4;
        }
        return gas;
    },
    [asset_swapper_1.ERC20BridgeSource.SushiSwap]: (fillData) => {
        let gas = 1.5e5;
        if (fillData.tokenAddressPath.length > 2) {
            gas += 5e4;
        }
        return gas;
    },
};
const NULL_SOURCE_COMPARISONS = asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[config_1.CHAIN_ID].sources.reduce((memo, liquiditySource) => {
    memo.push({
        name: liquiditySource,
        price: null,
        gas: null,
        savingsInEth: null,
        buyAmount: null,
        sellAmount: null,
        expectedSlippage: null,
    });
    return memo;
}, []);
exports.priceComparisonUtils = {
    getPriceComparisonFromQuote(chainId, side, quote, slippageModelManager, maxSlippageRate) {
        try {
            return getPriceComparisonFromQuoteOrThrow(chainId, side, quote, slippageModelManager, maxSlippageRate);
        }
        catch (e) {
            logger_1.logger.error(`Error calculating price comparisons, skipping [${e}]`);
            return undefined;
        }
    },
    renameNative(sc) {
        return {
            ...sc,
            name: sc.name === asset_swapper_1.ERC20BridgeSource.Native ? '0x' : sc.name,
        };
    },
};
function getPriceComparisonFromQuoteOrThrow(chainId, side, quote, slippageModelManager, maxSlippageRate) {
    // Set up variables for calculation
    const buyToken = (0, token_metadata_1.getTokenMetadataIfExists)(quote.buyTokenAddress, chainId);
    const sellToken = (0, token_metadata_1.getTokenMetadataIfExists)(quote.sellTokenAddress, chainId);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
    const ethToken = (0, token_metadata_1.getTokenMetadataIfExists)('WETH', chainId);
    const ethUnitAmount = new utils_1.BigNumber(10).pow(ethToken.decimals);
    if (!buyToken || !sellToken || !quote.buyAmount || !quote.sellAmount || !quote.priceComparisonsReport) {
        logger_1.logger.warn('Missing data to generate price comparisons');
        return undefined;
    }
    const isSelling = side === types_1.MarketOperation.Sell;
    const quoteTokenToEthRate = isSelling ? quote.buyTokenToEthRate : quote.sellTokenToEthRate;
    const { priceComparisonsReport } = quote;
    // Filter out samples with invalid amounts
    const allSources = [
        ...priceComparisonsReport.dexSources,
        ...priceComparisonsReport.multiHopSources,
        ...priceComparisonsReport.nativeSources,
    ];
    const fullTradeSources = allSources.filter((s) => isSelling
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            s.takerAmount.isEqualTo(quote.sellAmount) && s.makerAmount.isGreaterThan(constants_1.ZERO)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            s.makerAmount.isEqualTo(quote.buyAmount) && s.takerAmount.isGreaterThan(constants_1.ZERO));
    // Calculate the maker/taker amounts after factoring in gas costs
    const tradeSourcesWithGas = fullTradeSources.map((source) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
        const gas = constants_1.TX_BASE_GAS.plus(new utils_1.BigNumber(gasScheduleWithOverrides[source.liquiditySource](source.fillData)));
        const gasCost = gas.times(quote.gasPrice).dividedBy(ethUnitAmount).times(quoteTokenToEthRate);
        const unitMakerAmount = web3_wrapper_1.Web3Wrapper.toUnitAmount(source.makerAmount, buyToken.decimals);
        const unitMakerAmountAfterGasCosts = isSelling ? unitMakerAmount.minus(gasCost) : unitMakerAmount;
        const unitTakerAmount = web3_wrapper_1.Web3Wrapper.toUnitAmount(source.takerAmount, sellToken.decimals);
        const unitTakerAmountAfterGasCosts = isSelling ? unitTakerAmount : unitTakerAmount.plus(gasCost);
        let expectedSlippage = null;
        if (slippageModelManager) {
            expectedSlippage = slippageModelManager === null || slippageModelManager === void 0 ? void 0 : slippageModelManager.calculateExpectedSlippage(quote.buyTokenAddress, quote.sellTokenAddress, source.makerAmount, source.takerAmount, [{ name: source.liquiditySource, proportion: new utils_1.BigNumber(1) }], maxSlippageRate);
        }
        return {
            ...source,
            gas,
            unitTakerAmount,
            unitMakerAmount,
            unitTakerAmountAfterGasCosts,
            unitMakerAmountAfterGasCosts,
            expectedSlippage,
        };
    });
    // NOTE: Sort sources by the best outcome for the user
    // if the user is selling we want to maximize the maker amount they will receive
    // if the user is buying we want to minimize the taker amount they have to pay
    const sortedSources = isSelling
        ? tradeSourcesWithGas.slice().sort((a, b) => {
            return b.unitMakerAmountAfterGasCosts.comparedTo(a.unitMakerAmountAfterGasCosts);
        })
        : tradeSourcesWithGas.slice().sort((a, b) => {
            return a.unitTakerAmountAfterGasCosts.comparedTo(b.unitTakerAmountAfterGasCosts);
        });
    // Select the best (first in the sorted list) quote from each source
    const bestQuotesFromEverySource = _.uniqBy(sortedSources, 'liquiditySource');
    // *** Calculate additional fields that we want to return *** //
    // Calculate savings (Part 1): Cost of the quote including gas
    const quoteGasCostInTokens = quote.estimatedGas
        .dividedBy(constants_1.GAS_LIMIT_BUFFER_MULTIPLIER) // Remove gas estimate safety buffer that we added to the quote
        .times(quote.gasPrice)
        .dividedBy(ethUnitAmount)
        .times(quoteTokenToEthRate);
    const unitAmount = isSelling
        ? web3_wrapper_1.Web3Wrapper.toUnitAmount(quote.buyAmount, buyToken.decimals)
        : web3_wrapper_1.Web3Wrapper.toUnitAmount(quote.sellAmount, sellToken.decimals);
    const unitAmountAfterGasCosts = isSelling
        ? unitAmount.minus(quoteGasCostInTokens)
        : unitAmount.plus(quoteGasCostInTokens);
    const roundingStrategy = isSelling ? utils_1.BigNumber.ROUND_FLOOR : utils_1.BigNumber.ROUND_CEIL;
    // Transform the fields
    const sourcePrices = bestQuotesFromEverySource.map((source) => {
        const { liquiditySource, unitMakerAmount, unitTakerAmount, gas } = source;
        // calculate price
        const price = isSelling
            ? unitMakerAmount.dividedBy(unitTakerAmount).decimalPlaces(buyToken.decimals, roundingStrategy)
            : unitTakerAmount.dividedBy(unitMakerAmount).decimalPlaces(sellToken.decimals, roundingStrategy);
        // calculate savings (Part 2):
        const savingsInTokens = isSelling
            ? unitAmountAfterGasCosts.minus(source.unitMakerAmountAfterGasCosts)
            : source.unitTakerAmountAfterGasCosts.minus(unitAmountAfterGasCosts);
        const savingsInEth = quoteTokenToEthRate.gt(constants_1.ZERO)
            ? savingsInTokens.dividedBy(quoteTokenToEthRate).decimalPlaces(ethToken.decimals)
            : constants_1.ZERO;
        let expectedSlippage = null;
        if (slippageModelManager) {
            expectedSlippage = slippageModelManager === null || slippageModelManager === void 0 ? void 0 : slippageModelManager.calculateExpectedSlippage(quote.buyTokenAddress, quote.sellTokenAddress, source.makerAmount, source.takerAmount, [{ name: source.liquiditySource, proportion: new utils_1.BigNumber(1) }], maxSlippageRate);
        }
        return {
            name: liquiditySource,
            price,
            sellAmount: source.takerAmount,
            buyAmount: source.makerAmount,
            gas,
            savingsInEth,
            expectedSlippage,
        };
    });
    // Add null values for all sources we don't have a result for so that we always have a full result set in the response
    const allSourcePrices = _.uniqBy([...sourcePrices, ...NULL_SOURCE_COMPARISONS], 'name');
    return allSourcePrices;
}
//# sourceMappingURL=price_comparison_utils.js.map