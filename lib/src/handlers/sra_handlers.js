"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SRAHandlers = void 0;
const utils_1 = require("@0x/utils");
const http_status_codes_1 = require("http-status-codes");
const isValidUUID = require("uuid-validate");
const config_1 = require("../config");
const constants_1 = require("../constants");
const entities_1 = require("../entities");
const errors_1 = require("../errors");
const schemas_1 = require("../schemas");
const pagination_utils_1 = require("../utils/pagination_utils");
const schema_utils_1 = require("../utils/schema_utils");
const prom_client_1 = require("prom-client");
const ORDERS_POST_REQUESTS = new prom_client_1.Counter({
    name: 'orders_post_requests_total',
    help: 'Total number of /orders post requests',
    labelNames: ['type', 'chain_id'],
});
const ORDERS_GET_REQUESTS = new prom_client_1.Counter({
    name: 'orders_get_requests_total',
    help: 'Total number of /orders get requests',
    labelNames: ['endpoint', 'chain_id'],
});
class SRAHandlers {
    constructor(orderBook) {
        this._orderBook = orderBook;
    }
    static rootAsync(_req, res) {
        const message = `This is the root of the Standard Relayer API. Visit ${constants_1.SRA_DOCS_URL} for details about this API.`;
        res.status(http_status_codes_1.StatusCodes.OK).send({ message });
    }
    static feeRecipients(req, res) {
        const { page, perPage } = pagination_utils_1.paginationUtils.parsePaginationConfig(req);
        const normalizedFeeRecipient = config_1.FEE_RECIPIENT_ADDRESS.toLowerCase();
        const feeRecipients = [normalizedFeeRecipient];
        const paginatedFeeRecipients = pagination_utils_1.paginationUtils.paginate(feeRecipients, page, perPage);
        res.status(http_status_codes_1.StatusCodes.OK).send(paginatedFeeRecipients);
    }
    static orderConfig(req, res) {
        schema_utils_1.schemaUtils.validateSchema(req.body, schemas_1.schemas.sraOrderConfigPayloadSchema);
        const orderConfigResponse = {
            sender: constants_1.NULL_ADDRESS,
            feeRecipient: config_1.FEE_RECIPIENT_ADDRESS.toLowerCase(),
            takerTokenFeeAmount: config_1.TAKER_FEE_UNIT_AMOUNT,
        };
        res.status(http_status_codes_1.StatusCodes.OK).send(orderConfigResponse);
    }
    async getOrderByHashAsync(req, res) {
        const orderIfExists = await this._orderBook.getOrderByHashIfExistsAsync(req.params.orderHash);
        if (orderIfExists === undefined) {
            throw new errors_1.NotFoundError();
        }
        else {
            res.status(http_status_codes_1.StatusCodes.OK).send(orderIfExists);
        }
    }
    async ordersAsync(req, res) {
        schema_utils_1.schemaUtils.validateSchema(req.query, schemas_1.schemas.sraOrdersQuerySchema);
        const orderFieldFilters = new entities_1.SignedOrderV4Entity(req.query);
        const additionalFilters = {
            trader: req.query.trader ? req.query.trader.toString() : undefined,
            isUnfillable: req.query.unfillable === 'true',
        };
        const { page, perPage } = pagination_utils_1.paginationUtils.parsePaginationConfig(req);
        const paginatedOrders = await this._orderBook.getOrdersAsync(page, perPage, orderFieldFilters, additionalFilters);
        ORDERS_GET_REQUESTS.labels('orders', config_1.CHAIN_ID.toString()).inc();
        res.status(http_status_codes_1.StatusCodes.OK).send(paginatedOrders);
    }
    async orderbookAsync(req, res) {
        schema_utils_1.schemaUtils.validateSchema(req.query, schemas_1.schemas.sraOrderbookQuerySchema);
        const { page, perPage } = pagination_utils_1.paginationUtils.parsePaginationConfig(req);
        const baseToken = req.query.baseToken.toLowerCase();
        const quoteToken = req.query.quoteToken.toLowerCase();
        const orderbookResponse = await this._orderBook.getOrderBookAsync(page, perPage, baseToken, quoteToken);
        ORDERS_GET_REQUESTS.labels('book', config_1.CHAIN_ID.toString()).inc();
        res.status(http_status_codes_1.StatusCodes.OK).send(orderbookResponse);
    }
    async postOrderAsync(req, res) {
        const shouldSkipConfirmation = req.query.skipConfirmation === 'true';
        schema_utils_1.schemaUtils.validateSchema(req.body, schemas_1.schemas.sraPostOrderPayloadSchema);
        const signedOrder = unmarshallOrder(req.body);
        if (config_1.WHITELISTED_TOKENS !== '*') {
            const allowedTokens = config_1.WHITELISTED_TOKENS;
            validateAssetTokenOrThrow(allowedTokens, signedOrder.makerToken, 'makerToken');
            validateAssetTokenOrThrow(allowedTokens, signedOrder.takerToken, 'takerToken');
        }
        if (shouldSkipConfirmation) {
            res.status(http_status_codes_1.StatusCodes.OK).send();
        }
        await this._orderBook.addOrderAsync(signedOrder);
        if (!shouldSkipConfirmation) {
            res.status(http_status_codes_1.StatusCodes.OK).send();
        }
        ORDERS_POST_REQUESTS.labels('single', config_1.CHAIN_ID.toString()).inc();
    }
    async postOrdersAsync(req, res) {
        const shouldSkipConfirmation = req.query.skipConfirmation === 'true';
        schema_utils_1.schemaUtils.validateSchema(req.body, schemas_1.schemas.sraPostOrdersPayloadSchema);
        const signedOrders = unmarshallOrders(req.body);
        if (config_1.WHITELISTED_TOKENS !== '*') {
            const allowedTokens = config_1.WHITELISTED_TOKENS;
            for (const signedOrder of signedOrders) {
                validateAssetTokenOrThrow(allowedTokens, signedOrder.makerToken, 'makerToken');
                validateAssetTokenOrThrow(allowedTokens, signedOrder.takerToken, 'takerToken');
            }
        }
        if (shouldSkipConfirmation) {
            res.status(http_status_codes_1.StatusCodes.OK).send();
        }
        await this._orderBook.addOrdersAsync(signedOrders);
        if (!shouldSkipConfirmation) {
            res.status(http_status_codes_1.StatusCodes.OK).send();
        }
        ORDERS_POST_REQUESTS.labels('multi', config_1.CHAIN_ID.toString()).inc();
    }
    async postPersistentOrderAsync(req, res) {
        const shouldSkipConfirmation = req.query.skipConfirmation === 'true';
        const apiKey = req.header('0x-api-key');
        if (apiKey === undefined || !isValidUUID(apiKey) || !this._orderBook.isAllowedPersistentOrders(apiKey)) {
            throw new errors_1.InvalidAPIKeyError();
        }
        schema_utils_1.schemaUtils.validateSchema(req.body, schemas_1.schemas.sraPostOrderPayloadSchema);
        const signedOrder = unmarshallOrder(req.body);
        if (config_1.WHITELISTED_TOKENS !== '*') {
            const allowedTokens = config_1.WHITELISTED_TOKENS;
            validateAssetTokenOrThrow(allowedTokens, signedOrder.makerToken, 'makerToken');
            validateAssetTokenOrThrow(allowedTokens, signedOrder.takerToken, 'takerToken');
        }
        if (shouldSkipConfirmation) {
            res.status(http_status_codes_1.StatusCodes.OK).send();
        }
        await this._orderBook.addPersistentOrdersAsync([signedOrder]);
        if (!shouldSkipConfirmation) {
            res.status(http_status_codes_1.StatusCodes.OK).send();
        }
    }
}
exports.SRAHandlers = SRAHandlers;
function validateAssetTokenOrThrow(allowedTokens, tokenAddress, field) {
    if (!allowedTokens.includes(tokenAddress)) {
        throw new errors_1.ValidationError([
            {
                field,
                code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                reason: `${tokenAddress} not supported`,
            },
        ]);
    }
}
// As the order come in as JSON they need to be turned into the correct types such as BigNumber
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
function unmarshallOrder(signedOrderRaw) {
    const signedOrder = {
        // Defaults...
        taker: constants_1.NULL_ADDRESS,
        feeRecipient: constants_1.NULL_ADDRESS,
        pool: '0x0000000000000000000000000000000000000000000000000000000000000000',
        ...signedOrderRaw,
        sender: constants_1.NULL_ADDRESS,
        takerTokenFeeAmount: signedOrderRaw.takerTokenFeeAmount
            ? new utils_1.BigNumber(signedOrderRaw.takerTokenFeeAmount)
            : constants_1.ZERO,
        makerAmount: new utils_1.BigNumber(signedOrderRaw.makerAmount),
        takerAmount: new utils_1.BigNumber(signedOrderRaw.takerAmount),
        expiry: new utils_1.BigNumber(signedOrderRaw.expiry),
        salt: new utils_1.BigNumber(signedOrderRaw.salt),
    };
    return signedOrder;
}
// As the orders come in as JSON they need to be turned into the correct types such as BigNumber
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
function unmarshallOrders(signedOrdersRaw) {
    return signedOrdersRaw.map((signedOrderRaw) => {
        return unmarshallOrder(signedOrderRaw);
    });
}
//# sourceMappingURL=sra_handlers.js.map