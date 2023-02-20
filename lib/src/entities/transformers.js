"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigNumberTransformer = exports.BigIntTransformer = void 0;
const utils_1 = require("@0x/utils");
exports.BigIntTransformer = {
    from: (value) => {
        if (value === null) {
            return null;
        }
        const num = Number(value);
        if (!Number.isSafeInteger(num)) {
            throw new Error('unsafe integer precision when transforming value');
        }
        return value === null ? null : Number(value);
    },
    to: (value) => {
        if (value === null || value === undefined) {
            return null;
        }
        if (!Number.isSafeInteger(value)) {
            throw new Error('unsafe integer precision when transforming value');
        }
        return value.toString();
    },
};
exports.BigNumberTransformer = {
    from: (value) => {
        return value === null ? null : new utils_1.BigNumber(value);
    },
    to: (value) => {
        return value === null || value === undefined ? null : value.toString();
    },
};
//# sourceMappingURL=transformers.js.map