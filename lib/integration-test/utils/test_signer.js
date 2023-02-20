"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestMetaTxnUser = void 0;
const order_utils_1 = require("@0x/order-utils");
const subproviders_1 = require("@0x/subproviders");
const utils_1 = require("@0x/utils");
class TestMetaTxnUser {
    constructor() {
        const TAKER_ADDRESS = process.env.TAKER_ADDRESS;
        const TAKER_PRIVATE_KEY = process.env.TAKER_PRIVATE_KEY;
        const TAKER_RPC_ADDR = process.env.TAKER_RPC_ADDR;
        if (TAKER_ADDRESS === utils_1.NULL_ADDRESS || TAKER_ADDRESS === undefined) {
            throw new Error(`TAKER_ADDRESS must be specified`);
        }
        if (TAKER_PRIVATE_KEY === '' || TAKER_PRIVATE_KEY === undefined) {
            throw new Error(`TAKER_PRIVATE_KEY must be specified`);
        }
        if (TAKER_RPC_ADDR === undefined) {
            throw new Error(`TAKER_RPC_ADDR must be specified`);
        }
        this._takerAddress = TAKER_ADDRESS;
        this._takerPrivateKey = TAKER_PRIVATE_KEY;
        this._provider = this._createWeb3Provider();
    }
    getQuoteString(buyToken, sellToken, buyAmount) {
        return `?buyToken=${buyToken}&sellToken=${sellToken}&buyAmount=${buyAmount}&takerAddress=${this._takerAddress}`;
    }
    async signAsync(zeroExTransactionHash) {
        return order_utils_1.signatureUtils.ecSignHashAsync(this._provider, zeroExTransactionHash, this._takerAddress);
    }
    async signTransactionAsync(zeroExTransaction) {
        return order_utils_1.signatureUtils.ecSignTransactionAsync(this._provider, zeroExTransaction, this._takerAddress);
    }
    _createWeb3Provider() {
        const provider = new subproviders_1.Web3ProviderEngine();
        provider.addProvider(new subproviders_1.PrivateKeyWalletSubprovider(this._takerPrivateKey));
        utils_1.providerUtils.startProviderEngine(provider);
        return provider;
    }
}
exports.TestMetaTxnUser = TestMetaTxnUser;
//# sourceMappingURL=test_signer.js.map