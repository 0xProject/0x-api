import { WSClient } from '@0x/mesh-rpc-client';
import { Connection } from 'typeorm';

import * as config from '../config';
import { getDBConnectionAsync } from '../db_connection';
import { logger } from '../logger';
import { OrderWatcherService } from '../services/order_watcher_service';

if (require.main === module) {
    (async () => {
        const connection = await getDBConnectionAsync();
        const meshClient = new WSClient(config.MESH_WEBSOCKET_URI);
        await runOrderWatcherServiceAsync(connection, meshClient);
        logger.info(`Order Watching Service started!\nConfig: ${JSON.stringify(config, null, 2)}`);
    })().catch(error => logger.error(error));
}
/**
 * This service is a simple writer from the Mesh events. On order discovery
 * or an order update it will be persisted to the database. It also is responsible
 * for syncing the database with Mesh on start or after a disconnect.
 */
export async function runOrderWatcherServiceAsync(connection: Connection, meshClient: WSClient): Promise<void> {
    const orderWatcherService = new OrderWatcherService(connection, meshClient);
    await orderWatcherService.syncOrderbookAsync();
}
