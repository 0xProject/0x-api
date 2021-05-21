// tslint:disable:max-file-line-count
import {
    InternalServerError,
    InvalidAPIKeyError,
    NotFoundError,
    ValidationError,
    ValidationErrorCodes,
} from '@0x/api-utils';
import { MetaTransaction } from '@0x/protocol-utils';
import { getTokenMetadataIfExists, isNativeSymbolOrAddress, TokenMetadata } from '@0x/token-metadata';
import { addressUtils, BigNumber } from '@0x/utils';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';
import { Counter } from 'prom-client';

import { CHAIN_ID, NATIVE_WRAPPED_TOKEN_SYMBOL, ORIGIN_REGISTRY_ADDRESS } from '../config';
import { schemas } from '../schemas';
import {
    FetchFirmQuoteParams,
    FetchIndicativeQuoteParams,
    MetaTransactionSubmitRfqmSignedQuoteResponse,
    RfqmService,
    RfqmTypes,
    SubmitRfqmSignedQuoteParams,
} from '../services/rfqm_service';
import { ConfigManager } from '../utils/config_manager';
import { RfqmJobOpts, RfqmJobStatus } from '../utils/rfqm_db_utils';
import {
    StringMetaTransactionFields,
    StringSignatureFields,
    stringsToMetaTransactionFields,
    stringsToSignature,
} from '../utils/rfqm_request_utils';
import { schemaUtils } from '../utils/schema_utils';

const RFQM_INDICATIVE_QUOTE_REQUEST = new Counter({
    name: 'rfqm_handler_indicative_quote_requested',
    help: 'Request made to fetch rfqm indicative quote',
    labelNames: ['apiKey'],
});

const RFQM_INDICATIVE_QUOTE_NOT_FOUND = new Counter({
    name: 'rfqm_handler_indicative_quote_not_found',
    help: 'Request to fetch rfqm indicative quote returned no quote',
    labelNames: ['apiKey'],
});

const RFQM_INDICATIVE_QUOTE_ERROR = new Counter({
    name: 'rfqm_handler_indicative_quote_error',
    help: 'Request to fetch rfqm indicative quote resulted in error',
    labelNames: ['apiKey'],
});

const RFQM_FIRM_QUOTE_REQUEST = new Counter({
    name: 'rfqm_handler_firm_quote_requested',
    help: 'Request made to fetch rfqm firm quote',
    labelNames: ['apiKey'],
});

const RFQM_FIRM_QUOTE_NOT_FOUND = new Counter({
    name: 'rfqm_handler_firm_quote_not_found',
    help: 'Request to fetch rfqm firm quote returned no quote',
    labelNames: ['apiKey'],
});

const RFQM_FIRM_QUOTE_ERROR = new Counter({
    name: 'rfqm_handler_firm_quote_error',
    help: 'Request to fetch rfqm firm quote resulted in error',
    labelNames: ['apiKey'],
});

const RFQM_SIGNED_QUOTE_SUBMITTED = new Counter({
    name: 'rfqm_handler_signed_quote_submitted',
    help: 'Request received to submit a signed rfqm quote',
});

const RFQM_SIGNED_QUOTE_NOT_FOUND = new Counter({
    name: 'rfqm_handler_signed_quote_not_found',
    help: 'A submitted quote did not match any stored quotes',
});

const RFQM_SIGNED_QUOTE_FAILED_VALIDATION = new Counter({
    name: 'rfqm_handler_signed_quote_failed_validation',
    help: 'A signed quote failed validation before being queued',
});

export class RfqmHandlers {
    constructor(private readonly _rfqmService: RfqmService, private readonly _configManager: ConfigManager) {}

    public async getIndicativeQuoteAsync(req: express.Request, res: express.Response): Promise<void> {
        const apiKeyLabel = req.header('0x-api-key') || 'N/A';
        RFQM_INDICATIVE_QUOTE_REQUEST.labels(apiKeyLabel).inc();

        // Parse request
        const params = this._parseFetchIndicativeQuoteParams(req);

        // Try to get indicative quote
        let indicativeQuote;
        try {
            indicativeQuote = await this._rfqmService.fetchIndicativeQuoteAsync(params);
        } catch (err) {
            req.log.error(err, 'Encountered an error while fetching an rfqm indicative quote');
            RFQM_INDICATIVE_QUOTE_ERROR.labels(apiKeyLabel).inc();
            throw new InternalServerError('Unexpected error encountered');
        }

        // Handle no quote returned
        if (indicativeQuote === null) {
            RFQM_INDICATIVE_QUOTE_NOT_FOUND.labels(apiKeyLabel).inc();
            throw new NotFoundError('Unable to retrieve a price');
        }

        // Result
        res.status(HttpStatus.OK).send(indicativeQuote);
    }

