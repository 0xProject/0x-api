import { LimitOrderFields } from '@0x/protocol-utils';
import { BigNumber } from '@0x/utils';
import { getAddress } from '@ethersproject/address';
import * as _ from 'lodash';
import { Connection, In, MoreThanOrEqual } from 'typeorm';

import { LimitOrder } from '../asset-swapper';
import { fetchPoolLists } from '../asset-swapper/utils/market_operation_utils/pools_cache/pool_list_cache';
import {
    DB_ORDERS_UPDATE_CHUNK_SIZE,
    SRA_ORDER_EXPIRATION_BUFFER_SECONDS,
    SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS,
} from '../config';
import {
    ONE_SECOND_MS,
    NULL_ADDRESS,
    DIVA_GOVERNANCE_ADDRESS
} from '../constants';
import { PersistentSignedOrderV4Entity, SignedOrderV4Entity } from '../entities';
import { ValidationError, ValidationErrorCodes, ValidationErrorReasons } from '../errors';
import { alertOnExpiredOrders } from '../logger';
import {
    OrderbookResponse,
    OrderEventEndState,
    PaginatedCollection,
    SignedLimitOrder,
    SRAOrder,
    OrderbookPriceRequest
} from '../types';
import { orderUtils } from '../utils/order_utils';
import { OrderWatcherInterface } from '../utils/order_watcher';
import { paginationUtils } from '../utils/pagination_utils';

