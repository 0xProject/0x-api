import { Connection, createConnection } from 'typeorm';

import { config, inMemorySQLiteConfig } from './ormconfig';

let connection: Connection;

/**
 * Creates the DB connnection to use in an app
 */
export async function getDBConnectionAsync(): Promise<Connection> {
    if (!connection) {
        connection = await createConnection(config);
    }
    return connection;
}

/**
 * Creates an in-memory SQLite DB connection used for testing.
 */
export async function getInMemorySQLiteConnectionAsync(connectionName: string): Promise<Connection> {
    return createConnection({ ...inMemorySQLiteConfig, name: connectionName });
}
