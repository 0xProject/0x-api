"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetSwapperOrderbook = void 0;
const asset_swapper_1 = require("../asset-swapper");
const constants_1 = require("../constants");
class AssetSwapperOrderbook extends asset_swapper_1.Orderbook {
    constructor(orderbookService) {
        super();
        this.orderbookService = orderbookService;
    }
    async getOrdersAsync(makerToken, takerToken, pruneFn) {
        const apiOrders = await this.orderbookService.getOrdersAsync(constants_1.DEFAULT_PAGE, constants_1.DEFAULT_PER_PAGE, {
            makerToken,
            takerToken,
        }, {});
        const orders = apiOrders.records.map(apiOrderToOrderbookOrder);
        const result = pruneFn ? orders.filter(pruneFn) : orders;
        return result;
    }
    async getBatchOrdersAsync(makerTokens, takerToken, pruneFn) {
        const apiOrders = await this.orderbookService.getBatchOrdersAsync(constants_1.DEFAULT_PAGE, constants_1.DEFAULT_PER_PAGE, makerTokens, [
            takerToken,
        ]);
        const orders = apiOrders.records.map(apiOrderToOrderbookOrder);
        const pruned = pruneFn ? orders.filter(pruneFn) : orders;
        const groupedByMakerToken = makerTokens.map((token) => pruned.filter((o) => o.order.makerToken === token));
        return groupedByMakerToken;
    }
    async destroyAsync() {
        return;
    }
}
exports.AssetSwapperOrderbook = AssetSwapperOrderbook;
function apiOrderToOrderbookOrder(apiOrder) {
    const { signature, ...orderRest } = apiOrder.order;
    return {
        order: orderRest,
        signature,
        type: asset_swapper_1.FillQuoteTransformerOrderType.Limit,
    };
}
//# sourceMappingURL=asset_swapper_orderbook.js.map