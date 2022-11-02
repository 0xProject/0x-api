import * as express from 'express';
import * as asyncHandler from 'express-async-handler';

import { OfferHandlers } from '../handlers/offer_handlers';
import { OfferService } from '../services/offer_service';

// tslint:disable-next-line:completed-docs
export function createOfferRouter(offerService: OfferService): express.Router {
    const router = express.Router();
    const handlers = new OfferHandlers(offerService);
    /**
     * GET OfferCreateContingentPool retrieves the OfferCreateContingentPool by offer hash.
     */
    router.get(
        '/offer_create_contingent_pool/:offerHash',
        asyncHandler(handlers.getOfferCreateContingentPoolByOfferHashAsync.bind(handlers)),
    );
    /**
     * GET OfferCreateContingentPool retrieves a list of OfferCreateContingentPools given query parameters.
     */
    router.get('/offer_create_contingent_pool', asyncHandler(handlers.offerCreateContingentPoolsAsync.bind(handlers)));
    /**
     * POST OfferCreateContingentPool endpoint submits an OfferCreateContingentPool to the Relayer.
     */
    router.post(
        '/offer_create_contingent_pool',
        asyncHandler(handlers.postOfferCreateContingentPoolAsync.bind(handlers)),
    );
    /**
     * GET OfferAddLiquidity endpoint retrieves the OfferAddLiquidity by offer hash.
     */
    router.get(
        '/offer_add_liquidity/:offerHash',
        asyncHandler(handlers.getOfferAddLiquidityByOfferHashAsync.bind(handlers)),
    );
    /**
     * GET OfferAddLiquidity endpoint retrieves a list of OfferAddLiquidities given query parameters.
     */
    router.get('/offer_add_liquidity', asyncHandler(handlers.offerAddLiquidityAsync.bind(handlers)));
    /**
     * POST OfferAddLiquidity endpoint submits an OfferAddLiquidity to the Relayer.
     */
    router.post('/offer_add_liquidity', asyncHandler(handlers.postOfferAddLiquidityAsync.bind(handlers)));
    /**
     * GET OfferRemoveLiquidity endpoint retrieves the OfferRemoveLiquidity by offer hash.
     */
    router.get(
        '/offer_remove_liquidity/:offerHash',
        asyncHandler(handlers.getOfferRemoveLiquidityByOfferHashAsync.bind(handlers)),
    );
    /**
     * GET OfferRemoveLiquidity endpoint retrieves a list of OfferRemoveLiquidities given query parameters.
     */
    router.get('/offer_remove_liquidity', asyncHandler(handlers.offerRemoveLiquidityAsync.bind(handlers)));
    /**
     * POST OfferRemoveLiquidity endpoint submits an OfferRemoveLiquidity to the Relayer.
     */
    router.post('/offer_remove_liquidity', asyncHandler(handlers.postOfferRemoveLiquidityAsync.bind(handlers)));
    return router;
}
