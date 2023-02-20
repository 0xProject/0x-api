"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orderbook = exports.ERC20BridgeSource = exports.OrderPrunerPermittedFeeTypes = exports.MarketOperation = exports.SwapQuoterError = exports.AffiliateFeeType = void 0;
var AffiliateFeeType;
(function (AffiliateFeeType) {
    AffiliateFeeType[AffiliateFeeType["None"] = 0] = "None";
    AffiliateFeeType[AffiliateFeeType["PercentageFee"] = 1] = "PercentageFee";
    AffiliateFeeType[AffiliateFeeType["PositiveSlippageFee"] = 2] = "PositiveSlippageFee";
    AffiliateFeeType[AffiliateFeeType["GaslessFee"] = 3] = "GaslessFee";
})(AffiliateFeeType = exports.AffiliateFeeType || (exports.AffiliateFeeType = {}));
/**
 * Automatically resolved protocol fee refund receiver addresses.
 */
var ExchangeProxyRefundReceiver;
(function (ExchangeProxyRefundReceiver) {
    // Refund to the taker address.
    ExchangeProxyRefundReceiver["Taker"] = "0x0000000000000000000000000000000000000001";
    // Refund to the sender address.
    ExchangeProxyRefundReceiver["Sender"] = "0x0000000000000000000000000000000000000002";
})(ExchangeProxyRefundReceiver || (ExchangeProxyRefundReceiver = {}));
/**
 * Possible error messages thrown by an SwapQuoter instance or associated static methods.
 */
var SwapQuoterError;
(function (SwapQuoterError) {
    SwapQuoterError["NoEtherTokenContractFound"] = "NO_ETHER_TOKEN_CONTRACT_FOUND";
    SwapQuoterError["StandardRelayerApiError"] = "STANDARD_RELAYER_API_ERROR";
    SwapQuoterError["InsufficientAssetLiquidity"] = "INSUFFICIENT_ASSET_LIQUIDITY";
    SwapQuoterError["AssetUnavailable"] = "ASSET_UNAVAILABLE";
    SwapQuoterError["NoGasPriceProvidedOrEstimated"] = "NO_GAS_PRICE_PROVIDED_OR_ESTIMATED";
    SwapQuoterError["AssetDataUnsupported"] = "ASSET_DATA_UNSUPPORTED";
})(SwapQuoterError = exports.SwapQuoterError || (exports.SwapQuoterError = {}));
/**
 * Represents two main market operations supported by asset-swapper.
 */
var MarketOperation;
(function (MarketOperation) {
    MarketOperation["Sell"] = "Sell";
    MarketOperation["Buy"] = "Buy";
})(MarketOperation = exports.MarketOperation || (exports.MarketOperation = {}));
/**
 * Represents varying order takerFee types that can be pruned for by OrderPruner.
 */
var OrderPrunerPermittedFeeTypes;
(function (OrderPrunerPermittedFeeTypes) {
    OrderPrunerPermittedFeeTypes["NoFees"] = "NO_FEES";
    OrderPrunerPermittedFeeTypes["TakerDenominatedTakerFee"] = "TAKER_DENOMINATED_TAKER_FEE";
})(OrderPrunerPermittedFeeTypes = exports.OrderPrunerPermittedFeeTypes || (exports.OrderPrunerPermittedFeeTypes = {}));
/**
 * DEX sources to aggregate.
 */
