"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteServerClient = void 0;
const json_schemas_1 = require("@0x/json-schemas");
const quote_server_1 = require("@0x/quote-server");
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const prom_client_1 = require("prom-client");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const MARKET_MAKER_LAST_LOOK_LATENCY = new prom_client_1.Summary({
    name: 'market_maker_last_look_latency',
    help: 'Latency for Last Look request to Market Makers',
    labelNames: ['makerUri'],
});
const schemaValidator = new json_schemas_1.SchemaValidator();
schemaValidator.addSchema(quote_server_1.schemas.feeSchema);
schemaValidator.addSchema(quote_server_1.schemas.submitRequestSchema);
schemaValidator.addSchema(quote_server_1.schemas.submitReceiptSchema);
class QuoteServerClient {
    constructor(_axiosInstance) {
        this._axiosInstance = _axiosInstance;
    }
    async confirmLastLookAsync(makerUri, payload) {
        const timerStopFn = MARKET_MAKER_LAST_LOOK_LATENCY.labels(makerUri).startTimer();
        try {
            const response = await this._axiosInstance.post(`${makerUri}/submit`, payload, {
                timeout: constants_1.ONE_SECOND_MS * 2,
                headers: { 'Content-Type': 'application/json' },
            });
            const validator = schemaValidator.validate(response.data, quote_server_1.schemas.submitReceiptSchema);
            if (validator.errors && validator.errors.length > 0) {
                const errorsMsg = validator.errors.map((err) => err.toString()).join(',');
                throw new Error(`Error from validator: ${errorsMsg}`);
            }
            const responseFee = {
                amount: new utils_1.BigNumber(response.data.fee.amount),
                token: response.data.fee.token,
                type: response.data.fee.type,
            };
            if (!_.isEqual(responseFee, payload.fee)) {
                throw new Error('Fee in response is not equal to fee in request');
            }
            if (response.data.signedOrderHash !== payload.orderHash) {
                throw new Error(`Requested trade for order hash ${payload.orderHash} - received response for order hash ${response.data.signedOrderHash}`);
            }
            if (response.data.takerTokenFillAmount !== payload.takerTokenFillAmount.toString()) {
                throw new Error('takerTokenFillableAmount in response is not equal to takerTokenFillableAmount in request');
            }
            return response.data.proceedWithFill === true;
        }
        catch (error) {
            logger_1.logger.warn({ error, makerUri }, 'Encountered an error when confirming last look with market maker');
            return false;
        }
        finally {
            timerStopFn();
        }
    }
}
exports.QuoteServerClient = QuoteServerClient;
//# sourceMappingURL=quote_server_client.js.map