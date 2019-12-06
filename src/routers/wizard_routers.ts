import * as express from 'express';
import * as asyncHandler from 'express-async-handler';

import { WizardHandlers } from '../handlers/wizard_handlers';

export const createWizardRouter = (): express.Router => {
    const router = express.Router();
    const handlers = new WizardHandlers();
    /**
     * GET AssetPairs endpoint retrieves a list of available asset pairs and the information required to trade them.
     * http://sra-spec.s3-website-us-east-1.amazonaws.com/#operation/getAssetPairs
     */
    router.get('/construct/step1', asyncHandler(handlers.constructStep1.bind(handlers)));
    router.post('/construct/step2', asyncHandler(handlers.constructStep2.bind(handlers)));
    return router;
};
