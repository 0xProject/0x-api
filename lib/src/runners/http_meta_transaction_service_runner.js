"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_utils_1 = require("@0x/api-utils");
const express = require("express");
const utils_1 = require("./utils");
const config_1 = require("../config");
const constants_1 = require("../constants");
const root_handler_1 = require("../handlers/root_handler");
const logger_1 = require("../logger");
const error_handling_1 = require("../middleware/error_handling");
const meta_transaction_router_1 = require("../routers/meta_transaction_router");
const sentry_1 = require("../sentry");
const provider_utils_1 = require("../utils/provider_utils");
const utils_2 = require("./utils");
/**
 * This module can be used to run the Meta Transaction HTTP service standalone
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
    })().catch((error) => logger_1.logger.error(error));
}
async function runHttpServiceAsync(dependencies, config, _app) {
    const app = _app || express();
    if (dependencies.hasSentry) {
        const options = {
            app: app,
            dsn: config_1.SENTRY_DSN,
            environment: config_1.SENTRY_ENVIRONMENT,
            paths: [constants_1.META_TRANSACTION_V1_PATH, constants_1.META_TRANSACTION_V2_PATH],
            sampleRate: config_1.SENTRY_SAMPLE_RATE,
            tracesSampleRate: config_1.SENTRY_TRACES_SAMPLE_RATE,
        };
        (0, sentry_1.SentryInit)(options);
    }
    const server = (0, api_utils_1.createDefaultServer)(config, app, logger_1.logger, (0, utils_2.destroyCallback)(dependencies));
    app.get('/', root_handler_1.rootHandler);
    if (dependencies.metaTransactionService) {
        app.use(constants_1.META_TRANSACTION_V1_PATH, (0, meta_transaction_router_1.createMetaTransactionV1Router)(dependencies.metaTransactionService));
        app.use(constants_1.META_TRANSACTION_V2_PATH, (0, meta_transaction_router_1.createMetaTransactionV2Router)(dependencies.metaTransactionService));
    }
    else {
        logger_1.logger.error(`Could not run meta transaction service, exiting`);
        process.exit(1);
    }
    app.use(error_handling_1.errorHandler);
    server.listen(config.httpPort);
    return server;
}
//# sourceMappingURL=http_meta_transaction_service_runner.js.map