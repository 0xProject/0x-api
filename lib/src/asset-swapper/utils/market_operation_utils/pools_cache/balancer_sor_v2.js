"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePoolData = void 0;
/**
 * This has been copied from https://github.com/balancer-labs/balancer-sor/blob/john/rc2/src/helpers.ts.
 * Still awaiting V2 support for @balancer-labs/sor, once full V2 support is shipped we can upgrade sor and delete this file
 */
const parsePoolData = (directPools, tokenIn, tokenOut, mostLiquidPoolsFirstHop = [], mostLiquidPoolsSecondHop = [], hopTokens = []) => {
    const pathDataList = [];
    const pools = {};
    // First add direct pair paths
    for (const idKey in directPools) {
        const p = directPools[idKey];
        // Add pool to the set with all pools (only adds if it's still not present in dict)
        pools[idKey] = p;
        const swap = {
            pool: p.id,
            tokenIn,
            tokenOut,
            tokenInDecimals: 18,
            tokenOutDecimals: 18,
        };
        const path = {
            id: p.id,
            swaps: [swap],
        };
        pathDataList.push(path);
    }
    // Now add multi-hop paths.
    // mostLiquidPoolsFirstHop and mostLiquidPoolsSecondHop always has the same
    // lengh of hopTokens
    for (let i = 0; i < hopTokens.length; i++) {
        // Add pools to the set with all pools (only adds if it's still not present in dict)
        pools[mostLiquidPoolsFirstHop[i].id] = mostLiquidPoolsFirstHop[i];
        pools[mostLiquidPoolsSecondHop[i].id] = mostLiquidPoolsSecondHop[i];
        const swap1 = {
            pool: mostLiquidPoolsFirstHop[i].id,
            tokenIn,
            tokenOut: hopTokens[i],
            tokenInDecimals: 18,
            tokenOutDecimals: 18,
        };
        const swap2 = {
            pool: mostLiquidPoolsSecondHop[i].id,
            tokenIn: hopTokens[i],
            tokenOut,
            tokenInDecimals: 18,
            tokenOutDecimals: 18,
        };
        const path = {
            id: mostLiquidPoolsFirstHop[i].id + mostLiquidPoolsSecondHop[i].id,
            swaps: [swap1, swap2],
        };
        pathDataList.push(path);
    }
    return [pools, pathDataList];
};
exports.parsePoolData = parsePoolData;
//# sourceMappingURL=balancer_sor_v2.js.map