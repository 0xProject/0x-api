import * as express from 'express';
import * as asyncHandler from 'express-async-handler';

import { RecurringTradeHandlers } from '../handlers/recurring_trade_handlers';
import { RecurringTradeService } from '../services/recurring_trade_service';

export const createRecurringTradeRouter = (
    recurringTradeService: RecurringTradeService,
): express.Router => {
    const router = express.Router();
    const handlers = new RecurringTradeHandlers(recurringTradeService);
    router.get('/', asyncHandler(RecurringTradeHandlers.rootAsync.bind(RecurringTradeHandlers)));
    /**
     * GET recurring trades endpoint returns all recurring trades
     */
    router.get('/trades', asyncHandler(handlers.getAllRecurringTradesAsync.bind(handlers)));
    /**
     * GET trades/<address> endpoint returns recurring trades for the given address
     */
    router.get('/trades/:address', asyncHandler(handlers.getAllRecurringTradesAsync.bind(handlers)));
    /**
     * POST create recurring trades endpoint creates a new recurring trade
     */
    router.post('/create', asyncHandler(handlers.createRecurringTradeAsync.bind(handlers)));

    return router;
};
