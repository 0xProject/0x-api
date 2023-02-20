"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
const asset_swapper_1 = require("../../src/asset-swapper");
const rfqm_db_utils_1 = require("../../src/utils/rfqm_db_utils");
describe('RFQM DB utils', () => {
    describe('storedOrderToRfqmOrder and v4RfqOrderToStoredOrder', () => {
        it('should map there and back without data corruption', () => {
            // it's expired if it's over 9000
            const expiry = new asset_swapper_1.BigNumber(9000);
            const chainId = 1;
            const order = new protocol_utils_1.RfqOrder({
                txOrigin: '0x0000000000000000000000000000000000000000',
                taker: '0x1111111111111111111111111111111111111111',
                maker: '0x2222222222222222222222222222222222222222',
                makerToken: '0x3333333333333333333333333333333333333333',
                takerToken: '0x4444444444444444444444444444444444444444',
                expiry,
                salt: new asset_swapper_1.BigNumber(1),
                chainId,
                verifyingContract: '0x0000000000000000000000000000000000000000',
                pool: '0x1',
            });
            const processedOrder = (0, rfqm_db_utils_1.storedOrderToRfqmOrder)((0, rfqm_db_utils_1.v4RfqOrderToStoredOrder)(order));
            (0, contracts_test_utils_1.expect)(processedOrder).to.deep.eq(order);
        });
    });
});
//# sourceMappingURL=rfqm_db_utils_test.js.map