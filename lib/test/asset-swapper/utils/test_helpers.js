"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testHelpers = exports.RfqQuoteEndpoint = void 0;
const axios_1 = require("axios");
const axios_mock_adapter_1 = require("axios-mock-adapter");
const _ = require("lodash");
const errors_1 = require("../../../src/asset-swapper/errors");
var RfqQuoteEndpoint;
(function (RfqQuoteEndpoint) {
    RfqQuoteEndpoint["Indicative"] = "price";
    RfqQuoteEndpoint["Firm"] = "quote";
})(RfqQuoteEndpoint = exports.RfqQuoteEndpoint || (exports.RfqQuoteEndpoint = {}));
exports.testHelpers = {
    expectInsufficientLiquidityErrorAsync: async (expect, functionWhichTriggersErrorAsync, expectedAmountAvailableToFill) => {
        let wasErrorThrown = false;
        try {
            await functionWhichTriggersErrorAsync();
        }
        catch (e) {
            wasErrorThrown = true;
            expect(e).to.be.instanceOf(errors_1.InsufficientAssetLiquidityError);
            if (expectedAmountAvailableToFill) {
                expect(e.amountAvailableToFill).to.be.bignumber.equal(expectedAmountAvailableToFill);
            }
            else {
                expect(e.amountAvailableToFill).to.be.undefined();
            }
        }
        expect(wasErrorThrown).to.be.true();
    },
    /**
     * A helper utility for testing which mocks out
     * requests to RFQ-T/M providers
     */
    withMockedRfqQuotes: async (standardMockedResponses, altMockedResponses, quoteType, afterResponseCallback, axiosClient = axios_1.default) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
        const mockedAxios = new axios_mock_adapter_1.default(axiosClient, { onNoMatch: 'throwException' });
        try {
            // Mock out Standard RFQ-T/M responses
            for (const mockedResponse of standardMockedResponses) {
                const { endpoint, requestApiKey, requestParams, responseData, responseCode } = mockedResponse;
                const requestHeaders = {
                    Accept: 'application/json, text/plain, */*',
                    '0x-api-key': requestApiKey,
                    '0x-integrator-id': requestApiKey,
                };
                if (mockedResponse.callback !== undefined) {
                    mockedAxios
                        .onGet(`${endpoint}/${quoteType}`, { params: requestParams }, requestHeaders)
                        .reply(mockedResponse.callback);
                }
                else {
                    mockedAxios
                        .onGet(`${endpoint}/${quoteType}`, { params: requestParams }, requestHeaders)
                        .replyOnce(responseCode, responseData);
                }
            }
            // Mock out Alt RFQ-T/M responses
            for (const mockedResponse of altMockedResponses) {
                const { endpoint, mmApiKey, requestData, responseData, responseCode } = mockedResponse;
                const requestHeaders = {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${mmApiKey}`,
                };
                mockedAxios
                    .onPost(`${endpoint}/quotes`, 
                // hack to get AxiosMockAdapter to recognize the match
                // b/t the mock data and the request data
                {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
                    asymmetricMatch: (x) => {
                        return _.isEqual(requestData, x);
                    },
                }, requestHeaders)
                    .replyOnce(responseCode, responseData);
            }
            // Perform the callback function, e.g. a test validation
            await afterResponseCallback();
        }
        finally {
            // Ensure we always restore axios afterwards
            mockedAxios.restore();
        }
    },
};
//# sourceMappingURL=test_helpers.js.map