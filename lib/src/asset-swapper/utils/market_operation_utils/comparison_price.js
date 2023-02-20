"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComparisonPrices = void 0;
const dev_utils_1 = require("@0x/dev-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const types_1 = require("../../types");
const constants_1 = require("./constants");
/**
 * Takes in an optimizer response and returns a price for RFQT MMs to beat
 * returns the price of the taker asset in terms of the maker asset
 * So the RFQT MM should aim for a higher price
 * @param adjustedRate the adjusted rate (accounting for fees) from the optimizer, maker/taker
 * @param amount the amount specified by the client
 * @param marketSideLiquidity the results from querying liquidity sources
 * @param nativeOrderFeeEstimate the fee estimate for native order.
 * @return ComparisonPrice object with the prices for RFQ MMs to beat
 */
function getComparisonPrices(adjustedRate, amount, marketSideLiquidity, nativeOrderFeeEstimate, exchangeProxyOverhead) {
    let wholeOrder;
    let feeInEth;
    // HACK: get the fee penalty of a single 0x native order
    // The FeeSchedule function takes in a `FillData` object and returns a fee estimate in ETH
    // We don't have fill data here, we just want the cost of a single native order, so we pass in undefined
    // This works because the feeSchedule returns a constant for Native orders, this will need
    // to be tweaked if the feeSchedule for native orders uses the fillData passed in
    // 2 potential issues: there is no native fee schedule or the fee schedule depends on fill data
    try {
        const fillFeeInEth = new utils_1.BigNumber(nativeOrderFeeEstimate({ type: protocol_utils_1.FillQuoteTransformerOrderType.Rfq }).fee);
        const exchangeProxyOverheadInEth = new utils_1.BigNumber(exchangeProxyOverhead(constants_1.SOURCE_FLAGS.RfqOrder));
        feeInEth = fillFeeInEth.plus(exchangeProxyOverheadInEth);
    }
    catch {
        utils_1.logUtils.warn('Native order fee schedule requires fill data');
        return { wholeOrder };
    }
    // Calc native order fee penalty in output unit (maker units for sells, taker unit for buys)
    const feePenalty = !marketSideLiquidity.outputAmountPerEth.isZero()
        ? marketSideLiquidity.outputAmountPerEth.times(feeInEth)
        : // if it's a sell, the input token is the taker token
            marketSideLiquidity.inputAmountPerEth
                .times(feeInEth)
                .times(marketSideLiquidity.side === types_1.MarketOperation.Sell ? adjustedRate : adjustedRate.pow(-1));
    // the adjusted rate is defined as maker/taker
    // input is the taker token for sells, input is the maker token for buys
    const orderMakerAmount = marketSideLiquidity.side === types_1.MarketOperation.Sell ? adjustedRate.times(amount).plus(feePenalty) : amount;
    const orderTakerAmount = marketSideLiquidity.side === types_1.MarketOperation.Sell ? amount : amount.dividedBy(adjustedRate).minus(feePenalty);
    if (orderTakerAmount.gt(0) && orderMakerAmount.gt(0)) {
        const optimalMakerUnitAmount = dev_utils_1.Web3Wrapper.toUnitAmount(
        // round up maker amount -- err to giving more competitive price
        orderMakerAmount.integerValue(utils_1.BigNumber.ROUND_UP), marketSideLiquidity.makerTokenDecimals);
        const optimalTakerUnitAmount = dev_utils_1.Web3Wrapper.toUnitAmount(
        // round down taker amount -- err to giving more competitive price
        orderTakerAmount.integerValue(utils_1.BigNumber.ROUND_DOWN), marketSideLiquidity.takerTokenDecimals);
        wholeOrder = optimalMakerUnitAmount.div(optimalTakerUnitAmount).decimalPlaces(constants_1.COMPARISON_PRICE_DECIMALS);
    }
    return { wholeOrder };
}
exports.getComparisonPrices = getComparisonPrices;
//# sourceMappingURL=comparison_price.js.map