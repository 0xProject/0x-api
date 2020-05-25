import { Orderbook, SupportedProvider } from '@0x/asset-swapper';
import * as express from 'express';
import { Server } from 'http';
import { Connection } from 'typeorm';

import { SRA_PATH } from './constants';
import { getDBConnectionAsync } from './db_connection';
import { logger } from './logger';
import { OrderBookServiceOrderProvider } from './order_book_service_order_provider';
import { runHttpServiceAsync } from './runners/http_service_runner';
import { runOrderWatcherServiceAsync } from './runners/order_watcher_service_runner';
import { MetaTransactionService } from './services/meta_transaction_service';
import { MetricsService } from './services/metrics_service';
import { OrderBookService } from './services/orderbook_service';
import { StakingDataService } from './services/staking_data_service';
import { SwapService } from './services/swap_service';
import { TransactionWatcherSignerService } from './services/transaction_watcher_signer_service';
import { WebsocketSRAOpts, HttpServiceConfig, HttpServiceWithRateLimitterConfig } from './types';
import { MeshClient } from './utils/mesh_client';
import { OrderStoreDbAdapter } from './utils/order_store_db_adapter';
import {
    MetaTransactionRateLimiter,
    MetaTransactionRollingLimiter,
    AvailableRateLimiter,
    MetaTransactionDailyLimiter,
} from './utils/rate-limiters';
import { MetaTransactionComposableLimiter } from './utils/rate-limiters/meta_transaction_composable_rate_limiter';

export interface AppDependencies {
    connection: Connection;
    stakingDataService: StakingDataService;
    meshClient?: MeshClient;
    orderBookService: OrderBookService;
    swapService?: SwapService;
    metaTransactionService?: MetaTransactionService;
    provider: SupportedProvider;
    websocketOpts: Partial<WebsocketSRAOpts>;
    transactionWatcherService?: TransactionWatcherSignerService;
    metricsService?: MetricsService;
    rateLimiter?: MetaTransactionRateLimiter;
}

/**
 * Instantiates dependencies required to run the app. Uses default settings based on config
 * @param config should contain a URI for mesh to listen to, and the ethereum RPC URL
 */
export async function getDefaultAppDependenciesAsync(
    provider: SupportedProvider,
    config: HttpServiceWithRateLimitterConfig,
): Promise<AppDependencies> {
    const connection = await getDBConnectionAsync();
    const stakingDataService = new StakingDataService(connection);

    let meshClient: MeshClient | undefined;
    // hack (xianny): the Mesh client constructor has a fire-and-forget promise so we are unable
    // to catch initialisation errors. Allow the calling function to skip Mesh initialization by
    // not providing a websocket URI
    if (config.MESH_WEBSOCKET_URI !== undefined) {
        meshClient = new MeshClient(config.MESH_WEBSOCKET_URI, config.MESH_HTTP_URI);
    } else {
        logger.warn(`Skipping Mesh client creation because no URI provided`);
    }
    let metricsService: MetricsService | undefined;
    if (config.ENABLE_PROMETHEUS_METRICS) {
        metricsService = new MetricsService();
    }

    let rateLimiter: MetaTransactionRateLimiter | undefined;
    if (config.META_TXN_RATE_LIMIT_TYPE) {
        rateLimiter = createMetaTransactionRateLimiterFromEnvironment(connection, config);
    }

    const orderBookService = new OrderBookService(connection, meshClient);

    let swapService: SwapService | undefined;
    try {
        swapService = createSwapServiceFromOrderBookService(orderBookService, provider);
    } catch (err) {
        logger.error(err.stack);
    }

    const metaTransactionService = createMetaTxnServiceFromOrderBookService(orderBookService, provider, connection);

    const websocketOpts = { path: SRA_PATH };

    return {
        connection,
        stakingDataService,
        meshClient,
        orderBookService,
        swapService,
        metaTransactionService,
        provider,
        websocketOpts,
        metricsService,
        rateLimiter,
    };
}
/**
 * starts the app with dependencies injected. This entry-point is used when running a single instance 0x API
 * deployment and in tests. It is not used in production deployments where scaling is required.
 * @param dependencies  all values are optional and will be filled with reasonable defaults, with one
 *                      exception. if a `meshClient` is not provided, the API will start without a
 *                      connection to mesh.
 * @return the app object
 */
