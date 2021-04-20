// tslint:disable:max-file-line-count
import { InvalidAPIKeyError, NotFoundError, ValidationError, ValidationErrorCodes } from '@0x/api-utils';
import { BigNumber } from '@0x/utils';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';

import { CHAIN_ID, NATIVE_TOKEN_SYMBOL, NATIVE_WRAPPED_TOKEN_SYMBOL } from '../config';
import { schemas } from '../schemas';
import { EMPTY_QUOTE_RESPONSE, FetchIndicativeQuoteParams, RfqmService } from '../services/rfqm_service';
import { ConfigManager } from '../utils/config_manager';
import { schemaUtils } from '../utils/schema_utils';
import { findTokenAddressOrThrowApiError } from '../utils/token_metadata_utils';

export class RfqmHandlers {
    constructor(private readonly _rfqmService: RfqmService, private readonly _configManager: ConfigManager) {}

    public async getIndicativeQuoteAsync(req: express.Request, res: express.Response): Promise<void> {
        const params = this._parseFetchIndicativeQuoteParams(req);
        const indicativeQuote = await this._rfqmService.fetchIndicativeQuoteAsync(params);

        if (indicativeQuote === EMPTY_QUOTE_RESPONSE) {
            throw new NotFoundError('Unable to retrieve a price');
        }

        res.status(HttpStatus.OK).send(indicativeQuote);
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
        validateNotETH(sellTokenRaw, 'sellToken');
        validateNotETH(buyTokenRaw, 'buyToken');

        const sellToken = findTokenAddressOrThrowApiError(sellTokenRaw, 'sellToken', CHAIN_ID).toLowerCase();
        const buyToken = findTokenAddressOrThrowApiError(buyTokenRaw, 'buyToken', CHAIN_ID).toLowerCase();

        // Parse number params
        const sellAmount =
            req.query.sellAmount === undefined ? undefined : new BigNumber(req.query.sellAmount as string);
        const buyAmount = req.query.buyAmount === undefined ? undefined : new BigNumber(req.query.buyAmount as string);

        return {
            apiKey,
            buyAmount,
            buyToken,
            sellAmount,
            sellToken,
            takerAddress: takerAddress as string,
        };
    }
}

const validateNotETH = (token: string, field: string): boolean => {
    if (token === NATIVE_TOKEN_SYMBOL) {
        throw new ValidationError([
            {
                field,
                code: ValidationErrorCodes.TokenNotSupported,
                reason: `Unwrapped ${NATIVE_TOKEN_SYMBOL} is not supported. Use ${NATIVE_WRAPPED_TOKEN_SYMBOL} instead`,
            },
        ]);
    }

    return true;
};
