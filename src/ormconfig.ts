import { ConnectionOptions } from 'typeorm';

import { POSTGRES_READ_REPLICA_URIS, POSTGRES_URI } from './config';
import {
    BlockedAddressEntity,
    KeyValueEntity,
    MakerBalanceChainCacheEntity,
    OrderWatcherSignedOrderEntity,
    PersistentSignedOrderEntity,
    PersistentSignedOrderV4Entity,
    RfqMakerPairs,
    RfqMakerPairsUpdateTimeHash,
    RfqmJobEntity,
    RfqmQuoteEntity,
    RfqmTransactionSubmissionEntity,
    RfqmWorkerHeartbeatEntity,
    SignedOrderV4Entity,
} from './entities';

const entities = [
    BlockedAddressEntity,
    PersistentSignedOrderEntity,
    KeyValueEntity,
    MakerBalanceChainCacheEntity,
    SignedOrderV4Entity,
    PersistentSignedOrderV4Entity,
    RfqMakerPairs,
    RfqMakerPairsUpdateTimeHash,
    RfqmWorkerHeartbeatEntity,
    RfqmQuoteEntity,
    RfqmJobEntity,
    RfqmTransactionSubmissionEntity,
    OrderWatcherSignedOrderEntity,
];

const config: ConnectionOptions = {
    type: 'postgres',
    entities,
    synchronize: false,
    logging: true,
    logger: 'debug',
    extra: {
        max: 15,
        statement_timeout: 10000,
    },
    migrations: ['./lib/migrations/*.js'],
    ...(POSTGRES_READ_REPLICA_URIS
        ? {
              replication: {
                  master: { url: POSTGRES_URI },
                  slaves: POSTGRES_READ_REPLICA_URIS.map((r) => ({ url: r })),
              },
          }
        : { url: POSTGRES_URI }),
    cli: {
        migrationsDir: 'migrations',
    },
};

export function getOrmConfig(): ConnectionOptions | undefined {
    if (POSTGRES_URI === undefined) {
        return undefined;
    }
    return config;
}
