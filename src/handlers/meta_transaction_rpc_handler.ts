import {
    GeneralErrorCodes,
    generalErrorCodeToReason,
    isBadRequestError,
    isInternalServerError,
    isValidationError,
    ValidationError,
    ValidationErrorCodes,
} from '@0x/api-utils';
import { isNativeSymbolOrAddress } from '@0x/token-metadata';
import { BigNumber } from '@0x/utils';
import {
    GetQuoteRequest,
    GetQuoteResponse,
    MetaTransactionService as MetaTransactionRpcService,
} from '../proto-ts/meta_transaction.pb';

import { CHAIN_ID, META_TX_MIN_ALLOWED_SLIPPAGE } from '../config';
import { APIErrorCodes, apiErrorCodesToReasons, ValidationErrorReasons } from '../errors';
import { MetaTransactionService } from '../services/meta_transaction_service';
import { TwirpError } from 'twirpscript';
import { BigNumberJs } from '../proto-ts/big_number_js.pb';
import { DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE } from '../constants';

/**
 * Converts a BigNumberJs proto to an instance of bignumber.js `BigNumber`.
 * See: https://mikemcl.github.io/bignumber.js/#instance-properties
 */
export function protoToBigNumber(proto: BigNumberJs): BigNumber {
    // Proto uses an `int64` which is generated to a `bigint`, but bignumber.js uses
    // `number`. This probably masks some big problems with bignumber.js, but we'll
    // let that sleeping dog lie.
    const c = proto.c.map((x) => Number(x));
    const result = new BigNumber({
        c,
        e: proto.e ?? null,
        s: proto.s ? 1 : proto.s === false ? -1 : null,
        _isBigNumber: true,
    });
    if (!BigNumber.isBigNumber(result)) {
        throw new Error(`Unable to create BigNumber from proto: ${JSON.stringify(proto)}`);
    }
    return result;
}

/**
 * Converts a bignumber.js to its proto representation.
 * See: https://mikemcl.github.io/bignumber.js/#instance-properties
 */
export function bigNumberToProto(n: BigNumber): BigNumberJs {
    const c = n.c?.map((n) => BigInt(n)) ?? [];
    const s = n.s === 1 ? true : n.s === -1 ? false : null;
    const e = n.e;
    return { c, e, s };
}

