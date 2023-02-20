"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLiquidityProvidersForPair = void 0;
function getLiquidityProvidersForPair(registry, takerToken, makerToken) {
    return Object.entries(registry)
        .filter(([, plp]) => [makerToken, takerToken].every((t) => plp.tokens.includes(t)))
        .map(([providerAddress]) => {
        let gasCost;
        if (typeof registry[providerAddress].gasCost === 'number') {
            gasCost = registry[providerAddress].gasCost;
        }
        else {
            gasCost = registry[providerAddress].gasCost(takerToken, makerToken);
        }
        return {
            providerAddress,
            gasCost,
        };
    });
}
exports.getLiquidityProvidersForPair = getLiquidityProvidersForPair;
//# sourceMappingURL=liquidity_provider_utils.js.map