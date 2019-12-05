// tslint:disable-next-line:no-implicit-dependencies
import * as core from 'express-serve-static-core';
import * as pino from 'pino';

export const logger = pino();

/**
 * log middleware
 */
export function logMiddleware(): core.RequestHandler {
    const handler = (req: any, res: any, next: core.NextFunction) => {
        const startTime = Date.now();
        function writeLog(): void {
            const responseTime = Date.now() - startTime;
            res.removeListener('finish', writeLog);
            res.removeListener('close', writeLog);
            const logMsg = {
                req: {
                    url: req.originalUrl.split('?')[0],
                    method: req.method,
                    headers: {
                        'user-agent': req.headers['user-agent'],
                        host: req.headers.host,
                    },
                    body: req.body,
                    params: req.params,
                    query: req.query,
                },
                res: {
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    error: res.error,
                },
                responseTime,
                timestamp: Date.now(),
            };
            logger.info(logMsg);
        }
        res.on('finish', writeLog);
        res.on('close', writeLog);
        req.log = logger;
        next();
    };
    return handler;
}
