import * as express from 'express';
import * as asyncHandler from 'express-async-handler';

import { RfqmHandlers } from '../handlers/rfqm_handlers';
import { RfqmService } from '../services/rfqm_service';

// tslint:disable-next-line:completed-docs
export function createRfqmRouter(rfqmService: RfqmService): express.Router {
    const router = express.Router();
    const handlers = new RfqmHandlers(rfqmService);

    // Routes
    router.get('/price', asyncHandler(handlers.getIndicativeQuoteAsync.bind(handlers)));

    return router;
}
