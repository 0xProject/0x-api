"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderWatcherEventToSRAOrder = void 0;
const utils_1 = require("@0x/utils");
const orderWatcherEventToSRAOrder = (event) => {
    return {
        order: {
            ...event.order,
            takerTokenFeeAmount: new utils_1.BigNumber(event.order.takerTokenFeeAmount),
            makerAmount: new utils_1.BigNumber(event.order.makerAmount),
            takerAmount: new utils_1.BigNumber(event.order.takerAmount),
            expiry: new utils_1.BigNumber(event.order.expiry),
            salt: new utils_1.BigNumber(event.order.salt),
        },
        metaData: {
            orderHash: event.metaData.orderHash,
            remainingFillableTakerAmount: new utils_1.BigNumber(event.metaData.remainingFillableTakerAmount),
            state: event.metaData.state.toUpperCase(),
        },
    };
};
exports.orderWatcherEventToSRAOrder = orderWatcherEventToSRAOrder;
//# sourceMappingURL=order_watcher_utils.js.map