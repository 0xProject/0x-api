import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import * as core from 'express-serve-static-core';
import { Server } from 'http';

import { AppDependencies, getDefaultAppDependenciesAsync } from '../app';
import { defaultHttpServiceWithRateLimitterConfig } from '../config';
import { META_TRANSACTION_PATH } from '../constants';
import { rootHandler } from '../handlers/root_handler';
import { logger } from '../logger';
import { errorHandler } from '../middleware/error_handling';
import { requestLogger } from '../middleware/request_logger';
import { createMetaTransactionRouter } from '../routers/meta_transaction_router';
import { HttpServiceWithRateLimiterConfig } from '../types';
import { providerUtils } from '../utils/provider_utils';

/**
 * This module can be used to run the Meta Transaction HTTP service standalone
 */

process.on('uncaughtException', err => {
    logger.error(err);
    process.exit(1);
});

process.on('unhandledRejection', err => {
    if (err) {
        logger.error(err);
    }
});

if (require.main === module) {
    (async () => {
        const provider = providerUtils.createWeb3Provider(defaultHttpServiceWithRateLimitterConfig.ethereumRpcUrl);
        const dependencies = await getDefaultAppDependenciesAsync(provider, defaultHttpServiceWithRateLimitterConfig);
        await runHttpServiceAsync(dependencies, defaultHttpServiceWithRateLimitterConfig);
    })().catch(error => logger.error(error));
}

async function runHttpServiceAsync(
    dependencies: AppDependencies,
    config: HttpServiceWithRateLimiterConfig,
    _app?: core.Express,
): Promise<Server> {
    const app = _app || express();
    app.use(requestLogger());
    app.use(cors());
    app.use(bodyParser.json());
    app.get('/', rootHandler);
    const server = app.listen(config.httpPort, () => {
        logger.info(`API (HTTP) listening on port ${config.httpPort}!`);
    });

    if (dependencies.metaTransactionService) {
        app.use(
            META_TRANSACTION_PATH,
            createMetaTransactionRouter(dependencies.metaTransactionService, dependencies.rateLimiter),
        );
    } else {
        logger.error(`Could not run meta transaction service, exiting`);
        process.exit(1);
    }
    app.use(errorHandler);
    return server;
}
