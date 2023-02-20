"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfqClient = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const http_status_codes_1 = require("http-status-codes");
const config_1 = require("../config");
const logger_1 = require("../logger");
// A mapper function to return a serialized RfqOrder into one with BigNumbers
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
const toRfqOrder = (obj) => {
    return new protocol_utils_1.RfqOrder({
        makerToken: obj.makerToken,
        takerToken: obj.takerToken,
        makerAmount: new utils_1.BigNumber(obj.makerAmount),
        takerAmount: new utils_1.BigNumber(obj.takerAmount),
        maker: obj.maker,
        taker: obj.taker,
        chainId: obj.chainId,
        verifyingContract: obj.verifyingContract,
        txOrigin: obj.txOrigin,
        pool: obj.pool,
        salt: new utils_1.BigNumber(obj.salt),
        expiry: new utils_1.BigNumber(obj.expiry),
    });
};
// A mapper function to return a serialized OtcOrder into one with BigNumbers
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
const toOtcOrder = (obj) => {
    return new protocol_utils_1.OtcOrder({
        makerToken: obj.makerToken,
        takerToken: obj.takerToken,
        makerAmount: new utils_1.BigNumber(obj.makerAmount),
        takerAmount: new utils_1.BigNumber(obj.takerAmount),
        maker: obj.maker,
        taker: obj.taker,
        chainId: obj.chainId,
        verifyingContract: obj.verifyingContract,
        txOrigin: obj.txOrigin,
        expiryAndNonce: new utils_1.BigNumber(obj.expiryAndNonce),
    });
};
class RfqClient {
    constructor(_rfqApiUrl, _axiosInstance) {
        this._rfqApiUrl = _rfqApiUrl;
        this._axiosInstance = _axiosInstance;
    }
    /**
     * Communicates to an RFQ Client to fetch available prices
     */
    async getV1PricesAsync(request) {
        try {
            const response = await this._axiosInstance.post(`${this._rfqApiUrl}/rfqt/v1/prices`, request, {
                timeout: config_1.RFQT_REQUEST_MAX_RESPONSE_MS + 150,
                headers: {
                    '0x-chain-id': request.chainId,
                },
            });
            if (response.status !== http_status_codes_1.OK) {
                logger_1.logger.warn({ request }, 'Unable to get RFQt v1 prices');
                return {
                    prices: [],
                };
            }
            return response.data;
        }
        catch (error) {
            logger_1.logger.error({ errorMessage: error.message }, 'Encountered an error fetching for /rfqt/v1/prices');
            return {
                prices: [],
            };
        }
    }
    /**
     * Communicates to an RFQ Client to fetch available signed quotes
     */
    async getV1QuotesAsync(request) {
        var _a;
        try {
            const response = await this._axiosInstance.post(`${this._rfqApiUrl}/rfqt/v1/quotes`, request, {
                timeout: config_1.RFQT_REQUEST_MAX_RESPONSE_MS + 150,
                headers: {
                    '0x-chain-id': request.chainId,
                },
            });
            if (response.status !== http_status_codes_1.OK) {
                logger_1.logger.warn({ request }, 'Unable to get RFQt v1 quotes');
                return {
                    quotes: [],
                };
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
            const updatedQuotes = (_a = response.data) === null || _a === void 0 ? void 0 : _a.quotes.map((q) => {
                return {
                    signature: q.signature,
                    makerUri: q.makerUri,
                    order: toRfqOrder(q.order),
                };
            });
            return {
                quotes: updatedQuotes,
            };
        }
        catch (error) {
            logger_1.logger.error({ errorMessage: error.message }, 'Encountered an error fetching for /rfqt/v1/quotes');
            return {
                quotes: [],
            };
        }
    }
    /**
     * Communicates to an RFQ Client to fetch available v2 prices
     */
    async getV2PricesAsync(request) {
        var _a, _b;
        try {
            const response = await this._axiosInstance.post(`${this._rfqApiUrl}/internal/rfqt/v2/prices`, request, {
                timeout: config_1.RFQT_REQUEST_MAX_RESPONSE_MS * 3,
                headers: {
                    '0x-chain-id': request.chainId,
                },
            });
            if (response.status !== http_status_codes_1.OK) {
                logger_1.logger.warn({ request }, 'Unable to get RFQt v2 prices');
                return [];
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
            return (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.prices) === null || _b === void 0 ? void 0 : _b.map((q) => {
                return {
                    ...q,
                    expiry: new utils_1.BigNumber(q.expiry),
                    makerAmount: new utils_1.BigNumber(q.makerAmount),
                    takerAmount: new utils_1.BigNumber(q.takerAmount),
                };
            });
        }
        catch (error) {
            logger_1.logger.error({ errorMessage: error.message }, 'Encountered an error fetching for /internal/rfqt/v2/prices');
            return [];
        }
    }
    /**
     * Communicates to an RFQ Client to fetch available signed v2 quotes
     */
    async getV2QuotesAsync(request) {
        var _a, _b;
        try {
            const response = await this._axiosInstance.post(`${this._rfqApiUrl}/internal/rfqt/v2/quotes`, request, {
                timeout: config_1.RFQT_REQUEST_MAX_RESPONSE_MS * 3,
                headers: {
                    '0x-chain-id': request.chainId,
                },
            });
            if (response.status !== http_status_codes_1.OK) {
                logger_1.logger.warn({ request }, 'Unable to get RFQt v2 quotes');
                return [];
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
            const quotes = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.quotes) === null || _b === void 0 ? void 0 : _b.map((q) => {
                return {
                    fillableMakerAmount: new utils_1.BigNumber(q.fillableMakerAmount),
                    fillableTakerAmount: new utils_1.BigNumber(q.fillableTakerAmount),
                    fillableTakerFeeAmount: new utils_1.BigNumber(q.fillableTakerFeeAmount),
                    signature: q.signature,
                    makerUri: q.makerUri,
                    makerId: q.makerId,
                    order: toOtcOrder(q.order),
                };
            });
            return quotes;
        }
        catch (error) {
            logger_1.logger.error({ errorMessage: error.message }, 'Encountered an error fetching for /internal/rfqt/v2/quotes');
            return [];
        }
    }
    isRfqtEnabled() {
        return this._rfqApiUrl.length !== 0;
    }
}
exports.RfqClient = RfqClient;
//# sourceMappingURL=rfq_client.js.map