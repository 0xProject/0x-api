import { ConnectionOptions } from 'typeorm';

import { POSTGRES_READ_REPLICA_URIS, POSTGRES_URI } from './config';
import { KeyValueEntity, PersistentSignedOrderEntity, SignedOrderEntity, TransactionEntity } from './entities';

const entities = [SignedOrderEntity, PersistentSignedOrderEntity, TransactionEntity, KeyValueEntity];

const config: ConnectionOptions = {
    type: 'postgres',
    entities,
    // Disable synchronization in production
    synchronize: process.env.NODE_ENV ? process.env.NODE_ENV === 'test' : false,
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
                  slaves: POSTGRES_READ_REPLICA_URIS.map(r => ({ url: r })),
              },
          }
        : { url: POSTGRES_URI }),
};
module.exports = config;
