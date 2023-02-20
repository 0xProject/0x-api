"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
require("mocha");
const config_1 = require("../src/config");
/**
 * Configuration tests which run against the config in `test_env` file.
 */
describe('Config', () => {
    describe('getIntegratorIdForApiKey', () => {
        it('gets the integrator ID for an api key', () => {
            const id = (0, config_1.getIntegratorIdForApiKey)('test-api-key-1');
            (0, contracts_test_utils_1.expect)(id).to.equal('test-integrator-id-1');
        });
        it('correctly parses whitelist', () => {
            try {
                (0, config_1.getIntegratorByIdOrThrow)('test-integrator-id-2');
                contracts_test_utils_1.expect.fail(`"test-integrator-id-2" should not exist`);
            }
            catch (e) {
                (0, contracts_test_utils_1.expect)(e.toString()).to.equal('AssertionError: "test-integrator-id-2" should not exist');
            }
        });
        it('allows us to fetch Integrator by Integrator key', () => {
            const { whitelistIntegratorUrls } = (0, config_1.getIntegratorByIdOrThrow)('test-integrator-id-1');
            (0, contracts_test_utils_1.expect)(whitelistIntegratorUrls).to.deep.eq(['http://foo.bar']);
        });
        it('returns `undefined` for non-existent api keys', () => {
            const id = (0, config_1.getIntegratorIdForApiKey)('test-api-key-does-not-exist');
            (0, contracts_test_utils_1.expect)(id).to.be.undefined;
        });
    });
    describe('getApiKeyWhitelistFromIntegratorsAcl', () => {
        it('gets keys for allowed liquidity sources', () => {
            const rfqmKeys = (0, config_1.getApiKeyWhitelistFromIntegratorsAcl)('rfqm');
            (0, contracts_test_utils_1.expect)(rfqmKeys).to.deep.eq(['test-api-key-1', 'test-api-key-2', 'test-api-key-3']);
        });
        it("doesn't add disallowed liquidity sources to allowed API keys", () => {
            const rfqtKeys = (0, config_1.getApiKeyWhitelistFromIntegratorsAcl)('rfqt');
            (0, contracts_test_utils_1.expect)(rfqtKeys).to.deep.eq(['test-api-key-1', 'test-api-key-2']);
        });
        it('creates the RFQt Integrator ID list (used in swap/rfq/registry)', () => {
            (0, contracts_test_utils_1.expect)(config_1.RFQT_INTEGRATOR_IDS).to.deep.eq(['test-integrator-id-1']);
        });
    });
});
//# sourceMappingURL=config_test.js.map