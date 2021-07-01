import { expect } from '@0x/contracts-test-utils';
import delay from 'delay';
import 'mocha';
import { Connection } from 'typeorm';

import { getDBConnectionAsync } from '../../src/db_connection';
import { BlockedAddressEntity } from '../../src/entities/BlockedAddressEntity';
import { RfqBlacklistUtils } from '../../src/utils/rfq_blacklist_utils';
import { setupDependenciesAsync, teardownDependenciesAsync } from '../utils/deployment';

// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../../src/app')];

const SUITE_NAME = 'rfqBlacklistUtils';
const refreshIntervalMs = 1000;

describe.only(SUITE_NAME, () => {
    let connection: Connection;
    let rfqBlacklistUtils: RfqBlacklistUtils;

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
        rfqBlacklistUtils = RfqBlacklistUtils.getInstance(connection, new Set(), refreshIntervalMs);
    });

    after(async () => {
        // reset DB
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
        rfqBlacklistUtils.stopUpdating();
        await teardownDependenciesAsync(SUITE_NAME);
    });

    beforeEach(async () => {
        // reset DB
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
        rfqBlacklistUtils = RfqBlacklistUtils.getInstance(connection, new Set(), refreshIntervalMs);
    });

    it('should not initialize twice', () => {
        const rfqBlacklistUtils2 = RfqBlacklistUtils.getInstance(connection, new Set(), refreshIntervalMs);

        expect(rfqBlacklistUtils).to.eq(rfqBlacklistUtils2);
    });

    it('should pull from the DB after the refresh interval', async () => {
        const sampleBadAddress = '0xA10612Ee5432B6395d1F0d6fB2601299a1c64274';
        expect(rfqBlacklistUtils.isBlocked(sampleBadAddress)).to.be.false();

        // Add it to the blocked list
        await connection.getRepository(BlockedAddressEntity).save({
            address: sampleBadAddress.toLowerCase(),
        });

        await delay(refreshIntervalMs * 2);
        expect(rfqBlacklistUtils.isBlocked(sampleBadAddress)).to.be.true();
    });
});
// tslint:disable-line:max-file-line-count
