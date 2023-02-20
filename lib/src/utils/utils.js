"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = void 0;
const constants_1 = require("../constants");
exports.utils = {
    isNil: (value) => {
        // undefined == null => true
        // undefined == undefined => true
        return value == null;
    },
    calculateCallDataGas: (bytes) => {
        const buf = Buffer.from(bytes.replace(/0x/g, ''), 'hex');
        let gas = constants_1.TX_BASE_GAS.toNumber();
        for (const b of buf) {
            // 4 gas per 0 byte, 16 gas per non-zero
            gas += b === 0 ? 4 : 16;
        }
        return gas;
    },
};
//# sourceMappingURL=utils.js.map