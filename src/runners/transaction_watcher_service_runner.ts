import { SupportedProvider } from '@0x/order-utils';
import { Connection } from 'typeorm';

import * as defaultConfig from '../config';
import { getDBConnectionAsync } from '../db_connection';
import { logger } from '../logger';
import { TransactionWatcherService } from '../services/transaction_watcher_service';
import { providerUtils } from '../utils/provider_utils';

if (require.main === module) {
    (async () => {
        const provider = providerUtils.createWeb3Provider(defaultConfig.ETHEREUM_RPC_URL);
        const connection = await getDBConnectionAsync();

        await runTransactionWatcherServiceAsync(connection, provider);
    })().catch(error => logger.error(error));
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
 * This service tracks transactions and their state changes sent by the meta
 * transaction relays and persists them to the database.
 */
export async function runTransactionWatcherServiceAsync(
    connection: Connection,
    provider: SupportedProvider,
): Promise<void> {
    const transactionWatcherService = new TransactionWatcherService(connection, provider);
    logger.info(`TransactionWatcherService starting up!`);
    try {
        await transactionWatcherService.startAsync();
    } catch (err) {
        const logError = new Error(`Error on starting TransactionWatcher service: [${err.stack}]`);
        throw logError;
    }
}
