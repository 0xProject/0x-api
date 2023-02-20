"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniswapV2Rule = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const protocol_utils_1 = require("@0x/protocol-utils");
const constants_1 = require("../../constants");
const types_1 = require("../../types");
const quote_consumer_utils_1 = require("../quote_consumer_utils");
const abstract_feature_rule_1 = require("./abstract_feature_rule");
/**
 * A rule for `UniswapFeature` (Uniswap V2 and SushiSwap).
 */
class UniswapV2Rule extends abstract_feature_rule_1.AbstractFeatureRule {
    constructor(chainId, exchangeProxy) {
        super();
        this.chainId = chainId;
        this.exchangeProxy = exchangeProxy;
    }
    static create(chainId, exchangeProxy) {
        return new UniswapV2Rule(chainId, exchangeProxy);
    }
    isCompatible(quote, opts) {
        if (this.chainId !== contract_addresses_1.ChainId.Mainnet) {
            return false;
        }
        return (0, quote_consumer_utils_1.isDirectSwapCompatible)(quote.path, opts, UniswapV2Rule.SUPPORTED_SOURCES);
    }
    createCalldata(quote, opts) {
        const { isToETH, isFromETH } = opts;
        const { sellAmount, minBuyAmount, maxSlippage } = this.getSwapContext(quote, opts);
        const slippedOrder = quote.path.getSlippedOrders(maxSlippage)[0];
        const { fillData, source } = slippedOrder;
        return {
            calldataHexString: this.exchangeProxy
                .sellToUniswap(fillData.tokenAddressPath.map((a, i) => {
                if (i === 0 && isFromETH) {
                    return protocol_utils_1.ETH_TOKEN_ADDRESS;
                }
                if (i === fillData.tokenAddressPath.length - 1 && isToETH) {
                    return protocol_utils_1.ETH_TOKEN_ADDRESS;
                }
                return a;
            }), sellAmount, minBuyAmount, source === types_1.ERC20BridgeSource.SushiSwap)
                .getABIEncodedTransactionData(),
            ethAmount: isFromETH ? sellAmount : constants_1.constants.ZERO_AMOUNT,
            toAddress: this.exchangeProxy.address,
            allowanceTarget: this.exchangeProxy.address,
            gasOverhead: constants_1.constants.ZERO_AMOUNT,
        };
    }
}
exports.UniswapV2Rule = UniswapV2Rule;
UniswapV2Rule.SUPPORTED_SOURCES = [types_1.ERC20BridgeSource.UniswapV2, types_1.ERC20BridgeSource.SushiSwap];
//# sourceMappingURL=uniswap_v2_rule.js.map