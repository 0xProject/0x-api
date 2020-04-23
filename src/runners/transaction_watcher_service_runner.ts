import { Connection } from 'typeorm';

import * as defaultConfig from '../config';
import { logger } from '../logger';
import { TransactionWatcherService } from '../services/transaction_watcher_service';
import { providerUtils } from '../utils/provider_utils';
import { getDBConnectionAsync } from '../db_connection';
import { SupportedProvider } from '@0x/order-utils';
import { InitializationOptions } from 'bnc-sdk/dist/types/src/interfaces';

if (require.main === module) {
    (async () => {
        const provider = providerUtils.createWeb3Provider(defaultConfig.ETHEREUM_RPC_URL);
        const connection = await getDBConnectionAsync();
        const blocknativeOptions = getDefaultBlockNativeConfiguration();

        await runTransactionWatcherServiceAsync(connection, provider, blocknativeOptions);
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

function getDefaultBlockNativeConfiguration(): InitializationOptions {
    return {
        dappId: defaultConfig.BLOCK_NATIVE_API_KEY,
        networkId: defaultConfig.CHAIN_ID,
        ws: WebSocket,
    };
}

/**
 * This service tracks transactions and their state changes sent by the meta
 * transaction relays and persists them to the database.
 */
export async function runTransactionWatcherServiceAsync(
    connection: Connection,
    provider: SupportedProvider,
    blocknativeOptions: InitializationOptions,
): Promise<void> {
    const transactionWatcherService = new TransactionWatcherService(connection, provider, blocknativeOptions, []);
    logger.info(`TransactionWatcherService starting up!`);
    try {
        await transactionWatcherService.startAsync();
    } catch (err) {
        const logError = new Error(`Error on starting TransactionWatcher service: [${err.stack}]`);
        throw logError;
    }
}
