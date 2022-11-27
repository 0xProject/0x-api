import * as express from 'express';
import * as asyncHandler from 'express-async-handler';
import { BasicSwapHandlers } from '../handlers/basic_swap_handlers';

import { SwapHandlers } from '../handlers/swap_handlers';
import { BasicSwapService } from '../services/basic_swap_service';
import { SwapService } from '../services/swap_service';

export function createBasicSwapRouter(swapService: SwapService, basicSwapService: BasicSwapService): express.Router {
    const router = express.Router();
    const handlers = new BasicSwapHandlers(swapService, basicSwapService);
    router.get('', asyncHandler(SwapHandlers.root.bind(SwapHandlers)));
    router.get('/quote', asyncHandler(handlers.getQuoteAsync.bind(handlers)));

    return router;
}
