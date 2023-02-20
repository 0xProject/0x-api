"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const hash_utils_1 = require("../../src/utils/hash_utils");
describe('isRolledOut', () => {
    it('should give a consistent result for the same message', () => {
        const message = 'hello world';
        const threshold = 0.5;
        const first = (0, hash_utils_1.isHashSmallEnough)({ message, threshold });
        const second = (0, hash_utils_1.isHashSmallEnough)({ message, threshold });
        const third = (0, hash_utils_1.isHashSmallEnough)({ message, threshold });
        (0, contracts_test_utils_1.expect)(first).to.eq(second);
        (0, contracts_test_utils_1.expect)(second).to.eq(third);
    });
    it('should partition the rollout group to the approximate threshold target', () => {
        const population = 1000;
        const threshold = 0.1;
        let rolloutCount = 0;
        for (let i = 0; i < population; i++) {
            if ((0, hash_utils_1.isHashSmallEnough)({ message: i, threshold })) {
                rolloutCount++;
            }
        }
        (0, contracts_test_utils_1.expect)(rolloutCount).to.eq(102); // approximately 100
    });
    it('should roll out for 100%', () => {
        const population = 1000;
        const threshold = 1;
        let rolloutCount = 0;
        for (let i = 0; i < population; i++) {
            if ((0, hash_utils_1.isHashSmallEnough)({ message: i.toString(), threshold })) {
                rolloutCount++;
            }
        }
        (0, contracts_test_utils_1.expect)(rolloutCount).to.eq(1000);
    });
});
//# sourceMappingURL=hash_utils_test.js.map