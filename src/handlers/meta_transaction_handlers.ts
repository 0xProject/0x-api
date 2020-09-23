import { assert } from '@0x/assert';
import { ERC20BridgeSource, SwapQuoterError } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';
import * as isValidUUID from 'uuid-validate';

import { CHAIN_ID } from '../config';
import { API_KEY_HEADER, DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE, META_TRANSACTION_DOCS_URL, ZERO } from '../constants';
import { TransactionEntity } from '../entities';
import {
    GeneralErrorCodes,
    generalErrorCodeToReason,
    InternalServerError,
    NotFoundError,
    RevertAPIError,
    ValidationError,
    ValidationErrorCodes,
    ValidationErrorReasons,
} from '../errors';
import { logger } from '../logger';
import { isAPIError, isRevertError } from '../middleware/error_handling';
import { schemas } from '../schemas/schemas';
import { MetaTransactionService } from '../services/meta_transaction_service';
import {
    ChainId,
    GetMetaTransactionPriceResponse,
    GetMetaTransactionStatusResponse,
    GetTransactionRequestParams,
    ZeroExTransactionWithoutDomain,
} from '../types';
import { parseUtils } from '../utils/parse_utils';
import { priceComparisonUtils } from '../utils/price_comparison_utils';
import { isRateLimitedMetaTransactionResponse, MetaTransactionRateLimiter } from '../utils/rate-limiters';
import { schemaUtils } from '../utils/schema_utils';
import { findTokenAddressOrThrowApiError, getTokenMetadataIfExists } from '../utils/token_metadata_utils';

export class MetaTransactionHandlers {
    private readonly _metaTransactionService: MetaTransactionService;
    private readonly _rateLimiter?: MetaTransactionRateLimiter;

