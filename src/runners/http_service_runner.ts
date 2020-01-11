import { Orderbook } from '@0x/asset-swapper';
import { WSClient } from '@0x/mesh-rpc-client';
import * as express from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import * as core from 'express-serve-static-core';
import { Server } from 'http';

import { AppDependencies } from '../app';
import * as config from '../config';
import { getDBConnectionAsync } from '../db_connection';
import { logger } from '../logger';
import { requestLogger } from '../middleware/request_logger';
import { OrderBookServiceOrderProvider } from '../order_book_service_order_provider';
import { configureSRAHttpRouter } from '../routers/sra_router';
import { configureStakingHttpRouter } from '../routers/staking_router';
import { configureSwapHttpRouter } from '../routers/swap_router';
import { OrderBookService } from '../services/orderbook_service';
import { StakingDataService } from '../services/staking_data_service';
import { SwapService } from '../services/swap_service';
import { WebsocketService } from '../services/websocket_service';
import { OrderStoreDbAdapter } from '../utils/order_store_db_adapter';
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
        const meshClient = new WSClient(config.MESH_WEBSOCKET_URI);
        await runHttpServiceAsync({ meshClient }, config);
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
    _config: { HTTP_PORT: string; ETHEREUM_RPC_URL: string },
    _app?: core.Express,
): Promise<Server> {
    const app = _app || express();
    app.use(requestLogger());
    const server = app.listen(_config.HTTP_PORT, () => {
        logger.info(`API (HTTP) listening on port ${_config.HTTP_PORT}!\nConfig: ${JSON.stringify(_config, null, 2)}`);
    });

    // staking http service
    const connection = dependencies.connection || (await getDBConnectionAsync());
    const stakingDataService = dependencies.stakingDataService || new StakingDataService(connection);
    configureStakingHttpRouter(app, stakingDataService);

    // SRA http service
    const orderBookService = dependencies.orderBookService || new OrderBookService(connection, dependencies.meshClient);
    configureSRAHttpRouter(app, orderBookService);

    // swap/quote http service
    try {
        const swapService = dependencies.swapService || createSwapServiceFromOrderBookService(orderBookService);
        configureSwapHttpRouter(app, swapService);
    } catch (err) {
        logger.error(err);
    }

    // websocket service
    if (dependencies.meshClient) {
        // tslint:disable-next-line:no-unused-expression
        new WebsocketService(server, dependencies.meshClient, dependencies.websocketOpts);
    } else {
        logger.warn(`API running without a websocket connection to mesh!`);
    }

    return server;

    function createSwapServiceFromOrderBookService(_orderBookService: OrderBookService): SwapService {
        const orderStore = new OrderStoreDbAdapter(_orderBookService);
        const orderProvider = new OrderBookServiceOrderProvider(orderStore, orderBookService);
        const orderBook = new Orderbook(orderProvider, orderStore);
        const provider = dependencies.provider || providerUtils.createWeb3Provider(_config.ETHEREUM_RPC_URL);
        return new SwapService(orderBook, provider);
    }
}
