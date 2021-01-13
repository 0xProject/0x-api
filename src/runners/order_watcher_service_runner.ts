import * as express from 'express';
import { Connection } from 'typeorm';

import { getDefaultAppDependenciesAsync } from '../app';
import { defaultHttpServiceConfig } from '../config';
import { METRICS_PATH } from '../constants';
import { OrderWatcherSyncError } from '../errors';
import { logger } from '../logger';
import { createMetricsRouter } from '../routers/metrics_router';
import { MetricsService } from '../services/metrics_service';
import { OrderWatcherService } from '../services/order_watcher_service';
import { MeshClient } from '../utils/mesh_client';
import { providerUtils } from '../utils/provider_utils';

if (require.main === module) {
    (async () => {
        const provider = providerUtils.createWeb3Provider(defaultHttpServiceConfig.ethereumRpcUrl);
        const { connection, meshClient } = await getDefaultAppDependenciesAsync(provider, defaultHttpServiceConfig);
        if (defaultHttpServiceConfig.enablePrometheusMetrics) {
            const app = express();
            const metricsService = new MetricsService();
            const metricsRouter = createMetricsRouter(metricsService);
            app.use(METRICS_PATH, metricsRouter);
            const server = app.listen(defaultHttpServiceConfig.prometheusPort, () => {
                logger.info(`Metrics (HTTP) listening on port ${defaultHttpServiceConfig.prometheusPort}`);
            });
            server.on('error', err => {
                logger.error(err);
            });
        }

        if (meshClient) {
            await runOrderWatcherServiceAsync(connection, meshClient);

            logger.info(
                `Order Watching Service started!\nConfig: ${JSON.stringify(defaultHttpServiceConfig, null, 2)}`,
            );
        } else {
            logger.error(
                `Order Watching Service could not be started! Could not start mesh client!\nConfig: ${JSON.stringify(
                    defaultHttpServiceConfig,
                    null,
                    2,
                )}`,
            );
            process.exit(1);
        }
    })().catch(error => logger.error(error.stack));
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

/**
 * This service is a simple writer from the Mesh events. On order discovery
 * or an order update it will be persisted to the database. It also is responsible
 * for syncing the database with Mesh on start or after a disconnect.
 */
export async function runOrderWatcherServiceAsync(connection: Connection, meshClient: MeshClient): Promise<void> {
    const orderWatcherService = new OrderWatcherService(connection, meshClient);
    logger.info(`OrderWatcherService starting up!`);
    try {
        await orderWatcherService.syncOrderbookAsync();
    } catch (err) {
        const logError = new OrderWatcherSyncError(`Error on starting OrderWatcher service: [${err.stack}]`);
        throw logError;
    }
}
