"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const dev_utils_1 = require("@0x/dev-utils");
const utils_1 = require("@0x/utils");
require("mocha");
const constants_1 = require("../src/constants");
const MakerBalanceChainCacheEntity_1 = require("../src/entities/MakerBalanceChainCacheEntity");
const postgres_rfqt_firm_quote_validator_1 = require("../src/services/postgres_rfqt_firm_quote_validator");
const db_connection_1 = require("./utils/db_connection");
const deployment_1 = require("./utils/deployment");
const SUITE_NAME = 'Quote Validator Test';
let connection;
let chainCacheRepository;
const createRfqOrder = (maker, makerToken, takerToken, makerAmount, takerAmount) => {
    return {
        makerToken,
        takerToken,
        chainId: 1337,
        verifyingContract: (0, contracts_test_utils_1.randomAddress)(),
        maker,
        taker: utils_1.NULL_ADDRESS,
        txOrigin: utils_1.NULL_ADDRESS,
        pool: utils_1.NULL_BYTES,
        makerAmount,
        takerAmount,
        salt: new utils_1.BigNumber(100),
        expiry: new utils_1.BigNumber(100),
    };
};
describe(SUITE_NAME, () => {
    const DAI_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const USDC_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const MAKER1_ADDRESS = (0, contracts_test_utils_1.randomAddress)();
    const MAKER2_ADDRESS = (0, contracts_test_utils_1.randomAddress)();
    const MAKER3_ADDRESS = (0, contracts_test_utils_1.randomAddress)();
    const MAKER4_ADDRESS = (0, contracts_test_utils_1.randomAddress)();
    let validator;
    before(async () => {
        await (0, deployment_1.setupDependenciesAsync)(SUITE_NAME);
        connection = await (0, db_connection_1.initDBConnectionAsync)();
        chainCacheRepository = connection.getRepository(MakerBalanceChainCacheEntity_1.MakerBalanceChainCacheEntity);
        validator = new postgres_rfqt_firm_quote_validator_1.PostgresRfqtFirmQuoteValidator(chainCacheRepository);
    });
    afterEach(async () => {
        await chainCacheRepository.query('TRUNCATE TABLE maker_balance_chain_cache;');
        // await teardownDependenciesAsync(SUITE_NAME);
    });
    describe('PostgresBackedFirmQuoteValidator', async () => {
        it('should fail gracefully and mark orders as fully fillable if no entries are found', async () => {
            const beforefilter = await chainCacheRepository.count();
            (0, contracts_test_utils_1.expect)(beforefilter).to.eql(0);
            const orders = [800, 801, 802].map((takerAmount) => {
                return createRfqOrder(MAKER1_ADDRESS, DAI_TOKEN, USDC_TOKEN, dev_utils_1.Web3Wrapper.toBaseUnitAmount(700, 18), dev_utils_1.Web3Wrapper.toBaseUnitAmount(takerAmount, 6));
            });
            const results = await validator.getRfqtTakerFillableAmountsAsync(orders);
            (0, contracts_test_utils_1.expect)(results.length).to.eql(3);
            (0, contracts_test_utils_1.expect)(results.map((r) => r.toString())).to.eql(['800000000', '801000000', '802000000']);
            const afterFilter = await chainCacheRepository.count();
            (0, contracts_test_utils_1.expect)(afterFilter).to.eql(1);
        });
        it('should correctly round down taker amounts', async () => {
            await chainCacheRepository.insert({
                tokenAddress: DAI_TOKEN,
                makerAddress: MAKER1_ADDRESS,
                balance: dev_utils_1.Web3Wrapper.toBaseUnitAmount(300, 18),
                timeFirstSeen: 'NOW()',
                timeOfSample: 'NOW()',
            });
            const orderToValidate = createRfqOrder(MAKER1_ADDRESS, DAI_TOKEN, USDC_TOKEN, dev_utils_1.Web3Wrapper.toBaseUnitAmount(700, 18), dev_utils_1.Web3Wrapper.toBaseUnitAmount(800, 6));
            const results = await validator.getRfqtTakerFillableAmountsAsync([orderToValidate]);
            (0, contracts_test_utils_1.expect)(results.length).to.eql(1);
            (0, contracts_test_utils_1.expect)(results.map((r) => r.toString())).to.eql([
                '342857142', // 342.857142
            ]);
        });
        it('should be case insensitive to maker token addresses', async () => {
            const makerToken = DAI_TOKEN;
            const takerToken = USDC_TOKEN;
            await chainCacheRepository.insert({
                tokenAddress: makerToken,
                makerAddress: MAKER1_ADDRESS,
                balance: dev_utils_1.Web3Wrapper.toBaseUnitAmount(300, 18),
                timeFirstSeen: 'NOW()',
                timeOfSample: 'NOW()',
            });
            const order1 = createRfqOrder(MAKER1_ADDRESS, makerToken.toUpperCase(), takerToken, dev_utils_1.Web3Wrapper.toBaseUnitAmount(700, 18), dev_utils_1.Web3Wrapper.toBaseUnitAmount(800, 6));
            const order2 = createRfqOrder(MAKER1_ADDRESS, makerToken.toLowerCase(), takerToken, dev_utils_1.Web3Wrapper.toBaseUnitAmount(700, 18), dev_utils_1.Web3Wrapper.toBaseUnitAmount(800, 6));
            const results = await validator.getRfqtTakerFillableAmountsAsync([order1, order2]);
            (0, contracts_test_utils_1.expect)(results.length).to.eql(2);
            (0, contracts_test_utils_1.expect)(results.map((r) => r.toString())).to.eql([
                '342857142',
                '342857142', // 342.857142
            ]);
        });
        it('should ignore orders that have a stale cache', async () => {
            const fiveMinuteAgo = new Date(new Date().getTime() - 5 * 60 * constants_1.ONE_SECOND_MS);
            await chainCacheRepository.insert({
                makerAddress: MAKER1_ADDRESS,
                tokenAddress: DAI_TOKEN,
                balance: dev_utils_1.Web3Wrapper.toBaseUnitAmount(300, 18),
                timeFirstSeen: new Date(fiveMinuteAgo.getTime() - constants_1.ONE_SECOND_MS * 30),
                timeOfSample: fiveMinuteAgo,
            });
            await chainCacheRepository.insert({
                makerAddress: MAKER2_ADDRESS,
                tokenAddress: DAI_TOKEN,
                timeFirstSeen: new Date(fiveMinuteAgo.getTime() - constants_1.ONE_SECOND_MS * 30),
            });
            await chainCacheRepository.insert({
                makerAddress: MAKER3_ADDRESS,
                tokenAddress: DAI_TOKEN,
                timeFirstSeen: new Date(new Date().getTime() - constants_1.ONE_SECOND_MS * 30),
            });
            const orders = [MAKER1_ADDRESS, MAKER2_ADDRESS, MAKER3_ADDRESS].map((makerAddress) => {
                return createRfqOrder(makerAddress, DAI_TOKEN, USDC_TOKEN, dev_utils_1.Web3Wrapper.toBaseUnitAmount(700, 18), dev_utils_1.Web3Wrapper.toBaseUnitAmount(800, 6));
            });
            const results = await validator.getRfqtTakerFillableAmountsAsync(orders);
            (0, contracts_test_utils_1.expect)(results.length).to.eql(3);
            (0, contracts_test_utils_1.expect)(results.map((r) => r.toString())).to.eql([
                '0',
                '0',
                '800000000', // order maker has a cache entry and was seen 30 seconds ago - fully fillable
            ]);
        });
        it('should correctly report no taker fillable amount if makers do not have a balance', async () => {
            const oneMinuteAgo = new Date(new Date().getTime() - constants_1.ONE_MINUTE_MS);
            // Maker1 does not have capital
            // Maker2 has some capital
            // Maker3 has all the capital
            // Maker4 has no entries in the database
            await chainCacheRepository.insert({
                tokenAddress: DAI_TOKEN,
                makerAddress: MAKER1_ADDRESS,
                balance: new utils_1.BigNumber(0),
                timeFirstSeen: 'NOW()',
                timeOfSample: oneMinuteAgo,
            });
            await chainCacheRepository.insert({
                tokenAddress: DAI_TOKEN,
                makerAddress: MAKER2_ADDRESS,
                balance: dev_utils_1.Web3Wrapper.toBaseUnitAmount(120, 18),
                timeOfSample: oneMinuteAgo,
                timeFirstSeen: 'NOW()',
            });
            await chainCacheRepository.insert({
                tokenAddress: DAI_TOKEN,
                makerAddress: MAKER3_ADDRESS,
                balance: dev_utils_1.Web3Wrapper.toBaseUnitAmount(3000, 18),
                timeOfSample: oneMinuteAgo,
                timeFirstSeen: 'NOW()',
            });
            const orders = [MAKER1_ADDRESS, MAKER2_ADDRESS, MAKER3_ADDRESS, MAKER4_ADDRESS].map((address) => {
                return createRfqOrder(address, DAI_TOKEN, USDC_TOKEN, dev_utils_1.Web3Wrapper.toBaseUnitAmount(1000, 18), dev_utils_1.Web3Wrapper.toBaseUnitAmount(1000, 6));
            });
            // Balances were adjusted accordingly, and Maker4 was added to the chain cache
            const now = new Date();
            const results = await validator.getRfqtTakerFillableAmountsAsync(orders);
            (0, contracts_test_utils_1.expect)(results.length).to.eql(4);
            (0, contracts_test_utils_1.expect)(results.map((r) => r.toString())).to.eql(['0', '120000000', '1000000000', '1000000000']);
            // MAKER4 did not exist in the cache, so check to ensure it's been added.
            const maker4Entry = await chainCacheRepository.findOneOrFail({
                where: {
                    makerAddress: MAKER4_ADDRESS,
                    tokenAddress: DAI_TOKEN,
                },
            });
            (0, contracts_test_utils_1.expect)(maker4Entry.timeFirstSeen).to.be.gt(now);
        });
    });
});
//# sourceMappingURL=quote_validator_test.js.map