var ERC20BridgeSource;
(function (ERC20BridgeSource) {
    ERC20BridgeSource["Native"] = "Native";
    ERC20BridgeSource["Uniswap"] = "Uniswap";
    ERC20BridgeSource["UniswapV2"] = "Uniswap_V2";
    ERC20BridgeSource["Curve"] = "Curve";
    ERC20BridgeSource["Balancer"] = "Balancer";
    ERC20BridgeSource["BalancerV2"] = "Balancer_V2";
    ERC20BridgeSource["Bancor"] = "Bancor";
    ERC20BridgeSource["MakerPsm"] = "MakerPsm";
    ERC20BridgeSource["MStable"] = "mStable";
    ERC20BridgeSource["Mooniswap"] = "Mooniswap";
    ERC20BridgeSource["MultiHop"] = "MultiHop";
    ERC20BridgeSource["Shell"] = "Shell";
    ERC20BridgeSource["SushiSwap"] = "SushiSwap";
    ERC20BridgeSource["Dodo"] = "DODO";
    ERC20BridgeSource["DodoV2"] = "DODO_V2";
    ERC20BridgeSource["CryptoCom"] = "CryptoCom";
    ERC20BridgeSource["KyberDmm"] = "KyberDMM";
    ERC20BridgeSource["Component"] = "Component";
    ERC20BridgeSource["Saddle"] = "Saddle";
    ERC20BridgeSource["UniswapV3"] = "Uniswap_V3";
    ERC20BridgeSource["CurveV2"] = "Curve_V2";
    ERC20BridgeSource["Lido"] = "Lido";
    ERC20BridgeSource["ShibaSwap"] = "ShibaSwap";
    ERC20BridgeSource["AaveV2"] = "Aave_V2";
    ERC20BridgeSource["AaveV3"] = "Aave_V3";
    ERC20BridgeSource["Compound"] = "Compound";
    ERC20BridgeSource["Synapse"] = "Synapse";
    ERC20BridgeSource["BancorV3"] = "BancorV3";
    ERC20BridgeSource["Synthetix"] = "Synthetix";
    ERC20BridgeSource["WOOFi"] = "WOOFi";
    // BSC only
    ERC20BridgeSource["PancakeSwap"] = "PancakeSwap";
    ERC20BridgeSource["PancakeSwapV2"] = "PancakeSwap_V2";
    ERC20BridgeSource["BiSwap"] = "BiSwap";
    ERC20BridgeSource["MDex"] = "MDex";
    ERC20BridgeSource["KnightSwap"] = "KnightSwap";
    ERC20BridgeSource["BakerySwap"] = "BakerySwap";
    ERC20BridgeSource["Nerve"] = "Nerve";
    ERC20BridgeSource["Belt"] = "Belt";
    ERC20BridgeSource["Ellipsis"] = "Ellipsis";
    ERC20BridgeSource["ApeSwap"] = "ApeSwap";
    ERC20BridgeSource["ACryptos"] = "ACryptoS";
    // Polygon only
    ERC20BridgeSource["QuickSwap"] = "QuickSwap";
    ERC20BridgeSource["Dfyn"] = "Dfyn";
    ERC20BridgeSource["WaultSwap"] = "WaultSwap";
    ERC20BridgeSource["FirebirdOneSwap"] = "FirebirdOneSwap";
    ERC20BridgeSource["IronSwap"] = "IronSwap";
    ERC20BridgeSource["MeshSwap"] = "MeshSwap";
    ERC20BridgeSource["Dystopia"] = "Dystopia";
    // Avalanche
    ERC20BridgeSource["Pangolin"] = "Pangolin";
    ERC20BridgeSource["TraderJoe"] = "TraderJoe";
    ERC20BridgeSource["Platypus"] = "Platypus";
    ERC20BridgeSource["GMX"] = "GMX";
    // Celo only
    ERC20BridgeSource["UbeSwap"] = "UbeSwap";
    ERC20BridgeSource["MobiusMoney"] = "MobiusMoney";
    // Fantom
    ERC20BridgeSource["SpiritSwap"] = "SpiritSwap";
    ERC20BridgeSource["SpookySwap"] = "SpookySwap";
    ERC20BridgeSource["Beethovenx"] = "Beethovenx";
    ERC20BridgeSource["MorpheusSwap"] = "MorpheusSwap";
    ERC20BridgeSource["Yoshi"] = "Yoshi";
    // Optimism
    ERC20BridgeSource["Velodrome"] = "Velodrome";
})(ERC20BridgeSource = exports.ERC20BridgeSource || (exports.ERC20BridgeSource = {}));
class Orderbook {
    async destroyAsync() {
        return;
    }
}
exports.Orderbook = Orderbook;
//# sourceMappingURL=types.js.map