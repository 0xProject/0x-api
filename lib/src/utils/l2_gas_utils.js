"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateArbitrumL1CalldataGasCost = void 0;
const zlib = require("zlib");
const ARBITRUM_FIXED_COST_ESTIMATE = 140;
const TX_DATA_NON_ZERO_GAS_EIP2028 = 16;
const L1_GAS_COST_BUFFER = 1.15; // 15% buffer
// This number is based on "safe" (relatively large) value from `ArbGasInfo`'s (precompile) `getPricesInWei`
// `getPricesInWei` returns price per byte which needs to be divided by 16 (calldata unit for non-zero byte).
const DEFAULT_ARBITRUM_L1_CALLDATA_PRICE_PER_UNIT = 6250000000; // 100b / 16
// github.com/OffchainLabs/nitro/blob/c2f7c43dcd9a35a716cf6db8625228b4b7a4328d/arbos/l1pricing/l1pricing.go#L714
function getByteCountAfterBrotli0(calldata) {
    const calldataWithoutPrefix = calldata.startsWith('0x') ? calldata.substring(2) : calldata;
    const compressedCalldata = zlib.brotliCompressSync(Buffer.from(calldataWithoutPrefix, 'hex'), {
        params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_GENERIC,
            [zlib.constants.BROTLI_PARAM_QUALITY]: 0,
        },
    });
    return compressedCalldata.byteLength;
}
// https://github.com/OffchainLabs/nitro/blob/a84a760cae94e5c49c5da072b38e9cabe0dbbf72/arbos/l1pricing/l1pricing.go#L645
function getArbitrumPosterDataCost(calldata, l1CalldataPricePerUnit) {
    const l1ByteCount = getByteCountAfterBrotli0(calldata) + ARBITRUM_FIXED_COST_ESTIMATE;
    const units = l1ByteCount * TX_DATA_NON_ZERO_GAS_EIP2028;
    return units * l1CalldataPricePerUnit;
}
function estimateArbitrumL1CalldataGasCost(params) {
    const l1CalldataPricePerUnit = params.l1CalldataPricePerUnit || DEFAULT_ARBITRUM_L1_CALLDATA_PRICE_PER_UNIT;
    const posterDataCost = getArbitrumPosterDataCost(params.calldata, l1CalldataPricePerUnit) * L1_GAS_COST_BUFFER;
    const posterFee = posterDataCost / params.l2GasPrice;
    return Math.ceil(posterFee);
}
exports.estimateArbitrumL1CalldataGasCost = estimateArbitrumL1CalldataGasCost;
//# sourceMappingURL=l2_gas_utils.js.map