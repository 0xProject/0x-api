import { DataSource } from 'typeorm';

// import { POSTGRES_URI } from './config';
import { createConfig } from './createOrmConfig';

let dataSource: DataSource;

/**
 * Creates the DB connnection to use in an app
 */
export async function getDbDataSourceAsync(
    postgresUri: string = 'postgresql://api:api@localhost/api',
): Promise<DataSource> {
    if (!dataSource) {
        const config = createConfig(postgresUri);
        dataSource = new DataSource(config);
        await dataSource.initialize();
    }
    return dataSource;
}
