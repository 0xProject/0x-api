import { BigNumber } from '@0x/utils';
import { ZERO } from '../constants';
import {
    GasFee,
    GasFeeConfig,
    GaslessFeeConfigs,
    GaslessFees,
    IntegratorFee,
    IntegratorFeeConfig,
    ZeroexFee,
    ZeroExFeeConfig,
} from '../types';

/**
 * `transferFrom` estimated gas:
 * - Decrease balance of the owner (SLOAD + SSTORE): 24,000
 * - Increase balance of the spender (SLOAD + SSTORE): 24,000
 * - Update allowance of the spender (SLOAD + SSTORE): 24,000
 */
const TRANSFER_FROM_GAS = new BigNumber(72e3);

/**
 * Calculate gasless fees object which contains total fee amount and a breakdown of integrator, 0x and gas fees.
 *
 * @param feeConfigs Gasless fee configs parsed from input.
 * @param opts sellToken: Address of the sell token.
 *             sellTokenAmount: Amount of the sell token.
 *             sellTokenAmountPerBaseUnitNativeToken: Amount of sell token per base unit native token.
 *             gasPrice: Estimated gas price.
 *             quoteGasEstimate: The gas estimate to fill the quote.
 * @returns Gasless fees object and the total fee amount.
 */
export function calculateGaslessFees(opts: {
    feeConfigs: GaslessFeeConfigs;
    sellToken: string;
    sellTokenAmount: BigNumber;
    sellTokenAmountPerBaseUnitNativeToken: BigNumber;
    gasPrice: BigNumber;
    quoteGasEstimate: BigNumber;
}): { fees: GaslessFees; totalChargedFeeAmount: BigNumber } {
    const integratorFee = _calculateIntegratorFee({
        integratorFeeConfig: opts.feeConfigs.integrator,
        sellToken: opts.sellToken,
        sellTokenAmount: opts.sellTokenAmount,
    });

    const zeroexFee = _calculateZeroexFee({
        zeroexFeeConfig: opts.feeConfigs.zeroex,
        sellToken: opts.sellToken,
        sellTokenAmount: opts.sellTokenAmount,
        integratorFee,
    });

    const gasFee = _calculateGasFee({
        gasFeeConfig: opts.feeConfigs.gas,
        sellToken: opts.sellToken,
        sellTokenAmountPerBaseUnitNativeToken: opts.sellTokenAmountPerBaseUnitNativeToken,
        gasPrice: opts.gasPrice,
        quoteGasEstimate: opts.quoteGasEstimate,
        integratorFee,
        zeroexFee,
    });

    const fees = {
        integrator: integratorFee,
        zeroex: zeroexFee,
        gas: gasFee,
    };

    return {
        fees,
        totalChargedFeeAmount: _calculateTotalChargedFeeAmount(fees),
    };
}

function _calculateTotalChargedFeeAmount(fees: GaslessFees): BigNumber {
    const totalFeeAmount = ZERO;

    // Integrator fee
    if (fees.integrator && fees.integrator.feeRecipient) {
        totalFeeAmount.plus(fees.integrator.feeAmount);
    }
    // 0x fee
    if (fees.zeroex && fees.zeroex.feeRecipient) {
        // If the fee kind is integrator_share, the 0x amount has already been included in integrator amount
        if (fees.zeroex.kind !== 'integrator_share') {
            totalFeeAmount.plus(fees.zeroex.feeAmount);
        }
    }
    // Gas fee
    if (fees.gas && fees.gas.feeRecipient) {
        totalFeeAmount.plus(fees.gas.feeAmount);
    }

    return totalFeeAmount;
}

function _calculateIntegratorFee(opts: {
    integratorFeeConfig?: IntegratorFeeConfig;
    sellToken: string;
    sellTokenAmount: BigNumber;
}): IntegratorFee | undefined {
    if (!opts.integratorFeeConfig) {
        return undefined;
    }

    return {
        kind: 'volume',
        feeToken: opts.sellToken,
        feeAmount: opts.sellTokenAmount
            .times(opts.integratorFeeConfig.volumePercentage)
            .integerValue(BigNumber.ROUND_FLOOR),
        feeRecipient: opts.integratorFeeConfig.feeRecipient,
        volumePercentage: opts.integratorFeeConfig.volumePercentage,
    };
}

function _calculateZeroexFee(opts: {
    zeroexFeeConfig?: ZeroExFeeConfig;
    sellToken: string;
    sellTokenAmount: BigNumber;
    integratorFee?: IntegratorFee;
}): ZeroexFee | undefined {
    if (!opts.zeroexFeeConfig) {
        return undefined;
    }

    switch (opts.zeroexFeeConfig.kind) {
        case 'volume':
            return {
                kind: 'volume',
                feeToken: opts.sellToken,
                feeAmount: opts.sellTokenAmount
                    .times(opts.zeroexFeeConfig.volumePercentage)
                    .integerValue(BigNumber.ROUND_FLOOR),
                feeRecipient: opts.zeroexFeeConfig.feeRecipient,
                volumePercentage: opts.zeroexFeeConfig.volumePercentage,
            };
        case 'integrator_share':
            if (!opts.integratorFee) {
                // This should never happen
                throw new Error('Integrator fee is undefined');
            }

            return {
                kind: 'integrator_share',
                feeToken: opts.sellToken,
                feeAmount: opts.integratorFee.feeAmount
                    .times(opts.zeroexFeeConfig.integratorSharePercentage)
                    .integerValue(BigNumber.ROUND_FLOOR),
                feeRecipient: opts.zeroexFeeConfig.feeRecipient,
                integratorSharePercentage: opts.zeroexFeeConfig.integratorSharePercentage,
            };
        default:
            return undefined;
    }
}

function _calculateGasFee(opts: {
    gasFeeConfig?: GasFeeConfig;
    sellToken: string;
    sellTokenAmountPerBaseUnitNativeToken: BigNumber;
    gasPrice: BigNumber;
    quoteGasEstimate: BigNumber;
    integratorFee?: IntegratorFee;
    zeroexFee?: ZeroexFee;
}): GasFee | undefined {
    if (!opts.gasFeeConfig) {
        return undefined;
    }

    // Check the number of `transferFrom` necessary for fee
    const feeRecipients = new Set<string>();
    if (opts.integratorFee && opts.integratorFee.feeRecipient && opts.integratorFee.feeAmount.gt(0)) {
        feeRecipients.add(opts.integratorFee.feeRecipient);
    }
    if (opts.zeroexFee && opts.zeroexFee.feeRecipient && opts.zeroexFee.feeAmount.gt(0)) {
        feeRecipients.add(opts.zeroexFee.feeRecipient);
    }
    if (opts.gasFeeConfig && opts.gasFeeConfig.feeRecipient) {
        feeRecipients.add(opts.gasFeeConfig.feeRecipient);
    }

    const numTransferFromForFee = feeRecipients.size;
    // Add the `transferFrom` gas to gas cost to fill the order
    const estimatedGas = opts.quoteGasEstimate.plus(TRANSFER_FROM_GAS.times(numTransferFromForFee));

    return {
        kind: 'gas',
        feeToken: opts.sellToken,
        feeAmount: opts.sellTokenAmountPerBaseUnitNativeToken
            .times(opts.gasPrice)
            .times(estimatedGas)
            .integerValue(BigNumber.ROUND_FLOOR),
        feeRecipient: opts.gasFeeConfig.feeRecipient,
        feeTokenAmountPerBaseUnitNativeToken: opts.sellTokenAmountPerBaseUnitNativeToken,
        gasPrice: opts.gasPrice,
        estimatedGas,
    };
}
