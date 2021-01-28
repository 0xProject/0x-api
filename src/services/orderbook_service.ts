import { OrderEventEndState } from '@0x/mesh-graphql-client';
import { AssetPairsItem, OrderbookResponse, PaginatedCollection } from '@0x/types';
import * as _ from 'lodash';
import { Connection, In } from 'typeorm';

import {
    DB_ORDERS_UPDATE_CHUNK_SIZE,
    SRA_ORDER_EXPIRATION_BUFFER_SECONDS,
    SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS,
} from '../config';
import { PersistentSignedOrderV4Entity, SignedOrderV4Entity } from '../entities';
import { ValidationError, ValidationErrorCodes, ValidationErrorReasons } from '../errors';
import { alertOnExpiredOrders } from '../logger';
import {
    AcceptedOrderResult,
    APIOrder,
    APIOrderWithMetaData,
    PinResult,
    SignedLimitOrder,
    SRAGetOrdersRequestOpts,
} from '../types';
import { MeshClient } from '../utils/mesh_client';
import { meshUtils } from '../utils/mesh_utils';
import { orderUtils } from '../utils/order_utils';
import { paginationUtils } from '../utils/pagination_utils';

export class OrderBookService {
    private readonly _meshClient?: MeshClient;
    private readonly _connection: Connection;
    public static isAllowedPersistentOrders(apiKey: string): boolean {
        return SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS.includes(apiKey);
    }
    public async getOrderByHashIfExistsAsync(orderHash: string): Promise<APIOrder | undefined> {
        const signedOrderEntityIfExists = await this._connection.manager.findOne(SignedOrderV4Entity, orderHash);
        if (signedOrderEntityIfExists === undefined) {
            return undefined;
        } else {
            const deserializedOrder = orderUtils.deserializeOrderToAPIOrder(
                signedOrderEntityIfExists as Required<SignedOrderV4Entity>,
            );
            return deserializedOrder;
        }
    }
    public async getAssetPairsAsync(
        _page: number,
        _perPage: number,
        _assetDataA?: string,
        _assetDataB?: string,
    ): Promise<PaginatedCollection<AssetPairsItem>> {
        throw new Error('TODO IMPLEMENT');
        // const signedOrderEntities = (await this._connection.manager.find(SignedOrderV4Entity)) as Required<
        // SignedOrderV4Entity
        // >[];
        // const assetPairsItems: AssetPairsItem[] = signedOrderEntities
        // .map(orderUtils.deserializeOrder)
        // .map(orderUtils.signedOrderToAssetPair);
        // let nonPaginatedFilteredAssetPairs: AssetPairsItem[];
        // if (assetDataA === undefined && assetDataB === undefined) {
        // nonPaginatedFilteredAssetPairs = assetPairsItems;
        // } else if (assetDataA !== undefined && assetDataB !== undefined) {
        // const containsAssetDataAAndAssetDataB = (assetPair: AssetPairsItem) =>
        // (assetPair.assetDataA.assetData === assetDataA && assetPair.assetDataB.assetData === assetDataB) ||
        // (assetPair.assetDataA.assetData === assetDataB && assetPair.assetDataB.assetData === assetDataA);
        // nonPaginatedFilteredAssetPairs = assetPairsItems.filter(containsAssetDataAAndAssetDataB);
        // } else {
        // const assetData = assetDataA || assetDataB;
        // const containsAssetData = (assetPair: AssetPairsItem) =>
        // assetPair.assetDataA.assetData === assetData || assetPair.assetDataB.assetData === assetData;
        // nonPaginatedFilteredAssetPairs = assetPairsItems.filter(containsAssetData);
        // }
        // const uniqueNonPaginatedFilteredAssetPairs = _.uniqBy(
        // nonPaginatedFilteredAssetPairs,
        // assetPair => `${assetPair.assetDataA.assetData}/${assetPair.assetDataB.assetData}`,
        // );
        // const paginatedFilteredAssetPairs = paginationUtils.paginate(
        // uniqueNonPaginatedFilteredAssetPairs,
        // page,
        // perPage,
        // );
        // return paginatedFilteredAssetPairs;
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async getOrderBookAsync(
        _page: number,
        _perPage: number,
        _baseAssetData: string,
        _quoteAssetData: string,
    ): Promise<OrderbookResponse> {
        throw new Error('TODO IMPLEMENT');
        // const orderEntities = await this._connection.manager.find(SignedOrderV4Entity, {
        // where: {
        // takerAssetData: In([baseAssetData, quoteAssetData]),
        // makerAssetData: In([baseAssetData, quoteAssetData]),
        // },
        // });
        // const bidSignedOrderEntities = orderEntities.filter(
        // o => o.takerAssetData === baseAssetData && o.makerAssetData === quoteAssetData,
        // );
        // const askSignedOrderEntities = orderEntities.filter(
        // o => o.takerAssetData === quoteAssetData && o.makerAssetData === baseAssetData,
        // );
        // const bidApiOrders: APIOrder[] = (bidSignedOrderEntities as Required<SignedOrderV4Entity>[])
        // .map(orderUtils.deserializeOrderToAPIOrder)
        // .filter(orderUtils.isFreshOrder)
        // .sort((orderA, orderB) => orderUtils.compareBidOrder(orderA.order, orderB.order));
        // const askApiOrders: APIOrder[] = (askSignedOrderEntities as Required<SignedOrderV4Entity>[])
        // .map(orderUtils.deserializeOrderToAPIOrder)
        // .filter(orderUtils.isFreshOrder)
        // .sort((orderA, orderB) => orderUtils.compareAskOrder(orderA.order, orderB.order));
        // const paginatedBidApiOrders = paginationUtils.paginate(bidApiOrders, page, perPage);
        // const paginatedAskApiOrders = paginationUtils.paginate(askApiOrders, page, perPage);
        // return {
        // bids: paginatedBidApiOrders,
        // asks: paginatedAskApiOrders,
        // };
    }

    // TODO:(leo) Do all filtering and pagination in a DB (requires stored procedures or redundant fields)
    // tslint:disable-next-line:prefer-function-over-method
    public async getOrdersAsync(
        page: number,
        perPage: number,
        ordersFilterParams: SRAGetOrdersRequestOpts,
    ): Promise<PaginatedCollection<APIOrderWithMetaData>> {
        // Pre-filters
        // TODO(kimpers): FIX FILTERS
        const filterObjectWithValuesIfExist: Partial<SignedOrderV4Entity> = {
            verifyingContract: ordersFilterParams.verifyingContract,
            sender: ordersFilterParams.sender,
            makerToken: ordersFilterParams.makerToken,
            takerToken: ordersFilterParams.takerToken,
            maker: ordersFilterParams.maker,
            taker: ordersFilterParams.taker,
            feeRecipient: ordersFilterParams.feeRecipient,
        };
        const filterObject = _.pickBy(filterObjectWithValuesIfExist, _.identity.bind(_));
        const [signedOrderCount, signedOrderEntities] = await Promise.all([
            this._connection.manager.count(SignedOrderV4Entity, {
                where: filterObject,
            }),
            this._connection.manager.find(SignedOrderV4Entity, {
                where: filterObject,
                ...paginationUtils.paginateDBFilters(page, perPage),
                order: {
                    hash: 'ASC',
                },
            }),
        ]);
        const apiOrders = (signedOrderEntities as Required<SignedOrderV4Entity>[]).map(
            orderUtils.deserializeOrderToAPIOrder,
        );

        // check for expired orders
        const { fresh, expired } = orderUtils.groupByFreshness(apiOrders, SRA_ORDER_EXPIRATION_BUFFER_SECONDS);
        alertOnExpiredOrders(expired);

        // Join with persistent orders
        let persistentOrders: APIOrderWithMetaData[] = [];
        let persistentOrdersCount = 0;
        if (ordersFilterParams.isUnfillable === true) {
            if (filterObject.maker === undefined) {
                throw new ValidationError([
                    {
                        field: 'maker',
                        code: ValidationErrorCodes.RequiredField,
                        reason: ValidationErrorReasons.UnfillableRequiresMakerAddress,
                    },
                ]);
            }
            let persistentOrderEntities = [];
            [persistentOrdersCount, persistentOrderEntities] = await Promise.all([
                this._connection.manager.count(PersistentSignedOrderV4Entity, { where: filterObject }),
                this._connection.manager.find(PersistentSignedOrderV4Entity, {
                    where: filterObject,
                    ...paginationUtils.paginateDBFilters(page, perPage),
                    order: {
                        hash: 'ASC',
                    },
                }),
            ]);
            // This should match the states that trigger a removal from the SignedOrders table
            // Defined in meshUtils.calculateOrderLifecycle
            const unfillableStates = [
                OrderEventEndState.Cancelled,
                OrderEventEndState.Expired,
                OrderEventEndState.FullyFilled,
                // OrderEventEndState.Invalid,
                OrderEventEndState.StoppedWatching,
                OrderEventEndState.Unfunded,
            ];
            persistentOrders = (persistentOrderEntities as Required<PersistentSignedOrderV4Entity>[])
                .map(orderUtils.deserializeOrderToAPIOrder)
                .filter(apiOrder => {
                    return apiOrder.metaData.state && unfillableStates.includes(apiOrder.metaData.state);
                });
        }

        // Post-filters (query fields that don't exist verbatim in the order)
        const filteredApiOrders = orderUtils.filterOrders(fresh.concat(persistentOrders), ordersFilterParams);
        const total = signedOrderCount + persistentOrdersCount;

        // Paginate
        const paginatedApiOrders = paginationUtils.paginateSerialize(filteredApiOrders, total, page, perPage);
        return paginatedApiOrders;
    }
    public async getBatchOrdersAsync(
        page: number,
        perPage: number,
        makerAssetDatas: string[],
        takerAssetDatas: string[],
    ): Promise<PaginatedCollection<APIOrder>> {
        const filterObject = {
            makerAssetData: In(makerAssetDatas),
            takerAssetData: In(takerAssetDatas),
        };
        const signedOrderEntities = (await this._connection.manager.find(SignedOrderV4Entity, {
            where: filterObject,
        })) as Required<SignedOrderV4Entity>[];
        const apiOrders = signedOrderEntities.map(orderUtils.deserializeOrderToAPIOrder);

        // check for expired orders
        const { fresh, expired } = orderUtils.groupByFreshness(apiOrders, SRA_ORDER_EXPIRATION_BUFFER_SECONDS);
        alertOnExpiredOrders(expired);

        const paginatedApiOrders = paginationUtils.paginate(fresh, page, perPage);
        return paginatedApiOrders;
    }
    constructor(connection: Connection, meshClient?: MeshClient) {
        this._meshClient = meshClient;
        this._connection = connection;
    }
    public async addOrderAsync(signedOrder: SignedLimitOrder, pinned: boolean): Promise<void> {
        return this.addOrdersAsync([signedOrder], pinned);
    }
    public async addOrdersAsync(signedOrders: SignedLimitOrder[], pinned: boolean): Promise<void> {
        // Order Watcher Service will handle persistence
        await this._addOrdersAsync(signedOrders, pinned);
        return;
    }
    public async addPersistentOrdersAsync(signedOrders: SignedLimitOrder[], pinned: boolean): Promise<void> {
        const accepted = await this._addOrdersAsync(signedOrders, pinned);
        const persistentOrders = accepted.map(orderInfo => {
            const apiOrder = meshUtils.orderInfoToAPIOrder({ ...orderInfo, endState: OrderEventEndState.Added });
            return orderUtils.serializePersistentOrder(apiOrder);
        });
        // MAX SQL variable size is 999. This limit is imposed via Sqlite.
        // The SELECT query is not entirely effecient and pulls in all attributes
        // so we need to leave space for the attributes on the model represented
        // as SQL variables in the "AS" syntax. We leave 99 free for the
        // signedOrders model
        await this._connection
            .getRepository(PersistentSignedOrderV4Entity)
            .save(persistentOrders, { chunk: DB_ORDERS_UPDATE_CHUNK_SIZE });
    }
    public async splitOrdersByPinningAsync(signedOrders: SignedLimitOrder[]): Promise<PinResult> {
        return orderUtils.splitOrdersByPinningAsync(this._connection, signedOrders);
    }
    private async _addOrdersAsync(signedOrders: SignedLimitOrder[], pinned: boolean): Promise<AcceptedOrderResult[]> {
        if (this._meshClient) {
            // TODO(kimpers): FIX TYPES HERE
            const { rejected, accepted } = await this._meshClient.addOrdersV4Async(
                signedOrders.map(o => ({ ...o, exchangeAddress: o.verifyingContract })),
                pinned,
            );
            if (rejected.length !== 0) {
                const validationErrors = rejected.map((r, i) => ({
                    field: `signedOrder[${i}]`,
                    code: meshUtils.rejectedCodeToSRACode(r.code),
                    reason: `${r.code}: ${r.message}`,
                }));
                throw new ValidationError(validationErrors);
            }
            // Order Watcher Service will handle persistence
            // TODO(kimpers): fix types here!
            return accepted.map(o => ({
                ...o,
                order: {
                    ...o.order,
                    signature: {
                        ...o.order.signature,
                        signatureType: o.order.signature.signatureType as any,
                    },
                },
            }));
        }
        throw new Error('Could not add order to mesh.');
    }
}
