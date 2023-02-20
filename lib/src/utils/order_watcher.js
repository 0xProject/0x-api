"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderWatcher = void 0;
const api_utils_1 = require("@0x/api-utils");
const axios_1 = require("axios");
const config_1 = require("../config");
const errors_1 = require("../errors");
class OrderWatcher {
    async postOrdersAsync(orders) {
        try {
            await axios_1.default.post(`${config_1.ORDER_WATCHER_URL}/orders`, orders, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 1000,
            });
        }
        catch (err) {
            if (err.response.data) {
                throw new errors_1.ValidationError(err.response.data.validationErrors);
            }
            else if (err.request) {
                throw new api_utils_1.InternalServerError('failed to submit order to order-watcher');
            }
            else {
                throw new api_utils_1.InternalServerError('failed to prepare the order-watcher request');
            }
        }
    }
}
exports.OrderWatcher = OrderWatcher;
//# sourceMappingURL=order_watcher.js.map