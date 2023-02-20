"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlippageModelFillAdjustor = void 0;
const types_1 = require("@0x/types");
const asset_swapper_1 = require("../asset-swapper");
class SlippageModelFillAdjustor {
    constructor(slippageModelManager, sellToken, buyToken, maxSlippageRate) {
        this.slippageModelManager = slippageModelManager;
        this.sellToken = sellToken;
        this.buyToken = buyToken;
        this.maxSlippageRate = maxSlippageRate;
    }
    adjustFills(side, fills) {
        return fills.map((f) => {
            // Mostly negative, as in the trade experiences a worst price
            // e.g -0.02938
            const expectedSlippage = this.slippageModelManager.calculateExpectedSlippage(this.buyToken, this.sellToken, side === types_1.MarketOperation.Sell ? f.output : f.input, side === types_1.MarketOperation.Sell ? f.input : f.output, [{ name: f.source, proportion: new asset_swapper_1.BigNumber(1) }], this.maxSlippageRate);
            if (expectedSlippage === null) {
                return f;
            }
            const fill = { ...f };
            // Calculate the current penalty (gas) as we do not want to adjust
            // an already adjusted output (compounding the adjustment further)
            const previousPenalty = f.output.minus(f.adjustedOutput).absoluteValue();
            // 1000 * (1 + -0.02938) = 970
            const slippageAdjustedOutput = f.output
                .times(new asset_swapper_1.BigNumber(1).plus(expectedSlippage))
                .integerValue(asset_swapper_1.BigNumber.ROUND_UP);
            // Calculate the slippage as a positive amount, the difference from current output
            // and the slippage adjusted output
            const slippagePenalty = f.output.minus(slippageAdjustedOutput).absoluteValue();
            // Apply the penalties
            const newAdjustedOutput = (0, asset_swapper_1.adjustOutput)(side, f.output, previousPenalty.plus(slippagePenalty)).integerValue();
            fill.adjustedOutput = newAdjustedOutput;
            return fill;
        });
    }
}
exports.SlippageModelFillAdjustor = SlippageModelFillAdjustor;
//# sourceMappingURL=slippage_model_fill_adjustor.js.map