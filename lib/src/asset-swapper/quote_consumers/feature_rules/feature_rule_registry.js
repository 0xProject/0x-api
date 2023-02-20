"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureRuleRegistryImpl = void 0;
const quote_consumer_utils_1 = require("../quote_consumer_utils");
const transform_erc20_rule_1 = require("./transform_erc20_rule");
const uniswap_v2_rule_1 = require("./uniswap_v2_rule");
class FeatureRuleRegistryImpl {
    constructor(uniswapV2Rule, transformErc20Rule) {
        this.uniswapV2Rule = uniswapV2Rule;
        this.transformErc20Rule = transformErc20Rule;
    }
    static create(chainId, contractAddresses) {
        const exchangeProxy = (0, quote_consumer_utils_1.createExchangeProxyWithoutProvider)(contractAddresses.exchangeProxy);
        return new FeatureRuleRegistryImpl(uniswap_v2_rule_1.UniswapV2Rule.create(chainId, exchangeProxy), transform_erc20_rule_1.TransformERC20Rule.create(chainId, contractAddresses));
    }
    getUniswapV2Rule() {
        return this.uniswapV2Rule;
    }
    getTransformErc20Rule() {
        return this.transformErc20Rule;
    }
}
exports.FeatureRuleRegistryImpl = FeatureRuleRegistryImpl;
//# sourceMappingURL=feature_rule_registry.js.map