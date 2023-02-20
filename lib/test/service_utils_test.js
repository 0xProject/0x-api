"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
require("mocha");
const asset_swapper_1 = require("../src/asset-swapper");
const constants_1 = require("../src/constants");
const service_utils_1 = require("../src/utils/service_utils");
const constants_2 = require("./constants");
const mocks_1 = require("./utils/mocks");
const SUITE_NAME = 'serviceUtils';
describe(SUITE_NAME, () => {
    describe('attributeCallData', () => {
        it('it returns a reasonable ID and timestamp', () => {
            const fakeCallData = '0x0000000000000';
            const fakeAffiliate = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
            const attributedCallData = service_utils_1.serviceUtils.attributeCallData(fakeCallData, fakeAffiliate).affiliatedData;
            const currentTime = new Date();
            // parse out items from call data to ensure they are reasonable values
            const selectorPos = attributedCallData.indexOf(constants_2.AFFILIATE_DATA_SELECTOR);
            const affiliateAddress = '0x'.concat(attributedCallData.substring(selectorPos + 32, selectorPos + 72));
            const randomId = attributedCallData.substring(selectorPos + 118, selectorPos + 128);
            const timestampFromCallDataHex = attributedCallData.substring(selectorPos + 128, selectorPos + 136);
            const timestampFromCallData = parseInt(timestampFromCallDataHex, 16);
            (0, contracts_test_utils_1.expect)(affiliateAddress).to.be.eq(fakeAffiliate);
            // call data timestamp is within 3 seconds of timestamp created during test
            (0, contracts_test_utils_1.expect)(timestampFromCallData).to.be.greaterThan(currentTime.getTime() / 1000 - 3);
            (0, contracts_test_utils_1.expect)(timestampFromCallData).to.be.lessThan(currentTime.getTime() / 1000 + 3);
            // ID is a 10-digit hex number
            (0, contracts_test_utils_1.expect)(randomId).to.match(/[0-9A-Fa-f]{10}/);
        });
    });
    // NOTES: the tests runs with Ganache chain id.
    describe('convertToLiquiditySources', () => {
        it('returns the correct liquidity sources for multiple single sources', () => {
            const liquiditySources = service_utils_1.serviceUtils.convertToLiquiditySources({
                singleSource: {
                    [asset_swapper_1.ERC20BridgeSource.Native]: new utils_1.BigNumber(0.5),
                    [asset_swapper_1.ERC20BridgeSource.UniswapV3]: new utils_1.BigNumber(0.5),
                },
                multihop: [],
            });
            (0, contracts_test_utils_1.expect)(liquiditySources).to.be.deep.eq([
                {
                    name: '0x',
                    proportion: new utils_1.BigNumber(0.5),
                },
                {
                    name: asset_swapper_1.ERC20BridgeSource.UniswapV3,
                    proportion: new utils_1.BigNumber(0.5),
                },
            ]);
        });
        it('returns the correct liquidity sources for a mix of a single source and multihop sources', () => {
            const liquiditySources = service_utils_1.serviceUtils.convertToLiquiditySources({
                singleSource: {
                    [asset_swapper_1.ERC20BridgeSource.Native]: new utils_1.BigNumber(0.2),
                },
                multihop: [
                    {
                        proportion: new utils_1.BigNumber(0.3),
                        intermediateToken: 'intermediate-token-a',
                        hops: [asset_swapper_1.ERC20BridgeSource.UniswapV2, asset_swapper_1.ERC20BridgeSource.Curve],
                    },
                    {
                        proportion: new utils_1.BigNumber(0.4),
                        intermediateToken: 'intermediate-token-b',
                        hops: [asset_swapper_1.ERC20BridgeSource.BalancerV2, asset_swapper_1.ERC20BridgeSource.Curve],
                    },
                ],
            });
            (0, contracts_test_utils_1.expect)(liquiditySources).to.be.deep.eq([
                {
                    name: '0x',
                    proportion: new utils_1.BigNumber(0.2),
                },
                {
                    name: asset_swapper_1.ERC20BridgeSource.MultiHop,
                    proportion: new utils_1.BigNumber(0.3),
                    intermediateToken: 'intermediate-token-a',
                    hops: [asset_swapper_1.ERC20BridgeSource.UniswapV2, asset_swapper_1.ERC20BridgeSource.Curve],
                },
                {
                    name: asset_swapper_1.ERC20BridgeSource.MultiHop,
                    proportion: new utils_1.BigNumber(0.4),
                    intermediateToken: 'intermediate-token-b',
                    hops: [asset_swapper_1.ERC20BridgeSource.BalancerV2, asset_swapper_1.ERC20BridgeSource.Curve],
                },
            ]);
        });
    });
    describe('getAffiliateFeeAmounts', () => {
        it('returns the correct amounts if the fee is zero', () => {
            const affiliateFee = {
                feeType: asset_swapper_1.AffiliateFeeType.PercentageFee,
                recipient: '',
                buyTokenPercentageFee: 0,
                sellTokenPercentageFee: 0,
            };
            const costInfo = service_utils_1.serviceUtils.getBuyTokenFeeAmounts(mocks_1.randomSellQuote, affiliateFee);
            (0, contracts_test_utils_1.expect)(costInfo).to.deep.equal({
                buyTokenFeeAmount: constants_1.ZERO,
                sellTokenFeeAmount: constants_1.ZERO,
                gasCost: constants_1.ZERO,
            });
        });
        it('returns the correct amounts if the fee is non-zero', () => {
            const affiliateFee = {
                feeType: asset_swapper_1.AffiliateFeeType.PercentageFee,
                recipient: (0, contracts_test_utils_1.randomAddress)(),
                buyTokenPercentageFee: 0.01,
                sellTokenPercentageFee: 0,
            };
            const costInfo = service_utils_1.serviceUtils.getBuyTokenFeeAmounts(mocks_1.randomSellQuote, affiliateFee);
            (0, contracts_test_utils_1.expect)(costInfo).to.deep.equal({
                buyTokenFeeAmount: mocks_1.randomSellQuote.worstCaseQuoteInfo.makerAmount
                    .times(affiliateFee.buyTokenPercentageFee)
                    .dividedBy(affiliateFee.buyTokenPercentageFee + 1)
                    .integerValue(utils_1.BigNumber.ROUND_DOWN),
                sellTokenFeeAmount: constants_1.ZERO,
                gasCost: constants_1.AFFILIATE_FEE_TRANSFORMER_GAS,
            });
        });
    });
    it('returns the correct amounts if the positive slippage fee is non-zero', () => {
        const affiliateFee = {
            feeType: asset_swapper_1.AffiliateFeeType.PositiveSlippageFee,
            recipient: (0, contracts_test_utils_1.randomAddress)(),
            buyTokenPercentageFee: 0,
            sellTokenPercentageFee: 0,
        };
        const costInfo = service_utils_1.serviceUtils.getBuyTokenFeeAmounts(mocks_1.randomSellQuote, affiliateFee);
        (0, contracts_test_utils_1.expect)(costInfo).to.deep.equal({
            buyTokenFeeAmount: constants_1.ZERO,
            sellTokenFeeAmount: constants_1.ZERO,
            gasCost: constants_1.POSITIVE_SLIPPAGE_FEE_TRANSFORMER_GAS,
        });
    });
    it('returns the correct amounts if gasless', () => {
        const affiliateFee = {
            feeType: asset_swapper_1.AffiliateFeeType.GaslessFee,
            recipient: (0, contracts_test_utils_1.randomAddress)(),
            buyTokenPercentageFee: 0,
            sellTokenPercentageFee: 0,
        };
        const costInfo = service_utils_1.serviceUtils.getBuyTokenFeeAmounts(mocks_1.randomSellQuote, affiliateFee);
        (0, contracts_test_utils_1.expect)(costInfo).to.deep.equal({
            buyTokenFeeAmount: mocks_1.randomSellQuote.gasPrice
                .times(mocks_1.randomSellQuote.worstCaseQuoteInfo.gas)
                .times(mocks_1.randomSellQuote.makerAmountPerEth)
                .integerValue(utils_1.BigNumber.ROUND_DOWN),
            sellTokenFeeAmount: constants_1.ZERO,
            gasCost: constants_1.AFFILIATE_FEE_TRANSFORMER_GAS,
        });
    });
});
//# sourceMappingURL=service_utils_test.js.map