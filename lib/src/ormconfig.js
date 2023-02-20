"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const entities_1 = require("./entities");
const entities = [
    entities_1.BlockedAddressEntity,
    entities_1.PersistentSignedOrderEntity,
    entities_1.KeyValueEntity,
    entities_1.MakerBalanceChainCacheEntity,
    entities_1.SignedOrderV4Entity,
    entities_1.PersistentSignedOrderV4Entity,
    entities_1.RfqMakerPairs,
    entities_1.RfqMakerPairsUpdateTimeHash,
    entities_1.RfqmWorkerHeartbeatEntity,
    entities_1.RfqmQuoteEntity,
    entities_1.RfqmJobEntity,
    entities_1.RfqmTransactionSubmissionEntity,
    entities_1.OrderWatcherSignedOrderEntity,
];
const config = config_1.POSTGRES_URI === undefined
    ? undefined
    : {
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
        ...(config_1.POSTGRES_READ_REPLICA_URIS
            ? {
                replication: {
                    master: { url: config_1.POSTGRES_URI },
                    slaves: config_1.POSTGRES_READ_REPLICA_URIS.map((r) => ({ url: r })),
                },
            }
            : { url: config_1.POSTGRES_URI }),
        cli: {
            migrationsDir: 'migrations',
        },
    };
exports.default = config;
//# sourceMappingURL=ormconfig.js.map