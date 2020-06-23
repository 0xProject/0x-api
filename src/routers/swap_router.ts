import * as express from 'express';
import * as asyncHandler from 'express-async-handler';

import { SwapHandlers } from '../handlers/swap_handlers';
import { SwapService } from '../services/swap_service';

// tslint:disable-next-line:completed-docs
export function createSwapRouter(swapService: SwapService): express.Router {
    const router = express.Router();
    const handlers = new SwapHandlers(swapService);
    router.get('/v0', asyncHandler(SwapHandlers.rootAsync.bind(SwapHandlers)));
    router.get('/v0/quote', asyncHandler(handlers.getSwapQuoteV0Async.bind(handlers)));
    router.get('/v0/tokens', asyncHandler(handlers.getSwapTokensAsync.bind(handlers)));
    router.get('/v0/prices', asyncHandler(handlers.getTokenPricesAsync.bind(handlers)));
    router.get('/v0/price', asyncHandler(handlers.getSwapPriceV0Async.bind(handlers)));

    router.get('/v1', asyncHandler(SwapHandlers.rootAsync.bind(SwapHandlers)));
    router.get('/v1/quote', asyncHandler(handlers.getSwapQuoteAsync.bind(handlers)));
    router.get('/v1/tokens', asyncHandler(handlers.getSwapTokensAsync.bind(handlers)));
    router.get('/v1/prices', asyncHandler(handlers.getTokenPricesAsync.bind(handlers)));
    router.get('/v1/price', asyncHandler(handlers.getSwapPriceAsync.bind(handlers)));
    return router;
}
