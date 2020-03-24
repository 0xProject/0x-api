import bodyParser = require('body-parser');
import * as cors from 'cors';
import * as express from 'express';
import * as asyncHandler from 'express-async-handler';
import { Connection } from 'typeorm';

import * as defaultConfig from '../config';
import { SignerHandlers } from '../handlers/signer_handlers';
import { logger } from '../logger';
import { errorHandler } from '../middleware/error_handling';
import { requestLogger } from '../middleware/request_logger';
import { SignerService } from '../services/signer_service';
import { providerUtils } from '../utils/provider_utils';

if (require.main === module) {
    (async () => {
        const app = express();
        app.use(requestLogger());
        app.use(cors());
        app.use(bodyParser.json());

        const signerService = new SignerService();
        const handlers = new SignerHandlers(signerService);
        app.post('/sign', asyncHandler(handlers.signZeroExTransactionAsync.bind(handlers)));
        app.post('/whitelist', asyncHandler(handlers.whitelistZeroExTransactionAsync.bind(handlers)));

        app.use(errorHandler);

        logger.info('Signing Service started!');
    })().catch(error => logger.error(error));
}
process.on('uncaughtException', err => {
    logger.error(err);
    process.exit(1);
});

process.on('unhandledRejection', err => {
    if (err) {
        logger.error(err);
    }
});
