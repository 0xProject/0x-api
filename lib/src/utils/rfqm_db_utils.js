"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v4RfqOrderToStoredOrder = exports.storedOrderToRfqmOrder = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
const asset_swapper_1 = require("../asset-swapper");
const RfqmJobEntity_1 = require("../entities/RfqmJobEntity");
/**
 * convert a stored order into the appropriate order class
 */
function storedOrderToRfqmOrder(storedOrder) {
    if (storedOrder.type === RfqmJobEntity_1.RfqmOrderTypes.V4Rfq) {
        return new protocol_utils_1.RfqOrder({
            txOrigin: storedOrder.order.txOrigin,
            maker: storedOrder.order.maker,
            taker: storedOrder.order.taker,
            makerToken: storedOrder.order.makerToken,
            takerToken: storedOrder.order.takerToken,
            makerAmount: new asset_swapper_1.BigNumber(storedOrder.order.makerAmount),
            takerAmount: new asset_swapper_1.BigNumber(storedOrder.order.takerAmount),
            salt: new asset_swapper_1.BigNumber(storedOrder.order.salt),
            expiry: new asset_swapper_1.BigNumber(storedOrder.order.expiry),
            verifyingContract: storedOrder.order.verifyingContract,
            chainId: Number(storedOrder.order.chainId),
            pool: storedOrder.order.pool,
        });
    }
    else {
        throw new Error(`Unknown order type`);
    }
}
exports.storedOrderToRfqmOrder = storedOrderToRfqmOrder;
/**
 * convert a v4 RFQ order into a 'StoredOrder' format for writing to the DB
 */
function v4RfqOrderToStoredOrder(order) {
    return {
        type: RfqmJobEntity_1.RfqmOrderTypes.V4Rfq,
        order: {
            makerAmount: order.makerAmount.toString(),
            takerAmount: order.takerAmount.toString(),
            expiry: order.expiry.toString(),
            salt: order.salt.toString(),
            txOrigin: order.txOrigin,
            maker: order.maker,
            taker: order.taker,
            makerToken: order.makerToken,
            takerToken: order.takerToken,
            pool: order.pool,
            verifyingContract: order.verifyingContract,
            chainId: String(order.chainId),
        },
    };
}
exports.v4RfqOrderToStoredOrder = v4RfqOrderToStoredOrder;
//# sourceMappingURL=rfqm_db_utils.js.map