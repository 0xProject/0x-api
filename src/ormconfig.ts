import { ConnectionOptions } from 'typeorm';

import { POSTGRES_READ_REPLICA_URIS, POSTGRES_URI } from './config';
import { KeyValueEntity, SignedOrderEntity, TransactionEntity } from './entities';

const entities = [SignedOrderEntity, TransactionEntity, KeyValueEntity];

const baseConfig: any = {
    type: 'postgres',
    entities,
    // Disable synchronization in production
    synchronize: process.env.NODE_ENV && process.env.NODE_ENV === 'test',
    logging: true,
    logger: 'debug',
    extra: {
        max: 15,
        statement_timeout: 10000,
    },
};

if (POSTGRES_READ_REPLICA_URIS !== undefined) {
    const readReplicas = POSTGRES_READ_REPLICA_URIS.map(url => {
        return { url };
    });

    baseConfig.replication = {
        master: POSTGRES_URI,
        slaves: readReplicas,
    };
} else {
    baseConfig.url = POSTGRES_URI;
}

export const config: ConnectionOptions = baseConfig;
