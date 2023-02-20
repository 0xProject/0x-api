"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfqtMocker = exports.RfqtQuoteEndpoint = void 0;
const axios_1 = require("axios");
const axios_mock_adapter_1 = require("axios-mock-adapter");
var RfqtQuoteEndpoint;
(function (RfqtQuoteEndpoint) {
    RfqtQuoteEndpoint["Indicative"] = "price";
    RfqtQuoteEndpoint["Firm"] = "quote";
})(RfqtQuoteEndpoint = exports.RfqtQuoteEndpoint || (exports.RfqtQuoteEndpoint = {}));
/**
 * A helper utility for testing which mocks out
 * requests to RFQ-t providers
 */
exports.rfqtMocker = {
    /**
     * A helper utility for testing which mocks out
     * requests to RFQ-t providers
     */
    withMockedRfqtQuotes: async (mockedResponses, quoteType, afterResponseCallback, axiosClient = axios_1.default) => {
        const mockedAxios = new axios_mock_adapter_1.default(axiosClient);
        try {
            // Mock out RFQT responses
            for (const mockedResponse of mockedResponses) {
                const { endpoint, requestApiKey, requestParams, responseData, responseCode } = mockedResponse;
                const requestHeaders = {
                    Accept: 'application/json, text/plain, */*',
                    '0x-api-key': requestApiKey,
                    '0x-integrator-id': requestApiKey,
                };
                mockedAxios
                    .onGet(`${endpoint}/${quoteType}`, { params: requestParams }, requestHeaders)
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
//# sourceMappingURL=rfqt_mocker.js.map