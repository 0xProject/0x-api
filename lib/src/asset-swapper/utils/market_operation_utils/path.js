"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Path = void 0;
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const types_1 = require("../../types");
const constants_1 = require("./constants");
const fills_1 = require("./fills");
const orders_1 = require("./orders");
const rate_utils_1 = require("./rate_utils");
class Path {
    constructor(context, fills, ordersByType, targetInput, pathPenaltyOpts, sourceFlags, adjustedSize) {
        this.context = context;
        this.fills = fills;
        this.ordersByType = ordersByType;
        this.targetInput = targetInput;
        this.pathPenaltyOpts = pathPenaltyOpts;
        this.sourceFlags = sourceFlags;
        this.adjustedSize = adjustedSize;
    }
    static create(context, fills, targetInput, pathPenaltyOpts) {
        const sourceFlags = mergeSourceFlags(fills.map((fill) => fill.flags));
        return new Path(context, fills, createOrdersByType(fills, context), targetInput, pathPenaltyOpts, sourceFlags, createAdjustedSize(targetInput, fills));
    }
    hasTwoHop() {
        return (this.sourceFlags & constants_1.SOURCE_FLAGS[types_1.ERC20BridgeSource.MultiHop]) > 0;
    }
    getOrdersByType() {
        return this.ordersByType;
    }
    getOrders() {
        const twoHopOrders = _.flatMap(this.ordersByType.twoHopOrders, ({ firstHopOrder, secondHopOrder }) => [
            firstHopOrder,
            secondHopOrder,
        ]);
        return [...this.ordersByType.nativeOrders, ...this.ordersByType.bridgeOrders, ...twoHopOrders];
    }
    /**
     * Returns `OptimizedOrdersByType` with slippage applied (Native orders do not have slippage).
     * @param maxSlippage maximum slippage. It must be [0, 1].
     * @returns orders by type by with slippage applied when applicable.
     */
    getSlippedOrdersByType(maxSlippage) {
        checkSlippage(maxSlippage);
        const { nativeOrders, twoHopOrders, bridgeOrders } = this.getOrdersByType();
        const slipOrder = createSlipOrderFunction(maxSlippage, this.context.side);
        return {
            nativeOrders: nativeOrders,
            twoHopOrders: twoHopOrders.map((twoHopOrder) => ({
                firstHopOrder: slipOrder(twoHopOrder.firstHopOrder),
                secondHopOrder: slipOrder(twoHopOrder.secondHopOrder),
            })),
            bridgeOrders: bridgeOrders.map(createSlipOrderFunction(maxSlippage, this.context.side)),
        };
    }
    /**
     * Returns `OptimizedOrder`s with slippage applied (Native orders do not have slippage).
     * @param maxSlippage maximum slippage. It must be [0, 1].
     * @returns orders with slippage applied.
     */
    getSlippedOrders(maxSlippage) {
        checkSlippage(maxSlippage);
        const slipOrder = createSlipOrderFunction(maxSlippage, this.context.side);
        return this.getOrders().map(slipOrder);
    }
    /**
     * Calculates the rate of this path, where the output has been
     * adjusted for penalties (e.g cost)
     */
    adjustedRate() {
        const { input, output } = this.getExchangeProxyOverheadAppliedSize();
        return (0, rate_utils_1.getRate)(this.context.side, input, output);
    }
    /**
     * Compares two paths returning if this adjusted path
     * is better than the other adjusted path
     */
    isAdjustedBetterThan(other) {
        if (!this.targetInput.isEqualTo(other.targetInput)) {
            throw new Error(`Target input mismatch: ${this.targetInput} !== ${other.targetInput}`);
        }
        const { targetInput } = this;
        const { input } = this.adjustedSize;
        const { input: otherInput } = other.adjustedSize;
        if (input.isLessThan(targetInput) || otherInput.isLessThan(targetInput)) {
            return input.isGreaterThan(otherInput);
        }
        else {
            return this.adjustedCompleteRate().isGreaterThan(other.adjustedCompleteRate());
        }
    }
    getExchangeProxyOverheadAppliedSize() {
        // Adjusted input/output has been adjusted by the cost of the DEX, but not by any
        // overhead added by the exchange proxy.
        const { input, output } = this.adjustedSize;
        const { exchangeProxyOverhead, outputAmountPerEth, inputAmountPerEth } = this.pathPenaltyOpts;
        // Calculate the additional penalty from the ways this path can be filled
        // by the exchange proxy, e.g VIPs (small) or FillQuoteTransformer (large)
        const gasOverhead = exchangeProxyOverhead(this.sourceFlags);
        const pathPenalty = (0, fills_1.ethToOutputAmount)({
            input,
            output,
            inputAmountPerEth,
            outputAmountPerEth,
            ethAmount: gasOverhead,
        });
        return {
            input,
            output: this.context.side === types_1.MarketOperation.Sell ? output.minus(pathPenalty) : output.plus(pathPenalty),
        };
    }
    adjustedCompleteRate() {
        const { input, output } = this.getExchangeProxyOverheadAppliedSize();
        return (0, rate_utils_1.getCompleteRate)(this.context.side, input, output, this.targetInput);
    }
}
exports.Path = Path;
function createAdjustedSize(targetInput, fills) {
    return fills.reduce((currentSize, fill) => {
        if (currentSize.input.plus(fill.input).isGreaterThan(targetInput)) {
            const remainingInput = targetInput.minus(currentSize.input);
            const scaledFillOutput = fill.output.times(remainingInput.div(fill.input));
            // Penalty does not get interpolated.
            const penalty = fill.adjustedOutput.minus(fill.output);
            return {
                input: targetInput,
                output: currentSize.output.plus(scaledFillOutput).plus(penalty),
            };
        }
        else {
            return {
                input: currentSize.input.plus(fill.input),
                output: currentSize.output.plus(fill.adjustedOutput),
            };
        }
    }, { input: constants_1.ZERO_AMOUNT, output: constants_1.ZERO_AMOUNT });
}
function mergeSourceFlags(flags) {
    return flags.reduce((mergedFlags, currentFlags) => mergedFlags | currentFlags, BigInt(0));
}
function createOrdersByType(fills, context) {
    // Internal BigInt flag field is not supported JSON and is tricky to remove upstream.
    const normalizedFills = fills.map((fill) => _.omit(fill, 'flags'));
    const nativeOrders = normalizedFills
        .filter((fill) => fill.source === types_1.ERC20BridgeSource.Native)
        .map((fill) => (0, orders_1.createNativeOptimizedOrder)(fill, context.side));
    const twoHopOrders = normalizedFills
        .filter((fill) => fill.source === types_1.ERC20BridgeSource.MultiHop)
        .map((fill) => (0, orders_1.createOrdersFromTwoHopSample)(fill, context));
    const { makerToken, takerToken } = (0, orders_1.getMakerTakerTokens)(context);
    const bridgeOrders = normalizedFills
        .filter((fill) => fill.source !== types_1.ERC20BridgeSource.Native && fill.source !== types_1.ERC20BridgeSource.MultiHop)
        .map((fill) => (0, orders_1.createBridgeOrder)(fill, makerToken, takerToken, context.side));
    return { nativeOrders, twoHopOrders, bridgeOrders };
}
function checkSlippage(maxSlippage) {
    if (maxSlippage < 0 || maxSlippage > 1) {
        throw new Error(`slippage must be [0, 1]. Given: ${maxSlippage}`);
    }
}
function createSlipOrderFunction(maxSlippage, side) {
    return (order) => {
        if (order.source === types_1.ERC20BridgeSource.Native || maxSlippage === 0) {
            return order;
        }
        return {
            ...order,
            ...(side === types_1.MarketOperation.Sell
                ? {
                    makerAmount: order.makerAmount.eq(constants_1.MAX_UINT256)
                        ? constants_1.MAX_UINT256
                        : order.makerAmount.times(1 - maxSlippage).integerValue(utils_1.BigNumber.ROUND_DOWN),
                }
                : {
                    takerAmount: order.takerAmount.eq(constants_1.MAX_UINT256)
                        ? constants_1.MAX_UINT256
                        : order.takerAmount.times(1 + maxSlippage).integerValue(utils_1.BigNumber.ROUND_UP),
                }),
        };
    };
}
//# sourceMappingURL=path.js.map