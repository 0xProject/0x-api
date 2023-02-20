"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberUtils = void 0;
exports.numberUtils = {
    // from MDN https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    randomNumberInclusive: (minimumSpecified, maximumSpecified) => {
        const min = Math.ceil(minimumSpecified);
        const max = Math.floor(maximumSpecified);
        return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive and the minimum is inclusive
    },
    // creates a random hex number of desired length by stringing together
    // random integers from 1-15, guaranteeing the
    // result is a hex number of the given length
    randomHexNumberOfLength: (numberLength) => {
        let res = '';
        for (let i = 0; i < numberLength; i++) {
            res = `${res}${exports.numberUtils.randomNumberInclusive(1, 15).toString(16)}`;
        }
        return res;
    },
};
//# sourceMappingURL=number_utils.js.map