"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = exports.MATCHA_AFFILIATE_ENCODED_PARTIAL_ORDER_DATA = exports.MATCHA_AFFILIATE_ADDRESS = exports.AFFILIATE_DATA_SELECTOR = exports.NULL_ADDRESS = exports.SYMBOL_TO_ADDRESS = exports.WETH_TOKEN_ADDRESS = exports.ZRX_TOKEN_ADDRESS = exports.ETH_TOKEN_ADDRESS = exports.CONTRACT_ADDRESSES = exports.MAX_MINT_AMOUNT = exports.MAX_INT = exports.CHAIN_ID = exports.ETHEREUM_RPC_URL = void 0;
const dev_utils_1 = require("@0x/dev-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
Object.defineProperty(exports, "ETH_TOKEN_ADDRESS", { enumerable: true, get: function () { return protocol_utils_1.ETH_TOKEN_ADDRESS; } });
const utils_1 = require("@0x/utils");
const asset_swapper_1 = require("../src/asset-swapper");
exports.ETHEREUM_RPC_URL = 'http://localhost:8545';
exports.CHAIN_ID = 1337;
exports.MAX_INT = new utils_1.BigNumber(2).pow(256).minus(1);
exports.MAX_MINT_AMOUNT = new utils_1.BigNumber('10000000000000000000000');
exports.CONTRACT_ADDRESSES = (0, asset_swapper_1.getContractAddressesForChainOrThrow)(exports.CHAIN_ID);
exports.ZRX_TOKEN_ADDRESS = exports.CONTRACT_ADDRESSES.zrxToken;
exports.WETH_TOKEN_ADDRESS = exports.CONTRACT_ADDRESSES.etherToken;
exports.SYMBOL_TO_ADDRESS = {
    ZRX: exports.ZRX_TOKEN_ADDRESS,
    WETH: exports.WETH_TOKEN_ADDRESS,
    ETH: protocol_utils_1.ETH_TOKEN_ADDRESS,
};
exports.NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
exports.AFFILIATE_DATA_SELECTOR = '869584cd';
exports.MATCHA_AFFILIATE_ADDRESS = '0x86003b044f70dac0abc80ac8957305b6370893ed';
exports.MATCHA_AFFILIATE_ENCODED_PARTIAL_ORDER_DATA = '869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed0000000000000000000000000000000000000000000000';
const ganacheConfigs = {
    shouldUseInProcessGanache: false,
    shouldAllowUnlimitedContractSize: true,
    rpcUrl: exports.ETHEREUM_RPC_URL,
    shouldUseFakeGasEstimate: false,
};
const getProvider = () => {
    return dev_utils_1.web3Factory.getRpcProvider(ganacheConfigs);
};
exports.getProvider = getProvider;
//# sourceMappingURL=constants.js.map