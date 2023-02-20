"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pairUtils = void 0;
exports.pairUtils = {
    toKey(tokenA, tokenB) {
        return [tokenA, tokenB]
            .map((str) => str.toLowerCase())
            .sort()
            .join('-');
    },
    fromKey(k) {
        const a = k.split('-');
        if (a.length !== 2) {
            throw new Error();
        }
        return [a[0], a[1]];
    },
    toUniqueArray(pairKeys) {
        const uniqueKeySet = pairKeys.reduce((result, pairKey) => {
            result.add(pairKey);
            return result;
        }, new Set());
        return Array.from(uniqueKeySet.values()).map(exports.pairUtils.fromKey.bind(exports.pairUtils));
    },
};
//# sourceMappingURL=pair_utils.js.map