    public async getFirmQuoteAsync(req: express.Request, res: express.Response): Promise<void> {
        const apiKeyLabel = req.header('0x-api-key') || 'N/A';
        RFQM_FIRM_QUOTE_REQUEST.labels(apiKeyLabel).inc();

        // Parse request
        const params = this._parseFetchFirmQuoteParams(req);

        // Try to get firm quote
        let firmQuote;
        try {
            firmQuote = await this._rfqmService.fetchFirmQuoteAsync(params);
        } catch (err) {
            req.log.error(err, 'Encountered an error while fetching an rfqm firm quote');
            RFQM_FIRM_QUOTE_ERROR.labels(apiKeyLabel).inc();
            throw new InternalServerError('Unexpected error encountered');
        }

        // Handle no quote returned
        if (firmQuote === null) {
            RFQM_FIRM_QUOTE_NOT_FOUND.labels(apiKeyLabel).inc();
            throw new NotFoundError('Unable to retrieve a quote');
        }

        // Result
        res.status(HttpStatus.OK).send(firmQuote);
    }

    public async submitSignedQuoteAsync(req: express.Request, res: express.Response): Promise<void> {
        RFQM_SIGNED_QUOTE_SUBMITTED.inc();
        const params = parseSubmitSignedQuoteParams(req);

        if (params.type === RfqmTypes.MetaTransaction) {
            const metaTransactionHash = params.metaTransaction.getHash();

            // check that the firm quote is recognized as a previously returned quote
            const quote = await this._rfqmService.dbUtils.findQuoteByMetaTransactionHashAsync(metaTransactionHash);
            if (quote === undefined) {
                RFQM_SIGNED_QUOTE_NOT_FOUND.inc();
                throw new NotFoundError(`metaTransaction quote not found`);
            }

            // validate that the firm quote is fillable using the origin registry address (this address is assumed to hold ETH)
            try {
                await this._rfqmService._blockchainUtils.validateMetaTransactionOrThrowAsync(
                    params.metaTransaction,
                    params.signature,
                    ORIGIN_REGISTRY_ADDRESS,
                );
            } catch (err) {
                RFQM_SIGNED_QUOTE_FAILED_VALIDATION.inc();
                throw new InternalServerError(`metaTransaction is not fillable: ${err}`);
            }

            const rfqmJobOpts: RfqmJobOpts = {
                orderHash: quote.orderHash!,
                metaTransactionHash,
                createdAt: new Date(),
                expiry: params.metaTransaction.expirationTimeSeconds,
                chainId: CHAIN_ID,
                integratorId: quote.integratorId ? quote.integratorId : null,
                makerUri: quote.makerUri,
                status: RfqmJobStatus.InQueue,
                statusReason: null,
                calldata: this._rfqmService._blockchainUtils.generateMetaTransactionCallData(
                    params.metaTransaction,
                    params.signature,
                ),
                fee: quote.fee,
                order: quote.order,
                metadata: {
                    metaTransaction: params.metaTransaction,
                },
            };

            // this insert will fail if a job has already been created, ensuring
            // that a signed quote cannot be queued twice
            try {
                // make sure job data is persisted to Postgres before queueing task
                await this._rfqmService.dbUtils.writeRfqmJobToDbAsync(rfqmJobOpts);
                await this._rfqmService.enqueueJobAsync(quote.orderHash!);
            } catch (err) {
                throw new InternalServerError(
                    `failed to queue the quote for submission, it may have already been submitted`,
                );
            }

            const response: MetaTransactionSubmitRfqmSignedQuoteResponse = {
                type: RfqmTypes.MetaTransaction,
                metaTransactionHash,
                orderHash: quote.orderHash!,
            };

            res.status(HttpStatus.CREATED).send(response);
        } else {
            throw new InternalServerError('rfqm type not supported');
        }
    }

