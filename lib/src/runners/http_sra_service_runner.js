"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This module can be used to run the SRA HTTP service standalone
 */
const api_utils_1 = require("@0x/api-utils");
const express = require("express");
const utils_1 = require("./utils");
const config_1 = require("../config");
const constants_1 = require("../constants");
const root_handler_1 = require("../handlers/root_handler");
const logger_1 = require("../logger");
const address_normalizer_1 = require("../middleware/address_normalizer");
const error_handling_1 = require("../middleware/error_handling");
const orderbook_router_1 = require("../routers/orderbook_router");
const sra_router_1 = require("../routers/sra_router");
const sentry_1 = require("../sentry");
const websocket_service_1 = require("../services/websocket_service");
const provider_utils_1 = require("../utils/provider_utils");
const promBundle = require("express-prom-bundle");
const utils_2 = require("./utils");
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
async function runHttpServiceAsync(dependencies, config, 
// $eslint-fix-me https://github.com/rhinodavid/eslint-fix-me
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
useMetricsMiddleware = true, _app) {
    const app = _app || express();
    if (dependencies.hasSentry) {
        const options = {
            app: app,
            dsn: config_1.SENTRY_DSN,
            environment: config_1.SENTRY_ENVIRONMENT,
            paths: [constants_1.SRA_PATH, constants_1.ORDERBOOK_PATH],
            sampleRate: config_1.SENTRY_SAMPLE_RATE,
            tracesSampleRate: config_1.SENTRY_TRACES_SAMPLE_RATE,
        };
        (0, sentry_1.SentryInit)(options);
    }
    if (useMetricsMiddleware) {
        /**
         * express-prom-bundle will create a histogram metric called "http_request_duration_seconds"
         * The official prometheus docs describe how to use this exact histogram metric: https://prometheus.io/docs/practices/histograms/
         * We use the following labels: statusCode, path
         */
        const metricsMiddleware = promBundle({
            autoregister: false,
            includeStatusCode: true,
            includePath: true,
            customLabels: { chainId: undefined },
            normalizePath: [['/order/.*', '/order/#orderHash']],
            transformLabels: (labels, req, _res) => {
                Object.assign(labels, { chainId: req.header('0x-chain-id') || 1 });
            },
            // buckets used for the http_request_duration_seconds histogram. All numbers (in seconds) represents boundaries of buckets.
            // tslint:disable-next-line: custom-no-magic-numbers
            buckets: [0.01, 0.04, 0.1, 0.3, 0.6, 1, 1.5, 2, 2.5, 3, 4, 6, 9],
        });
        app.use(metricsMiddleware);
    }
    app.use(address_normalizer_1.addressNormalizer);
    app.use((0, api_utils_1.cacheControl)(constants_1.DEFAULT_CACHE_AGE_SECONDS));
    const server = (0, api_utils_1.createDefaultServer)(config, app, logger_1.logger, (0, utils_2.destroyCallback)(dependencies));
    app.get('/', root_handler_1.rootHandler);
    if (dependencies.orderBookService === undefined) {
        logger_1.logger.error('OrderBookService dependency is missing, exiting');
        process.exit(1);
    }
    // SRA http service
    app.use(constants_1.SRA_PATH, (0, sra_router_1.createSRARouter)(dependencies.orderBookService));
    // OrderBook http service
    app.use(constants_1.ORDERBOOK_PATH, (0, orderbook_router_1.createOrderBookRouter)(dependencies.orderBookService));
    app.use(error_handling_1.errorHandler);
    // websocket service
    if (dependencies.kafkaClient) {
        const wsService = new websocket_service_1.WebsocketService(server, dependencies.kafkaClient, dependencies.websocketOpts);
        wsService.startAsync().catch((error) => logger_1.logger.error(error.stack));
    }
    else {
        logger_1.logger.error('Could not establish kafka connection, exiting');
        process.exit(1);
    }
    server.listen(config.httpPort);
    return server;
}
//# sourceMappingURL=http_sra_service_runner.js.map