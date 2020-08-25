import { APIOrder } from '@0x/types';
import * as pino from 'pino';

import {
    LOG_ASYNC_ENABLED,
    LOG_ASYNC_FLUSH_INTERVAL_SEC,
    LOG_BUFFER_BYTES,
    LOG_LEVEL,
    LOGGER_INCLUDE_TIMESTAMP,
    MAX_ORDER_EXPIRATION_BUFFER_SECONDS,
} from './config';
import { ONE_SECOND_MS } from './constants';
import { ExpiredOrderError } from './errors';

const pinoDestination = pino.destination({
    minLength: LOG_BUFFER_BYTES, // Buffer before writing
    sync: !LOG_ASYNC_ENABLED, // Asynchronous logging
});

export const logger = pino(
    {
        level: LOG_LEVEL,
        useLevelLabels: true,
        timestamp: LOGGER_INCLUDE_TIMESTAMP,
    },
    pinoDestination,
);

if (LOG_ASYNC_ENABLED) {
    // asynchronously flush every 10 seconds to keep the buffer empty
    // in periods of low activity
    setInterval(() => {
        logger.flush();
    }, ONE_SECOND_MS * LOG_ASYNC_FLUSH_INTERVAL_SEC).unref();
}

/**
 * If the max age of expired orders exceeds the configured threshold, this function
 * logs an error capturing the details of the expired orders
 */
export function alertOnExpiredOrders(expired: APIOrder[], details?: string): void {
    const maxExpirationTimeSeconds = Date.now() / ONE_SECOND_MS + MAX_ORDER_EXPIRATION_BUFFER_SECONDS;
    let idx = 0;
    if (
        expired.find((order, i) => {
            idx = i;
            return order.order.expirationTimeSeconds.toNumber() > maxExpirationTimeSeconds;
        })
    ) {
        const error = new ExpiredOrderError(expired[idx].order, MAX_ORDER_EXPIRATION_BUFFER_SECONDS, details);
        logger.error(error);
    }
}
