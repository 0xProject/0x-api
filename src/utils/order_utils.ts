import { assert } from '@0x/assert';
import { Signature, SignatureType } from '@0x/protocol-utils';
import { BigNumber } from '@0x/utils';

import { CHAIN_ID, FEE_RECIPIENT_ADDRESS, SRA_ORDER_EXPIRATION_BUFFER_SECONDS, TAKER_FEE_UNIT_AMOUNT } from '../config';
import { NULL_ADDRESS, ONE_SECOND_MS } from '../constants';
import {
    OfferAddLiquidityEntity,
    OfferCreateContingentPoolEntity,
    PersistentSignedOrderV4Entity,
    SignedOrderV4Entity,
} from '../entities';
import {
    OfferAddLiquidity,
    OfferCreateContingentPool,
    OrderConfigRequestPayload,
    OrderConfigResponse,
    OrderEventEndState,
    SignedLimitOrder,
    SRAOrder,
    SRAOrderMetaData,
} from '../types';

export const orderUtils = {
    isIgnoredOrder: (addressesToIgnore: string[], apiOrder: SRAOrder): boolean => {
        return addressesToIgnore.some((addressToIgnore) => {
            const { maker, makerToken, takerToken } = apiOrder.order;

            return [maker.toLowerCase(), makerToken.toLowerCase(), takerToken.toLowerCase()].includes(
                addressToIgnore.toLowerCase(),
            );
        });
    },
    isFreshOrder: (
        apiOrder: SRAOrder,
        expirationBufferSeconds: number = SRA_ORDER_EXPIRATION_BUFFER_SECONDS,
    ): boolean => {
        const dateNowSeconds = Date.now() / ONE_SECOND_MS;
        return apiOrder.order.expiry.toNumber() > dateNowSeconds + expirationBufferSeconds;
    },
    groupByFreshness: <T extends SRAOrder>(
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
        const [signatureTypeStr, r, s, vStr] = signatureStr.split(',');
        const signatureType = parseInt(signatureTypeStr, 10) as SignatureType;
        const v = parseInt(vStr, 10);
        assert.isNumber('signatureType', signatureType);
        assert.isNumber('signatureV', v);
        assert.isString('signatureR', r);
        assert.isString('signatureS', s);

        return {
            signatureType,
            r,
            s,
            v,
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
    deserializeOfferCreateContingentPool: (
        offerCreateContingentPoolEntity: OfferCreateContingentPoolEntity,
    ): OfferCreateContingentPool => {
        const signedOffer: OfferCreateContingentPool = {
            offerHash: offerCreateContingentPoolEntity.offerHash as string,
            maker: offerCreateContingentPoolEntity.maker as string,
            taker: offerCreateContingentPoolEntity.taker as string,
            makerCollateralAmount: offerCreateContingentPoolEntity.makerCollateralAmount as string,
            takerCollateralAmount: offerCreateContingentPoolEntity.takerCollateralAmount as string,
            makerDirection: offerCreateContingentPoolEntity.makerDirection as string,
            offerExpiry: offerCreateContingentPoolEntity.offerExpiry as string,
            minimumTakerFillAmount: offerCreateContingentPoolEntity.minimumTakerFillAmount as string,
            referenceAsset: offerCreateContingentPoolEntity.referenceAsset as string,
            expiryTime: offerCreateContingentPoolEntity.expiryTime as string,
            floor: offerCreateContingentPoolEntity.floor as string,
            inflection: offerCreateContingentPoolEntity.inflection as string,
            cap: offerCreateContingentPoolEntity.cap as string,
            gradient: offerCreateContingentPoolEntity.gradient as string,
            collateralToken: offerCreateContingentPoolEntity.collateralToken as string,
            dataProvider: offerCreateContingentPoolEntity.dataProvider as string,
            capacity: offerCreateContingentPoolEntity.capacity as string,
            permissionedERC721Token: offerCreateContingentPoolEntity.permissionedERC721Token as string,
            salt: offerCreateContingentPoolEntity.salt as string,
            signature: JSON.parse(offerCreateContingentPoolEntity.signature as string),
            chainId: Number(offerCreateContingentPoolEntity.chainId),
            verifyingContract: offerCreateContingentPoolEntity.verifyingContract as string,
        };
        return signedOffer;
    },
    deserializeOfferAddLiquidity: (offerAddLiquidityEntity: OfferAddLiquidityEntity): OfferAddLiquidity => {
        const signedOffer: OfferAddLiquidity = {
            offerHash: offerAddLiquidityEntity.offerHash as string,
            maker: offerAddLiquidityEntity.maker as string,
            taker: offerAddLiquidityEntity.taker as string,
            makerCollateralAmount: offerAddLiquidityEntity.makerCollateralAmount as string,
            takerCollateralAmount: offerAddLiquidityEntity.takerCollateralAmount as string,
            makerDirection: offerAddLiquidityEntity.makerDirection as string,
            offerExpiry: offerAddLiquidityEntity.offerExpiry as string,
            minimumTakerFillAmount: offerAddLiquidityEntity.minimumTakerFillAmount as string,
            salt: offerAddLiquidityEntity.salt as string,
            poolId: offerAddLiquidityEntity.poolId as string,
            actualTakerFillableAmount: offerAddLiquidityEntity.actualTakerFillableAmount as string,
            chainId: Number(offerAddLiquidityEntity.chainId),
            verifyingContract: offerAddLiquidityEntity.verifyingContract as string,
            referenceAsset: offerAddLiquidityEntity.referenceAsset as string,
            collateralToken: offerAddLiquidityEntity.collateralToken as string,
            dataProvider: offerAddLiquidityEntity.dataProvider as string,
            signature: JSON.parse(offerAddLiquidityEntity.signature as string),
        };
        return signedOffer;
    },
    deserializeOrderToSRAOrder: (
        signedOrderEntity: Required<SignedOrderV4Entity> | Required<PersistentSignedOrderV4Entity>,
    ): SRAOrder => {
        const order = orderUtils.deserializeOrder(signedOrderEntity);
        const state = (signedOrderEntity as PersistentSignedOrderV4Entity).orderState;
        const createdAt = (signedOrderEntity as PersistentSignedOrderV4Entity).createdAt;
        const metaData: SRAOrderMetaData = {
            orderHash: signedOrderEntity.hash,
            remainingFillableTakerAmount: new BigNumber(signedOrderEntity.remainingFillableTakerAmount),
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
    serializeOrder: (apiOrder: SRAOrder): SignedOrderV4Entity => {
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
            pool: signedOrder.pool,
            expiry: signedOrder.expiry.toString(),
            hash: apiOrder.metaData.orderHash,
            remainingFillableTakerAmount: apiOrder.metaData.remainingFillableTakerAmount.toString(),
        });
        return signedOrderEntity;
    },
    // used for parsing query params
    serializeUnsignedLimitOrder: (order: SignedLimitOrder): Partial<SignedOrderV4Entity> => {
        return {
            sender: order.sender,
            maker: order.maker,
            taker: order.taker,
            makerAmount: order.makerAmount.toString(),
            takerAmount: order.takerAmount.toString(),
            makerToken: order.makerToken,
            takerToken: order.takerToken,
            takerTokenFeeAmount: order.takerTokenFeeAmount.toString(),
            salt: order.salt.toString(),
            verifyingContract: order.verifyingContract,
            feeRecipient: order.feeRecipient,
            pool: order.pool,
            expiry: order.expiry.toString(),
        };
    },
    serializePersistentOrder: (apiOrder: SRAOrder): PersistentSignedOrderV4Entity => {
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
            pool: signedOrder.pool,
            expiry: signedOrder.expiry.toString(),
            hash: apiOrder.metaData.orderHash,
            remainingFillableTakerAmount: apiOrder.metaData.remainingFillableTakerAmount.toString(),
            orderState: apiOrder.metaData.state || OrderEventEndState.Added,
        });
        return persistentOrder;
    },
    getOrderConfig: (_order: Partial<OrderConfigRequestPayload>): OrderConfigResponse => {
        const orderConfigResponse: OrderConfigResponse = {
            sender: NULL_ADDRESS,
            feeRecipient: FEE_RECIPIENT_ADDRESS.toLowerCase(),
            takerTokenFeeAmount: TAKER_FEE_UNIT_AMOUNT,
        };
        return orderConfigResponse;
    },
};
