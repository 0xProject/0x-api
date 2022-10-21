import * as express from 'express';
import * as asyncHandler from 'express-async-handler';

import { SRAHandlers } from '../handlers/sra_handlers';
import { OrderBookService } from '../services/orderbook_service';

// tslint:disable-next-line:completed-docs
export function createOrderBookRouter(orderBook: OrderBookService): express.Router {
    const router = express.Router();
    const handlers = new SRAHandlers(orderBook);
    /**
     * GET Orderbook endpoint retrieves the orderbook for a given asset pair.
     */
    router.get('/', asyncHandler(handlers.orderbookAsync.bind(handlers)));
    /**
     * GET Price endpoint retrieves the prices by order hash.
     */
    router.get('/prices', asyncHandler(handlers.orderbookPricesAsync.bind(handlers)));
    /**
     * GET Orders endpoint retrieves a list of orders given query parameters.
     */
    router.get('/orders', asyncHandler(handlers.ordersAsync.bind(handlers)));
    /**
     * GET FeeRecepients endpoint retrieves a collection of all fee recipient addresses for a relayer.
     */
    router.get('/fee_recipients', SRAHandlers.feeRecipients.bind(SRAHandlers));
    /**
     * POST Order config endpoint retrives the values for order fields that the relayer requires.
     */
    router.post('/order_config', SRAHandlers.orderConfig.bind(SRAHandlers));
    /**
     * POST Order endpoint submits an order to the Relayer.
     */
    router.post('/order', asyncHandler(handlers.postOrderAsync.bind(handlers)));
    /**
     * POST Orders endpoint submits several orders to the Relayer.
     * This is an additional endpoint not a part of the official SRA standard
     */
    router.post('/orders', asyncHandler(handlers.postOrdersAsync.bind(handlers)));
    /**
     * POST Persistent order endpoint submits an order that will be persisted even after cancellation or expiration.
     * Requires an API Key
     */
    router.post('/order/persistent', asyncHandler(handlers.postPersistentOrderAsync.bind(handlers)));
    /**
     * GET Order endpoint retrieves the order by order hash.
     */
    router.get('/order/:orderHash', asyncHandler(handlers.getOrderByHashAsync.bind(handlers)));
    /**
     * GET Offer endpoint retrieves the offer by offer hash.
     */
    router.get(
        '/offer_create_contingent_pool/:offerHash',
        asyncHandler(handlers.getOfferByOfferHashAsync.bind(handlers)),
    );
    /**
     * GET Offers endpoint retrieves a list of offers given query parameters.
     */
    router.get('/offers_create_contingent_pool', asyncHandler(handlers.offersAsync.bind(handlers)));
    /**
     * POST Offer endpoint submits an offer to the Relayer.
     */
    router.post('/offer_create_contingent_pool', asyncHandler(handlers.postOfferAsync.bind(handlers)));
    /**
     * GET Offer liquidity endpoint retrieves the AddOfferLiquidity by offer hash.
     */
    router.get(
        '/offer_add_liquidity/:offerHash',
        asyncHandler(handlers.getOfferLiquidityByOfferHashAsync.bind(handlers)),
    );
    /**
     * GET Offer liquidity endpoint retrieves a list of AddOfferLiquidity given query parameters.
     */
    router.get('/offers_add_liquidity', asyncHandler(handlers.offerLiquiditiesAsync.bind(handlers)));
    /**
     * POST Offer liquidity endpoint submits an AddOfferLiquidity to the Relayer.
     */
    router.post('/offer_add_liquidity', asyncHandler(handlers.postOfferLiquidityAsync.bind(handlers)));
    return router;
}
