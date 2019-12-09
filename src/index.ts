import { WSClient } from '@0x/mesh-rpc-client';
import * as express from 'express';

import * as config from './config';
import { SRA_PATH } from './constants';
import { getDBConnectionAsync } from './db_connection';
import { logger } from './logger';
import { requestLogger } from './middleware/request_logger';
import { OrderWatcherService } from './services/order_watcher_service';
import { OrderBookService } from './services/orderbook_service';
import { SRAHttpService } from './services/sra_http_service';
import { StakingDataService } from './services/staking_data_service';
import { StakingHttpService } from './services/staking_http_service';
import { WebsocketService } from './services/websocket_service';

(async () => {
    const connection = await getDBConnectionAsync();
    const app = express();
    app.use(requestLogger());
    const server = app.listen(config.HTTP_PORT, () => {
        logger.info(
            `API (HTTP) listening on port ${config.HTTP_PORT}!\nConfig: ${JSON.stringify(
                config,
                null,
                2,
            )}`,
        );
    });
    const stakingDataService = new StakingDataService(connection);
    // tslint:disable-next-line:no-unused-expression
    new StakingHttpService(app, stakingDataService);
    let meshClient: WSClient | undefined;
    try {
        meshClient = new WSClient(config.MESH_WEBSOCKET_URI);
        // tslint:disable-next-line:no-unused-expression
        new WebsocketService(server, meshClient, { path: SRA_PATH });
    } catch (err) {
        logger.error(err);
    }
    const orderBookService = new OrderBookService(connection, meshClient);
    // tslint:disable-next-line:no-unused-expression
    new SRAHttpService(app, orderBookService);
    if (meshClient) {
        const orderWatcherService = new OrderWatcherService(connection, meshClient);
        await orderWatcherService.syncOrderbookAsync();
    } else {
        logger.warn('API starting without a connection to mesh');
    }
})().catch(error => logger.error(error));

process.on('uncaughtException', err => {
    logger.error(err);
    process.exit(1);
});

process.on('unhandledRejection', err => {
    if (err) {
        logger.error(err);
    }
});
