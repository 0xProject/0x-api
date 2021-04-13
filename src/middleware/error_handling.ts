import { APIBaseError, BadRequestError, ErrorUtils as BaseErrorUtils, isAPIError } from '@0x/api-utils';
import * as HttpStatus from 'http-status-codes';

import { APIErrorCodes, apiErrorCodesToReasons } from '../errors';
import { logger } from '../logger';

export { isAPIError, isRevertError } from '@0x/api-utils';

class ErrorUtils extends BaseErrorUtils {
    public generateError(err: Error): any {
        if (isAPIError(err) && isAPIBadRequestError(err)) {
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
        return super.generateError(err);
    }
    constructor() {
        super(logger);
    }
}

function isAPIBadRequestError(error: APIBaseError): error is APIBaseError & BadRequestError<APIErrorCodes> {
    return error.statusCode === HttpStatus.BAD_REQUEST;
}

export const errorUtils = new ErrorUtils();
export const errorHandler = errorUtils.getErrorHandler();
