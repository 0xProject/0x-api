"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomLimitOrder = exports.getRandomSignedLimitOrderAsync = void 0;
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const asset_swapper_1 = require("../../src/asset-swapper");
const constants_1 = require("../../src/constants");
const constants_2 = require("../constants");
/**
 * Creates a random signed limit order from the provided fields
 */
async function getRandomSignedLimitOrderAsync(provider, fields = {}) {
    const limitOrder = getRandomLimitOrder(fields);
    const signature = await limitOrder.getSignatureWithProviderAsync(provider, asset_swapper_1.SignatureType.EIP712);
    return {
        ...limitOrder,
        signature,
    };
}
exports.getRandomSignedLimitOrderAsync = getRandomSignedLimitOrderAsync;
/**
 * Creates a random unsigned limit order from the provided fields
 */
function getRandomLimitOrder(fields = {}) {
    return new protocol_utils_1.LimitOrder({
        // Default opts
        makerToken: constants_2.ZRX_TOKEN_ADDRESS,
        takerToken: constants_2.WETH_TOKEN_ADDRESS,
        makerAmount: (0, contracts_test_utils_1.getRandomInteger)('100e18', '1000e18'),
        takerAmount: (0, contracts_test_utils_1.getRandomInteger)('100e18', '1000e18'),
        takerTokenFeeAmount: constants_1.ZERO,
        maker: (0, contracts_test_utils_1.randomAddress)(),
        taker: constants_2.NULL_ADDRESS,
        sender: constants_2.NULL_ADDRESS,
        feeRecipient: constants_2.NULL_ADDRESS,
        expiry: new utils_1.BigNumber(2524604400),
        salt: new utils_1.BigNumber(utils_1.hexUtils.random()),
        chainId: constants_2.CHAIN_ID,
        verifyingContract: (0, asset_swapper_1.getContractAddressesForChainOrThrow)(constants_2.CHAIN_ID).exchangeProxy,
        ...fields,
    });
}
exports.getRandomLimitOrder = getRandomLimitOrder;
//# sourceMappingURL=orders.js.map