export class OrderBookService {
    private readonly _connection: Connection;
    private readonly _orderWatcher: OrderWatcherInterface;
    public static isAllowedPersistentOrders(apiKey: string): boolean {
        return SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS.includes(apiKey);
    }
    public async getOrderByHashIfExistsAsync(orderHash: string): Promise<SRAOrder | undefined> {
        let signedOrderEntity;
        signedOrderEntity = await this._connection.manager.findOne(SignedOrderV4Entity, orderHash);
        if (!signedOrderEntity) {
            signedOrderEntity = await this._connection.manager.findOne(PersistentSignedOrderV4Entity, orderHash);
        }
        if (signedOrderEntity === undefined) {
            return undefined;
        } else {
            return orderUtils.deserializeOrderToSRAOrder(signedOrderEntity as Required<SignedOrderV4Entity>);
        }
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async getOrderBookAsync(
        page: number,
        perPage: number,
        baseToken: string,
        quoteToken: string,
    ): Promise<OrderbookResponse> {
        const orderEntities = await this._connection.manager.find(SignedOrderV4Entity, {
            where: {
                takerToken: In([baseToken, quoteToken]),
                makerToken: In([baseToken, quoteToken]),
            },
        });
        const bidSignedOrderEntities = orderEntities.filter(
            (o) => o.takerToken === baseToken && o.makerToken === quoteToken,
        );
        const askSignedOrderEntities = orderEntities.filter(
            (o) => o.takerToken === quoteToken && o.makerToken === baseToken,
        );
        const bidApiOrders: SRAOrder[] = (bidSignedOrderEntities as Required<SignedOrderV4Entity>[])
            .map(orderUtils.deserializeOrderToSRAOrder)
            .filter(orderUtils.isFreshOrder)
            .sort((orderA, orderB) => orderUtils.compareBidOrder(orderA.order, orderB.order));
        const askApiOrders: SRAOrder[] = (askSignedOrderEntities as Required<SignedOrderV4Entity>[])
            .map(orderUtils.deserializeOrderToSRAOrder)
            .filter(orderUtils.isFreshOrder)
            .sort((orderA, orderB) => orderUtils.compareAskOrder(orderA.order, orderB.order));
        const paginatedBidApiOrders = paginationUtils.paginate(bidApiOrders, page, perPage);
        const paginatedAskApiOrders = paginationUtils.paginate(askApiOrders, page, perPage);
        return {
            bids: paginatedBidApiOrders,
            asks: paginatedAskApiOrders,
        };
    }

    public checkBidsOrAsks = (order: SRAOrder,req: OrderbookPriceRequest): boolean => {
        // 1 is 0.001% and the actual amount is token fee / 100000, so we divided it by 100000
        const takerTokenFeeAmountExpected = order.order.takerAmount.multipliedBy(new BigNumber(req.takerTokenFee / 100000));

        if (order.order.taker === NULL_ADDRESS && // Ensure that orders are fillable by anyone and not reserved for a specific address
            order.order.feeRecipient === DIVA_GOVERNANCE_ADDRESS.toLowerCase() && // Ensure that the feeRecipient is DIVA Governance address
            (order.order.takerTokenFeeAmount.lte(takerTokenFeeAmountExpected.minus(1)) ||
            order.order.takerTokenFeeAmount.gte(takerTokenFeeAmountExpected.plus(1)))
        ) {
            return false;
        }
        if (req.taker !== NULL_ADDRESS && req.taker !== order.order.taker.toLowerCase()) {
            return false;
        }
        if (req.feeRecipient !== NULL_ADDRESS && order.order.feeRecipient.toLowerCase() !== req.feeRecipient) {
            return false;
        }
        if (req.takerTokenFee !== 0) {
            const toleranceTakerTokenFeeAmount = new BigNumber(1);

            if (order.order.takerTokenFeeAmount.lte(takerTokenFeeAmountExpected.minus(toleranceTakerTokenFeeAmount)) ||
                order.order.takerTokenFeeAmount.gte(takerTokenFeeAmountExpected.plus(toleranceTakerTokenFeeAmount))
            ) {
                return false;
            }
        }
        if (req.threshold !== 0 && order.metaData.remainingFillableTakerAmount.lte(req.threshold)) {
            return false;
        }

        return true;
    }

    public getBidOrAskFormat = (record: SRAOrder) => {
        return {
            order: {
                maker: getAddress(record.order.maker),
                taker: getAddress(record.order.taker),
                makerToken: getAddress(record.order.makerToken),
                takerToken: getAddress(record.order.takerToken),
                makerAmount: record.order.makerAmount,
                takerAmount: record.order.takerAmount,
                takerTokenFeeAmount: record.order.takerTokenFeeAmount,
                feeRecipient: getAddress(record.order.feeRecipient),
                expiry: record.order.expiry,
            },
            metaData: {
                remainingFillableTakerAmount: record.metaData.remainingFillableTakerAmount,
            }
        }
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getPricesAsync(req: OrderbookPriceRequest): Promise<any> {
        const result: any[] = [];
        const res = await fetchPoolLists(req.page, req.perPage, req.createdBy, req.graphUrl);
        let pools: any[] = [];
        res.map((pool: any) => {
            pools.push({
                baseToken: pool.longToken.id,
                quoteToken: pool.collateralToken.id,
            });

            pools.push({
                baseToken: pool.shortToken.id,
                quoteToken: pool.collateralToken.id,
            })
        })

        // Get all tokens list
        await Promise.all(pools.map(async (pool) => {
            let priceResponse = await this.getOrderBookAsync(1, 1000, pool.baseToken, pool.quoteToken);
            pool.bids = priceResponse.bids.records;
            pool.asks = priceResponse.asks.records;
        }));

        // Get best bid and ask
        for (let i = 0; i < pools.length; i++) {
            let filterBid = {};
            let count = 0;
            if (pools[i].bids.length !== 0) {
                while(count < pools[i].bids.length) {
                    if (this.checkBidsOrAsks(pools[i].bids[count], req)) {
                        filterBid = this.getBidOrAskFormat(pools[i].bids[count]);
                        break;
                    }
                    count++;
                }
            }

            let filterAsk = {};
            count = 0;
            if (pools[i].asks.length !== 0) {
                while(count < pools[i].asks.length) {
                    if (this.checkBidsOrAsks(pools[i].asks[count], req)) {
                        filterAsk = this.getBidOrAskFormat(pools[i].asks[count]);
                        break;
                    }
                    count++;
                }
            }

            result.push({
                baseToken: getAddress(pools[i].baseToken),
                quoteToken: getAddress(pools[i].quoteToken),
                bid: filterBid,
                ask: filterAsk,
            })
        }

        return paginationUtils.paginate(result, req.page, req.perPage);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOrdersAsync(
        page: number,
        perPage: number,
        orderFieldFilters: Partial<SignedOrderV4Entity>,
        additionalFilters: { isUnfillable?: boolean; trader?: string },
    ): Promise<PaginatedCollection<SRAOrder>> {
        // Validation
        if (additionalFilters.isUnfillable === true && orderFieldFilters.maker === undefined) {
            throw new ValidationError([
                {
                    field: 'maker',
                    code: ValidationErrorCodes.RequiredField,
                    reason: ValidationErrorReasons.UnfillableRequiresMakerAddress,
                },
            ]);
        }

        // Each array element in `filters` is an OR subclause
        const filters = [];

        // Pre-filters; exists in the entity verbatim
        const columnNames = this._connection.getMetadata(SignedOrderV4Entity).columns.map((x) => x.propertyName);
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
        } else {
            filters.push(orderFilter);
        }

        // Add an expiry time check to all filters
        const minExpiryTime = Math.floor(Date.now() / ONE_SECOND_MS) + SRA_ORDER_EXPIRATION_BUFFER_SECONDS;
        const filtersWithExpirationCheck = filters.map((filter) => ({
            ...filter,
            expiry: MoreThanOrEqual(minExpiryTime),
        }));

        const [signedOrderCount, signedOrderEntities] = await Promise.all([
            this._connection.manager.count(SignedOrderV4Entity, {
                where: filtersWithExpirationCheck,
            }),
            this._connection.manager.find(SignedOrderV4Entity, {
                where: filtersWithExpirationCheck,
                ...paginationUtils.paginateDBFilters(page, perPage),
                order: {
                    hash: 'ASC',
                },
            }),
        ]);
        const apiOrders = (signedOrderEntities as Required<SignedOrderV4Entity>[]).map(
            orderUtils.deserializeOrderToSRAOrder,
        );

        // Join with persistent orders
        let persistentOrders: SRAOrder[] = [];
        let persistentOrdersCount = 0;
        if (additionalFilters.isUnfillable === true) {
            const removedStates = [
                OrderEventEndState.Cancelled,
                OrderEventEndState.Expired,
                OrderEventEndState.FullyFilled,
                OrderEventEndState.Invalid,
                OrderEventEndState.StoppedWatching,
                OrderEventEndState.Unfunded,
            ];
            const filtersWithoutDuplicateSignedOrders = filters.map((filter) => ({
                ...filter,
                orderState: In(removedStates),
            }));
            let persistentOrderEntities = [];
            [persistentOrdersCount, persistentOrderEntities] = await Promise.all([
                this._connection.manager.count(PersistentSignedOrderV4Entity, {
                    where: filtersWithoutDuplicateSignedOrders,
                }),
                this._connection.manager.find(PersistentSignedOrderV4Entity, {
                    where: filtersWithoutDuplicateSignedOrders,
                    ...paginationUtils.paginateDBFilters(page, perPage),
                    order: {
                        hash: 'ASC',
                    },
                }),
            ]);
            persistentOrders = (persistentOrderEntities as Required<PersistentSignedOrderV4Entity>[]).map(
                orderUtils.deserializeOrderToSRAOrder,
            );
        }

        const allOrders = apiOrders.concat(persistentOrders);
        const total = signedOrderCount + persistentOrdersCount;

        // Paginate
        const paginatedApiOrders = paginationUtils.paginateSerialize(allOrders, total, page, perPage);
        return paginatedApiOrders;
    }
    public async getBatchOrdersAsync(
        page: number,
        perPage: number,
        makerTokens: string[],
        takerTokens: string[],
    ): Promise<PaginatedCollection<SRAOrder>> {
        const filterObject = {
            makerToken: In(makerTokens),
            takerToken: In(takerTokens),
        };
        const signedOrderEntities = (await this._connection.manager.find(SignedOrderV4Entity, {
            where: filterObject,
        })) as Required<SignedOrderV4Entity>[];
        const apiOrders = signedOrderEntities.map(orderUtils.deserializeOrderToSRAOrder);

        // check for expired orders
        const { fresh, expired } = orderUtils.groupByFreshness(apiOrders, SRA_ORDER_EXPIRATION_BUFFER_SECONDS);
        alertOnExpiredOrders(expired);

        const paginatedApiOrders = paginationUtils.paginate(fresh, page, perPage);
        return paginatedApiOrders;
    }
    constructor(connection: Connection, orderWatcher: OrderWatcherInterface) {
        this._connection = connection;
        this._orderWatcher = orderWatcher;
    }
    public async addOrderAsync(signedOrder: SignedLimitOrder): Promise<void> {
        await this._orderWatcher.postOrdersAsync([signedOrder]);
    }
    public async addOrdersAsync(signedOrders: SignedLimitOrder[]): Promise<void> {
        await this._orderWatcher.postOrdersAsync(signedOrders);
    }
    public async addPersistentOrdersAsync(signedOrders: SignedLimitOrder[]): Promise<void> {
        await this._orderWatcher.postOrdersAsync(signedOrders);

        // Figure out which orders were accepted by looking for them in the database.
        const hashes = signedOrders.map((o) => {
            const limitOrder = new LimitOrder(o as LimitOrderFields);
            return limitOrder.getHash();
        });
        const addedOrders = await this._connection.manager.find(SignedOrderV4Entity, {
            where: { hash: In(hashes) },
        });
        // MAX SQL variable size is 999. This limit is imposed via Sqlite.
        // The SELECT query is not entirely effecient and pulls in all attributes
        // so we need to leave space for the attributes on the model represented
        // as SQL variables in the "AS" syntax. We leave 99 free for the
        // signedOrders model
        await this._connection
            .getRepository(PersistentSignedOrderV4Entity)
            .save(addedOrders, { chunk: DB_ORDERS_UPDATE_CHUNK_SIZE });
    }
}
