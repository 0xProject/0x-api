import { DataSourceOptions } from 'typeorm';

import { POSTGRES_URI } from './config';
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
const POSTGRES_READ_REPLICA_URIS: any = undefined;
export const createConfig = (postgresUri: string = POSTGRES_URI!): DataSourceOptions => ({
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
    // url: postgresUri,
    ...(POSTGRES_READ_REPLICA_URIS
        ? {
              replication: {
                  master: { url: postgresUri },
                  slaves: POSTGRES_READ_REPLICA_URIS.map((r: any) => ({ url: r })),
              },
          }
        : { url: postgresUri }),
});
