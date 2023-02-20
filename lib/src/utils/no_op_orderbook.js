"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoOpOrderbook = void 0;
const asset_swapper_1 = require("../asset-swapper");
class NoOpOrderbook extends asset_swapper_1.Orderbook {
    constructor() {
        super();
    }
    async getOrdersAsync(_makerToken, _takerToken, _pruneFn) {
        return [];
    }
    async getBatchOrdersAsync(_makerTokens, _takerToken, _pruneFn) {
        return [];
    }
    async destroyAsync() {
        return;
    }
}
exports.NoOpOrderbook = NoOpOrderbook;
//# sourceMappingURL=no_op_orderbook.js.map