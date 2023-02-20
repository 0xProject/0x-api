"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateFeeUtils = void 0;
const utils_1 = require("@0x/utils");
const assert_1 = require("./assert");
exports.affiliateFeeUtils = {
    /**
     * Get the amount of eth to send for a forwarder contract call (includes takerAssetAmount, protocol fees, and specified affiliate fee amount)
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee.
     */
    getTotalEthAmountWithAffiliateFee(swapQuoteInfo, feePercentage) {
        const ethAmount = swapQuoteInfo.protocolFeeInWeiAmount.plus(swapQuoteInfo.totalTakerAmount);
        const ethAmountWithFees = ethAmount.plus(exports.affiliateFeeUtils.getFeeAmount(swapQuoteInfo, feePercentage));
        return ethAmountWithFees;
    },
    /**
     * Get the affiliate fee owed to the forwarder fee recipient.
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee.
     */
    getFeeAmount(swapQuoteInfo, feePercentage) {
        assert_1.assert.assert(feePercentage >= 0, 'feePercentage must be >= 0');
        const ethAmount = swapQuoteInfo.protocolFeeInWeiAmount.plus(swapQuoteInfo.totalTakerAmount);
        // HACK(dekz): This is actually in WEI amount not ETH
        return ethAmount.times(feePercentage).integerValue(utils_1.BigNumber.ROUND_UP);
    },
};
//# sourceMappingURL=affiliate_fee_utils.js.map