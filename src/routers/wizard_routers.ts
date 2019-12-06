import * as express from 'express';
import * as asyncHandler from 'express-async-handler';

import { GetOrderInfoWizardHandlers, CreateOrderWizardHandlers, CancelOrdersWizardHandlers } from '../handlers/wizard_handlers';

export const createWizardRouter = (): express.Router => {
    const router = express.Router();
    const getOrderInfoHandlers = new GetOrderInfoWizardHandlers();
    const createOrderHandlers = new CreateOrderWizardHandlers();
    const cancelHandlers = new CancelOrdersWizardHandlers();
    /**
     * GET AssetPairs endpoint retrieves a list of available asset pairs and the information required to trade them.
     * http://sra-spec.s3-website-us-east-1.amazonaws.com/#operation/getAssetPairs
     */
    router.get('/construct/step1', asyncHandler(createOrderHandlers.constructStep1.bind(createOrderHandlers)));
    router.post('/construct/step2', asyncHandler(createOrderHandlers.constructStep2.bind(createOrderHandlers)));

    router.post('/get_info', asyncHandler(getOrderInfoHandlers.constructStep1.bind(getOrderInfoHandlers)));
    router.post('/cancel', asyncHandler(cancelHandlers.constructStep1.bind(getOrderInfoHandlers)));
    return router;
};
