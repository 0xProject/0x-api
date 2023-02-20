"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderUtils = void 0;
const assert_1 = require("@0x/assert");
const utils_1 = require("@0x/utils");
const config_1 = require("../config");
const constants_1 = require("../constants");
const entities_1 = require("../entities");
const types_1 = require("../types");
exports.orderUtils = {
    isIgnoredOrder: (addressesToIgnore, apiOrder) => {
        return addressesToIgnore.some((addressToIgnore) => {
            const { maker, makerToken, takerToken } = apiOrder.order;
            return [maker.toLowerCase(), makerToken.toLowerCase(), takerToken.toLowerCase()].includes(addressToIgnore.toLowerCase());
        });
    },
    isFreshOrder: (apiOrder, expirationBufferSeconds = config_1.SRA_ORDER_EXPIRATION_BUFFER_SECONDS) => {
        const dateNowSeconds = Date.now() / constants_1.ONE_SECOND_MS;
        return apiOrder.order.expiry.toNumber() > dateNowSeconds + expirationBufferSeconds;
    },
    groupByFreshness: (apiOrders, expirationBufferSeconds) => {
        const accumulator = { fresh: [], expired: [] };
        for (const order of apiOrders) {
            exports.orderUtils.isFreshOrder(order, expirationBufferSeconds)
                ? accumulator.fresh.push(order)
                : accumulator.expired.push(order);
        }
        return accumulator;
    },
    compareAskOrder: (orderA, orderB) => {
        const orderAPrice = orderA.takerAmount.div(orderA.makerAmount);
        const orderBPrice = orderB.takerAmount.div(orderB.makerAmount);
        if (!orderAPrice.isEqualTo(orderBPrice)) {
            return orderAPrice.comparedTo(orderBPrice);
        }
        return exports.orderUtils.compareOrderByFeeRatio(orderA, orderB);
    },
    compareBidOrder: (orderA, orderB) => {
        const orderAPrice = orderA.makerAmount.div(orderA.takerAmount);
        const orderBPrice = orderB.makerAmount.div(orderB.takerAmount);
        if (!orderAPrice.isEqualTo(orderBPrice)) {
            return orderBPrice.comparedTo(orderAPrice);
        }
        return exports.orderUtils.compareOrderByFeeRatio(orderA, orderB);
    },
    compareOrderByFeeRatio: (orderA, orderB) => {
        const orderAFeePrice = orderA.takerTokenFeeAmount.div(orderA.takerAmount);
        const orderBFeePrice = orderB.takerTokenFeeAmount.div(orderB.takerAmount);
        if (!orderAFeePrice.isEqualTo(orderBFeePrice)) {
            return orderBFeePrice.comparedTo(orderAFeePrice);
        }
        return orderA.expiry.comparedTo(orderB.expiry);
    },
    deserializeSignature: (signatureStr) => {
        const [signatureTypeStr, r, s, vStr] = signatureStr.split(',');
        const signatureType = parseInt(signatureTypeStr, 10);
        const v = parseInt(vStr, 10);
        assert_1.assert.isNumber('signatureType', signatureType);
        assert_1.assert.isNumber('signatureV', v);
        assert_1.assert.isString('signatureR', r);
        assert_1.assert.isString('signatureS', s);
        return {
            signatureType,
            r,
            s,
            v,
        };
    },
    deserializeOrder: (signedOrderEntity) => {
        const signedOrder = {
            signature: exports.orderUtils.deserializeSignature(signedOrderEntity.signature),
            sender: signedOrderEntity.sender,
            maker: signedOrderEntity.maker,
            taker: signedOrderEntity.taker,
            takerTokenFeeAmount: new utils_1.BigNumber(signedOrderEntity.takerTokenFeeAmount),
            makerAmount: new utils_1.BigNumber(signedOrderEntity.makerAmount),
            takerAmount: new utils_1.BigNumber(signedOrderEntity.takerAmount),
            makerToken: signedOrderEntity.makerToken,
            takerToken: signedOrderEntity.takerToken,
            salt: new utils_1.BigNumber(signedOrderEntity.salt),
            verifyingContract: signedOrderEntity.verifyingContract,
            feeRecipient: signedOrderEntity.feeRecipient,
            expiry: new utils_1.BigNumber(signedOrderEntity.expiry),
            chainId: config_1.CHAIN_ID,
            pool: signedOrderEntity.pool,
        };
        return signedOrder;
    },
    deserializeOrderToSRAOrder: (signedOrderEntity) => {
        const order = exports.orderUtils.deserializeOrder(signedOrderEntity);
        const state = signedOrderEntity.orderState;
        const createdAt = signedOrderEntity.createdAt;
        const metaData = {
            orderHash: signedOrderEntity.hash,
            remainingFillableTakerAmount: new utils_1.BigNumber(signedOrderEntity.remainingFillableTakerAmount),
            state,
            createdAt,
        };
        return {
            order,
            metaData,
        };
    },
    serializeSignature: (signature) => {
        const { signatureType, r, s, v } = signature;
        return [signatureType, r, s, v].join(',');
    },
    serializeOrder: (apiOrder) => {
        const signedOrder = apiOrder.order;
        const signedOrderEntity = new entities_1.SignedOrderV4Entity({
            signature: exports.orderUtils.serializeSignature(signedOrder.signature),
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
    serializeUnsignedLimitOrder: (order) => {
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
    serializePersistentOrder: (apiOrder) => {
        const signedOrder = apiOrder.order;
        const persistentOrder = new entities_1.PersistentSignedOrderV4Entity({
            signature: exports.orderUtils.serializeSignature(signedOrder.signature),
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
            orderState: apiOrder.metaData.state || types_1.OrderEventEndState.Added,
        });
        return persistentOrder;
    },
    getOrderConfig: (_order) => {
        const orderConfigResponse = {
            sender: constants_1.NULL_ADDRESS,
            feeRecipient: config_1.FEE_RECIPIENT_ADDRESS.toLowerCase(),
            takerTokenFeeAmount: config_1.TAKER_FEE_UNIT_AMOUNT,
        };
        return orderConfigResponse;
    },
};
//# sourceMappingURL=order_utils.js.map