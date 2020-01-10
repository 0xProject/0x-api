import { WSClient } from '@0x/mesh-rpc-client';

import { getAppAsync } from './app';
import * as config from './config';
import { getDBConnectionAsync } from './db_connection';
import { logger } from './logger';

if (require.main === module) {
    (async () => {
        const connection = await getDBConnectionAsync();
        const meshClient = new WSClient(config.MESH_WEBSOCKET_URI);
        await getAppAsync({ connection, meshClient }, config);
    })().catch(err => logger.error(err));
}
process.on('uncaughtException', err => {
    logger.error(err);
    process.exit(1);
});

process.on('unhandledRejection', err => {
    if (err) {
        logger.error(err);
    }
});
