"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexOrderSampler = exports.getSampleAmounts = void 0;
const utils_1 = require("@0x/utils");
const sampler_operations_1 = require("./sampler_operations");
/**
 * Generate sample amounts up to `maxFillAmount`.
 */
function getSampleAmounts(maxFillAmount, numSamples, expBase = 1) {
    const distribution = [...Array(numSamples)].map((_v, i) => new utils_1.BigNumber(expBase).pow(i));
    const distributionSum = utils_1.BigNumber.sum(...distribution);
    const stepSizes = distribution.map((d) => d.div(distributionSum));
    const amounts = stepSizes.map((_s, i) => {
        if (i === numSamples - 1) {
            return maxFillAmount;
        }
        return maxFillAmount
            .times(utils_1.BigNumber.sum(...[0, ...stepSizes.slice(0, i + 1)]))
            .integerValue(utils_1.BigNumber.ROUND_UP);
    });
    return amounts;
}
exports.getSampleAmounts = getSampleAmounts;
/**
 * Encapsulates interactions with the `ERC20BridgeSampler` contract.
 */
class DexOrderSampler extends sampler_operations_1.SamplerOperations {
    constructor(chainId, _samplerContract, _samplerOverrides, poolsCaches, tokenAdjacencyGraph, bancorServiceFn = async () => undefined) {
        super(chainId, _samplerContract, poolsCaches, tokenAdjacencyGraph, bancorServiceFn);
        this.chainId = chainId;
        this._samplerOverrides = _samplerOverrides;
    }
    /**
     * Run a series of operations from `DexOrderSampler.ops` in a single transaction.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async executeAsync(...ops) {
        return this.executeBatchAsync(ops);
    }
    /**
     * Run a series of operations from `DexOrderSampler.ops` in a single transaction.
     * Takes an arbitrary length array, but is not typesafe.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async executeBatchAsync(ops) {
        const callDatas = ops.map((o) => o.encodeCall());
        const { overrides, block } = this._samplerOverrides
            ? this._samplerOverrides
            : { overrides: undefined, block: undefined };
        // All operations are NOOPs
        if (callDatas.every((cd) => cd === utils_1.NULL_BYTES)) {
            return callDatas.map((_callData, i) => ops[i].handleCallResults(utils_1.NULL_BYTES));
        }
        // Execute all non-empty calldatas.
        const rawCallResults = await this._samplerContract
            .batchCall(callDatas.filter((cd) => cd !== utils_1.NULL_BYTES))
            .callAsync({ overrides }, block);
        // Return the parsed results.
        let rawCallResultsIdx = 0;
        return callDatas.map((callData, i) => {
            const { data, success } = callData !== utils_1.NULL_BYTES ? rawCallResults[rawCallResultsIdx++] : { success: true, data: utils_1.NULL_BYTES };
            return success ? ops[i].handleCallResults(data) : ops[i].handleRevert(data);
        });
    }
}
exports.DexOrderSampler = DexOrderSampler;
//# sourceMappingURL=sampler.js.map