    public static rootAsync(_req: express.Request, res: express.Response): void {
        const message = `This is the root of the Meta Transaction API. Visit ${META_TRANSACTION_DOCS_URL} for details about this API.`;
        res.status(HttpStatus.OK).send({ message });
    }
    constructor(metaTransactionService: MetaTransactionService, rateLimiter?: MetaTransactionRateLimiter) {
        this._metaTransactionService = metaTransactionService;
        this._rateLimiter = rateLimiter;
    }
    public async getQuoteAsync(req: express.Request, res: express.Response): Promise<void> {
        const apiKey = req.header(API_KEY_HEADER);
        if (apiKey !== undefined && !isValidUUID(apiKey)) {
            res.status(HttpStatus.BAD_REQUEST).send({
                code: GeneralErrorCodes.InvalidAPIKey,
                reason: generalErrorCodeToReason[GeneralErrorCodes.InvalidAPIKey],
            });
            return;
        }
        // HACK typescript typing does not allow this valid json-schema
        schemaUtils.validateSchema(req.query, schemas.metaTransactionQuoteRequestSchema as any);
        // parse query params
        const {
            takerAddress,
            sellTokenAddress,
            buyTokenAddress,
            sellAmount,
            buyAmount,
            slippagePercentage,
            excludedSources,
            // tslint:disable-next-line:boolean-naming
            includePriceComparisons,
        } = parseGetTransactionRequestParams(req);
        try {
            const metaTransactionQuote = await this._metaTransactionService.calculateMetaTransactionQuoteAsync({
                takerAddress,
                buyTokenAddress,
                sellTokenAddress,
                buyAmount,
                sellAmount,
                from: takerAddress,
                slippagePercentage,
                excludedSources,
                apiKey,
                includePriceComparisons,
            });
            res.status(HttpStatus.OK).send(metaTransactionQuote);
        } catch (e) {
            // If this is already a transformed error then just re-throw
            if (isAPIError(e)) {
                throw e;
            }
            // Wrap a Revert error as an API revert error
            if (isRevertError(e)) {
                throw new RevertAPIError(e);
            }
            const errorMessage: string = e.message;
            // TODO AssetSwapper can throw raw Errors or InsufficientAssetLiquidityError
            if (
                errorMessage.startsWith(SwapQuoterError.InsufficientAssetLiquidity) ||
                errorMessage.startsWith('NO_OPTIMAL_PATH')
            ) {
                throw new ValidationError([
                    {
                        field: buyAmount ? 'buyAmount' : 'sellAmount',
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: SwapQuoterError.InsufficientAssetLiquidity,
                    },
                ]);
            }
            if (errorMessage.startsWith(SwapQuoterError.AssetUnavailable)) {
                throw new ValidationError([
                    {
                        field: 'token',
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: e.message,
                    },
                ]);
            }
            logger.info('Uncaught error', e);
            throw new InternalServerError(e.message);
        }
    }
    public async getPriceAsync(req: express.Request, res: express.Response): Promise<void> {
        const apiKey = req.header('0x-api-key');
        if (apiKey !== undefined && !isValidUUID(apiKey)) {
            res.status(HttpStatus.BAD_REQUEST).send({
                code: GeneralErrorCodes.InvalidAPIKey,
                reason: generalErrorCodeToReason[GeneralErrorCodes.InvalidAPIKey],
            });
            return;
        }
        // HACK typescript typing does not allow this valid json-schema
        schemaUtils.validateSchema(req.query, schemas.metaTransactionQuoteRequestSchema as any);
        // parse query params
        const params = parseGetTransactionRequestParams(req);
        const {
            takerAddress,
            sellTokenAddress,
            buyTokenAddress,
            sellAmount,
            buyAmount,
            slippagePercentage,
            excludedSources,
            // tslint:disable-next-line:boolean-naming
            includePriceComparisons,
        } = params;
        try {
            const metaTransactionPrice = await this._metaTransactionService.calculateMetaTransactionPriceAsync(
                {
                    takerAddress,
                    buyTokenAddress,
                    sellTokenAddress,
                    buyAmount,
                    sellAmount,
                    from: takerAddress,
                    slippagePercentage,
                    excludedSources,
                    apiKey,
                    includePriceComparisons,
                },
                'price',
            );
            const metaTransactionPriceResponse: GetMetaTransactionPriceResponse = {
                price: metaTransactionPrice.price,
                buyAmount: metaTransactionPrice.buyAmount,
                sellAmount: metaTransactionPrice.sellAmount,
                sellTokenAddress,
                buyTokenAddress,
                sources: metaTransactionPrice.sources,
                value: metaTransactionPrice.protocolFee,
                gasPrice: metaTransactionPrice.gasPrice,
                gas: metaTransactionPrice.estimatedGas,
                estimatedGas: metaTransactionPrice.estimatedGas,
                protocolFee: metaTransactionPrice.protocolFee,
                minimumProtocolFee: metaTransactionPrice.minimumProtocolFee,
                estimatedGasTokenRefund: ZERO,
                allowanceTarget: metaTransactionPrice.allowanceTarget,
            };

            let priceResponse = metaTransactionPriceResponse;
            if (params.includePriceComparisons) {
                const priceComparisons = priceComparisonUtils.getPriceComparisonFromQuote(CHAIN_ID, params, {
                    ...metaTransactionPrice,
                    buyTokenAddress,
                    sellTokenAddress,
                });

                if (priceComparisons) {
                    priceResponse = {
                        ...metaTransactionPriceResponse,
                        priceComparisons,
                    };
                }
            }
            res.status(HttpStatus.OK).send(priceResponse);
        } catch (e) {
            // If this is already a transformed error then just re-throw
            if (isAPIError(e)) {
                throw e;
            }
            // Wrap a Revert error as an API revert error
            if (isRevertError(e)) {
                throw new RevertAPIError(e);
            }
            const errorMessage: string = e.message;
            // TODO AssetSwapper can throw raw Errors or InsufficientAssetLiquidityError
            if (
                errorMessage.startsWith(SwapQuoterError.InsufficientAssetLiquidity) ||
                errorMessage.startsWith('NO_OPTIMAL_PATH')
            ) {
                throw new ValidationError([
                    {
                        field: buyAmount ? 'buyAmount' : 'sellAmount',
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: SwapQuoterError.InsufficientAssetLiquidity,
                    },
                ]);
            }
            if (errorMessage.startsWith(SwapQuoterError.AssetUnavailable)) {
                throw new ValidationError([
                    {
                        field: 'token',
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: e.message,
                    },
                ]);
            }
            logger.info('Uncaught error', e);
            throw new InternalServerError(e.message);
        }
    }
    public async submitZeroExTransactionIfWhitelistedAsync(req: express.Request, res: express.Response): Promise<void> {
        const apiKey = req.header('0x-api-key');
        const affiliateAddress = req.query.affiliateAddress as string | undefined;
        if (apiKey !== undefined && !isValidUUID(apiKey)) {
            res.status(HttpStatus.BAD_REQUEST).send({
                code: GeneralErrorCodes.InvalidAPIKey,
                reason: generalErrorCodeToReason[GeneralErrorCodes.InvalidAPIKey],
            });
            return;
        }
        schemaUtils.validateSchema(req.body, schemas.metaTransactionFillRequestSchema);

        // parse the request body
        const { zeroExTransaction, signature } = parsePostTransactionRequestBody(req);
        const zeroExTransactionHash = await this._metaTransactionService.getZeroExTransactionHashFromZeroExTransactionAsync(
            zeroExTransaction,
        );
        const transactionInDatabase = await this._metaTransactionService.findTransactionByHashAsync(
            zeroExTransactionHash,
        );
        if (transactionInDatabase !== undefined) {
            // user attemps to submit a transaction already present in the database
            res.status(HttpStatus.OK).send(marshallTransactionEntity(transactionInDatabase));
            return;
        }
        try {
            const protocolFee = await this._metaTransactionService.validateZeroExTransactionFillAsync(
                zeroExTransaction,
                signature,
            );

            // If eligible for free txn relay, submit it, otherwise, return unsigned Ethereum txn
            if (apiKey !== undefined && MetaTransactionService.isEligibleForFreeMetaTxn(apiKey)) {
                // If Metatxn service is not live then we reject
                const isLive = await this._metaTransactionService.isSignerLiveAsync();
                if (!isLive) {
                    res.status(HttpStatus.NOT_FOUND).send({
                        code: GeneralErrorCodes.ServiceDisabled,
                        reason: generalErrorCodeToReason[GeneralErrorCodes.ServiceDisabled],
                    });
                    return;
                }
                if (this._rateLimiter !== undefined) {
                    const rateLimitResponse = await this._rateLimiter.isAllowedAsync({
                        apiKey,
                        takerAddress: zeroExTransaction.signerAddress,
                    });
                    if (isRateLimitedMetaTransactionResponse(rateLimitResponse)) {
                        const ethereumTxn = await this._metaTransactionService.generatePartialExecuteTransactionEthereumTransactionAsync(
                            zeroExTransaction,
                            signature,
                            protocolFee,
                        );
                        res.status(HttpStatus.TOO_MANY_REQUESTS).send({
                            code: GeneralErrorCodes.UnableToSubmitOnBehalfOfTaker,
                            reason: rateLimitResponse.reason,
                            ethereumTransaction: {
                                data: ethereumTxn.data,
                                gasPrice: ethereumTxn.gasPrice,
                                gas: ethereumTxn.gas,
                                value: ethereumTxn.value,
                                to: ethereumTxn.to,
                            },
                        });
                        return;
                    }
                }
                const { ethereumTransactionHash } = await this._metaTransactionService.submitZeroExTransactionAsync(
                    zeroExTransactionHash,
                    zeroExTransaction,
                    signature,
                    protocolFee,
                    apiKey,
                    affiliateAddress,
                );
                res.status(HttpStatus.OK).send({
                    ethereumTransactionHash,
                    zeroExTransactionHash,
                });
            } else {
                const ethereumTxn = await this._metaTransactionService.generatePartialExecuteTransactionEthereumTransactionAsync(
                    zeroExTransaction,
                    signature,
                    protocolFee,
                );
                res.status(HttpStatus.FORBIDDEN).send({
                    code: GeneralErrorCodes.UnableToSubmitOnBehalfOfTaker,
                    reason: generalErrorCodeToReason[GeneralErrorCodes.UnableToSubmitOnBehalfOfTaker],
                    ethereumTransaction: {
                        data: ethereumTxn.data,
                        gasPrice: ethereumTxn.gasPrice,
                        gas: ethereumTxn.gas,
                        value: ethereumTxn.value,
                        to: ethereumTxn.to,
                    },
                });
            }
        } catch (e) {
            // If this is already a transformed error then just re-throw
            if (isAPIError(e)) {
                throw e;
            }
            // Wrap a Revert error as an API revert error
            if (isRevertError(e)) {
                throw new RevertAPIError(e);
            }
            logger.info('Uncaught error', e);
            throw new InternalServerError(e.message);
        }
    }
    public async getTransactionStatusAsync(req: express.Request, res: express.Response): Promise<void> {
        const transactionHash = req.params.txHash;
        try {
            assert.isHexString('transactionHash', transactionHash);
        } catch (e) {
            throw new ValidationError([
                {
                    field: 'txHash',
                    code: ValidationErrorCodes.InvalidSignatureOrHash,
                    reason: e.message,
                },
            ]);
        }
        const tx = await this._metaTransactionService.findTransactionByHashAsync(transactionHash);
        if (tx === undefined) {
            throw new NotFoundError();
        } else {
            res.status(HttpStatus.OK).send(marshallTransactionEntity(tx));
        }
    }
    public async getSignerStatusAsync(_req: express.Request, res: express.Response): Promise<void> {
        try {
            const isLive = await this._metaTransactionService.isSignerLiveAsync();
            res.status(HttpStatus.OK).send({ isLive });
        } catch (e) {
            logger.error('Uncaught error: ', e);
            throw new InternalServerError('failed to check signer status');
        }
    }
}

