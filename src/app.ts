import { Orderbook } from '@0x/asset-swapper';
import { WSClient } from '@0x/mesh-rpc-client';
import * as express from 'express';

import * as defaultConfig from './config';
import { SRA_PATH } from './constants';
import { getDBConnectionAsync } from './db_connection';
import { logger } from './logger';
import { requestLogger } from './middleware/request_logger';
import { OrderBookServiceOrderProvider } from './order_book_service_order_provider';
import { OrderWatcherService } from './services/order_watcher_service';
import { OrderBookService } from './services/orderbook_service';
import { SRAHttpService } from './services/sra_http_service';
import { StakingDataService } from './services/staking_data_service';
import { StakingHttpService } from './services/staking_http_service';
import { SwapHttpService } from './services/swap_http_service';
import { SwapService } from './services/swap_service';
import { WebsocketService } from './services/websocket_service';
import { OrderStoreDbAdapter } from './utils/order_store_db_adapter';
import { providerUtils } from './utils/provider_utils';

// tslint:disable:no-unused-expression
/**
 * returns the app
 */
export async function getAppAsync(config: any = defaultConfig): Promise<express.Application> {
    const connection = await getDBConnectionAsync();
    const app = express();
    app.use(requestLogger());
    const server = app.listen(config.HTTP_PORT, () => {
        logger.info(`API (HTTP) listening on port ${config.HTTP_PORT}!\nConfig: ${JSON.stringify(config, null, 2)}`);
    });
    const stakingDataService = new StakingDataService(connection);
    // tslint:disable-next-line:no-unused-expression
    new StakingHttpService(app, stakingDataService);
    let meshClient: WSClient | undefined;
    try {
        if (config.ENVIRONMENT !== 'unittest') { // hack: this doesn't work in tests yet
            meshClient = new WSClient(config.MESH_WEBSOCKET_URI);
            // tslint:disable-next-line:no-unused-expression
            new WebsocketService(server, meshClient, { path: SRA_PATH });
        }
    } catch (err) {
        logger.error(JSON.stringify(err));
    }
    const orderBookService = new OrderBookService(connection, meshClient);
    // tslint:disable-next-line:no-unused-expression
    new SRAHttpService(app, orderBookService);
    try {
        // Quote Service
        const orderStore = new OrderStoreDbAdapter(orderBookService);
        const orderProvider = new OrderBookServiceOrderProvider(orderStore, orderBookService);
        const orderBook = new Orderbook(orderProvider, orderStore);
        const provider = providerUtils.createWeb3Provider(config.ETHEREUM_RPC_URL);
        const swapService = new SwapService(orderBook, provider);
        // tslint:disable-next-line:no-unused-expression
        new SwapHttpService(app, swapService);
    } catch (err) {
        logger.error(err);
    }

    // OrderWatcher Service
    if (meshClient) {
        const orderWatcherService = new OrderWatcherService(connection, meshClient);
        await orderWatcherService.syncOrderbookAsync();
    } else {
        logger.warn('API starting without a connection to mesh');
    }
    return app;
}
