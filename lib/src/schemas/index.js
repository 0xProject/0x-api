"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = void 0;
const integratorsAclSchema = require("./integrators_acl_schema.json");
const integratorAclSchema = require("./integrator_acl_schema.json");
const metaTransactionFillRequestSchema = require("./meta_transaction_fill_request_schema.json");
const metaTransactionQuoteRequestSchema = require("./meta_transaction_quote_request_schema.json");
const rfqMakerConfigSchema = require("./rfq_maker_config.json");
const rfqMakerConfigListSchema = require("./rfq_maker_config_list.json");
const slippageModelFileSchema = require("./slippage_model_file_schema.json");
const slippageModelSchema = require("./slippage_model_schema.json");
const sraOrderbookQuerySchema = require("./sra_orderbook_query_schema.json");
const sraOrdersQuerySchema = require("./sra_orders_query_schema.json");
const sraOrderConfigPayloadSchema = require("./sra_order_config_payload_schema.json");
const sraPostOrdersPayloadSchema = require("./sra_post_orders_payload_schema.json");
const sraPostOrderPayloadSchema = require("./sra_post_order_payload_schema.json");
const sraOrdersChannelSubscribeSchema = require("./sra_ws_orders_channel_subscribe_schema.json");
const swapQuoteRequestSchema = require("./swap_quote_request_schema.json");
exports.schemas = {
    integratorAclSchema,
    integratorsAclSchema,
    metaTransactionFillRequestSchema,
    metaTransactionQuoteRequestSchema,
    rfqMakerConfigListSchema,
    rfqMakerConfigSchema,
    slippageModelFileSchema,
    slippageModelSchema,
    sraOrderbookQuerySchema,
    sraOrderConfigPayloadSchema,
    sraOrdersChannelSubscribeSchema,
    sraOrdersQuerySchema,
    sraPostOrderPayloadSchema,
    sraPostOrdersPayloadSchema,
    swapQuoteRequestSchema,
};
//# sourceMappingURL=index.js.map