const parseGetTransactionRequestParams = (req: express.Request): GetTransactionRequestParams => {
    const takerAddress = req.query.takerAddress as string;
    const sellToken = req.query.sellToken as string;
    const buyToken = req.query.buyToken as string;
    const sellTokenAddress = findTokenAddressOrThrowApiError(sellToken, 'sellToken', CHAIN_ID);
    const buyTokenAddress = findTokenAddressOrThrowApiError(buyToken, 'buyToken', CHAIN_ID);

    const sellAmount = req.query.sellAmount === undefined ? undefined : new BigNumber(req.query.sellAmount as string);
    const buyAmount = req.query.buyAmount === undefined ? undefined : new BigNumber(req.query.buyAmount as string);
    const slippagePercentage = parseFloat(req.query.slippagePercentage as string) || DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE;
    if (slippagePercentage > 1) {
        throw new ValidationError([
            {
                field: 'slippagePercentage',
                code: ValidationErrorCodes.ValueOutOfRange,
                reason: ValidationErrorReasons.PercentageOutOfRange,
            },
        ]);
    }
    const _excludedSources =
        req.query.excludedSources === undefined
            ? []
            : parseUtils.parseStringArrForERC20BridgeSources((req.query.excludedSources as string).split(','));

    // tslint:disable-next-line:boolean-naming
    const includePriceComparisons =
        req.query.includePriceComparisons === undefined ? false : req.query.includePriceComparisons === 'true';

    // Exclude Bancor as a source unless swap involves BNT token
    const bntAddress = getTokenMetadataIfExists('bnt', ChainId.Mainnet).tokenAddress;
    const isBNT = sellTokenAddress.toLowerCase() === bntAddress || buyTokenAddress.toLowerCase() === bntAddress;
    const excludedSources = isBNT ? _excludedSources : _excludedSources.concat(ERC20BridgeSource.Bancor);

    return {
        takerAddress,
        sellTokenAddress,
        buyTokenAddress,
        sellAmount,
        buyAmount,
        slippagePercentage,
        excludedSources,
        includePriceComparisons,
    };
};

interface PostTransactionRequestBody {
    zeroExTransaction: ZeroExTransactionWithoutDomain;
    signature: string;
}

const parsePostTransactionRequestBody = (req: any): PostTransactionRequestBody => {
    const requestBody = req.body;
    const signature = requestBody.signature;
    const zeroExTransaction: ZeroExTransactionWithoutDomain = {
        salt: new BigNumber(requestBody.zeroExTransaction.salt),
        expirationTimeSeconds: new BigNumber(requestBody.zeroExTransaction.expirationTimeSeconds),
        gasPrice: new BigNumber(requestBody.zeroExTransaction.gasPrice),
        signerAddress: requestBody.zeroExTransaction.signerAddress,
        data: requestBody.zeroExTransaction.data,
    };
    return {
        zeroExTransaction,
        signature,
    };
};

const marshallTransactionEntity = (tx: TransactionEntity): GetMetaTransactionStatusResponse => {
    return {
        refHash: tx.refHash,
        hash: tx.txHash,
        status: tx.status,
        gasPrice: tx.gasPrice,
        updatedAt: tx.updatedAt,
        blockNumber: tx.blockNumber,
        expectedMinedInSec: tx.expectedMinedInSec,
        ethereumTxStatus: tx.txStatus,
    };
};
