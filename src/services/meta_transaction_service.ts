import * as bodyParser from 'body-parser';
import * as cors from 'cors';
// tslint:disable-next-line:no-implicit-dependencies
import * as core from 'express-serve-static-core';

import { META_TRANSACTION_PATH } from '../constants';
import { errorHandler } from '../middleware/error_handling';
import { createMetaTransactionRouter } from '../routers/meta_transaction_router';

import { OrderBookService } from './orderbook_service';

// tslint:disable-next-line:no-unnecessary-class
export class MetaTransactionHttpService {
    constructor(app: core.Express, orderBook: OrderBookService) {
        app.use(cors());
        app.use(bodyParser.json());
        app.use(META_TRANSACTION_PATH, createMetaTransactionRouter(orderBook));
        app.use(errorHandler);
    }
}
