"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
require("mocha");
const asset_swapper_1 = require("../src/asset-swapper");
const parse_utils_1 = require("../src/utils/parse_utils");
const SUITE_NAME = 'parseUtils';
describe(SUITE_NAME, () => {
    beforeEach(() => {
        delete process.env.TEST_NEW_KEY;
    });
    it('raises a ValidationError if includedSources is RFQT and a taker is not specified', async () => {
        (0, contracts_test_utils_1.expect)(() => {
            parse_utils_1.parseUtils.parseRequestForExcludedSources({
                includedSources: 'RFQT',
            }, [], 'price');
        }).throws();
    });
    it('raises a ValidationError if API keys are not present or valid', async () => {
        (0, contracts_test_utils_1.expect)(() => {
            parse_utils_1.parseUtils.parseRequestForExcludedSources({
                includedSources: 'RFQT',
                takerAddress: utils_1.NULL_ADDRESS,
                apiKey: 'foo',
            }, ['lorem', 'ipsum'], 'price');
        }).throws();
    });
    it('returns excludedSources correctly when excludedSources is present', async () => {
        const { excludedSources, nativeExclusivelyRFQT } = parse_utils_1.parseUtils.parseRequestForExcludedSources({
            excludedSources: 'Uniswap,Curve',
        }, [], 'price');
        (0, contracts_test_utils_1.expect)(excludedSources[0]).to.eql(asset_swapper_1.ERC20BridgeSource.Uniswap);
        (0, contracts_test_utils_1.expect)(excludedSources[1]).to.eql(asset_swapper_1.ERC20BridgeSource.Curve);
        (0, contracts_test_utils_1.expect)(nativeExclusivelyRFQT).to.eql(false);
    });
    it('returns empty array if no includedSources and excludedSources are present', async () => {
        const { excludedSources, nativeExclusivelyRFQT } = parse_utils_1.parseUtils.parseRequestForExcludedSources({}, [], 'price');
        (0, contracts_test_utils_1.expect)(excludedSources.length).to.eql(0);
        (0, contracts_test_utils_1.expect)(nativeExclusivelyRFQT).to.eql(false);
    });
    it('correctly handles includedSources=RFQT', async () => {
        const { excludedSources, includedSources, nativeExclusivelyRFQT } = parse_utils_1.parseUtils.parseRequestForExcludedSources({
            includedSources: 'RFQT',
            takerAddress: utils_1.NULL_ADDRESS,
            apiKey: 'ipsum',
        }, ['lorem', 'ipsum'], 'price');
        (0, contracts_test_utils_1.expect)(nativeExclusivelyRFQT).to.eql(true);
        (0, contracts_test_utils_1.expect)(excludedSources).to.deep.eq([]);
        (0, contracts_test_utils_1.expect)(includedSources).to.deep.eq(['Native']);
    });
    it('correctly handles includedSources=RFQT,Native', async () => {
        const { excludedSources, includedSources, nativeExclusivelyRFQT } = parse_utils_1.parseUtils.parseRequestForExcludedSources({
            includedSources: 'RFQT,Native',
            takerAddress: utils_1.NULL_ADDRESS,
            apiKey: 'ipsum',
        }, ['lorem', 'ipsum'], 'price');
        (0, contracts_test_utils_1.expect)(nativeExclusivelyRFQT).to.eql(false);
        (0, contracts_test_utils_1.expect)(excludedSources).to.deep.eq([]);
        (0, contracts_test_utils_1.expect)(includedSources).to.deep.eq(['Native']);
    });
    it('raises a ValidationError if includedSources and excludedSources are both present', async () => {
        (0, contracts_test_utils_1.expect)(() => {
            parse_utils_1.parseUtils.parseRequestForExcludedSources({
                excludedSources: 'Native',
                includedSources: 'RFQT',
            }, [], 'price');
        }).throws();
    });
    it('raises a ValidationError if a firm quote is requested and "intentOnFilling" is not set to "true"', async () => {
        (0, contracts_test_utils_1.expect)(() => {
            parse_utils_1.parseUtils.parseRequestForExcludedSources({
                includedSources: 'RFQT',
                takerAddress: utils_1.NULL_ADDRESS,
                apiKey: 'ipsum',
            }, ['lorem', 'ipsum'], 'quote');
        }).throws();
    });
});
//# sourceMappingURL=parse_utils_test.js.map