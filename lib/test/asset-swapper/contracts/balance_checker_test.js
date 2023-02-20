"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_erc20_1 = require("@0x/contracts-erc20");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const artifacts_1 = require("../../artifacts");
const wrappers_1 = require("../../wrappers");
const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
contracts_test_utils_1.blockchainTests.resets('BalanceChecker contract', (env) => {
    let contract;
    before(async () => {
        contract = await wrappers_1.BalanceCheckerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.BalanceChecker, env.provider, env.txDefaults, {});
    });
    describe('getBalances', () => {
        it('returns the correct array for a successful call', async () => {
            const makerToken = await contracts_erc20_1.DummyERC20TokenContract.deployFrom0xArtifactAsync(contracts_erc20_1.artifacts.DummyERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts, contracts_test_utils_1.constants.DUMMY_TOKEN_NAME, contracts_test_utils_1.constants.DUMMY_TOKEN_SYMBOL, new utils_1.BigNumber(18), contracts_test_utils_1.constants.DUMMY_TOKEN_TOTAL_SUPPLY);
            const accounts = await contracts_test_utils_1.web3Wrapper.getAvailableAddressesAsync();
            const owner = accounts[0];
            const owner2 = accounts[1];
            await makerToken.mint(new utils_1.BigNumber(100)).awaitTransactionSuccessAsync({ from: owner });
            const testResults = await contract.balances([owner, owner2], [makerToken.address, ETH_ADDRESS]).callAsync();
            (0, contracts_test_utils_1.expect)(testResults).to.eql([new utils_1.BigNumber(100), new utils_1.BigNumber(1000000000000000000000)]);
        });
        it('it throws an error if the input arrays of different lengths', async () => {
            const accounts = await contracts_test_utils_1.web3Wrapper.getAvailableAddressesAsync();
            const owner = accounts[0];
            try {
                await contract.balances([owner], [ETH_ADDRESS, ETH_ADDRESS]).callAsync();
                contracts_test_utils_1.expect.fail();
            }
            catch (error) {
                (0, contracts_test_utils_1.expect)(error.message).to.eql('users array is a different length than the tokens array');
            }
        });
    });
    describe('getMinOfBalancesOrAllowances', () => {
        it('returns the balance if the allowance can cover it', async () => {
            const makerToken = await contracts_erc20_1.DummyERC20TokenContract.deployFrom0xArtifactAsync(contracts_erc20_1.artifacts.DummyERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts, contracts_test_utils_1.constants.DUMMY_TOKEN_NAME, contracts_test_utils_1.constants.DUMMY_TOKEN_SYMBOL, new utils_1.BigNumber(18), contracts_test_utils_1.constants.DUMMY_TOKEN_TOTAL_SUPPLY);
            const accounts = await contracts_test_utils_1.web3Wrapper.getAvailableAddressesAsync();
            const owner = accounts[0];
            const owner2 = accounts[1];
            const allowanceTarget = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';
            await makerToken.mint(new utils_1.BigNumber(100)).awaitTransactionSuccessAsync({ from: owner });
            await makerToken.approve(allowanceTarget, new utils_1.BigNumber(150)).awaitTransactionSuccessAsync({ from: owner });
            await makerToken.mint(new utils_1.BigNumber(150)).awaitTransactionSuccessAsync({ from: owner2 });
            await makerToken
                .approve(allowanceTarget, new utils_1.BigNumber(200))
                .awaitTransactionSuccessAsync({ from: owner2 });
            const testResults = await contract
                .getMinOfBalancesOrAllowances([owner, owner2], [makerToken.address, makerToken.address], allowanceTarget)
                .callAsync();
            (0, contracts_test_utils_1.expect)(testResults).to.eql([new utils_1.BigNumber(100), new utils_1.BigNumber(150)]);
        });
        it('returns the allowance if the allowance < balance', async () => {
            const makerToken = await contracts_erc20_1.DummyERC20TokenContract.deployFrom0xArtifactAsync(contracts_erc20_1.artifacts.DummyERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts, contracts_test_utils_1.constants.DUMMY_TOKEN_NAME, contracts_test_utils_1.constants.DUMMY_TOKEN_SYMBOL, new utils_1.BigNumber(18), contracts_test_utils_1.constants.DUMMY_TOKEN_TOTAL_SUPPLY);
            const accounts = await contracts_test_utils_1.web3Wrapper.getAvailableAddressesAsync();
            const owner = accounts[0];
            const owner2 = accounts[1];
            const allowanceTarget = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';
            await makerToken.mint(new utils_1.BigNumber(100)).awaitTransactionSuccessAsync({ from: owner });
            await makerToken.approve(allowanceTarget, new utils_1.BigNumber(50)).awaitTransactionSuccessAsync({ from: owner });
            await makerToken.mint(new utils_1.BigNumber(100)).awaitTransactionSuccessAsync({ from: owner2 });
            await makerToken.approve(allowanceTarget, new utils_1.BigNumber(75)).awaitTransactionSuccessAsync({ from: owner2 });
            const testResults = await contract
                .getMinOfBalancesOrAllowances([owner, owner2], [makerToken.address, makerToken.address], allowanceTarget)
                .callAsync();
            (0, contracts_test_utils_1.expect)(testResults).to.eql([new utils_1.BigNumber(50), new utils_1.BigNumber(75)]);
        });
    });
});
//# sourceMappingURL=balance_checker_test.js.map