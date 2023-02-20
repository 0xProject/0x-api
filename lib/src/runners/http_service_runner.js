"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHttpServiceAsync = void 0;
const api_utils_1 = require("@0x/api-utils");
const express = require("express");
const utils_1 = require("./utils");
const config_1 = require("../config");
const constants_1 = require("../constants");
const root_handler_1 = require("../handlers/root_handler");
const logger_1 = require("../logger");
const address_normalizer_1 = require("../middleware/address_normalizer");
const error_handling_1 = require("../middleware/error_handling");
const meta_transaction_router_1 = require("../routers/meta_transaction_router");
const orderbook_router_1 = require("../routers/orderbook_router");
const sra_router_1 = require("../routers/sra_router");
const swap_router_1 = require("../routers/swap_router");
const sentry_1 = require("../sentry");
const websocket_service_1 = require("../services/websocket_service");
const provider_utils_1 = require("../utils/provider_utils");
const utils_2 = require("./utils");
/**
 * http_service_runner hosts endpoints for sra, swap and meta-txns (minus the /submit endpoint)
 * and can be horizontally scaled as needed
 */
process.on('uncaughtException', (err) => {
    logger_1.logger.error(err);
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    if (err) {
        logger_1.logger.error(err);
    }
});
if (require.main === module) {
    (async () => {
        const provider = provider_utils_1.providerUtils.createWeb3Provider(config_1.defaultHttpServiceConfig.ethereumRpcUrl, config_1.defaultHttpServiceConfig.rpcRequestTimeout, config_1.defaultHttpServiceConfig.shouldCompressRequest);
        const dependencies = await (0, utils_1.getDefaultAppDependenciesAsync)(provider, config_1.defaultHttpServiceConfig);
        await runHttpServiceAsync(dependencies, config_1.defaultHttpServiceConfig);
    })().catch((error) => logger_1.logger.error(error.stack));
}
/**
 * This service handles the HTTP requests. This involves fetching from the database
 * as well as adding orders to order-watcher.
 * @param dependencies Defaults are provided for all params.
 */
async function runHttpServiceAsync(dependencies, config, _app) {
    const app = _app || express();
    if (dependencies.hasSentry) {
        const options = {
            app: app,
            dsn: config_1.SENTRY_DSN,
            environment: config_1.SENTRY_ENVIRONMENT,
            paths: [constants_1.SRA_PATH, constants_1.ORDERBOOK_PATH, constants_1.META_TRANSACTION_V1_PATH, constants_1.META_TRANSACTION_V2_PATH, constants_1.SWAP_PATH],
            sampleRate: config_1.SENTRY_SAMPLE_RATE,
            tracesSampleRate: config_1.SENTRY_TRACES_SAMPLE_RATE,
        };
        (0, sentry_1.SentryInit)(options);
    }
    const server = (0, api_utils_1.createDefaultServer)(config, app, logger_1.logger, (0, utils_2.destroyCallback)(dependencies));
    app.get('/', root_handler_1.rootHandler);
    server.on('error', (err) => {
        logger_1.logger.error(err);
    });
    // transform all values of `req.query.[xx]Address` to lowercase
    app.use(address_normalizer_1.addressNormalizer);
    if (dependencies.orderBookService !== undefined) {
        // SRA http service
        app.use(constants_1.SRA_PATH, (0, sra_router_1.createSRARouter)(dependencies.orderBookService));
        // OrderBook http service
        app.use(constants_1.ORDERBOOK_PATH, (0, orderbook_router_1.createOrderBookRouter)(dependencies.orderBookService));
    }
    // metatxn http service
    if (dependencies.metaTransactionService) {
        app.use(constants_1.META_TRANSACTION_V1_PATH, (0, meta_transaction_router_1.createMetaTransactionV1Router)(dependencies.metaTransactionService));
        app.use(constants_1.META_TRANSACTION_V2_PATH, (0, meta_transaction_router_1.createMetaTransactionV2Router)(dependencies.metaTransactionService));
    }
    else {
        logger_1.logger.error(`API running without meta transactions service`);
    }
    // swap/quote http service
    if (dependencies.swapService) {
        app.use(constants_1.SWAP_PATH, (0, swap_router_1.createSwapRouter)(dependencies.swapService));
    }
    else {
        logger_1.logger.error(`API running without swap service`);
    }
    app.use(error_handling_1.errorHandler);
    // optional websocket service
    if (dependencies.kafkaClient) {
        const wsService = new websocket_service_1.WebsocketService(server, dependencies.kafkaClient, dependencies.websocketOpts);
        wsService.startAsync().catch((error) => logger_1.logger.error(error.stack));
    }
    else {
        logger_1.logger.warn('Could not establish kafka connection, websocket service will not start');
    }
    server.listen(config.httpPort);
    return {
        server,
    };
}
exports.runHttpServiceAsync = runHttpServiceAsync;
//# sourceMappingURL=http_service_runner.js.map