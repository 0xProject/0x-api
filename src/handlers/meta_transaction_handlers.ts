// import { assetDataUtils, BigNumber, SignedOrder } from '0x.js';
// import { schemas } from '@0x/json-schemas';
import * as express from 'express';
// import * as HttpStatus from 'http-status-codes';
import * as _ from 'lodash';

// import { FEE_RECIPIENT_ADDRESS, WHITELISTED_TOKENS } from '../config';
// import { NotFoundError, ValidationError, ValidationErrorCodes } from '../errors';
import { OrderBookService } from '../services/orderbook_service';
// import { orderUtils } from '../utils/order_utils';
// import { paginationUtils } from '../utils/pagination_utils';
// import { schemaUtils } from '../utils/schema_utils';

export class MetaTransactionHandlers {
    // private readonly _orderBook: OrderBookService;
    constructor(_orderBook: OrderBookService) {
        // this._orderBook = orderBook;
    }
    public async getTransactionAsync(_req: express.Request, _res: express.Response): Promise<void> {
        // const { page, perPage } = paginationUtils.parsePaginationConfig(req);
        // const paginatedOrders = await this._orderBook.getOrdersAsync(page, perPage, req.query);
        // res.status(HttpStatus.OK).send(paginatedOrders);
        console.log('GET /transaction');
    }
    public async postTransactionAsync(_req: express.Request, _res: express.Response): Promise<void> {
        // const signedOrder = unmarshallOrder(req.body);
        // if (WHITELISTED_TOKENS !== '*') {
        //     const allowedTokens: string[] = WHITELISTED_TOKENS;
        //     validateAssetDataIsWhitelistedOrThrow(allowedTokens, signedOrder.makerAssetData, 'makerAssetData');
        //     validateAssetDataIsWhitelistedOrThrow(allowedTokens, signedOrder.takerAssetData, 'takerAssetData');
        // }
        // await this._orderBook.addOrderAsync(signedOrder);
        // res.status(HttpStatus.OK).send();
        console.log('POST /transaction');
    }
}
