import * as express from 'express';
import * as HttpStatus from 'http-status-codes';

import {
    APIBaseError,
    BadRequestError,
    ErrorBodyWithHTTPStatusCode,
    GeneralErrorCodes,
    generalErrorCodeToReason,
    ValidationError,
} from '../errors';
import { logger } from '../logger';

/**
 * Wraps an Error with a JSON human readable reason and status code.
 */
export function generateError(err: Error): ErrorBodyWithHTTPStatusCode {
    if ((err as any).isAPIError) {
        const apiError = err as APIBaseError;
        const statusCode = apiError.statusCode;
        if (apiError.statusCode === HttpStatus.BAD_REQUEST) {
            const badRequestError = apiError as BadRequestError;
            if (badRequestError.generalErrorCode === GeneralErrorCodes.ValidationError) {
                const validationError = badRequestError as ValidationError;
                return {
                    statusCode,
                    errorBody: {
                        code: badRequestError.generalErrorCode,
                        reason: generalErrorCodeToReason[badRequestError.generalErrorCode],
                        validationErrors: validationError.validationErrors,
                    },
                };
            } else {
                return {
                    statusCode,
                    errorBody: {
                        code: badRequestError.generalErrorCode,
                        reason: generalErrorCodeToReason[badRequestError.generalErrorCode],
                    },
                };
            }
        } else {
            return {
                statusCode,
                errorBody: {
                    reason: HttpStatus.getStatusText(apiError.statusCode),
                },
            };
        }
    } else if ((err as any).statusCode) {
        return {
            statusCode: HttpStatus.BAD_REQUEST,
            errorBody: {
                reason: err.message,
            },
        };
    } else {
        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            errorBody: {
                reason: err.message,
            },
        };
    }
}

/**
 * Catches errors thrown by our code and serialies them
 */
export function errorHandler(
    err: Error,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
): void {
    // If you call next() with an error after you have started writing the response
    // (for example, if you encounter an error while streaming the response to the client)
    // the Express default error handler closes the connection and fails the request.
    if (res.headersSent) {
        return next(err);
    }

    const { statusCode, errorBody } = generateError(err);
    res.status(statusCode).send(errorBody);

    // If the error is an internal error, log it with the stack!
    // All other error responses are logged as part of request logging
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
        logger.error(err);
        next(err);
    }
}
