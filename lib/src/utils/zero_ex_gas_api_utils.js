"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeroExGasApiUtils = void 0;
const config_1 = require("../config");
const constants_1 = require("../constants");
let previousGasInfo;
let lastAccessed;
const CACHE_EXPIRY_SEC = 60;
const getGasInfoAsync = async () => {
    const now = Date.now() / constants_1.ONE_SECOND_MS;
    if (!previousGasInfo || now - CACHE_EXPIRY_SEC > lastAccessed) {
        try {
            const res = await fetch(config_1.ZERO_EX_GAS_API_URL);
            previousGasInfo = await res.json();
            lastAccessed = now;
        }
        catch (e) {
            throw new Error('Failed to fetch gas price from 0x gas api');
        }
    }
    return previousGasInfo;
};
exports.zeroExGasApiUtils = {
    /** @returns gas prices or default gas prices.*/
    getGasPricesOrDefault: async (defaultGasPrices) => {
        const gasInfo = await getGasInfoAsync();
        if (gasInfo !== undefined) {
            return {
                ...defaultGasPrices,
                ...gasInfo.result,
            };
        }
        return defaultGasPrices;
    },
};
//# sourceMappingURL=zero_ex_gas_api_utils.js.map