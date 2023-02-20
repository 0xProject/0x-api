"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSRARouter = void 0;
const express = require("express");
const asyncHandler = require("express-async-handler");
const sra_handlers_1 = require("../handlers/sra_handlers");
function createSRARouter(orderBook) {
    const router = express.Router();
    const handlers = new sra_handlers_1.SRAHandlers(orderBook);
    // Link to docs in the root.
    router.get('/', asyncHandler(sra_handlers_1.SRAHandlers.rootAsync.bind(sra_handlers_1.SRAHandlers)));
    /**
     * GET Orders endpoint retrieves a list of orders given query parameters.
     * http://sra3-spec.s3-website-us-east-1.amazonaws.com/#operation/getOrders
     */
    router.get('/orders', asyncHandler(handlers.ordersAsync.bind(handlers)));
    /**
     * GET Orderbook endpoint retrieves the orderbook for a given asset pair.
     * http://sra3-spec.s3-website-us-east-1.amazonaws.com/#operation/getOrderbook
     */
    router.get('/orderbook', asyncHandler(handlers.orderbookAsync.bind(handlers)));
    /**
     * GET FeeRecepients endpoint retrieves a collection of all fee recipient addresses for a relayer.
     * http://sra3-spec.s3-website-us-east-1.amazonaws.com/v3/fee_recipients
     */
    router.get('/fee_recipients', sra_handlers_1.SRAHandlers.feeRecipients.bind(sra_handlers_1.SRAHandlers));
    /**
     * POST Order config endpoint retrives the values for order fields that the relayer requires.
     * http://sra3-spec.s3-website-us-east-1.amazonaws.com/#operation/getOrderConfig
     */
    router.post('/order_config', sra_handlers_1.SRAHandlers.orderConfig.bind(sra_handlers_1.SRAHandlers));
    /**
     * POST Order endpoint submits an order to the Relayer.
     * http://sra3-spec.s3-website-us-east-1.amazonaws.com/#operation/postOrder
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
     * This is an additional endpoint not a part of the official SRA standard
     */
    router.post('/order/persistent', asyncHandler(handlers.postPersistentOrderAsync.bind(handlers)));
    /**
     * GET Order endpoint retrieves the order by order hash.
     * http://sra3-spec.s3-website-us-east-1.amazonaws.com/#operation/getOrder
     */
    router.get('/order/:orderHash', asyncHandler(handlers.getOrderByHashAsync.bind(handlers)));
    return router;
}
exports.createSRARouter = createSRARouter;
//# sourceMappingURL=sra_router.js.map