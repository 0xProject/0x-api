"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketServiceError = exports.ExpiredOrderError = exports.ValidationErrorReasons = exports.apiErrorCodesToReasons = exports.APIErrorCodes = exports.ServiceDisabledError = exports.GasEstimationError = exports.EthSellNotSupportedError = exports.InsufficientFundsError = exports.ValidationErrorCodes = exports.ValidationError = exports.RevertAPIError = exports.NotImplementedError = exports.NotFoundError = exports.MalformedJSONError = exports.InvalidAPIKeyError = exports.InternalServerError = void 0;
const api_utils_1 = require("@0x/api-utils");
const http_status_codes_1 = require("http-status-codes");
const constants_1 = require("./constants");
var api_utils_2 = require("@0x/api-utils");
Object.defineProperty(exports, "InternalServerError", { enumerable: true, get: function () { return api_utils_2.InternalServerError; } });
Object.defineProperty(exports, "InvalidAPIKeyError", { enumerable: true, get: function () { return api_utils_2.InvalidAPIKeyError; } });
Object.defineProperty(exports, "MalformedJSONError", { enumerable: true, get: function () { return api_utils_2.MalformedJSONError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return api_utils_2.NotFoundError; } });
Object.defineProperty(exports, "NotImplementedError", { enumerable: true, get: function () { return api_utils_2.NotImplementedError; } });
Object.defineProperty(exports, "RevertAPIError", { enumerable: true, get: function () { return api_utils_2.RevertAPIError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return api_utils_2.ValidationError; } });
Object.defineProperty(exports, "ValidationErrorCodes", { enumerable: true, get: function () { return api_utils_2.ValidationErrorCodes; } });
class InsufficientFundsError extends api_utils_1.BadRequestError {
    constructor() {
        super(...arguments);
        this.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        this.generalErrorCode = APIErrorCodes.InsufficientFundsError;
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
class EthSellNotSupportedError extends api_utils_1.BadRequestError {
    constructor() {
        super(...arguments);
        this.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        this.generalErrorCode = APIErrorCodes.EthSellNotSupported;
    }
}
exports.EthSellNotSupportedError = EthSellNotSupportedError;
class GasEstimationError extends api_utils_1.BadRequestError {
    constructor() {
        super(...arguments);
        this.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        this.generalErrorCode = APIErrorCodes.GasEstimationFailed;
    }
}
exports.GasEstimationError = GasEstimationError;
class ServiceDisabledError extends api_utils_1.BadRequestError {
    constructor() {
        super(...arguments);
        this.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        this.generalErrorCode = APIErrorCodes.ServiceDisabled;
    }
}
exports.ServiceDisabledError = ServiceDisabledError;
var APIErrorCodes;
(function (APIErrorCodes) {
    APIErrorCodes[APIErrorCodes["OrderSubmissionDisabled"] = 102] = "OrderSubmissionDisabled";
    APIErrorCodes[APIErrorCodes["UnableToSubmitOnBehalfOfTaker"] = 106] = "UnableToSubmitOnBehalfOfTaker";
    APIErrorCodes[APIErrorCodes["ServiceDisabled"] = 108] = "ServiceDisabled";
    APIErrorCodes[APIErrorCodes["InsufficientFundsError"] = 109] = "InsufficientFundsError";
    APIErrorCodes[APIErrorCodes["EthSellNotSupported"] = 110] = "EthSellNotSupported";
    APIErrorCodes[APIErrorCodes["GasEstimationFailed"] = 111] = "GasEstimationFailed";
})(APIErrorCodes = exports.APIErrorCodes || (exports.APIErrorCodes = {}));
exports.apiErrorCodesToReasons = {
    ...api_utils_1.generalErrorCodeToReason,
    [APIErrorCodes.OrderSubmissionDisabled]: 'Order submission disabled',
    [APIErrorCodes.UnableToSubmitOnBehalfOfTaker]: 'Unable to submit transaction on behalf of taker',
    [APIErrorCodes.ServiceDisabled]: 'Service disabled',
    [APIErrorCodes.InsufficientFundsError]: 'Insufficient funds for transaction',
    [APIErrorCodes.EthSellNotSupported]: 'ETH selling is not supported',
    [APIErrorCodes.GasEstimationFailed]: 'Gas estimation failed',
};
var ValidationErrorReasons;
(function (ValidationErrorReasons) {
    ValidationErrorReasons["PercentageOutOfRange"] = "MUST_BE_LESS_THAN_OR_EQUAL_TO_ONE";
    ValidationErrorReasons["ConflictingFilteringArguments"] = "CONFLICTING_FILTERING_ARGUMENTS";
    ValidationErrorReasons["ArgumentNotYetSupported"] = "ARGUMENT_NOT_YET_SUPPORTED";
    ValidationErrorReasons["InvalidApiKey"] = "INVALID_API_KEY";
    ValidationErrorReasons["TakerAddressInvalid"] = "TAKER_ADDRESS_INVALID";
    ValidationErrorReasons["RequiresIntentOnFilling"] = "REQUIRES_INTENT_ON_FILLING";
    ValidationErrorReasons["UnfillableRequiresMakerAddress"] = "MAKER_ADDRESS_REQUIRED_TO_FETCH_UNFILLABLE_ORDERS";
    ValidationErrorReasons["MultipleFeeTypesUsed"] = "MULTIPLE_FEE_TYPES_USED";
    ValidationErrorReasons["FeeRecipientMissing"] = "FEE_RECIPIENT_MISSING";
    ValidationErrorReasons["MinSlippageTooLow"] = "MINIMUM_SLIPPAGE_IS_TOO_LOW";
    ValidationErrorReasons["PriceImpactTooHigh"] = "PRICE_IMPACT_TOO_HIGH";
    ValidationErrorReasons["InvalidGaslessFeeType"] = "INVALID_GASLESS_FEE_TYPE";
    ValidationErrorReasons["InvalidMetaTransactionVersion"] = "INVALID_META_TRANSACTION_VERSION";
})(ValidationErrorReasons = exports.ValidationErrorReasons || (exports.ValidationErrorReasons = {}));
class ExpiredOrderError extends api_utils_1.AlertError {
    constructor(order, currentThreshold, details) {
        super();
        this.order = order;
        this.currentThreshold = currentThreshold;
        this.details = details;
        this.message = `Found expired order!`;
        this.expiry = order.expiry.toNumber();
        this.expiredForSeconds = Date.now() / constants_1.ONE_SECOND_MS - this.expiry;
    }
}
exports.ExpiredOrderError = ExpiredOrderError;
class WebsocketServiceError extends api_utils_1.AlertError {
    constructor(error) {
        super();
        this.error = error;
        this.message = 'Error in the Websocket service!';
    }
}
exports.WebsocketServiceError = WebsocketServiceError;
//# sourceMappingURL=errors.js.map