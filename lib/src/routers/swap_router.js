"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwapRouter = void 0;
const express = require("express");
const asyncHandler = require("express-async-handler");
const swap_handlers_1 = require("../handlers/swap_handlers");
function createSwapRouter(swapService) {
    const router = express.Router();
    const handlers = new swap_handlers_1.SwapHandlers(swapService);
    router.get('', asyncHandler(swap_handlers_1.SwapHandlers.root.bind(swap_handlers_1.SwapHandlers)));
    router.get('/rfq/registry', asyncHandler(swap_handlers_1.SwapHandlers.getRfqRegistry.bind(handlers)));
    router.get('/quote', asyncHandler(handlers.getQuoteAsync.bind(handlers)));
    router.get('/price', asyncHandler(handlers.getQuotePriceAsync.bind(handlers)));
    router.get('/sources', asyncHandler(swap_handlers_1.SwapHandlers.getLiquiditySources.bind(handlers)));
    return router;
}
exports.createSwapRouter = createSwapRouter;
//# sourceMappingURL=swap_router.js.map