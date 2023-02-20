"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AaveV2Sampler = void 0;
const constants_1 = require("../constants");
class AaveV2Sampler {
    static sampleSellsFromAaveV2(aaveInfo, takerToken, makerToken, takerTokenAmounts) {
        // Deposit/Withdrawal underlying <-> aToken is always 1:1
        if ((takerToken.toLowerCase() === aaveInfo.aToken.toLowerCase() &&
            makerToken.toLowerCase() === aaveInfo.underlyingToken.toLowerCase()) ||
            (takerToken.toLowerCase() === aaveInfo.underlyingToken.toLowerCase() &&
                makerToken.toLowerCase() === aaveInfo.aToken.toLowerCase())) {
            return takerTokenAmounts;
        }
        // Not matching the reserve return 0 results
        const numSamples = takerTokenAmounts.length;
        const makerTokenAmounts = new Array(numSamples);
        makerTokenAmounts.fill(constants_1.ZERO_AMOUNT);
        return makerTokenAmounts;
    }
    static sampleBuysFromAaveV2(aaveInfo, takerToken, makerToken, makerTokenAmounts) {
        // Deposit/Withdrawal underlying <-> aToken is always 1:1
        if ((takerToken.toLowerCase() === aaveInfo.aToken.toLowerCase() &&
            makerToken.toLowerCase() === aaveInfo.underlyingToken.toLowerCase()) ||
            (takerToken.toLowerCase() === aaveInfo.underlyingToken.toLowerCase() &&
                makerToken.toLowerCase() === aaveInfo.aToken.toLowerCase())) {
            return makerTokenAmounts;
        }
        // Not matching the reserve return 0 results
        const numSamples = makerTokenAmounts.length;
        const takerTokenAmounts = new Array(numSamples);
        takerTokenAmounts.fill(constants_1.ZERO_AMOUNT);
        return takerTokenAmounts;
    }
}
exports.AaveV2Sampler = AaveV2Sampler;
//# sourceMappingURL=AaveV2Sampler.js.map