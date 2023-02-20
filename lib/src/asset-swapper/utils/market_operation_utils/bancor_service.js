"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BancorService = void 0;
const sdk_1 = require("@bancor/sdk");
const types_1 = require("@bancor/sdk/dist/types");
const constants_1 = require("./constants");
const findToken = (tokenAddress, graph) => 
// If we're looking for WETH it is stored by Bancor as the 0xeee address
tokenAddress.toLowerCase() === constants_1.MAINNET_TOKENS.WETH.toLowerCase()
    ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    : Object.keys(graph).filter((k) => k.toLowerCase() === tokenAddress.toLowerCase())[0];
class BancorService {
    constructor(sdk) {
        this.sdk = sdk;
    }
    static async createAsync(provider) {
        const sdk = await sdk_1.SDK.create({ ethereumNodeEndpoint: provider });
        const service = new BancorService(sdk);
        return service;
    }
    getPaths(_fromToken, _toToken) {
        // HACK: We reach into the blockchain object and pull in it's cache of tokens
        // and we use it's internal non-async getPathsFunc
        try {
            const blockchain = this.sdk._core.blockchains[types_1.BlockchainType.Ethereum];
            const fromToken = findToken(_fromToken, blockchain.graph);
            const toToken = findToken(_toToken, blockchain.graph);
            return blockchain.getPathsFunc.bind(blockchain)(fromToken, toToken);
        }
        catch (e) {
            return [];
        }
    }
}
exports.BancorService = BancorService;
//# sourceMappingURL=bancor_service.js.map