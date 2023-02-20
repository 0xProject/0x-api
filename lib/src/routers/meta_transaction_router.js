"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMetaTransactionV2Router = exports.createMetaTransactionV1Router = void 0;
const express = require("express");
const asyncHandler = require("express-async-handler");
const meta_transaction_handlers_1 = require("../handlers/meta_transaction_handlers");
const createMetaTransactionV1Router = (metaTransactionService) => {
    const router = express.Router();
    const handlers = new meta_transaction_handlers_1.MetaTransactionHandlers(metaTransactionService);
    // V1 handlers
    router.get('', asyncHandler(meta_transaction_handlers_1.MetaTransactionHandlers.rootAsync.bind(meta_transaction_handlers_1.MetaTransactionHandlers)));
    router.get('/price', asyncHandler(handlers.getV1PriceAsync.bind(handlers)));
    router.get('/quote', asyncHandler(handlers.getV1QuoteAsync.bind(handlers)));
    return router;
};
exports.createMetaTransactionV1Router = createMetaTransactionV1Router;
const createMetaTransactionV2Router = (metaTransactionService) => {
    const router = express.Router();
    const handlers = new meta_transaction_handlers_1.MetaTransactionHandlers(metaTransactionService);
    // V2 handlers
    router.get('', asyncHandler(meta_transaction_handlers_1.MetaTransactionHandlers.rootAsync.bind(meta_transaction_handlers_1.MetaTransactionHandlers)));
    router.post('/price', asyncHandler(handlers.getV2PriceAsync.bind(handlers)));
    router.post('/quote', asyncHandler(handlers.getV2QuoteAsync.bind(handlers)));
    return router;
};
exports.createMetaTransactionV2Router = createMetaTransactionV2Router;
//# sourceMappingURL=meta_transaction_router.js.map