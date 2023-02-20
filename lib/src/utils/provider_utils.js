"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerUtils = void 0;
const subproviders_1 = require("@0x/subproviders");
const utils_1 = require("@0x/utils");
const rpc_subprovider_1 = require("../rpc_subprovider");
exports.providerUtils = {
    createWeb3Provider: (rpcHost, timeout = 5000, shouldCompressRequest = false) => {
        const providerEngine = new subproviders_1.Web3ProviderEngine();
        providerEngine.addProvider(new rpc_subprovider_1.RPCSubprovider(rpcHost, timeout, shouldCompressRequest));
        utils_1.providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    },
};
//# sourceMappingURL=provider_utils.js.map