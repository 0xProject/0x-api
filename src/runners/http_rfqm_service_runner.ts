/**
 * This module can be used to run the RFQM HTTP service standalone
 */
import { cacheControl, createDefaultServer } from '@0x/api-utils';
import * as express from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import * as core from 'express-serve-static-core';
import { Server } from 'http';

import { AppDependencies, getDefaultAppDependenciesAsync } from '../app';
import { defaultHttpServiceWithRateLimiterConfig } from '../config';
import { DEFAULT_CACHE_AGE_SECONDS, RFQM_PATH } from '../constants';
import { rootHandler } from '../handlers/root_handler';
import { logger } from '../logger';
import { addressNormalizer } from '../middleware/address_normalizer';
import { errorHandler } from '../middleware/error_handling';
import { createRfqmRouter } from '../routers/rfqm_router';
import { HttpServiceConfig } from '../types';
import { providerUtils } from '../utils/provider_utils';

import { destroyCallback } from './utils';

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
        await runHttpRfqmServiceAsync(dependencies, config);
    })().catch((error) => logger.error(error.stack));
}

/**
 * Runs the Rfqm Service in isolation
 */
export async function runHttpRfqmServiceAsync(
    dependencies: AppDependencies,
    config: HttpServiceConfig,
    _app?: core.Express,
): Promise<{ app: express.Application; server: Server }> {
    const app = _app || express();
    app.use(addressNormalizer);
    app.use(cacheControl(DEFAULT_CACHE_AGE_SECONDS));
    const server = createDefaultServer(config, app, logger, destroyCallback(dependencies));

    app.get('/', rootHandler);

    if (dependencies.rfqmService) {
        app.use(RFQM_PATH, createRfqmRouter(dependencies.rfqmService));
    } else {
        logger.error(`Could not run rfqm service, exiting`);
        process.exit(1);
    }
    app.use(errorHandler);

    server.listen(config.httpPort);
    return { app, server };
}
