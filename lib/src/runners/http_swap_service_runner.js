"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This module can be used to run the Swap HTTP service standalone
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
const swap_router_1 = require("../routers/swap_router");
const sentry_1 = require("../sentry");
const provider_utils_1 = require("../utils/provider_utils");
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
        const config = {
            ...config_1.defaultHttpServiceConfig,
        };
        const dependencies = await (0, utils_1.getDefaultAppDependenciesAsync)(provider, config);
        await runHttpServiceAsync(dependencies, config);
    })().catch((error) => logger_1.logger.error(error.stack));
}
async function runHttpServiceAsync(dependencies, config, _app) {
    const app = _app || express();
    if (dependencies.hasSentry) {
        const options = {
            app: app,
            dsn: config_1.SENTRY_DSN,
            environment: config_1.SENTRY_ENVIRONMENT,
            paths: [constants_1.SWAP_PATH],
            sampleRate: config_1.SENTRY_SAMPLE_RATE,
            tracesSampleRate: config_1.SENTRY_TRACES_SAMPLE_RATE,
        };
        (0, sentry_1.SentryInit)(options);
    }
    app.use(address_normalizer_1.addressNormalizer);
    app.use((0, api_utils_1.cacheControl)(constants_1.DEFAULT_CACHE_AGE_SECONDS));
    const server = (0, api_utils_1.createDefaultServer)(config, app, logger_1.logger, (0, utils_2.destroyCallback)(dependencies));
    app.get('/', root_handler_1.rootHandler);
    if (dependencies.swapService) {
        app.use(constants_1.SWAP_PATH, (0, swap_router_1.createSwapRouter)(dependencies.swapService));
    }
    else {
        logger_1.logger.error(`Could not run swap service, exiting`);
        process.exit(1);
    }
    app.use(error_handling_1.errorHandler);
    server.listen(config.httpPort);
    return server;
}
//# sourceMappingURL=http_swap_service_runner.js.map