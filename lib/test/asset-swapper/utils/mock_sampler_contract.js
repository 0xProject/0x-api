"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSamplerContract = void 0;
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const wrappers_1 = require("../../../src/asset-swapper/../wrappers");
const DUMMY_PROVIDER = {
    sendAsync: (..._args) => {
        /* no-op */
    },
};
class MockSamplerContract extends wrappers_1.ERC20BridgeSamplerContract {
    constructor(handlers = {}) {
        super(contracts_test_utils_1.constants.NULL_ADDRESS, DUMMY_PROVIDER);
        this._handlers = {};
        this._handlers = handlers;
    }
    batchCall(callDatas) {
        return {
            ...super.batchCall(callDatas),
            callAsync: async (..._callArgs) => callDatas.map((callData) => ({ success: true, data: this._callEncodedFunction(callData) })),
        };
    }
    getLimitOrderFillableMakerAssetAmounts(orders, signatures) {
        return this._wrapCall(super.getLimitOrderFillableMakerAssetAmounts, this._handlers.getLimitOrderFillableMakerAssetAmounts, orders, signatures, contracts_test_utils_1.constants.NULL_ADDRESS);
    }
    getLimitOrderFillableTakerAssetAmounts(orders, signatures) {
        return this._wrapCall(super.getLimitOrderFillableTakerAssetAmounts, this._handlers.getLimitOrderFillableTakerAssetAmounts, orders, signatures, contracts_test_utils_1.constants.NULL_ADDRESS);
    }
    sampleSellsFromUniswap(router, takerToken, makerToken, takerAssetAmounts) {
        return this._wrapCall(super.sampleSellsFromUniswap, this._handlers.sampleSellsFromUniswap, router, takerToken, makerToken, takerAssetAmounts);
    }
    sampleSellsFromUniswapV2(router, path, takerAssetAmounts) {
        return this._wrapCall(super.sampleSellsFromUniswapV2, this._handlers.sampleSellsFromUniswapV2, router, path, takerAssetAmounts);
    }
    sampleBuysFromUniswap(router, takerToken, makerToken, makerAssetAmounts) {
        return this._wrapCall(super.sampleBuysFromUniswap, this._handlers.sampleBuysFromUniswap, router, takerToken, makerToken, makerAssetAmounts);
    }
    sampleBuysFromUniswapV2(router, path, makerAssetAmounts) {
        return this._wrapCall(super.sampleBuysFromUniswapV2, this._handlers.sampleBuysFromUniswapV2, router, path, makerAssetAmounts);
    }
    _callEncodedFunction(callData) {
        var _a;
        if (callData === '0x') {
            return callData;
        }
        const selector = utils_1.hexUtils.slice(callData, 0, 4);
        for (const [name, handler] of Object.entries(this._handlers)) {
            if (handler && this.getSelector(name) === selector) {
                const args = this.getABIDecodedTransactionData(name, callData);
                const result = handler(...args);
                const encoder = this._lookupAbiEncoder(this.getFunctionSignature(name));
                if (((_a = encoder.getReturnValueDataItem().components) === null || _a === void 0 ? void 0 : _a.length) === 1) {
                    return encoder.encodeReturnValues([result]);
                }
                else {
                    return encoder.encodeReturnValues(result);
                }
            }
        }
        if (selector === this.getSelector('batchCall')) {
            const calls = this.getABIDecodedTransactionData('batchCall', callData);
            const results = calls.map((cd) => ({
                success: true,
                data: this._callEncodedFunction(cd),
            }));
            return this._lookupAbiEncoder(this.getFunctionSignature('batchCall')).encodeReturnValues([results]);
        }
        throw new Error(`Unkown selector: ${selector}`);
    }
    _wrapCall(superFn, handler, ...args) {
        return {
            ...superFn.call(this, ...args),
            callAsync: async (..._callArgs) => {
                if (!handler) {
                    throw new Error(`${superFn.name} handler undefined`);
                }
                return handler.call(this, ...args);
            },
        };
    }
}
exports.MockSamplerContract = MockSamplerContract;
//# sourceMappingURL=mock_sampler_contract.js.map