"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const web3_wrapper_1 = require("@0x/web3-wrapper");
const ethereum_types_1 = require("ethereum-types");
const ts_mockito_1 = require("ts-mockito");
const constants_1 = require("../../src/constants");
const rfqm_worker_balance_utils_1 = require("../../src/utils/rfqm_worker_balance_utils");
let web3WrapperMock;
describe('RFQM Worker balance utils', () => {
    describe('isWorkerReadyAndAbleAsync', () => {
        beforeEach(() => {
            web3WrapperMock = (0, ts_mockito_1.mock)(web3_wrapper_1.Web3Wrapper);
        });
        it('should assess the balance to trade', async () => {
            (0, ts_mockito_1.when)(web3WrapperMock.getAccountNonceAsync(constants_1.NULL_ADDRESS)).thenResolve(0);
            (0, ts_mockito_1.when)(web3WrapperMock.getAccountNonceAsync(constants_1.NULL_ADDRESS, (0, ts_mockito_1.anything)())).thenResolve(0);
            const tests = [
                [web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(0.5, 18), web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(120, 9), true],
                [web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(0.05, 18), web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(120, 9), false],
                [web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(0.05, 18), web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(100, 9), true],
            ];
            for (const test of tests) {
                const [balance, gasPrice, isSuccessful] = test;
                (0, contracts_test_utils_1.expect)(await (0, rfqm_worker_balance_utils_1.isWorkerReadyAndAbleAsync)((0, ts_mockito_1.instance)(web3WrapperMock), constants_1.NULL_ADDRESS, balance, gasPrice)).to.eql(isSuccessful);
            }
        });
        it('should fail with an outstanding transaction', async () => {
            (0, ts_mockito_1.when)(web3WrapperMock.getAccountNonceAsync(constants_1.NULL_ADDRESS)).thenResolve(0);
            (0, ts_mockito_1.when)(web3WrapperMock.getAccountNonceAsync(constants_1.NULL_ADDRESS, ethereum_types_1.BlockParamLiteral.Pending)).thenResolve(1);
            (0, contracts_test_utils_1.expect)(await (0, rfqm_worker_balance_utils_1.isWorkerReadyAndAbleAsync)((0, ts_mockito_1.instance)(web3WrapperMock), constants_1.NULL_ADDRESS, web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(10, 18), web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(120, 9))).to.eql(false);
        });
    });
});
//# sourceMappingURL=rfqm_worker_test.js.map