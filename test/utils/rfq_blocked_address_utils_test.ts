import { expect } from '@0x/contracts-test-utils';
import 'mocha';
import { Connection } from 'typeorm';

import { getDBConnectionAsync } from '../../src/db_connection';
import { BlockedAddressEntity } from '../../src/entities/BlockedAddressEntity';
import { RfqBlockedAddressUtils } from '../../src/utils/rfq_blocked_address_utils';

import { setupDependenciesAsync, teardownDependenciesAsync } from './deployment';

// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../../src/app')];

const SUITE_NAME = 'rfqBlockedAddressUtils';
const ttlMs = 50;

describe(SUITE_NAME, () => {
    let connection: Connection;
    let rfqBlacklistUtils: RfqBlockedAddressUtils;

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
        rfqBlacklistUtils = new RfqBlockedAddressUtils(connection, new Set(), ttlMs);
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
        rfqBlacklistUtils = new RfqBlockedAddressUtils(connection, new Set(), ttlMs);
    });

    it('should use stale values via isBlocked', async () => {
        const sampleBadAddress = '0xA10612Ee5432B6395d1F0d6fB2601299a1c64274';
        expect(rfqBlacklistUtils.isBlocked(sampleBadAddress)).to.be.false();

        // Add it to the blocked list
        await connection.getRepository(BlockedAddressEntity).save({
            address: sampleBadAddress.toLowerCase(),
        });

        expect(rfqBlacklistUtils.isBlocked(sampleBadAddress)).to.be.false();
    });

    it('should use fresh values via isBlockedAsync', async () => {
        const sampleBadAddress = '0xB10612Ee5432B6395d1F0d6fB2601299a1c64274';

        // Add it to the blocked list
        await connection.getRepository(BlockedAddressEntity).save({
            address: sampleBadAddress.toLowerCase(),
        });

        const isBlocked = await rfqBlacklistUtils.isBlockedAsync(sampleBadAddress);

        expect(isBlocked).to.be.true();
    });

    it('should be case insensitive', async () => {
        const sampleBadAddress = '0xC10612Ee5432B6395d1F0d6fB2601299a1c64274';
        // Add it to the blocked list
        await connection.getRepository(BlockedAddressEntity).save({
            address: sampleBadAddress.toLowerCase(),
        });

        const isChecksumBlocked = await rfqBlacklistUtils.isBlockedAsync(sampleBadAddress);
        const isLowerCaseBlocked = await rfqBlacklistUtils.isBlockedAsync(sampleBadAddress.toLowerCase());
        const isUpperCaseBlocked = await rfqBlacklistUtils.isBlockedAsync(sampleBadAddress.toUpperCase());

        expect(isChecksumBlocked).to.be.true();
        expect(isLowerCaseBlocked).to.be.true();
        expect(isUpperCaseBlocked).to.be.true();
    });
});
// tslint:disable-line:max-file-line-count
