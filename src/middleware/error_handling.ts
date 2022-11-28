import { APIBaseError, BadRequestError, ErrorUtils as BaseErrorUtils, isAPIError } from '@0x/api-utils';
import { StatusCodes } from 'http-status-codes';

import { APIErrorCodes, apiErrorCodesToReasons } from '../errors';

class ErrorUtils extends BaseErrorUtils {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
    public generateError(err: Error): any {
        // handle error codes that are specific to 0x API
        if (
            isAPIError(err) &&
            isAPIBadRequestError(err) &&
            Object.values(APIErrorCodes).includes(err.generalErrorCode)
        ) {
            const statusCode = err.statusCode;
            const code = err.generalErrorCode;
            return {
                statusCode,
                errorBody: {
                    code,
                    reason: apiErrorCodesToReasons[code],
                },
            };
        }
        // otherwise use general error handling
        return super.generateError(err);
    }
}

function isAPIBadRequestError(error: APIBaseError): error is APIBaseError & BadRequestError<APIErrorCodes> {
    return error.statusCode === StatusCodes.BAD_REQUEST;
}

export const errorUtils = new ErrorUtils();
export const errorHandler = errorUtils.getErrorHandler();
