"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockOrderWatcher = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
const entities_1 = require("../../src/entities");
const order_utils_1 = require("../../src/utils/order_utils");
class MockOrderWatcher {
    constructor(connection) {
        this._connection = connection;
    }
    async postOrdersAsync(orders) {
        await this._connection.getRepository(entities_1.OrderWatcherSignedOrderEntity).save(orders.map((order) => {
            const limitOrder = new protocol_utils_1.LimitOrder(order);
            return order_utils_1.orderUtils.serializeOrder({
                order,
                metaData: {
                    orderHash: limitOrder.getHash(),
                    remainingFillableTakerAmount: order.takerAmount,
                },
            });
        }));
    }
}
exports.MockOrderWatcher = MockOrderWatcher;
//# sourceMappingURL=mock_order_watcher.js.map