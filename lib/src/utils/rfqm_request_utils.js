"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringsToMetaTransactionFields = exports.stringsToSignature = void 0;
const asset_swapper_1 = require("../asset-swapper");
/**
 * convert a Signature response into the data types expected by protocol-utils
 */
function stringsToSignature(strings) {
    return {
        signatureType: Number(strings.signatureType),
        v: Number(strings.v),
        r: strings.r,
        s: strings.s,
    };
}
exports.stringsToSignature = stringsToSignature;
/**
 * convert a metaTransaction response into a the fields expected when instantiating
 * a metaTransaction object
 */
function stringsToMetaTransactionFields(strings) {
    return {
        signer: strings.signer,
        sender: strings.sender,
        minGasPrice: new asset_swapper_1.BigNumber(strings.minGasPrice),
        maxGasPrice: new asset_swapper_1.BigNumber(strings.maxGasPrice),
        expirationTimeSeconds: new asset_swapper_1.BigNumber(strings.expirationTimeSeconds),
        salt: new asset_swapper_1.BigNumber(strings.salt),
        callData: strings.callData,
        value: new asset_swapper_1.BigNumber(strings.value),
        feeToken: strings.feeToken,
        feeAmount: new asset_swapper_1.BigNumber(strings.feeAmount),
        chainId: Number(strings.chainId),
        verifyingContract: strings.verifyingContract,
    };
}
exports.stringsToMetaTransactionFields = stringsToMetaTransactionFields;
//# sourceMappingURL=rfqm_request_utils.js.map