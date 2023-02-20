"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_erc20_1 = require("@0x/contracts-erc20");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const web3_wrapper_1 = require("@0x/web3-wrapper");
require("mocha");
const artifacts_1 = require("../src/artifacts");
const asset_swapper_1 = require("../src/asset-swapper");
const constants_1 = require("../src/constants");
const entities_1 = require("../src/entities");
const rfq_maker_balance_cache_runner_1 = require("../src/runners/rfq_maker_balance_cache_runner");
const constants_2 = require("./constants");
const db_connection_1 = require("./utils/db_connection");
const deployment_1 = require("./utils/deployment");
const SUITE_NAME = 'RFQ Maker Balance Cache Tests';
describe(SUITE_NAME, () => {
    let provider;
    let balanceCheckerContract;
    let dbConnection;
    let zrx;
    let balanceRepo;
    let web3Wrapper;
    let makerAddress1;
    let makerAddress2;
    before(async () => {
        await (0, deployment_1.setupDependenciesAsync)(SUITE_NAME);
        provider = (0, constants_2.getProvider)();
        web3Wrapper = new web3_wrapper_1.Web3Wrapper(provider);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const deployer = accounts[0];
        makerAddress1 = accounts[1];
        makerAddress2 = accounts[2];
        zrx = await contracts_erc20_1.DummyERC20TokenContract.deployFrom0xArtifactAsync(contracts_erc20_1.artifacts.DummyERC20Token, provider, { from: deployer, gas: 10000000 }, {}, '0x Protocol Token', 'ZRX', new utils_1.BigNumber(18), new utils_1.BigNumber(1000000));
        await zrx.mint(new utils_1.BigNumber(100)).awaitTransactionSuccessAsync({ from: makerAddress1 });
        await zrx
            .approve(constants_1.RFQ_ALLOWANCE_TARGET, new utils_1.BigNumber(100))
            .awaitTransactionSuccessAsync({ from: makerAddress1 });
        await zrx.mint(new utils_1.BigNumber(150)).awaitTransactionSuccessAsync({ from: makerAddress2 });
        await zrx
            .approve(constants_1.RFQ_ALLOWANCE_TARGET, new utils_1.BigNumber(125))
            .awaitTransactionSuccessAsync({ from: makerAddress2 });
        balanceCheckerContract = await asset_swapper_1.BalanceCheckerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.BalanceChecker, provider, { from: deployer, gas: 10000000 }, {});
        dbConnection = await (0, db_connection_1.initDBConnectionAsync)();
        // save some balance cache entities
        const maker1 = new entities_1.MakerBalanceChainCacheEntity();
        maker1.makerAddress = makerAddress1;
        maker1.tokenAddress = zrx.address;
        maker1.timeFirstSeen = new Date();
        const maker2 = new entities_1.MakerBalanceChainCacheEntity();
        maker2.makerAddress = makerAddress2;
        maker2.tokenAddress = zrx.address;
        maker2.timeFirstSeen = new Date();
        balanceRepo = dbConnection.getRepository(entities_1.MakerBalanceChainCacheEntity);
        await balanceRepo.save([maker1, maker2]);
    });
    after(async () => {
        await (0, deployment_1.teardownDependenciesAsync)(SUITE_NAME);
    });
    describe('runRfqBalanceCheckerAsync', () => {
        it('correctly updates maker addresses', async () => {
            await (0, rfq_maker_balance_cache_runner_1.cacheRfqBalancesAsync)(dbConnection, balanceCheckerContract, false, '');
            const maker1 = await dbConnection
                .getRepository(entities_1.MakerBalanceChainCacheEntity)
                .createQueryBuilder('maker_balance_chain_cache')
                .where('maker_balance_chain_cache.makerAddress = :address AND maker_balance_chain_cache.tokenAddress = :token', { address: makerAddress1, token: zrx.address })
                .getOne();
            const maker2 = await dbConnection
                .getRepository(entities_1.MakerBalanceChainCacheEntity)
                .createQueryBuilder('maker_balance_chain_cache')
                .where('maker_balance_chain_cache.makerAddress = :address AND maker_balance_chain_cache.tokenAddress = :token', { address: makerAddress2, token: zrx.address })
                .getOne();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            (0, contracts_test_utils_1.expect)(maker1.balance).to.be.deep.equal(new utils_1.BigNumber(100));
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            (0, contracts_test_utils_1.expect)(maker2.balance).to.be.deep.equal(new utils_1.BigNumber(125));
        });
    });
});
//# sourceMappingURL=rfq_maker_balance_cache_test.js.map