export async function getAppAsync(
    dependencies: AppDependencies,
    config: HttpServiceConfig,
): Promise<{ app: Express.Application; server: Server }> {
    const app = express();
    const { server, wsService } = await runHttpServiceAsync(dependencies, config, app);
    if (dependencies.meshClient !== undefined) {
        try {
            await runOrderWatcherServiceAsync(dependencies.connection, dependencies.meshClient);
        } catch (e) {
            logger.error(`Error attempting to start Order Watcher service, [${JSON.stringify(e)}]`);
        }
    } else {
        logger.warn('No mesh client provided, API running without Order Watcher');
    }
    // Register a shutdown event listener.
    // TODO: More teardown logic should be added here. For example, the mesh rpc
    // client should be destroyed and services should be torn down.
    server.on('close', async () => {
        await wsService.destroyAsync();
    });

    return { app, server };
}

function createMetaTransactionRateLimiterFromEnvironment(
    dbConnection: Connection,
    config: HttpServiceWithRateLimitterConfig,
): MetaTransactionRateLimiter {
    const rateLimiterTypes = config.META_TXN_RATE_LIMIT_TYPE;
    if (rateLimiterTypes.length === 0) {
        return createRateLimiter(rateLimiterTypes[0], dbConnection, config);
    } else {
        const rateLimiters = rateLimiterTypes.map(rateLimitterType =>
            createRateLimiter(rateLimitterType, dbConnection, config),
        );
        return new MetaTransactionComposableLimiter(rateLimiters);
    }
}

function createRateLimiter(
    rateLimiter: AvailableRateLimiter,
    dbConnection: Connection,
    config: HttpServiceWithRateLimitterConfig,
): MetaTransactionRateLimiter {
    switch (rateLimiter) {
        case AvailableRateLimiter.Daily:
            return new MetaTransactionDailyLimiter(dbConnection, config.META_TXN_DAILY_RATE_LIMITTER_ALLOWED_NUMBER);
        case AvailableRateLimiter.Rolling:
            return new MetaTransactionRollingLimiter(
                dbConnection,
                config.META_TXN_ROLLING_RATE_LIMITTER_ALLOWED_NUMBER,
                config.META_TXN_ROLLING_RATE_LIMITTER_INTERVAL_NUMBER,
                config.META_TXN_ROLLING_RATE_LIMITTER_INTERVAL_UNIT,
            );
    }
}

/**
 * Instantiates SwapService using the provided OrderBookService and ethereum RPC provider.
 */
export function createSwapServiceFromOrderBookService(
    orderBookService: OrderBookService,
    provider: SupportedProvider,
): SwapService {
    const orderStore = new OrderStoreDbAdapter(orderBookService);
    const orderProvider = new OrderBookServiceOrderProvider(orderStore, orderBookService);
    const orderBook = new Orderbook(orderProvider, orderStore);
    return new SwapService(orderBook, provider);
}

/**
 * Instantiates MetaTransactionService using the provided OrderBookService,
 * ethereum RPC provider and db connection.
 */
export function createMetaTxnServiceFromOrderBookService(
    orderBookService: OrderBookService,
    provider: SupportedProvider,
    dbConnection: Connection,
): MetaTransactionService {
    const orderStore = new OrderStoreDbAdapter(orderBookService);
    const orderProvider = new OrderBookServiceOrderProvider(orderStore, orderBookService);
    const orderBook = new Orderbook(orderProvider, orderStore);
    return new MetaTransactionService(orderBook, provider, dbConnection);
}