export function createGetQuoteHandler<TContext = unknown>(
    metaTransactionService: MetaTransactionService,
): MetaTransactionRpcService<TContext>['GetQuote'] {
    return async (getQuoteRequest: GetQuoteRequest, _context: TContext): Promise<GetQuoteResponse> => {
        const isNativeOutputToken = isNativeSymbolOrAddress(getQuoteRequest.outputTokenAddress, CHAIN_ID);

        // Native token selling isn't supported.
        if (isNativeSymbolOrAddress(getQuoteRequest.inputTokenAddress, CHAIN_ID)) {
            const e: TwirpError = {
                code: 'invalid_argument',
                msg: apiErrorCodesToReasons[APIErrorCodes.EthSellNotSupported],
                meta: { zeroexErrorCode: APIErrorCodes.EthSellNotSupported.toString() },
            };
            throw e;
        }

        // Slippage
        const slippagePercentage = getQuoteRequest.slippagePercentage
            ? protoToBigNumber(getQuoteRequest.slippagePercentage)
            : new BigNumber(DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE);

        if (slippagePercentage.isGreaterThanOrEqualTo(1)) {
            throw new TwirpError({
                code: 'invalid_argument',
                msg: generalErrorCodeToReason[GeneralErrorCodes.ValidationError],
                meta: {
                    zeroexErrorCode: GeneralErrorCodes.ValidationError.toString(),
                    validationErrors: JSON.stringify([
                        {
                            field: 'slippagePercentage',
                            code: ValidationErrorCodes.ValueOutOfRange,
                            reason: ValidationErrorReasons.PercentageOutOfRange,
                        },
                    ]),
                },
            });
        }
        if (slippagePercentage.isLessThan(META_TX_MIN_ALLOWED_SLIPPAGE)) {
            throw new TwirpError({
                code: 'invalid_argument',
                msg: generalErrorCodeToReason[GeneralErrorCodes.ValidationError],
                meta: {
                    zeroexErrorCode: GeneralErrorCodes.ValidationError.toString(),
                    validationErrors: JSON.stringify([
                        {
                            field: 'slippagePercentage',
                            code: ValidationErrorCodes.ValueOutOfRange,
                            reason: ValidationErrorReasons.MinSlippageTooLow,
                        },
                    ]),
                },
            });
        }

        try {
            const metaTransactionQuote = await metaTransactionService.getMetaTransactionQuoteAsync({
                affiliateAddress: getQuoteRequest.affiliateAddress ?? undefined,
                buyAmount: getQuoteRequest.outputAmount ? protoToBigNumber(getQuoteRequest.outputAmount) : undefined,
                sellAmount: getQuoteRequest.inputAmount ? protoToBigNumber(getQuoteRequest.inputAmount) : undefined,
                buyTokenAddress: getQuoteRequest.outputTokenAddress,
                from: getQuoteRequest.takerAddress,
                integratorId: getQuoteRequest.integratorId,
                isETHBuy: isNativeOutputToken,
                isETHSell: false,
                quoteUniqueId: getQuoteRequest.quoteUniqueId,
                sellTokenAddress: getQuoteRequest.inputTokenAddress,
                takerAddress: getQuoteRequest.takerAddress,
            });

            return {
                quote: {
                    inputTokenAddress: metaTransactionQuote.sellTokenAddress,
                    inputAmount: bigNumberToProto(metaTransactionQuote.sellAmount),
                    outputTokenAddress: metaTransactionQuote.buyTokenAddress,
                    outputAmount: bigNumberToProto(metaTransactionQuote.buyAmount),
                    price: bigNumberToProto(metaTransactionQuote.price),
                    estimatedPriceImpact: metaTransactionQuote.estimatedPriceImpact
                        ? bigNumberToProto(metaTransactionQuote.estimatedPriceImpact)
                        : null,
                    inputTokenToNativeRate: bigNumberToProto(metaTransactionQuote.sellTokenToEthRate),
                    outputTokenToNativeRate: bigNumberToProto(metaTransactionQuote.buyTokenToEthRate),
                    chainId: metaTransactionQuote.chainId,
                    gas: bigNumberToProto(metaTransactionQuote.gas),
                    estimatedGas: bigNumberToProto(metaTransactionQuote.estimatedGas),
                    gasPrice: bigNumberToProto(metaTransactionQuote.gasPrice),
                    value: bigNumberToProto(metaTransactionQuote.value),
                    protocolFee: bigNumberToProto(metaTransactionQuote.protocolFee),
                    minimumProtocolFee: bigNumberToProto(metaTransactionQuote.minimumProtocolFee),
                    allowanceTarget: metaTransactionQuote.allowanceTarget ?? '',
                    liquiditySources: metaTransactionQuote.sources.map((s) => ({
                        name: s.name,
                        proportion: bigNumberToProto(s.proportion),
                        hops: s.hops ?? [],
                    })),
                },
                metaTransaction: {
                    signerAddress: metaTransactionQuote.metaTransaction.signer,
                    senderAddress: metaTransactionQuote.metaTransaction.sender,
                    minGasPrice: bigNumberToProto(metaTransactionQuote.metaTransaction.minGasPrice),
                    maxGasPrice: bigNumberToProto(metaTransactionQuote.metaTransaction.maxGasPrice),
                    expirationTimeSeconds: bigNumberToProto(metaTransactionQuote.metaTransaction.expirationTimeSeconds),
                    salt: bigNumberToProto(metaTransactionQuote.metaTransaction.salt),
                    callData: metaTransactionQuote.metaTransaction.callData,
                    value: bigNumberToProto(metaTransactionQuote.metaTransaction.value),
                    feeTokenAddress: metaTransactionQuote.metaTransaction.feeToken,
                    feeAmount: bigNumberToProto(metaTransactionQuote.metaTransaction.feeAmount),
                    chainId: metaTransactionQuote.metaTransaction.domain.chainId,
                    verifyingContract: metaTransactionQuote.metaTransaction.domain.verifyingContract,
                },
            };
        } catch (e) {
            // TODO (rhinodavid): revist this -- extract and standardize
            if (isValidationError(e)) {
                throw new TwirpError({
                    code: 'invalid_argument',
                    msg: generalErrorCodeToReason[e.generalErrorCode],
                    meta: {
                        zeroexErrorCode: e.generalErrorCode.toString(),
                        validationErrors: JSON.stringify(e.validationErrors),
                    },
                });
            }
            if (isInternalServerError(e)) {
                throw new TwirpError({
                    code: 'internal',
                    msg: e.message,
                });
            }
            if (isBadRequestError(e)) {
                throw new TwirpError({
                    code: 'malformed',
                    msg: generalErrorCodeToReason[e.generalErrorCode],
                    meta: { zeroexErrorCode: e.generalErrorCode.toString() },
                });
            }
            // default
            throw new TwirpError({
                code: 'unknown',
                msg: e.message,
            });
        }
    };
}
