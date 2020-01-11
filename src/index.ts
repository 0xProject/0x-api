import { WSClient } from '@0x/mesh-rpc-client';

import { getAppAsync } from './app';
import * as config from './config';
import { SRA_PATH } from './constants';
import { getDBConnectionAsync } from './db_connection';
import { logger } from './logger';

if (require.main === module) {
    (async () => {
        const connection = await getDBConnectionAsync();
        const meshClient = new WSClient(config.MESH_WEBSOCKET_URI);
        const websocketOpts = { path: SRA_PATH };
        await getAppAsync({ connection, meshClient, websocketOpts }, config);
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
