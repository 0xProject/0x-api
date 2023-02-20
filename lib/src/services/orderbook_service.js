"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBookService = void 0;
const _ = require("lodash");
const typeorm_1 = require("typeorm");
const asset_swapper_1 = require("../asset-swapper");
const config_1 = require("../config");
const constants_1 = require("../constants");
const entities_1 = require("../entities");
const errors_1 = require("../errors");
const logger_1 = require("../logger");
const types_1 = require("../types");
const order_utils_1 = require("../utils/order_utils");
const order_watcher_1 = require("../utils/order_watcher");
const pagination_utils_1 = require("../utils/pagination_utils");
class OrderBookService {
    constructor(connection, orderWatcher) {
        this._connection = connection;
        this._orderWatcher = orderWatcher;
    }
    static create(connection) {
        if (connection === undefined) {
            return undefined;
        }
        return new OrderBookService(connection, new order_watcher_1.OrderWatcher());
    }
    isAllowedPersistentOrders(apiKey) {
        return config_1.SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS.includes(apiKey);
    }
    async getOrderByHashIfExistsAsync(orderHash) {
        let signedOrderEntity;
        signedOrderEntity = await this._connection.manager.findOne(entities_1.SignedOrderV4Entity, orderHash);
        if (!signedOrderEntity) {
            signedOrderEntity = await this._connection.manager.findOne(entities_1.PersistentSignedOrderV4Entity, orderHash);
        }
        if (signedOrderEntity === undefined) {
            return undefined;
        }
        else {
            return order_utils_1.orderUtils.deserializeOrderToSRAOrder(signedOrderEntity);
        }
    }
    async getOrderBookAsync(page, perPage, baseToken, quoteToken) {
        const orderEntities = await this._connection.manager.find(entities_1.SignedOrderV4Entity, {
            where: {
                takerToken: (0, typeorm_1.In)([baseToken, quoteToken]),
                makerToken: (0, typeorm_1.In)([baseToken, quoteToken]),
            },
        });
        const bidSignedOrderEntities = orderEntities.filter((o) => o.takerToken === baseToken && o.makerToken === quoteToken);
        const askSignedOrderEntities = orderEntities.filter((o) => o.takerToken === quoteToken && o.makerToken === baseToken);
        const bidApiOrders = bidSignedOrderEntities
            .map(order_utils_1.orderUtils.deserializeOrderToSRAOrder)
            .filter(order_utils_1.orderUtils.isFreshOrder)
            .sort((orderA, orderB) => order_utils_1.orderUtils.compareBidOrder(orderA.order, orderB.order));
        const askApiOrders = askSignedOrderEntities
            .map(order_utils_1.orderUtils.deserializeOrderToSRAOrder)
            .filter(order_utils_1.orderUtils.isFreshOrder)
            .sort((orderA, orderB) => order_utils_1.orderUtils.compareAskOrder(orderA.order, orderB.order));
        const paginatedBidApiOrders = pagination_utils_1.paginationUtils.paginate(bidApiOrders, page, perPage);
        const paginatedAskApiOrders = pagination_utils_1.paginationUtils.paginate(askApiOrders, page, perPage);
        return {
            bids: paginatedBidApiOrders,
            asks: paginatedAskApiOrders,
        };
    }
    async getOrdersAsync(page, perPage, orderFieldFilters, additionalFilters) {
        // Validation
        if (additionalFilters.isUnfillable === true && orderFieldFilters.maker === undefined) {
            throw new errors_1.ValidationError([
                {
                    field: 'maker',
                    code: errors_1.ValidationErrorCodes.RequiredField,
                    reason: errors_1.ValidationErrorReasons.UnfillableRequiresMakerAddress,
                },
            ]);
        }
        // Each array element in `filters` is an OR subclause
        const filters = [];
        // Pre-filters; exists in the entity verbatim
        const columnNames = this._connection.getMetadata(entities_1.SignedOrderV4Entity).columns.map((x) => x.propertyName);
        const orderFilter = _.pickBy(orderFieldFilters, (v, k) => {
            return columnNames.includes(k);
        });
        // Post-filters; filters that don't exist verbatim
        if (additionalFilters.trader) {
            filters.push({
                ...orderFilter,
                maker: additionalFilters.trader,
            });
            filters.push({
                ...orderFilter,
                taker: additionalFilters.trader,
            });
        }
        else {
            filters.push(orderFilter);
        }
        // Add an expiry time check to all filters
        const minExpiryTime = Math.floor(Date.now() / constants_1.ONE_SECOND_MS) + config_1.SRA_ORDER_EXPIRATION_BUFFER_SECONDS;
        const filtersWithExpirationCheck = filters.map((filter) => ({
            ...filter,
            expiry: (0, typeorm_1.MoreThanOrEqual)(minExpiryTime),
        }));
        const [signedOrderCount, signedOrderEntities] = await Promise.all([
            this._connection.manager.count(entities_1.SignedOrderV4Entity, {
                where: filtersWithExpirationCheck,
            }),
            this._connection.manager.find(entities_1.SignedOrderV4Entity, {
                where: filtersWithExpirationCheck,
                ...pagination_utils_1.paginationUtils.paginateDBFilters(page, perPage),
                order: {
                    hash: 'ASC',
                },
            }),
        ]);
        const apiOrders = signedOrderEntities.map(order_utils_1.orderUtils.deserializeOrderToSRAOrder);
        // Join with persistent orders
        let persistentOrders = [];
        let persistentOrdersCount = 0;
        if (additionalFilters.isUnfillable === true) {
            const removedStates = [
                types_1.OrderEventEndState.Cancelled,
                types_1.OrderEventEndState.Expired,
                types_1.OrderEventEndState.FullyFilled,
                types_1.OrderEventEndState.Invalid,
                types_1.OrderEventEndState.StoppedWatching,
                types_1.OrderEventEndState.Unfunded,
            ];
            const filtersWithoutDuplicateSignedOrders = filters.map((filter) => ({
                ...filter,
                orderState: (0, typeorm_1.In)(removedStates),
            }));
            let persistentOrderEntities = [];
            [persistentOrdersCount, persistentOrderEntities] = await Promise.all([
                this._connection.manager.count(entities_1.PersistentSignedOrderV4Entity, {
                    where: filtersWithoutDuplicateSignedOrders,
                }),
                this._connection.manager.find(entities_1.PersistentSignedOrderV4Entity, {
                    where: filtersWithoutDuplicateSignedOrders,
                    ...pagination_utils_1.paginationUtils.paginateDBFilters(page, perPage),
                    order: {
                        hash: 'ASC',
                    },
                }),
            ]);
            persistentOrders = persistentOrderEntities.map(order_utils_1.orderUtils.deserializeOrderToSRAOrder);
        }
        const allOrders = apiOrders.concat(persistentOrders);
        const total = signedOrderCount + persistentOrdersCount;
        // Paginate
        const paginatedApiOrders = pagination_utils_1.paginationUtils.paginateSerialize(allOrders, total, page, perPage);
        return paginatedApiOrders;
    }
    async getBatchOrdersAsync(page, perPage, makerTokens, takerTokens) {
        const filterObject = {
            makerToken: (0, typeorm_1.In)(makerTokens),
            takerToken: (0, typeorm_1.In)(takerTokens),
        };
        const signedOrderEntities = (await this._connection.manager.find(entities_1.SignedOrderV4Entity, {
            where: filterObject,
        }));
        const apiOrders = signedOrderEntities.map(order_utils_1.orderUtils.deserializeOrderToSRAOrder);
        // check for expired orders
        const { fresh, expired } = order_utils_1.orderUtils.groupByFreshness(apiOrders, config_1.SRA_ORDER_EXPIRATION_BUFFER_SECONDS);
        (0, logger_1.alertOnExpiredOrders)(expired);
        const paginatedApiOrders = pagination_utils_1.paginationUtils.paginate(fresh, page, perPage);
        return paginatedApiOrders;
    }
    async addOrderAsync(signedOrder) {
        await this._orderWatcher.postOrdersAsync([signedOrder]);
    }
    async addOrdersAsync(signedOrders) {
        await this._orderWatcher.postOrdersAsync(signedOrders);
    }
    async addPersistentOrdersAsync(signedOrders) {
        await this._orderWatcher.postOrdersAsync(signedOrders);
        // Figure out which orders were accepted by looking for them in the database.
        const hashes = signedOrders.map((o) => {
            const limitOrder = new asset_swapper_1.LimitOrder(o);
            return limitOrder.getHash();
        });
        const addedOrders = await this._connection.manager.find(entities_1.SignedOrderV4Entity, {
            where: { hash: (0, typeorm_1.In)(hashes) },
        });
        // MAX SQL variable size is 999. This limit is imposed via Sqlite.
        // The SELECT query is not entirely effecient and pulls in all attributes
        // so we need to leave space for the attributes on the model represented
        // as SQL variables in the "AS" syntax. We leave 99 free for the
        // signedOrders model
        await this._connection
            .getRepository(entities_1.PersistentSignedOrderV4Entity)
            .save(addedOrders, { chunk: config_1.DB_ORDERS_UPDATE_CHUNK_SIZE });
    }
}
exports.OrderBookService = OrderBookService;
//# sourceMappingURL=orderbook_service.js.map