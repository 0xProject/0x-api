"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceUtils = exports.getBuyTokenPercentageFeeOrZero = void 0;
const utils_1 = require("@0x/utils");
const asset_swapper_1 = require("../asset-swapper");
const config_1 = require("../config");
const constants_1 = require("../constants");
const number_utils_1 = require("./number_utils");
const getBuyTokenPercentageFeeOrZero = (affiliateFee) => {
    switch (affiliateFee.feeType) {
        case asset_swapper_1.AffiliateFeeType.GaslessFee:
        case asset_swapper_1.AffiliateFeeType.PositiveSlippageFee:
            return 0;
        default:
            return affiliateFee.buyTokenPercentageFee;
    }
};
exports.getBuyTokenPercentageFeeOrZero = getBuyTokenPercentageFeeOrZero;
exports.serviceUtils = {
    attributeCallData(data, affiliateAddress) {
        const affiliateAddressOrDefault = affiliateAddress ? affiliateAddress : config_1.FEE_RECIPIENT_ADDRESS;
        const affiliateCallDataEncoder = new utils_1.AbiEncoder.Method({
            constant: true,
            outputs: [],
            name: 'ZeroExAPIAffiliate',
            inputs: [
                { name: 'affiliate', type: 'address' },
                { name: 'timestamp', type: 'uint256' },
            ],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        });
        // Generate unique identifier
        const timestampInSeconds = new utils_1.BigNumber(Date.now() / constants_1.ONE_SECOND_MS).integerValue();
        const hexTimestamp = timestampInSeconds.toString(constants_1.HEX_BASE);
        const randomNumber = number_utils_1.numberUtils.randomHexNumberOfLength(10);
        // Concatenate the hex identifier with the hex timestamp
        // In the final encoded call data, this will leave us with a 5-byte ID followed by
        // a 4-byte timestamp, and won't break parsers of the timestamp made prior to the
        // addition of the ID
        const uniqueIdentifier = new utils_1.BigNumber(`${randomNumber}${hexTimestamp}`, constants_1.HEX_BASE);
        // Encode additional call data and return
        const encodedAffiliateData = affiliateCallDataEncoder.encode([affiliateAddressOrDefault, uniqueIdentifier]);
        const affiliatedData = `${data}${encodedAffiliateData.slice(2)}`;
        return { affiliatedData, decodedUniqueId: `${randomNumber}-${timestampInSeconds}` };
    },
    convertToLiquiditySources(sourceBreakdown) {
        const toExternalFormat = (source) => (source === asset_swapper_1.ERC20BridgeSource.Native ? '0x' : source);
        // TODO Jacob SELL is a superset of BUY, but may not always be
        const allSingleSources = asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[config_1.CHAIN_ID].sources.filter((source) => source !== asset_swapper_1.ERC20BridgeSource.MultiHop);
        const defaultSingleSourceBreakdown = Object.fromEntries(allSingleSources.map((source) => [source, new utils_1.BigNumber(0)]));
        const singleSourceBreakdown = { ...defaultSingleSourceBreakdown, ...sourceBreakdown.singleSource };
        const singleSourceLiquiditySources = Object.entries(singleSourceBreakdown).map(([source, proportion]) => ({
            name: toExternalFormat(source),
            proportion: new utils_1.BigNumber(proportion.toPrecision(constants_1.PERCENTAGE_SIG_DIGITS)),
        }));
        const multihopLiquiditySources = sourceBreakdown.multihop.map((breakdown) => ({
            name: asset_swapper_1.ERC20BridgeSource.MultiHop,
            proportion: new utils_1.BigNumber(breakdown.proportion.toPrecision(constants_1.PERCENTAGE_SIG_DIGITS)),
            intermediateToken: breakdown.intermediateToken,
            hops: breakdown.hops.map(toExternalFormat),
        }));
        return [...singleSourceLiquiditySources, ...multihopLiquiditySources];
    },
    getBuyTokenFeeAmounts(quote, fee) {
        if (fee.feeType === asset_swapper_1.AffiliateFeeType.None || fee.recipient === constants_1.NULL_ADDRESS || fee.recipient === '') {
            return {
                sellTokenFeeAmount: constants_1.ZERO,
                buyTokenFeeAmount: constants_1.ZERO,
                gasCost: constants_1.ZERO,
            };
        }
        if (fee.feeType === asset_swapper_1.AffiliateFeeType.GaslessFee) {
            const buyTokenFeeAmount = config_1.GASLESS_SWAP_FEE_ENABLED
                ? quote.makerAmountPerEth
                    .times(quote.gasPrice)
                    .times(quote.worstCaseQuoteInfo.gas)
                    .integerValue(utils_1.BigNumber.ROUND_DOWN)
                : constants_1.ZERO;
            return {
                sellTokenFeeAmount: constants_1.ZERO,
                buyTokenFeeAmount,
                gasCost: constants_1.AFFILIATE_FEE_TRANSFORMER_GAS,
            };
        }
        const minBuyAmount = quote.worstCaseQuoteInfo.makerAmount;
        const buyTokenFeeAmount = minBuyAmount
            .times((0, exports.getBuyTokenPercentageFeeOrZero)(fee))
            .dividedBy((0, exports.getBuyTokenPercentageFeeOrZero)(fee) + 1)
            .integerValue(utils_1.BigNumber.ROUND_DOWN);
        return {
            sellTokenFeeAmount: constants_1.ZERO,
            buyTokenFeeAmount,
            gasCost: fee.feeType === asset_swapper_1.AffiliateFeeType.PercentageFee
                ? constants_1.AFFILIATE_FEE_TRANSFORMER_GAS
                : constants_1.POSITIVE_SLIPPAGE_FEE_TRANSFORMER_GAS,
        };
    },
};
//# sourceMappingURL=service_utils.js.map