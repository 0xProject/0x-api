import * as express from 'express';
import * as asyncHandler from 'express-async-handler';

import { MetaTransactionHandlers } from '../handlers/meta_transaction_handlers';
import { OrderBookService } from '../services/orderbook_service';

export const createMetaTransactionRouter = (orderBook: OrderBookService): express.Router => {
    const router = express.Router();
    const handlers = new MetaTransactionHandlers(orderBook);
    /**
     * GET Transaction endpoint returns an unsigned 0x Transaction that when sent to
     * `executeTransaction` will execute a specified swap.
     *
     * https://0x.org/docs/guides/v3-specification#transaction-message-format
     */
    router.get('/transaction', asyncHandler(handlers.getTransactionAsync.bind(handlers)));
    /**
     * POST Transaction endpoint takes a signed 0x Transaction and sends it to Ethereum
     * for execution via `executeTransaction`.
     *
     * https://0x.org/docs/guides/v3-specification#executing-a-transaction
     */
    router.post('/transaction', asyncHandler(handlers.postTransactionAsync.bind(handlers)));
    return router;
};
