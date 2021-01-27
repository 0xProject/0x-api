import { OrderEventEndState } from '@0x/mesh-graphql-client';
import { Signature, SignatureType } from '@0x/protocol-utils';
import {
    AssetData,
    AssetProxyId,
    ERC1155AssetData,
    ERC20AssetData,
    ERC20BridgeAssetData,
    ERC721AssetData,
    MultiAssetData,
    OrderConfigRequest,
    OrderConfigResponse,
    StaticCallAssetData,
} from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Connection, In, Like } from 'typeorm';

import {
    CHAIN_ID,
    FEE_RECIPIENT_ADDRESS,
    MAKER_FEE_ASSET_DATA,
    MAKER_FEE_UNIT_AMOUNT,
    PINNED_MM_ADDRESSES,
    PINNED_POOL_IDS,
    SRA_ORDER_EXPIRATION_BUFFER_SECONDS,
    TAKER_FEE_ASSET_DATA,
    TAKER_FEE_UNIT_AMOUNT,
} from '../config';
import { NULL_ADDRESS, ONE_SECOND_MS, TEN_MINUTES_MS } from '../constants';
import { PersistentSignedOrderV4Entity, SignedOrderV4Entity } from '../entities';
import { logger } from '../logger';
import * as queries from '../queries/staking_queries';
import {
    APIOrder,
    APIOrderMetaData,
    APIOrderWithMetaData,
    PinResult,
    RawPool,
    SignedLimitOrder,
    SRAGetOrdersRequestOpts,
} from '../types';

import { createResultCache, ResultCache } from './result_cache';

// Cache the expensive query of current epoch stats
let PIN_CACHE: ResultCache<any>;
const getPoolsAsync = async (connection: Connection) => {
    if (!PIN_CACHE) {
        PIN_CACHE = createResultCache<any[]>(() => connection.query(queries.stakingPoolsQuery), TEN_MINUTES_MS);
    }
    return (await PIN_CACHE.getResultAsync()).result;
};

