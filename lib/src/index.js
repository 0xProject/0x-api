"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const utils_1 = require("./runners/utils");
const config_1 = require("./config");
const logger_1 = require("./logger");
const provider_utils_1 = require("./utils/provider_utils");
if (require.main === module) {
    (async () => {
        const provider = provider_utils_1.providerUtils.createWeb3Provider(config_1.defaultHttpServiceConfig.ethereumRpcUrl, config_1.defaultHttpServiceConfig.rpcRequestTimeout, config_1.defaultHttpServiceConfig.shouldCompressRequest);
        const dependencies = await (0, utils_1.getDefaultAppDependenciesAsync)(provider, config_1.defaultHttpServiceConfig);
        await (0, app_1.getAppAsync)(dependencies, config_1.defaultHttpServiceConfig);
    })().catch((err) => logger_1.logger.error(err.stack));
}
process.on('uncaughtException', (err) => {
    logger_1.logger.error(err);
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    if (err) {
        logger_1.logger.error(err);
    }
});
//# sourceMappingURL=index.js.map