"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const axios_1 = require("axios");
const axios_mock_adapter_1 = require("axios-mock-adapter");
const HttpStatus = require("http-status-codes");
const asset_swapper_1 = require("../../src/asset-swapper");
const quote_server_client_1 = require("../../src/utils/quote_server_client");
const constants_1 = require("../constants");
const makerUri = 'https://some-market-maker.xyz';
describe('QuoteServerClient', () => {
    const axiosInstance = axios_1.default.create();
    const axiosMock = new axios_mock_adapter_1.default(axiosInstance);
    afterEach(() => {
        axiosMock.reset();
    });
    describe('confirmLastLookAsync', () => {
        it('should reject last look if invalid takerTokenFillableAmount passed', async () => {
            // Given
            const client = new quote_server_client_1.QuoteServerClient(axiosInstance);
            const order = new asset_swapper_1.RfqOrder();
            const request = {
                order,
                orderHash: 'someOrderHash',
                takerTokenFillAmount: new utils_1.BigNumber('1225'),
                fee: {
                    amount: new utils_1.BigNumber('100'),
                    type: 'fixed',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
            };
            const response = {
                fee: {
                    amount: '100',
                    type: 'fixed',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
                proceedWithFill: true,
                takerTokenFillAmount: '1223',
                signedOrderHash: 'someOrderHash',
            };
            axiosMock
                .onPost(`${makerUri}/submit`, JSON.parse(JSON.stringify(request)))
                .replyOnce(HttpStatus.OK, response);
            // When
            const shouldProceed = await client.confirmLastLookAsync(makerUri, request);
            // Then
            (0, contracts_test_utils_1.expect)(shouldProceed).to.eq(false);
        });
        it('should reject last look if valid negative response', async () => {
            // Given
            const client = new quote_server_client_1.QuoteServerClient(axiosInstance);
            const order = new asset_swapper_1.RfqOrder();
            const request = {
                order,
                orderHash: 'someOrderHash',
                takerTokenFillAmount: new utils_1.BigNumber('1225'),
                fee: {
                    amount: new utils_1.BigNumber('100'),
                    type: 'fixed',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
            };
            const response = {
                fee: {
                    amount: '100',
                    type: 'fixed',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
                proceedWithFill: false,
                takerTokenFillAmount: '1225',
                signedOrderHash: 'someSignedOrderHash',
            };
            axiosMock
                .onPost(`${makerUri}/submit`, JSON.parse(JSON.stringify(request)))
                .replyOnce(HttpStatus.OK, response);
            // When
            const shouldProceed = await client.confirmLastLookAsync(makerUri, request);
            // Then
            (0, contracts_test_utils_1.expect)(shouldProceed).to.eq(false);
        });
        it('should confirm last look if valid positive response', async () => {
            // Given
            const client = new quote_server_client_1.QuoteServerClient(axiosInstance);
            const order = new asset_swapper_1.RfqOrder();
            const request = {
                order,
                takerTokenFillAmount: new utils_1.BigNumber('1225'),
                orderHash: 'someOrderHash',
                fee: {
                    amount: new utils_1.BigNumber('100'),
                    type: 'fixed',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
            };
            const response = {
                fee: {
                    amount: '100',
                    type: 'fixed',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
                takerTokenFillAmount: '1225',
                proceedWithFill: true,
                signedOrderHash: 'someOrderHash',
            };
            axiosMock
                .onPost(`${makerUri}/submit`, JSON.parse(JSON.stringify(request)))
                .replyOnce(HttpStatus.OK, response);
            // When
            const shouldProceed = await client.confirmLastLookAsync(makerUri, request);
            // Then
            (0, contracts_test_utils_1.expect)(shouldProceed).to.eq(true);
        });
        it('should reject last look if invalid response', async () => {
            // Given
            const client = new quote_server_client_1.QuoteServerClient(axiosInstance);
            const order = new asset_swapper_1.RfqOrder();
            const request = {
                order,
                takerTokenFillAmount: new utils_1.BigNumber('1225'),
                orderHash: 'someOrderHash',
                fee: {
                    amount: new utils_1.BigNumber('100'),
                    type: 'fixed',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
            };
            const response = {
                fee: {
                    amount: '100',
                    type: 'invalid',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
                proceedWithFill: true,
                takerTokenFillAmount: '1225',
                signedOrderHash: 'someOrderHash',
            };
            axiosMock
                .onPost(`${makerUri}/submit`, JSON.parse(JSON.stringify(request)))
                .replyOnce(HttpStatus.OK, response);
            // When
            const shouldProceed = await client.confirmLastLookAsync(makerUri, request);
            // Then
            (0, contracts_test_utils_1.expect)(shouldProceed).to.eq(false);
        });
        it(`should reject last look if fee doesn't match`, async () => {
            // Given
            const client = new quote_server_client_1.QuoteServerClient(axiosInstance);
            const order = new asset_swapper_1.RfqOrder();
            const request = {
                order,
                takerTokenFillAmount: new utils_1.BigNumber('1225'),
                orderHash: 'someOrderHash',
                fee: {
                    amount: new utils_1.BigNumber('100'),
                    type: 'fixed',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
            };
            const response = {
                fee: {
                    amount: '101',
                    type: 'fixed',
                    token: constants_1.CONTRACT_ADDRESSES.etherToken,
                },
                proceedWithFill: true,
                takerTokenFillAmount: '1225',
                signedOrderHash: 'someOrderHash',
            };
            axiosMock
                .onPost(`${makerUri}/submit`, JSON.parse(JSON.stringify(request)))
                .replyOnce(HttpStatus.OK, response);
            // When
            const shouldProceed = await client.confirmLastLookAsync(makerUri, request);
            // Then
            (0, contracts_test_utils_1.expect)(shouldProceed).to.eq(false);
        });
    });
});
//# sourceMappingURL=quote_server_client_test.js.map