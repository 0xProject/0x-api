"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
require("mocha");
const BlockedAddressEntity_1 = require("../../src/entities/BlockedAddressEntity");
const rfq_blocked_address_utils_1 = require("../../src/utils/rfq_blocked_address_utils");
const db_connection_1 = require("./db_connection");
const deployment_1 = require("./deployment");
// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../../src/app')];
const SUITE_NAME = 'rfqBlockedAddressUtils';
const ttlMs = 50;
describe(SUITE_NAME, () => {
    let connection;
    let rfqBlacklistUtils;
    before(async () => {
        await (0, deployment_1.setupDependenciesAsync)(SUITE_NAME);
        connection = await (0, db_connection_1.initDBConnectionAsync)();
        rfqBlacklistUtils = new rfq_blocked_address_utils_1.RfqBlockedAddressUtils(connection, new Set(), ttlMs);
    });
    after(async () => {
        // reset DB
        connection = await (0, db_connection_1.initDBConnectionAsync)();
        await (0, deployment_1.teardownDependenciesAsync)(SUITE_NAME);
    });
    beforeEach(async () => {
        // reset DB
        connection = await (0, db_connection_1.initDBConnectionAsync)();
        rfqBlacklistUtils = new rfq_blocked_address_utils_1.RfqBlockedAddressUtils(connection, new Set(), ttlMs);
    });
    describe('blocked_addresses table', () => {
        it('should only allow lower case insertions', async () => {
            // eslint-disable-next-line @zapper-fi/ethereum-address
            const sampleBadAddress = '0xA10612Ee5432B6395d1F0d6fB2601299a1c64274';
            try {
                await connection.getRepository(BlockedAddressEntity_1.BlockedAddressEntity).save({
                    address: sampleBadAddress,
                });
                contracts_test_utils_1.expect.fail('should throw');
            }
            catch (err) {
                (0, contracts_test_utils_1.expect)(err.message).to.match(/violates check constraint/);
            }
            try {
                await connection.getRepository(BlockedAddressEntity_1.BlockedAddressEntity).save({
                    address: sampleBadAddress.toLowerCase(),
                });
            }
            catch (err) {
                contracts_test_utils_1.expect.fail('lower case should not throw');
            }
        });
    });
    it('should use stale values via isBlocked', async () => {
        // eslint-disable-next-line @zapper-fi/ethereum-address
        const sampleBadAddress = '0xA10612Ee5432B6395d1F0d6fB2601299a1c64274';
        (0, contracts_test_utils_1.expect)(rfqBlacklistUtils.isBlocked(sampleBadAddress)).to.be.false();
        // Add it to the blocked list
        await connection.getRepository(BlockedAddressEntity_1.BlockedAddressEntity).save({
            address: sampleBadAddress.toLowerCase(),
        });
        (0, contracts_test_utils_1.expect)(rfqBlacklistUtils.isBlocked(sampleBadAddress)).to.be.false();
    });
    it('should use fresh values after the update is complete', async () => {
        // eslint-disable-next-line @zapper-fi/ethereum-address
        const sampleBadAddress = '0xB10612Ee5432B6395d1F0d6fB2601299a1c64274';
        // Add it to the blocked list
        await connection.getRepository(BlockedAddressEntity_1.BlockedAddressEntity).save({
            address: sampleBadAddress.toLowerCase(),
        });
        // Initally not blocked
        const isBlocked_t0 = rfqBlacklistUtils.isBlocked(sampleBadAddress);
        (0, contracts_test_utils_1.expect)(isBlocked_t0).to.be.false();
        // Await for the update to complete
        await rfqBlacklistUtils.completeUpdateAsync();
        // Now should be blocked
        const isBlocked_t1 = rfqBlacklistUtils.isBlocked(sampleBadAddress);
        (0, contracts_test_utils_1.expect)(isBlocked_t1).to.be.true();
    });
    it('should be case insensitive', async () => {
        // eslint-disable-next-line @zapper-fi/ethereum-address
        const sampleBadAddress = '0xC10612Ee5432B6395d1F0d6fB2601299a1c64274';
        await connection.getRepository(BlockedAddressEntity_1.BlockedAddressEntity).save({
            address: sampleBadAddress.toLowerCase(),
        });
        // Trigger the update and wait for completion
        rfqBlacklistUtils.isBlocked(sampleBadAddress);
        await rfqBlacklistUtils.completeUpdateAsync();
        const isChecksumBlocked = rfqBlacklistUtils.isBlocked(sampleBadAddress);
        const isLowerCaseBlocked = rfqBlacklistUtils.isBlocked(sampleBadAddress.toLowerCase());
        const isUpperCaseBlocked = rfqBlacklistUtils.isBlocked(sampleBadAddress.toUpperCase());
        (0, contracts_test_utils_1.expect)(isChecksumBlocked).to.be.true();
        (0, contracts_test_utils_1.expect)(isLowerCaseBlocked).to.be.true();
        (0, contracts_test_utils_1.expect)(isUpperCaseBlocked).to.be.true();
    });
});
//# sourceMappingURL=rfq_blocked_address_utils_test.js.map