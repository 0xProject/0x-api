/**
 * This module can be used to run the RFQM HTTP service standalone
 */
import { createDefaultServer } from '@0x/api-utils';
import * as express from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import * as core from 'express-serve-static-core';
import { Server } from 'http';

import { getDefaultAppDependenciesAsync } from '../app';
import { defaultHttpServiceWithRateLimiterConfig } from '../config';
import { RFQM_PATH } from '../constants';
import { logger } from '../logger';
import { addressNormalizer } from '../middleware/address_normalizer';
import { errorHandler } from '../middleware/error_handling';
import { createRfqmRouter } from '../routers/rfqm_router';
import { RfqmService } from '../services/rfqm_service';
import { HttpServiceConfig } from '../types';
import { ConfigManager } from '../utils/config_manager';
import { providerUtils } from '../utils/provider_utils';

process.on('uncaughtException', (err) => {
    logger.error(err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    if (err) {
        logger.error(err);
    }
});

if (require.main === module) {
    (async () => {
        const provider = providerUtils.createWeb3Provider(defaultHttpServiceWithRateLimiterConfig.ethereumRpcUrl);
        const config: HttpServiceConfig = {
            ...defaultHttpServiceWithRateLimiterConfig,
            // Mesh is not required for Rfqm Service
            meshWebsocketUri: undefined,
            meshHttpUri: undefined,
        };
        const dependencies = await getDefaultAppDependenciesAsync(provider, config);
        if (dependencies.rfqmService && dependencies.configManager) {
            await runHttpRfqmServiceAsync(dependencies.rfqmService, dependencies.configManager, config);
        }
    })().catch((error) => logger.error(error.stack));
}

/**
 * Runs the Rfqm Service in isolation
 */
export async function runHttpRfqmServiceAsync(
    rfqmService: RfqmService,
    configManager: ConfigManager,
    config: HttpServiceConfig,
    _app?: core.Express,
): Promise<{ app: express.Application; server: Server }> {
    const app = _app || express();
    app.use(addressNormalizer);
    const server = createDefaultServer(config, app, logger, async () => {
        /* TODO - clean up DB connection when present */
    });

    if (rfqmService && configManager) {
        app.use(RFQM_PATH, createRfqmRouter(rfqmService, configManager));
    } else {
        logger.error(`Could not run rfqm service, exiting`);
        process.exit(1);
    }

    app.use(errorHandler);

    server.listen(config.httpPort);
    return { app, server };
}
