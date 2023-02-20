"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderEventEndState = exports.FeeParamTypes = exports.WebsocketConnectionEventType = exports.OrdersChannelMessageTypes = exports.MessageChannels = exports.MessageTypes = void 0;
var MessageTypes;
(function (MessageTypes) {
    MessageTypes["Subscribe"] = "subscribe";
})(MessageTypes = exports.MessageTypes || (exports.MessageTypes = {}));
var MessageChannels;
(function (MessageChannels) {
    MessageChannels["Orders"] = "orders";
})(MessageChannels = exports.MessageChannels || (exports.MessageChannels = {}));
var OrdersChannelMessageTypes;
(function (OrdersChannelMessageTypes) {
    OrdersChannelMessageTypes["Update"] = "update";
    OrdersChannelMessageTypes["Unknown"] = "unknown";
})(OrdersChannelMessageTypes = exports.OrdersChannelMessageTypes || (exports.OrdersChannelMessageTypes = {}));
var WebsocketConnectionEventType;
(function (WebsocketConnectionEventType) {
    WebsocketConnectionEventType["Close"] = "close";
    WebsocketConnectionEventType["Error"] = "error";
    WebsocketConnectionEventType["Message"] = "message";
})(WebsocketConnectionEventType = exports.WebsocketConnectionEventType || (exports.WebsocketConnectionEventType = {}));
/** END SRA TYPES */
var FeeParamTypes;
(function (FeeParamTypes) {
    FeeParamTypes["FIXED"] = "FIXED";
    FeeParamTypes["GASLESS_FEE"] = "GASLESS_FEE";
})(FeeParamTypes = exports.FeeParamTypes || (exports.FeeParamTypes = {}));
var OrderEventEndState;
(function (OrderEventEndState) {
    // The order was successfully validated and added to the Mesh node. The order is now being watched and any changes to
    // the fillability will result in subsequent order events.
    OrderEventEndState["Added"] = "ADDED";
    // The order was filled for a partial amount. The order is still fillable up to the fillableTakerAssetAmount.
    OrderEventEndState["Filled"] = "FILLED";
    // The order was fully filled and its remaining fillableTakerAssetAmount is 0. The order is no longer fillable.
    OrderEventEndState["FullyFilled"] = "FULLY_FILLED";
    // The order was cancelled and is no longer fillable.
    OrderEventEndState["Cancelled"] = "CANCELLED";
    // The order expired and is no longer fillable.
    OrderEventEndState["Expired"] = "EXPIRED";
    // Catch all 'Invalid' state when invalid orders are submitted.
    OrderEventEndState["Invalid"] = "INVALID";
    // The order was previously expired, but due to a block re-org it is no longer considered expired (should be rare).
    OrderEventEndState["Unexpired"] = "UNEXPIRED";
    // The order has become unfunded and is no longer fillable. This can happen if the maker makes a transfer or changes their allowance.
    OrderEventEndState["Unfunded"] = "UNFUNDED";
    // The fillability of the order has increased. This can happen if a previously processed fill event gets reverted due to a block re-org,
    // or if a maker makes a transfer or changes their allowance.
    OrderEventEndState["FillabilityIncreased"] = "FILLABILITY_INCREASED";
    // The order is potentially still valid but was removed for a different reason (e.g.
    // the database is full or the peer that sent the order was misbehaving). The order will no longer be watched
    // and no further events for this order will be emitted. In some cases, the order may be re-added in the
    // future.
    OrderEventEndState["StoppedWatching"] = "STOPPED_WATCHING";
})(OrderEventEndState = exports.OrderEventEndState || (exports.OrderEventEndState = {}));
//# sourceMappingURL=types.js.map