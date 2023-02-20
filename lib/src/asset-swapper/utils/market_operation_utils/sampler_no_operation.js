"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamplerNoOperation = void 0;
const utils_1 = require("@0x/utils");
/**
 * SamplerNoOperation can be used for sources where we already have all the necessary information
 * required to perform the sample operations, without needing access to any on-chain data. Using a noop sample
 * you can skip the eth_call, and just calculate the results directly in typescript land.
 */
class SamplerNoOperation {
    constructor(opts) {
        this.source = opts.source;
        this.fillData = opts.fillData || {};
        this._callback = opts.callback;
    }
    encodeCall() {
        return utils_1.NULL_BYTES;
    }
    handleCallResults(_callResults) {
        return this._callback();
    }
    handleRevert(_callResults) {
        utils_1.logUtils.warn(`SamplerNoOperation: ${this.source} reverted`);
        return [];
    }
}
exports.SamplerNoOperation = SamplerNoOperation;
//# sourceMappingURL=sampler_no_operation.js.map