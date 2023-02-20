"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const constants_1 = require("../../src/constants");
const fee_calculator_1 = require("../../src/utils/fee_calculator");
const constants_2 = require("../constants");
const RANDOM_ADDRESS1 = '0x70a9f34f9b34c64957b9c401a97bfed35b95049e';
const RANDOM_ADDRESS2 = '0x70a9f34f9b34c64957b9c401a97bfed35b95049f';
describe('calculateGaslessFees', () => {
    describe('integrator fee', () => {
        it('returns undefined for integrator field if integrator fee config is not present', () => {
            const { fees, totalOnChainChargedFeeAmount } = (0, fee_calculator_1.calculateFees)({
                feeConfigs: {},
                sellToken: constants_2.WETH_TOKEN_ADDRESS,
                sellTokenAmount: new utils_1.BigNumber(10e3),
                sellTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                gasPrice: new utils_1.BigNumber(10e9),
                quoteGasEstimate: new utils_1.BigNumber(20e3),
            });
            (0, contracts_test_utils_1.expect)(fees.integratorFee).to.be.undefined;
            (0, contracts_test_utils_1.expect)(totalOnChainChargedFeeAmount).to.eql(constants_1.ZERO);
        });
        it('returns correct integrator fee and total fee amount if integrator fee config is present', () => {
            const { fees, totalOnChainChargedFeeAmount } = (0, fee_calculator_1.calculateFees)({
                feeConfigs: {
                    integratorFee: {
                        type: 'volume',
                        feeRecipient: RANDOM_ADDRESS1,
                        billingType: 'on-chain',
                        volumePercentage: new utils_1.BigNumber(0.1),
                    },
                },
                sellToken: constants_2.WETH_TOKEN_ADDRESS,
                sellTokenAmount: new utils_1.BigNumber(10e3),
                sellTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                gasPrice: new utils_1.BigNumber(10e9),
                quoteGasEstimate: new utils_1.BigNumber(20e3),
            });
            (0, contracts_test_utils_1.expect)(fees.integratorFee).to.eql({
                type: 'volume',
                feeToken: constants_2.WETH_TOKEN_ADDRESS,
                feeAmount: new utils_1.BigNumber(1e3),
                feeRecipient: RANDOM_ADDRESS1,
                billingType: 'on-chain',
                volumePercentage: new utils_1.BigNumber(0.1),
            });
            (0, contracts_test_utils_1.expect)(totalOnChainChargedFeeAmount).to.eql(new utils_1.BigNumber(1e3));
        });
    });
    describe('0x fee', () => {
        it('returns undefined for zeroex field if 0x fee config is not present', () => {
            const { fees, totalOnChainChargedFeeAmount } = (0, fee_calculator_1.calculateFees)({
                feeConfigs: {},
                sellToken: constants_2.WETH_TOKEN_ADDRESS,
                sellTokenAmount: new utils_1.BigNumber(10e3),
                sellTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                gasPrice: new utils_1.BigNumber(10e9),
                quoteGasEstimate: new utils_1.BigNumber(20e3),
            });
            (0, contracts_test_utils_1.expect)(fees.integratorFee).to.be.undefined;
            (0, contracts_test_utils_1.expect)(totalOnChainChargedFeeAmount).to.eql(constants_1.ZERO);
        });
        it('returns correct 0x fee and total fee amount if 0x fee config is present and the type is volume', () => {
            const { fees, totalOnChainChargedFeeAmount } = (0, fee_calculator_1.calculateFees)({
                feeConfigs: {
                    zeroExFee: {
                        type: 'volume',
                        feeRecipient: RANDOM_ADDRESS1,
                        billingType: 'on-chain',
                        volumePercentage: new utils_1.BigNumber(0.1),
                    },
                },
                sellToken: constants_2.WETH_TOKEN_ADDRESS,
                sellTokenAmount: new utils_1.BigNumber(10e3),
                sellTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                gasPrice: new utils_1.BigNumber(10e9),
                quoteGasEstimate: new utils_1.BigNumber(20e3),
            });
            (0, contracts_test_utils_1.expect)(fees.zeroExFee).to.eql({
                type: 'volume',
                feeToken: constants_2.WETH_TOKEN_ADDRESS,
                feeAmount: new utils_1.BigNumber(1e3),
                feeRecipient: RANDOM_ADDRESS1,
                billingType: 'on-chain',
                volumePercentage: new utils_1.BigNumber(0.1),
            });
            (0, contracts_test_utils_1.expect)(totalOnChainChargedFeeAmount).to.eql(new utils_1.BigNumber(1e3));
        });
        it('returns correct 0x fee and total fee amount if 0x fee config is present and the type is integrator_share', () => {
            const { fees, totalOnChainChargedFeeAmount } = (0, fee_calculator_1.calculateFees)({
                feeConfigs: {
                    integratorFee: {
                        type: 'volume',
                        feeRecipient: RANDOM_ADDRESS1,
                        billingType: 'on-chain',
                        volumePercentage: new utils_1.BigNumber(0.1),
                    },
                    zeroExFee: {
                        type: 'integrator_share',
                        feeRecipient: RANDOM_ADDRESS2,
                        billingType: 'on-chain',
                        integratorSharePercentage: new utils_1.BigNumber(0.05),
                    },
                },
                sellToken: constants_2.WETH_TOKEN_ADDRESS,
                sellTokenAmount: new utils_1.BigNumber(10e3),
                sellTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                gasPrice: new utils_1.BigNumber(10e9),
                quoteGasEstimate: new utils_1.BigNumber(20e3),
            });
            (0, contracts_test_utils_1.expect)(fees.zeroExFee).to.eql({
                type: 'integrator_share',
                feeToken: constants_2.WETH_TOKEN_ADDRESS,
                billingType: 'on-chain',
                feeAmount: new utils_1.BigNumber(50),
                feeRecipient: RANDOM_ADDRESS2,
                integratorSharePercentage: new utils_1.BigNumber(0.05),
            });
            (0, contracts_test_utils_1.expect)(totalOnChainChargedFeeAmount).to.eql(new utils_1.BigNumber(1e3));
        });
        it('throws if 0x fee type is integrator_share but integrator fee config is not present', () => {
            (0, contracts_test_utils_1.expect)(() => {
                (0, fee_calculator_1.calculateFees)({
                    feeConfigs: {
                        zeroExFee: {
                            type: 'integrator_share',
                            feeRecipient: RANDOM_ADDRESS2,
                            billingType: 'on-chain',
                            integratorSharePercentage: new utils_1.BigNumber(0.05),
                        },
                    },
                    sellToken: constants_2.WETH_TOKEN_ADDRESS,
                    sellTokenAmount: new utils_1.BigNumber(10e3),
                    sellTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                    gasPrice: new utils_1.BigNumber(10e9),
                    quoteGasEstimate: new utils_1.BigNumber(20e3),
                });
            }).to.throw();
        });
    });
    describe('gas fee', () => {
        it('returns undefined for zeroex field if 0x fee config is not present', () => {
            const { fees, totalOnChainChargedFeeAmount } = (0, fee_calculator_1.calculateFees)({
                feeConfigs: {},
                sellToken: constants_2.WETH_TOKEN_ADDRESS,
                sellTokenAmount: new utils_1.BigNumber(10e3),
                sellTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                gasPrice: new utils_1.BigNumber(10e9),
                quoteGasEstimate: new utils_1.BigNumber(20e3),
            });
            (0, contracts_test_utils_1.expect)(fees.integratorFee).to.be.undefined;
            (0, contracts_test_utils_1.expect)(totalOnChainChargedFeeAmount).to.eql(constants_1.ZERO);
        });
        describe('returns correct gas fee and total fee amount if gas fee config is present', () => {
            it('returns correct result if integrator fee, 0x and gas fee all have fee recipient', () => {
                const { fees, totalOnChainChargedFeeAmount } = (0, fee_calculator_1.calculateFees)({
                    feeConfigs: {
                        integratorFee: {
                            type: 'volume',
                            feeRecipient: RANDOM_ADDRESS1,
                            billingType: 'on-chain',
                            volumePercentage: new utils_1.BigNumber(0.01),
                        },
                        zeroExFee: {
                            type: 'integrator_share',
                            feeRecipient: RANDOM_ADDRESS2,
                            billingType: 'on-chain',
                            integratorSharePercentage: new utils_1.BigNumber(0.05),
                        },
                        gasFee: {
                            type: 'gas',
                            billingType: 'on-chain',
                            feeRecipient: RANDOM_ADDRESS2,
                        },
                    },
                    sellToken: constants_2.WETH_TOKEN_ADDRESS,
                    sellTokenAmount: new utils_1.BigNumber(1e16),
                    sellTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                    gasPrice: new utils_1.BigNumber(10e9),
                    quoteGasEstimate: new utils_1.BigNumber(20e3),
                });
                (0, contracts_test_utils_1.expect)(fees.gasFee).to.eql({
                    type: 'gas',
                    feeToken: constants_2.WETH_TOKEN_ADDRESS,
                    feeAmount: new utils_1.BigNumber(1.64e15),
                    feeRecipient: RANDOM_ADDRESS2,
                    billingType: 'on-chain',
                    feeTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                    gasPrice: new utils_1.BigNumber(10e9),
                    estimatedGas: new utils_1.BigNumber(164e3),
                });
                (0, contracts_test_utils_1.expect)(totalOnChainChargedFeeAmount).to.eql(new utils_1.BigNumber(1.74e15));
            });
            it('returns correct result if gas fee do not have fee recipient', () => {
                const { fees, totalOnChainChargedFeeAmount } = (0, fee_calculator_1.calculateFees)({
                    feeConfigs: {
                        integratorFee: {
                            type: 'volume',
                            feeRecipient: RANDOM_ADDRESS1,
                            billingType: 'on-chain',
                            volumePercentage: new utils_1.BigNumber(0.01),
                        },
                        zeroExFee: {
                            type: 'volume',
                            feeRecipient: RANDOM_ADDRESS2,
                            billingType: 'on-chain',
                            volumePercentage: new utils_1.BigNumber(0.01),
                        },
                        gasFee: {
                            type: 'gas',
                            feeRecipient: null,
                            billingType: 'off-chain',
                        },
                    },
                    sellToken: constants_2.WETH_TOKEN_ADDRESS,
                    sellTokenAmount: new utils_1.BigNumber(1e16),
                    sellTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                    gasPrice: new utils_1.BigNumber(10e9),
                    quoteGasEstimate: new utils_1.BigNumber(20e3),
                });
                (0, contracts_test_utils_1.expect)(fees.gasFee).to.eql({
                    type: 'gas',
                    feeToken: constants_2.WETH_TOKEN_ADDRESS,
                    feeAmount: new utils_1.BigNumber(1.64e15),
                    feeRecipient: null,
                    billingType: 'off-chain',
                    feeTokenAmountPerBaseUnitNativeToken: new utils_1.BigNumber(1),
                    gasPrice: new utils_1.BigNumber(10e9),
                    estimatedGas: new utils_1.BigNumber(164e3),
                });
                (0, contracts_test_utils_1.expect)(totalOnChainChargedFeeAmount).to.eql(new utils_1.BigNumber(2e14));
            });
        });
    });
});
//# sourceMappingURL=fee_calculator_test.js.map