export const orderUtils = {
    isIgnoredOrder: (addressesToIgnore: string[], apiOrder: APIOrder): boolean => {
        return addressesToIgnore.some(addressToIgnore => {
            const { maker, makerToken, takerToken } = apiOrder.order;

            return [maker.toLowerCase(), makerToken.toLowerCase(), takerToken.toLowerCase()].includes(
                addressToIgnore.toLowerCase(),
            );
        });
    },
    isMultiAssetData: (decodedAssetData: AssetData): decodedAssetData is MultiAssetData => {
        return decodedAssetData.assetProxyId === AssetProxyId.MultiAsset;
    },
    isStaticCallAssetData: (decodedAssetData: AssetData): decodedAssetData is StaticCallAssetData => {
        return decodedAssetData.assetProxyId === AssetProxyId.StaticCall;
    },
    isBridgeAssetData: (decodedAssetData: AssetData): decodedAssetData is ERC20BridgeAssetData => {
        return decodedAssetData.assetProxyId === AssetProxyId.ERC20Bridge;
    },
    isTokenAssetData: (
        decodedAssetData: AssetData,
    ): decodedAssetData is ERC20AssetData | ERC1155AssetData | ERC721AssetData => {
        switch (decodedAssetData.assetProxyId) {
            case AssetProxyId.ERC1155:
            case AssetProxyId.ERC721:
            case AssetProxyId.ERC20:
                return true;
            default:
                return false;
        }
    },
    isFreshOrder: (
        apiOrder: APIOrder,
        expirationBufferSeconds: number = SRA_ORDER_EXPIRATION_BUFFER_SECONDS,
    ): boolean => {
        const dateNowSeconds = Date.now() / ONE_SECOND_MS;
        return apiOrder.order.expiry.toNumber() > dateNowSeconds + expirationBufferSeconds;
    },
    groupByFreshness: <T extends APIOrder>(
        apiOrders: T[],
        expirationBufferSeconds: number,
    ): { fresh: T[]; expired: T[] } => {
        const accumulator = { fresh: [] as T[], expired: [] as T[] };
        for (const order of apiOrders) {
            orderUtils.isFreshOrder(order, expirationBufferSeconds)
                ? accumulator.fresh.push(order)
                : accumulator.expired.push(order);
        }
        return accumulator;
    },
    compareAskOrder: (orderA: SignedLimitOrder, orderB: SignedLimitOrder): number => {
        const orderAPrice = orderA.takerAmount.div(orderA.makerAmount);
        const orderBPrice = orderB.takerAmount.div(orderB.makerAmount);
        if (!orderAPrice.isEqualTo(orderBPrice)) {
            return orderAPrice.comparedTo(orderBPrice);
        }
        return orderUtils.compareOrderByFeeRatio(orderA, orderB);
    },
    compareBidOrder: (orderA: SignedLimitOrder, orderB: SignedLimitOrder): number => {
        const orderAPrice = orderA.makerAmount.div(orderA.takerAmount);
        const orderBPrice = orderB.makerAmount.div(orderB.takerAmount);
        if (!orderAPrice.isEqualTo(orderBPrice)) {
            return orderBPrice.comparedTo(orderAPrice);
        }
        return orderUtils.compareOrderByFeeRatio(orderA, orderB);
    },
    compareOrderByFeeRatio: (orderA: SignedLimitOrder, orderB: SignedLimitOrder): number => {
        const orderAFeePrice = orderA.takerTokenFeeAmount.div(orderA.takerAmount);
        const orderBFeePrice = orderB.takerTokenFeeAmount.div(orderB.takerAmount);
        if (!orderAFeePrice.isEqualTo(orderBFeePrice)) {
            return orderBFeePrice.comparedTo(orderAFeePrice);
        }
        return orderA.expiry.comparedTo(orderB.expiry);
    },
    deserializeSignature: (signatureStr: string): Signature => {
        // TODO(kimpers): validation needed here
        const [signatureType, r, s, v] = signatureStr.split(',');
        return {
            signatureType: parseInt(signatureType, 10) as SignatureType,
            r,
            s,
            v: parseInt(v, 10),
        };
    },
    deserializeOrder: (
        signedOrderEntity: Required<SignedOrderV4Entity | PersistentSignedOrderV4Entity>,
    ): SignedLimitOrder => {
        const signedOrder: SignedLimitOrder = {
            signature: orderUtils.deserializeSignature(signedOrderEntity.signature),
            sender: signedOrderEntity.sender,
            maker: signedOrderEntity.maker,
            taker: signedOrderEntity.taker,
            takerTokenFeeAmount: new BigNumber(signedOrderEntity.takerTokenFeeAmount),
            makerAmount: new BigNumber(signedOrderEntity.makerAmount),
            takerAmount: new BigNumber(signedOrderEntity.takerAmount),
            makerToken: signedOrderEntity.makerToken,
            takerToken: signedOrderEntity.takerToken,
            salt: new BigNumber(signedOrderEntity.salt),
            verifyingContract: signedOrderEntity.verifyingContract,
            feeRecipient: signedOrderEntity.feeRecipient,
            expiry: new BigNumber(signedOrderEntity.expiry),
            chainId: CHAIN_ID,
            pool: signedOrderEntity.pool,
        };
        return signedOrder;
    },
    deserializeOrderToAPIOrder: (
        signedOrderEntity: Required<SignedOrderV4Entity> | Required<PersistentSignedOrderV4Entity>,
    ): APIOrderWithMetaData => {
        const order = orderUtils.deserializeOrder(signedOrderEntity);
        const state = (signedOrderEntity as PersistentSignedOrderV4Entity).orderState;
        const createdAt = (signedOrderEntity as PersistentSignedOrderV4Entity).createdAt;
        const metaData: APIOrderMetaData = {
            orderHash: signedOrderEntity.hash,
            remainingFillableTakerAssetAmount: new BigNumber(signedOrderEntity.remainingFillableTakerAssetAmount),
            state,
            createdAt,
        };
        return {
            order,
            metaData,
        };
    },
    serializeSignature: (signature: Signature) => {
        const { signatureType, r, s, v } = signature;
        return [signatureType, r, s, v].join(',');
    },
    serializeOrder: (apiOrder: APIOrderWithMetaData): SignedOrderV4Entity => {
        const signedOrder = apiOrder.order;
        const signedOrderEntity = new SignedOrderV4Entity({
            signature: orderUtils.serializeSignature(signedOrder.signature),
            sender: signedOrder.sender,
            maker: signedOrder.maker,
            taker: signedOrder.taker,
            makerAmount: signedOrder.makerAmount.toString(),
            takerAmount: signedOrder.takerAmount.toString(),
            makerToken: signedOrder.makerToken,
            takerToken: signedOrder.takerToken,
            takerTokenFeeAmount: signedOrder.takerTokenFeeAmount.toString(),
            salt: signedOrder.salt.toString(),
            verifyingContract: signedOrder.verifyingContract,
            feeRecipient: signedOrder.feeRecipient,
            expiry: signedOrder.expiry.toString(),
            hash: apiOrder.metaData.orderHash,
            remainingFillableTakerAssetAmount: apiOrder.metaData.remainingFillableTakerAssetAmount.toString(),
        });
        return signedOrderEntity;
    },
    serializePersistentOrder: (apiOrder: APIOrderWithMetaData): PersistentSignedOrderV4Entity => {
        const signedOrder = apiOrder.order;
        const persistentOrder = new PersistentSignedOrderV4Entity({
            signature: orderUtils.serializeSignature(signedOrder.signature),
            sender: signedOrder.sender,
            maker: signedOrder.maker,
            taker: signedOrder.taker,
            makerAmount: signedOrder.makerAmount.toString(),
            takerAmount: signedOrder.takerAmount.toString(),
            makerToken: signedOrder.makerToken,
            takerToken: signedOrder.takerToken,
            takerTokenFeeAmount: signedOrder.takerTokenFeeAmount.toString(),
            salt: signedOrder.salt.toString(),
            verifyingContract: signedOrder.verifyingContract,
            feeRecipient: signedOrder.feeRecipient,
            expiry: signedOrder.expiry.toString(),
            hash: apiOrder.metaData.orderHash,
            remainingFillableTakerAssetAmount: apiOrder.metaData.remainingFillableTakerAssetAmount.toString(),
            orderState: apiOrder.metaData.state || OrderEventEndState.Added,
        });
        return persistentOrder;
    },
    getOrderConfig: (_order: Partial<OrderConfigRequest>): OrderConfigResponse => {
        const normalizedFeeRecipient = FEE_RECIPIENT_ADDRESS.toLowerCase();
        const orderConfigResponse: OrderConfigResponse = {
            senderAddress: NULL_ADDRESS,
            feeRecipientAddress: normalizedFeeRecipient,
            makerFee: MAKER_FEE_UNIT_AMOUNT,
            takerFee: TAKER_FEE_UNIT_AMOUNT,
            makerFeeAssetData: MAKER_FEE_ASSET_DATA,
            takerFeeAssetData: TAKER_FEE_ASSET_DATA,
        };
        return orderConfigResponse;
    },
    assetDataOrAssetProxyId: (assetData: string | string[] | undefined, assetProxyId: string | undefined) => {
        if (!assetData && !assetProxyId) {
            return undefined;
        }
        if (assetProxyId) {
            return Like(`${assetProxyId}%`);
        }
        if (Array.isArray(assetData)) {
            return In(assetData);
        }
        return assetData;
    },
    filterOrders: (apiOrders: APIOrderWithMetaData[], filters: SRAGetOrdersRequestOpts): APIOrderWithMetaData[] => {
        // TODO(kimpers): Clean up filters and naming
        const { sender, takerToken, makerToken } = filters;
        const matchTraderAddress = (order: SignedLimitOrder, filterAddress?: string): boolean =>
            filterAddress ? order.maker === filterAddress || order.taker === filterAddress : true;
        const matchMakerTokenAddress = (order: SignedLimitOrder, filterAddress?: string): boolean =>
            filterAddress ? order.makerToken === filterAddress : true;
        const matchTakerTokenAddress = (order: SignedLimitOrder, filterAddress?: string): boolean =>
            filterAddress ? order.takerToken === filterAddress : true;
        const filteredOrders = apiOrders.filter(apiOrder => {
            const o = apiOrder.order;
            return (
                matchTraderAddress(o, sender) &&
                matchMakerTokenAddress(o, takerToken) &&
                matchTakerTokenAddress(o, makerToken)
            );
        });
        return filteredOrders;
    },
    // splitOrdersByPinning splits the orders into those we wish to pin in our Mesh node and
    // those we wish not to pin. We wish to pin the orders of MMers with a lot of ZRX at stake and
    // who have a track record of acting benevolently.
    async splitOrdersByPinningAsync(connection: Connection, signedOrders: SignedLimitOrder[]): Promise<PinResult> {
        let currentPools = [];
        // HACK(jalextowle): This query will fail when running against Ganache, so we
        // skip it an only use pinned MMers. A deployed staking system that allows this
        // functionality to be tested would improve the testing infrastructure.
        try {
            currentPools = (await getPoolsAsync(connection)) || [];
        } catch (error) {
            logger.warn(`stakingPoolsQuery threw an error: ${error}`);
        }
        let makerAddresses: string[] = PINNED_MM_ADDRESSES;
        currentPools.forEach((poolStats: RawPool) => {
            if (!PINNED_POOL_IDS.includes(poolStats.pool_id)) {
                return;
            }
            makerAddresses = [...makerAddresses, ...poolStats.maker_addresses];
        });
        const pinResult: PinResult = {
            pin: [],
            doNotPin: [],
        };
        signedOrders.forEach(signedOrder => {
            if (makerAddresses.includes(signedOrder.maker)) {
                pinResult.pin.push(signedOrder);
            } else {
                pinResult.doNotPin.push(signedOrder);
            }
        });
        return pinResult;
    },
};
