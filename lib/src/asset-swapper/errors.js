"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientAssetLiquidityError = void 0;
const types_1 = require("./types");
/**
 * Error class representing insufficient asset liquidity
 */
class InsufficientAssetLiquidityError extends Error {
    /**
     * @param amountAvailableToFill The amount availabe to fill (in base units) factoring in slippage
     */
    constructor(amountAvailableToFill) {
        super(types_1.SwapQuoterError.InsufficientAssetLiquidity);
        this.amountAvailableToFill = amountAvailableToFill;
        // Setting prototype so instanceof works.  See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, InsufficientAssetLiquidityError.prototype);
    }
}
exports.InsufficientAssetLiquidityError = InsufficientAssetLiquidityError;
//# sourceMappingURL=errors.js.map