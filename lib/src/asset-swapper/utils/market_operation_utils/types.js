"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFinalPathFillData = exports.CurveFunctionSelectors = exports.AggregationError = void 0;
/**
 * Common exception messages thrown by aggregation logic.
 */
var AggregationError;
(function (AggregationError) {
    AggregationError["NoOptimalPath"] = "NO_OPTIMAL_PATH";
    AggregationError["EmptyOrders"] = "EMPTY_ORDERS";
    AggregationError["NotERC20AssetData"] = "NOT_ERC20ASSET_DATA";
    AggregationError["NoBridgeForSource"] = "NO_BRIDGE_FOR_SOURCE";
})(AggregationError = exports.AggregationError || (exports.AggregationError = {}));
/**
 * Curve contract function selectors.
 */
var CurveFunctionSelectors;
(function (CurveFunctionSelectors) {
    CurveFunctionSelectors["None"] = "0x00000000";
    CurveFunctionSelectors["exchange"] = "0x3df02124";
    CurveFunctionSelectors["exchange_underlying"] = "0xa6417ed6";
    CurveFunctionSelectors["get_dy_underlying"] = "0x07211ef7";
    CurveFunctionSelectors["get_dx_underlying"] = "0x0e71d1b9";
    CurveFunctionSelectors["get_dy"] = "0x5e0d443f";
    CurveFunctionSelectors["get_dx"] = "0x67df02ca";
    CurveFunctionSelectors["get_dy_uint256"] = "0x556d6e9f";
    CurveFunctionSelectors["exchange_underlying_uint256"] = "0x65b2489b";
    // Curve V2
    CurveFunctionSelectors["exchange_v2"] = "0x5b41b908";
    CurveFunctionSelectors["exchange_underlying_v2"] = "0x65b2489b";
    CurveFunctionSelectors["get_dy_v2"] = "0x556d6e9f";
    CurveFunctionSelectors["get_dy_underlying_v2"] = "0x85f11d1e";
    // Nerve BSC, Saddle Mainnet, Synapse
    CurveFunctionSelectors["swap"] = "0x91695586";
    CurveFunctionSelectors["calculateSwap"] = "0xa95b089f";
    CurveFunctionSelectors["calculateSwapUnderlying"] = "0x75d8e3e4";
    CurveFunctionSelectors["swapUnderlying"] = "0x78e0fae8";
})(CurveFunctionSelectors = exports.CurveFunctionSelectors || (exports.CurveFunctionSelectors = {}));
function isFinalPathFillData(data) {
    return !!data.path;
}
exports.isFinalPathFillData = isFinalPathFillData;
//# sourceMappingURL=types.js.map