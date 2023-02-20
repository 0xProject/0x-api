"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransformerNonces = exports.decodeTransformERC20 = void 0;
const utils_1 = require("@0x/utils");
const transformERC20Encoder = utils_1.AbiEncoder.createMethod('transformERC20', [
    { type: 'address', name: 'inputToken' },
    { type: 'address', name: 'outputToken' },
    { type: 'uint256', name: 'inputTokenAmount' },
    { type: 'uint256', name: 'minOutputTokenAmount' },
    {
        type: 'tuple[]',
        name: 'transformations',
        components: [
            { type: 'uint32', name: 'deploymentNonce' },
            { type: 'bytes', name: 'data' },
        ],
    },
]);
/** Returns decoded `TransformERC20.transformERC20` calldata. */
function decodeTransformERC20(calldata) {
    return transformERC20Encoder.decode(calldata);
}
exports.decodeTransformERC20 = decodeTransformERC20;
function getTransformerNonces(args) {
    return args.transformations.map((t) => t.deploymentNonce.toNumber());
}
exports.getTransformerNonces = getTransformerNonces;
//# sourceMappingURL=decoders.js.map