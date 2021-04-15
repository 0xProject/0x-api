// tslint:disable:max-file-line-count
import { BigNumber } from '@0x/utils';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';

import { CHAIN_ID } from '../config';
import { schemas } from '../schemas';
import { RfqmService } from '../services/rfqm_service';
import { FetchIndicativeQuoteParams } from '../types';
import { schemaUtils } from '../utils/schema_utils';
import { findTokenAddressOrThrowApiError, isETHSymbolOrAddress } from '../utils/token_metadata_utils';

export class RfqmHandlers {
    constructor(public readonly _rfqmService: RfqmService) {}

    public async getIndicativeQuoteAsync(req: express.Request, res: express.Response): Promise<void> {
        const params = parseFetchIndicativeQuoteParams(req);
        const indicativeQuote = await this._rfqmService.fetchIndicativeQuoteAsync(params);
        res.status(HttpStatus.OK).send(indicativeQuote);
    }
}

const parseFetchIndicativeQuoteParams = (req: express.Request): FetchIndicativeQuoteParams => {
    // HACK - reusing the validation for Swap Quote as the interface here is a subset
    schemaUtils.validateSchema(req.query, schemas.swapQuoteRequestSchema as any);
    const apiKey = req.header('0x-api-key');
    if (apiKey === undefined) {
        throw new Error('Must access with an API key');
    }

    // Parse string params
    const { takerAddress } = req.query;

    // Parse tokens and eth wrap/unwraps
    const sellTokenRaw = req.query.sellToken as string;
    const buyTokenRaw = req.query.buyToken as string;
    const isETHSell = isETHSymbolOrAddress(sellTokenRaw);
    const isETHBuy = isETHSymbolOrAddress(buyTokenRaw);
    // TODO - should we ignore ETH?
    // NOTE: Internally all ETH trades are for WETH, we just wrap/unwrap automatically
    const sellToken = findTokenAddressOrThrowApiError(
        isETHSell ? 'WETH' : sellTokenRaw,
        'sellToken',
        CHAIN_ID,
    ).toLowerCase();
    const buyToken = findTokenAddressOrThrowApiError(
        isETHBuy ? 'WETH' : buyTokenRaw,
        'buyToken',
        CHAIN_ID,
    ).toLowerCase();
    // Parse number params
    const sellAmount = req.query.sellAmount === undefined ? undefined : new BigNumber(req.query.sellAmount as string);
    const buyAmount = req.query.buyAmount === undefined ? undefined : new BigNumber(req.query.buyAmount as string);

    return {
        apiKey,
        buyAmount,
        buyToken,
        sellAmount,
        sellToken,
        takerAddress: takerAddress as string,
    };
};
