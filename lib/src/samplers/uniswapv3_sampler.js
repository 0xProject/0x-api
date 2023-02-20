"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniswapV3Sampler = void 0;
const asset_swapper_1 = require("../asset-swapper");
const constants_1 = require("../asset-swapper/utils/market_operation_utils/constants");
const sampler_contract_operation_1 = require("../asset-swapper/utils/market_operation_utils/sampler_contract_operation");
class UniswapV3Sampler {
    constructor(chainId, samplerContract) {
        this.source = asset_swapper_1.ERC20BridgeSource.UniswapV3;
        this.chainId = chainId;
        this.samplerContract = samplerContract;
        ({ factory: this.factoryAddress, router: this.routerAddress } = constants_1.UNISWAPV3_CONFIG_BY_CHAIN_ID[chainId]);
    }
    createSampleSellsOperation(tokenAddressPath, amounts) {
        return this.createSamplerOperation(this.samplerContract.sampleSellsFromUniswapV3, 'sampleSellsFromUniswapV3', tokenAddressPath, amounts);
    }
    createSampleBuysOperation(tokenAddressPath, amounts) {
        return this.createSamplerOperation(this.samplerContract.sampleBuysFromUniswapV3, 'sampleBuysFromUniswapV3', tokenAddressPath, amounts);
    }
    static postProcessSamplerFunctionOutput(amounts, paths, gasUsed) {
        return paths.map((path, i) => ({
            path,
            inputAmount: amounts[i],
            gasUsed: gasUsed[i].toNumber(),
        }));
    }
    createSamplerOperation(samplerFunction, samplerMethodName, tokenAddressPath, amounts) {
        return new sampler_contract_operation_1.SamplerContractOperation({
            source: this.source,
            contract: this.samplerContract,
            function: samplerFunction,
            params: [this.factoryAddress, tokenAddressPath, amounts],
            callback: (callResults, fillData) => {
                const [paths, gasUsed, samples] = this.samplerContract.getABIDecodedReturnData(samplerMethodName, callResults);
                fillData.router = this.routerAddress;
                fillData.tokenAddressPath = tokenAddressPath;
                fillData.pathAmounts = UniswapV3Sampler.postProcessSamplerFunctionOutput(amounts, paths, gasUsed);
                return samples;
            },
        });
    }
}
exports.UniswapV3Sampler = UniswapV3Sampler;
//# sourceMappingURL=uniswapv3_sampler.js.map