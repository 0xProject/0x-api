"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderBookRouter = void 0;
const express = require("express");
const asyncHandler = require("express-async-handler");
const sra_handlers_1 = require("../handlers/sra_handlers");
function createOrderBookRouter(orderBook) {
    const router = express.Router();
    const handlers = new sra_handlers_1.SRAHandlers(orderBook);
    /**
     * GET Orderbook endpoint retrieves the orderbook for a given asset pair.
     */
    router.get('/', asyncHandler(handlers.orderbookAsync.bind(handlers)));
    /**
     * GET Orders endpoint retrieves a list of orders given query parameters.
     */
    router.get('/orders', asyncHandler(handlers.ordersAsync.bind(handlers)));
    /**
     * GET FeeRecepients endpoint retrieves a collection of all fee recipient addresses for a relayer.
     */
    router.get('/fee_recipients', sra_handlers_1.SRAHandlers.feeRecipients.bind(sra_handlers_1.SRAHandlers));
    /**
     * POST Order config endpoint retrives the values for order fields that the relayer requires.
     */
    router.post('/order_config', sra_handlers_1.SRAHandlers.orderConfig.bind(sra_handlers_1.SRAHandlers));
    /**
     * POST Order endpoint submits an order to the Relayer.
     */
    router.post('/order', asyncHandler(handlers.postOrderAsync.bind(handlers)));
    /**
     * POST Orders endpoint submits several orders to the Relayer.
     * This is an additional endpoint not a part of the official SRA standard
     */
    router.post('/orders', asyncHandler(handlers.postOrdersAsync.bind(handlers)));
    /**
     * POST Persistent order endpoint submits an order that will be persisted even after cancellation or expiration.
     * Requires an API Key
     */
    router.post('/order/persistent', asyncHandler(handlers.postPersistentOrderAsync.bind(handlers)));
    /**
     * GET Order endpoint retrieves the order by order hash.
     */
    router.get('/order/:orderHash', asyncHandler(handlers.getOrderByHashAsync.bind(handlers)));
    return router;
}
exports.createOrderBookRouter = createOrderBookRouter;
//# sourceMappingURL=orderbook_router.js.map