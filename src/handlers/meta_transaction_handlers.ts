import { BigNumber } from '0x.js';
// import { schemas } from '@0x/json-schemas';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';
import * as _ from 'lodash';

// import { FEE_RECIPIENT_ADDRESS, WHITELISTED_TOKENS } from '../config';
// import { NotFoundError, ValidationError, ValidationErrorCodes } from '../errors';
import { OrderBookService } from '../services/orderbook_service';
// import { orderUtils } from '../utils/order_utils';
// import { schemaUtils } from '../utils/schema_utils';

export class MetaTransactionHandlers {
    // private readonly _orderBook: OrderBookService;
    constructor(_orderBook: OrderBookService) {
        // this._orderBook = orderBook;
    }
    public async getTransactionAsync(req: express.Request, res: express.Response): Promise<void> {
        const { sellToken, buyToken, sellAmount, buyAmount } = parseGetTransactionRequestParams(req);
        res.status(HttpStatus.OK).send({ sellToken, buyToken, sellAmount, buyAmount });
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

interface GetTransactionRequestParams {
    sellToken: string;
    buyToken: string;
    sellAmount?: BigNumber;
    buyAmount?: BigNumber;
}
const parseGetTransactionRequestParams = (req: express.Request): GetTransactionRequestParams => {
    const sellToken = req.query.sellToken;
    const buyToken = req.query.buyToken;
    const sellAmount = req.query.sellAmount === undefined ? undefined : new BigNumber(req.query.sellAmount);
    const buyAmount = req.query.buyAmount === undefined ? undefined : new BigNumber(req.query.buyAmount);
    return { sellToken, buyToken, sellAmount, buyAmount };
};
