import { expect } from '@0x/contracts-test-utils';
import 'mocha';
import { Connection } from 'typeorm';

import { getDBConnectionAsync } from '../src/db_connection';
import { TransactionEntity, TransactionEntityOpts } from '../src/entities';
import { LastLookConfig } from '../src/types';

import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';

// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../src/app')];

const SUITE_NAME = 'rfqm tests';

describe(SUITE_NAME, () => {
    let connection: Connection;

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
    });

    after(async () => {
        // reset DB
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
        await teardownDependenciesAsync(SUITE_NAME);
    });

    beforeEach(async () => {
        // reset DB
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
    });

    describe('db tests', () => {
        it('should be able to save and read an entity with no data change', async () => {
            const lastLookConfig: LastLookConfig = {
                makerUri: 'https://anrfqmm.com',
                orderHash: '0x00',
                rfqOrderDetail: {
                    makerAmount: '1234',
                    takerAmount: '12345',
                    makerToken: '0xab',
                    takerToken: '0xcd',
                    txOrigin: '0x00',
                },
            };
            const txEntityOpts: TransactionEntityOpts = {
                refHash: '0x00',
                apiKey: 'averycoolkey',
                txHash: '0x00',
                takerAddress: '0x00',
                status: 'submitted',
                expectedMinedInSec: 60,
                to: '0x00',
                lastLookConfig,
            };
            const testTxEntity = TransactionEntity.make(txEntityOpts);

            const txRepository = connection.getRepository(TransactionEntity);

            await txRepository.save(testTxEntity);

            // read the newly saved entity
            const dbEntity = await txRepository.findOne();

            // the saved + read entity should match the original entity
            expect(dbEntity).to.deep.eq(testTxEntity);
        });
        it('should be able to write a transaction entity with null lastLookConfig', async () => {
            const txEntityOpts: TransactionEntityOpts = {
                refHash: '0x00',
                apiKey: 'averycoolkey',
                txHash: '0x00',
                takerAddress: '0x00',
                status: 'submitted',
                expectedMinedInSec: 60,
                to: '0x00',
                lastLookConfig: null,
            };
            const testTxEntity = TransactionEntity.make(txEntityOpts);

            const txRepository = connection.getRepository(TransactionEntity);

            await txRepository.save(testTxEntity);

            // read the newly saved entity
            const dbEntity = await txRepository.findOne();

            // the saved + read entity should match the original entity
            expect(dbEntity).to.deep.eq(testTxEntity);
        });
    });
});

// tslint:disable-line:max-file-line-count
