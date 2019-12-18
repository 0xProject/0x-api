import { getAppAsync } from './app';
import { logger } from './logger';

// start the app
getAppAsync().catch(error => logger.error(error));

process.on('uncaughtException', err => {
    logger.error(err);
    process.exit(1);
});

process.on('unhandledRejection', err => {
    if (err) {
        logger.error(err);
    }
});
