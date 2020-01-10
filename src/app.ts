import { SupportedProvider } from '@0x/asset-swapper';
import { WSClient } from '@0x/mesh-rpc-client';
import * as express from 'express';
import { Connection } from 'typeorm';

import { getDBConnectionAsync } from './db_connection';
import { logger } from './logger';
import { runHttpServiceAsync } from './runners/http_service_runner';
import { runOrderWatcherServiceAsync } from './runners/order_watcher_service_runner';
import { OrderBookService } from './services/orderbook_service';
import { StakingDataService } from './services/staking_data_service';
import { SwapService } from './services/swap_service';
import { WebsocketService } from './services/websocket_service';

export interface AppDependencies {
    connection?: Connection;
    stakingDataService?: StakingDataService;
    meshClient?: WSClient;
    orderBookService?: OrderBookService;
    swapService?: SwapService;
    provider?: SupportedProvider;
}

/**
 * starts the app with dependencies injected
 * @param dependencies  all values are optional and will be filled with reasonable defaults, with one
 *                      exception. if a `meshClient` is not provided, the API will start without a
 *                      connection to mesh.
 * @return the app object
 */
export async function getAppAsync(
    dependencies: AppDependencies,
    config: { HTTP_PORT: string; ETHEREUM_RPC_URL: string },
): Promise<Express.Application> {
    const app = express();
    const server = await runHttpServiceAsync(dependencies, config, app);
    const connection = dependencies.connection || (await getDBConnectionAsync());

    if (dependencies.meshClient !== undefined) {
        // tslint:disable-next-line:no-unused-expression
        new WebsocketService(server, dependencies.meshClient);
        await runOrderWatcherServiceAsync(connection, dependencies.meshClient);
    } else {
        logger.warn('API starting without a connection to mesh');
    }
    return app;
}
