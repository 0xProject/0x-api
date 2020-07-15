import { ConnectionOptions } from 'typeorm';

import { POSTGRES_URI } from './config';
import { KeyValueEntity, RecurringTradeEntity, SignedOrderEntity, TransactionEntity } from './entities';

const entities = [RecurringTradeEntity, SignedOrderEntity, TransactionEntity, KeyValueEntity];

export const config: ConnectionOptions = {
    type: 'postgres',
    url: POSTGRES_URI,
    entities,
    synchronize: true,
    logging: true,
    logger: 'debug',
    extra: {
        connectionLimit: 50,
    },
};
