"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiplexUniswapEncoder = exports.multiplexOtcOrder = exports.multiplexRfqEncoder = exports.multiplexTransformERC20Encoder = exports.MultiplexSubcall = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
var MultiplexSubcall;
(function (MultiplexSubcall) {
    MultiplexSubcall[MultiplexSubcall["Invalid"] = 0] = "Invalid";
    MultiplexSubcall[MultiplexSubcall["Rfq"] = 1] = "Rfq";
    MultiplexSubcall[MultiplexSubcall["Otc"] = 2] = "Otc";
    MultiplexSubcall[MultiplexSubcall["UniswapV2"] = 3] = "UniswapV2";
    MultiplexSubcall[MultiplexSubcall["UniswapV3"] = 4] = "UniswapV3";
    MultiplexSubcall[MultiplexSubcall["TransformERC20"] = 5] = "TransformERC20";
    MultiplexSubcall[MultiplexSubcall["BatchSell"] = 6] = "BatchSell";
    MultiplexSubcall[MultiplexSubcall["MultiHopSell"] = 7] = "MultiHopSell";
})(MultiplexSubcall = exports.MultiplexSubcall || (exports.MultiplexSubcall = {}));
exports.multiplexTransformERC20Encoder = utils_1.AbiEncoder.create([
    {
        name: 'transformations',
        type: 'tuple[]',
        components: [
            { name: 'deploymentNonce', type: 'uint32' },
            { name: 'data', type: 'bytes' },
        ],
    },
]);
exports.multiplexRfqEncoder = utils_1.AbiEncoder.create([
    { name: 'order', type: 'tuple', components: protocol_utils_1.RfqOrder.STRUCT_ABI },
    { name: 'signature', type: 'tuple', components: protocol_utils_1.SIGNATURE_ABI },
]);
exports.multiplexOtcOrder = utils_1.AbiEncoder.create([
    { name: 'order', type: 'tuple', components: protocol_utils_1.OtcOrder.STRUCT_ABI },
    { name: 'signature', type: 'tuple', components: protocol_utils_1.SIGNATURE_ABI },
]);
exports.multiplexUniswapEncoder = utils_1.AbiEncoder.create([
    { name: 'tokens', type: 'address[]' },
    { name: 'isSushi', type: 'bool' },
]);
//# sourceMappingURL=multiplex_encoders.js.map