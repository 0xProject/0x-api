import bodyParser = require('body-parser');
import * as cors from 'cors';
import * as express from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import * as core from 'express-serve-static-core';
import { Server } from 'http';

import { AppDependencies, getDefaultAppDependenciesAsync } from '../app';
import * as defaultConfig from '../config';
import { SRA_PATH, STAKING_PATH, SWAP_PATH } from '../constants';
import { logger } from '../logger';
import { errorHandler } from '../middleware/error_handling';
import { requestLogger } from '../middleware/request_logger';
import { createSRARouter } from '../routers/sra_router';
import { createStakingRouter } from '../routers/staking_router';
import { createSwapRouter } from '../routers/swap_router';
import { WebsocketService } from '../services/websocket_service';
import { providerUtils } from '../utils/provider_utils';

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
        const provider = providerUtils.createWeb3Provider(defaultConfig.ETHEREUM_RPC_URL);
        const dependencies = await getDefaultAppDependenciesAsync(provider, defaultConfig);
        await runHttpServiceAsync(dependencies, defaultConfig);
    })().catch(error => logger.error(error));
}

/**
 * This service handles the HTTP requests. This involves fetching from the database
 * as well as adding orders to mesh.
 * @param dependencies If no mesh client is supplied, the HTTP service will start without it.
 *                     It will provide defaults for other params.
 */
export async function runHttpServiceAsync(
    dependencies: AppDependencies,
    config: { HTTP_PORT: string; ETHEREUM_RPC_URL: string },
    _app?: core.Express,
): Promise<Server> {
    const app = _app || express();
    app.use(requestLogger());
    app.use(cors());
    app.use(bodyParser.json());

    const server = app.listen(config.HTTP_PORT, () => {
        logger.info(`API (HTTP) listening on port ${config.HTTP_PORT}!\nConfig: ${JSON.stringify(config, null, 2)}`);
    });

    // staking http service
    app.use(STAKING_PATH, createStakingRouter(dependencies.stakingDataService));

    // SRA http service
    app.use(SRA_PATH, createSRARouter(dependencies.orderBookService));

    // swap/quote http service
    if (dependencies.swapService) {
        app.use(SWAP_PATH, createSwapRouter(dependencies.swapService));
    } else {
        logger.warn(`API running without swap service`);
    }

    app.use(errorHandler);

    // websocket service
    if (dependencies.meshClient) {
        // tslint:disable-next-line:no-unused-expression
        new WebsocketService(server, dependencies.meshClient, dependencies.websocketOpts);
    } else {
        logger.warn(`API running without a websocket connection to mesh!`);
    }

    return server;
}
