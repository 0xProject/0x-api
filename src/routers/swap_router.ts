import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as asyncHandler from 'express-async-handler';
// tslint:disable-next-line:no-implicit-dependencies
import * as core from 'express-serve-static-core';

import { SWAP_PATH } from '../constants';
import { SwapHandlers } from '../handlers/swap_handlers';
import { errorHandler } from '../middleware/error_handling';
import { SwapService } from '../services/swap_service';

export const configureSwapHttpRouter = (app: core.Express, swapService: SwapService): void => {
    app.use(cors());
    app.use(bodyParser.json());
    app.use(SWAP_PATH, createSwapRouter(swapService));
    app.use(errorHandler);
};

function createSwapRouter(swapService: SwapService): express.Router {
    const router = express.Router();
    const handlers = new SwapHandlers(swapService);
    router.get('/quote', asyncHandler(handlers.getSwapQuoteAsync.bind(handlers)));
    router.get('/tokens', asyncHandler(handlers.getSwapTokensAsync.bind(handlers)));
    return router;
}
