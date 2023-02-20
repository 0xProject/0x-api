"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomSignature = exports.getRandomAmount = exports.generatePseudoRandomSalt = void 0;
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
function generatePseudoRandomSalt() {
    const salt = (0, utils_1.generatePseudoRandom256BitNumber)();
    return salt;
}
exports.generatePseudoRandomSalt = generatePseudoRandomSalt;
function getRandomAmount(maxAmount = '1e18') {
    return (0, contracts_test_utils_1.getRandomInteger)(1, maxAmount);
}
exports.getRandomAmount = getRandomAmount;
function getRandomSignature() {
    return {
        v: 1,
        r: utils_1.hexUtils.random(32),
        s: utils_1.hexUtils.random(32),
        signatureType: protocol_utils_1.SignatureType.Invalid,
    };
}
exports.getRandomSignature = getRandomSignature;
//# sourceMappingURL=utils.js.map