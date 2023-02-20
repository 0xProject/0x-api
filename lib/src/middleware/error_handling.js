"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.errorUtils = void 0;
const api_utils_1 = require("@0x/api-utils");
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../errors");
class ErrorUtils extends api_utils_1.ErrorUtils {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
    generateError(err) {
        // handle error codes that are specific to 0x API
        if ((0, api_utils_1.isAPIError)(err) &&
            isAPIBadRequestError(err) &&
            Object.values(errors_1.APIErrorCodes).includes(err.generalErrorCode)) {
            const statusCode = err.statusCode;
            const code = err.generalErrorCode;
            return {
                statusCode,
                errorBody: {
                    code,
                    reason: errors_1.apiErrorCodesToReasons[code],
                },
            };
        }
        // otherwise use general error handling
        return super.generateError(err);
    }
}
function isAPIBadRequestError(error) {
    return error.statusCode === http_status_codes_1.StatusCodes.BAD_REQUEST;
}
exports.errorUtils = new ErrorUtils();
exports.errorHandler = exports.errorUtils.getErrorHandler();
//# sourceMappingURL=error_handling.js.map