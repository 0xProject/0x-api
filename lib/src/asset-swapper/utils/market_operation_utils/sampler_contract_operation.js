"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamplerContractOperation = void 0;
const utils_1 = require("@0x/utils");
class SamplerContractOperation {
    constructor(opts) {
        this.source = opts.source;
        this.fillData = opts.fillData || {};
        this._samplerContract = opts.contract;
        this._samplerFunction = opts.function;
        this._params = opts.params;
        this._callback = opts.callback;
    }
    encodeCall() {
        return this._samplerFunction
            .bind(this._samplerContract)(...this._params)
            .getABIEncodedTransactionData();
    }
    handleCallResults(callResults) {
        if (this._callback !== undefined) {
            return this._callback(callResults, this.fillData);
        }
        else {
            return this._samplerContract.getABIDecodedReturnData(this._samplerFunction.name, callResults);
        }
    }
    handleRevert(callResults) {
        let msg = callResults;
        try {
            msg = (0, utils_1.decodeBytesAsRevertError)(callResults).toString();
        }
        catch (e) {
            // do nothing
        }
        utils_1.logUtils.warn(`SamplerContractOperation: ${this.source}.${this._samplerFunction.name} reverted ${msg}`);
        return [];
    }
}
exports.SamplerContractOperation = SamplerContractOperation;
//# sourceMappingURL=sampler_contract_operation.js.map