    private _parseFetchFirmQuoteParams(req: express.Request): FetchFirmQuoteParams {
        // Same as indicative except requires takerAddress
        const indicativeQuoteRequest = this._parseFetchIndicativeQuoteParams(req);
        const takerAddress = indicativeQuoteRequest.takerAddress || '';
        if (takerAddress === '') {
            throw new ValidationError([
                {
                    field: 'takerAddress',
                    code: ValidationErrorCodes.RequiredField,
                    reason: `The field takerAddress is missing`,
                },
            ]);
        } else if (!addressUtils.isAddress(takerAddress)) {
            throw new ValidationError([
                {
                    field: 'takerAddress',
                    code: ValidationErrorCodes.InvalidAddress,
                    reason: `Must provide a valid takerAddress`,
                },
            ]);
        }
        return {
            ...indicativeQuoteRequest,
            takerAddress,
        };
    }

    private _parseFetchIndicativeQuoteParams(req: express.Request): FetchIndicativeQuoteParams {
        // HACK - reusing the validation for Swap Quote as the interface here is a subset
        schemaUtils.validateSchema(req.query, schemas.swapQuoteRequestSchema as any);
        const apiKey = req.header('0x-api-key');
        if (apiKey === undefined) {
            throw new InvalidAPIKeyError('Must access with an API key');
        }

        if (!this._configManager.getRfqmApiKeyWhitelist().has(apiKey)) {
            throw new InvalidAPIKeyError('API key not authorized for RFQM access');
        }

        // Parse string params
        const { takerAddress } = req.query;

        // Parse tokens
        const sellTokenRaw = req.query.sellToken as string;
        const buyTokenRaw = req.query.buyToken as string;
        validateNotNativeTokenOrThrow(sellTokenRaw, 'sellToken');
        validateNotNativeTokenOrThrow(buyTokenRaw, 'buyToken');

        const { tokenAddress: sellToken, decimals: sellTokenDecimals } = getTokenMetadataOrThrow(
            sellTokenRaw,
            'sellToken',
        );
        const { tokenAddress: buyToken, decimals: buyTokenDecimals } = getTokenMetadataOrThrow(buyTokenRaw, 'buyToken');

        // Parse number params
        const sellAmount =
            req.query.sellAmount === undefined ? undefined : new BigNumber(req.query.sellAmount as string);
        const buyAmount = req.query.buyAmount === undefined ? undefined : new BigNumber(req.query.buyAmount as string);

        return {
            apiKey,
            buyAmount,
            buyToken,
            buyTokenDecimals,
            sellAmount,
            sellToken,
            sellTokenDecimals,
            takerAddress: takerAddress as string,
        };
    }
}

const parseSubmitSignedQuoteParams = (req: express.Request): SubmitRfqmSignedQuoteParams => {
    const type = req.query.type as RfqmTypes;

    if (type === RfqmTypes.MetaTransaction) {
        const metaTransaction = new MetaTransaction(
            stringsToMetaTransactionFields((req.query.metaTransactionas as unknown) as StringMetaTransactionFields),
        );
        const signature = stringsToSignature((req.query.signature as unknown) as StringSignatureFields);

        return {
            type,
            metaTransaction,
            signature,
        };
    } else {
        throw new Error('Unsupported submission type for /submit');
    }
};

const validateNotNativeTokenOrThrow = (token: string, field: string): boolean => {
    if (isNativeSymbolOrAddress(token, CHAIN_ID)) {
        throw new ValidationError([
            {
                field,
                code: ValidationErrorCodes.TokenNotSupported,
                reason: `Unwrapped Native Asset is not supported. Use ${NATIVE_WRAPPED_TOKEN_SYMBOL} instead`,
            },
        ]);
    }

    return true;
};

const getTokenMetadataOrThrow = (token: string, field: string): TokenMetadata => {
    const metadata = getTokenMetadataIfExists(token, CHAIN_ID);
    if (metadata === undefined) {
        throw new ValidationError([
            {
                field,
                code: ValidationErrorCodes.AddressNotSupported,
                reason: `Token ${token} is currently unsupported`,
            },
        ]);
    }

    return metadata;
};
