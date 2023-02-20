"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBadTokenForSource = exports.uniswapV2LikeRouterAddress = exports.getCurveLikeInfosForPair = exports.getShellLikeInfosForPair = exports.getPlatypusInfoForPair = exports.getDodoV2Offsets = exports.isValidAddress = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const utils_1 = require("@0x/utils");
const constants_1 = require("./constants");
const curve_1 = require("./curve");
const types_1 = require("../../types");
// eslint-disable-next-line @typescript-eslint/ban-types
function isValidAddress(address) {
    return (typeof address === 'string' || address instanceof String) && address.toString() !== constants_1.NULL_ADDRESS;
}
exports.isValidAddress = isValidAddress;
function getDodoV2Offsets() {
    return Array(constants_1.MAX_DODOV2_POOLS_QUERIED)
        .fill(0)
        .map((_v, i) => new utils_1.BigNumber(i));
}
exports.getDodoV2Offsets = getDodoV2Offsets;
function getShellsForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.Mainnet) {
        return [];
    }
    return Object.values(constants_1.SHELL_POOLS_BY_CHAIN_ID[chainId])
        .filter((c) => [makerToken, takerToken].every((t) => c.tokens.includes(t)))
        .map((i) => i.poolAddress);
}
function getComponentForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.Mainnet) {
        return [];
    }
    return Object.values(constants_1.COMPONENT_POOLS_BY_CHAIN_ID[chainId])
        .filter((c) => [makerToken, takerToken].every((t) => c.tokens.includes(t)))
        .map((i) => i.poolAddress);
}
function getMStableForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.Mainnet && chainId !== contract_addresses_1.ChainId.Polygon) {
        return [];
    }
    return Object.values(constants_1.MSTABLE_POOLS_BY_CHAIN_ID[chainId])
        .filter((c) => [makerToken, takerToken].every((t) => c.tokens.includes(t)))
        .map((i) => i.poolAddress);
}
function getCurveInfosForPair(chainId, takerToken, makerToken) {
    switch (chainId) {
        case contract_addresses_1.ChainId.Mainnet:
            return Object.values(curve_1.CURVE_MAINNET_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.Polygon:
            return Object.values(curve_1.CURVE_POLYGON_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.Fantom:
            return Object.values(curve_1.CURVE_FANTOM_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.Avalanche:
            return Object.values(curve_1.CURVE_AVALANCHE_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.Optimism:
            return Object.values(curve_1.CURVE_OPTIMISM_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        default:
            return [];
    }
}
function getCurveV2InfosForPair(chainId, takerToken, makerToken) {
    const filterTokenInfos = function (curveV2ChainInfos) {
        return Object.values(curveV2ChainInfos).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
            (c.tokens.includes(t) &&
                [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
    };
    switch (chainId) {
        case contract_addresses_1.ChainId.Mainnet:
            return filterTokenInfos(curve_1.CURVE_V2_MAINNET_INFOS);
        case contract_addresses_1.ChainId.Polygon:
            return filterTokenInfos(curve_1.CURVE_V2_POLYGON_INFOS);
        case contract_addresses_1.ChainId.Fantom:
            return filterTokenInfos(curve_1.CURVE_V2_FANTOM_INFOS);
        case contract_addresses_1.ChainId.Avalanche:
            return filterTokenInfos(curve_1.CURVE_V2_AVALANCHE_INFOS);
        case contract_addresses_1.ChainId.Arbitrum:
            return filterTokenInfos(curve_1.CURVE_V2_ARBITRUM_INFOS);
        default:
            return [];
    }
}
function getNerveInfosForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.BSC) {
        return [];
    }
    return Object.values(constants_1.NERVE_BSC_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
        (c.tokens.includes(t) && [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
}
function getSynapseInfosForPair(chainId, takerToken, makerToken) {
    switch (chainId) {
        case contract_addresses_1.ChainId.Mainnet:
            return Object.values(constants_1.SYNAPSE_MAINNET_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.Optimism:
            return Object.values(constants_1.SYNAPSE_OPTIMISM_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.BSC:
            return Object.values(constants_1.SYNAPSE_BSC_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.Polygon:
            return Object.values(constants_1.SYNAPSE_POLYGON_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.Fantom:
            return Object.values(constants_1.SYNAPSE_FANTOM_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.Avalanche:
            return Object.values(constants_1.SYNAPSE_AVALANCHE_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        case contract_addresses_1.ChainId.Arbitrum:
            return Object.values(constants_1.SYNAPSE_ARBITRUM_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
                (c.tokens.includes(t) &&
                    [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
        default:
            return [];
    }
}
function getFirebirdOneSwapInfosForPair(chainId, takerToken, makerToken) {
    if (chainId === contract_addresses_1.ChainId.BSC) {
        return Object.values(constants_1.FIREBIRDONESWAP_BSC_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
            (c.tokens.includes(t) &&
                [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
    }
    else if (chainId === contract_addresses_1.ChainId.Polygon) {
        return Object.values(constants_1.FIREBIRDONESWAP_POLYGON_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
            (c.tokens.includes(t) &&
                [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
    }
    else {
        return [];
    }
}
function getBeltInfosForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.BSC) {
        return [];
    }
    return Object.values(curve_1.BELT_BSC_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
        (c.tokens.includes(t) && [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
}
function getEllipsisInfosForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.BSC) {
        return [];
    }
    return Object.values(curve_1.ELLIPSIS_BSC_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
        (c.tokens.includes(t) && [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
}
function getSaddleInfosForPair(chainId, takerToken, makerToken) {
    const chainToInfosMap = {
        [contract_addresses_1.ChainId.Mainnet]: constants_1.SADDLE_MAINNET_INFOS,
        [contract_addresses_1.ChainId.Optimism]: constants_1.SADDLE_OPTIMISM_INFOS,
        [contract_addresses_1.ChainId.Arbitrum]: constants_1.SADDLE_ARBITRUM_INFOS,
    };
    const saddleChainInfos = chainToInfosMap[chainId];
    if (!saddleChainInfos)
        return [];
    return Object.values(saddleChainInfos).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
        (c.tokens.includes(t) && [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
}
function getIronSwapInfosForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.Polygon) {
        return [];
    }
    return Object.values(constants_1.IRONSWAP_POLYGON_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
        (c.tokens.includes(t) && [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
}
function getAcryptosInfosForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.BSC) {
        return [];
    }
    return Object.values(curve_1.ACRYPTOS_BSC_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
        (c.tokens.includes(t) && [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
}
function getMobiusMoneyInfoForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.Celo) {
        return [];
    }
    return Object.values(constants_1.MOBIUSMONEY_CELO_INFOS).filter((c) => [makerToken, takerToken].every((t) => (c.tokens.includes(t) && c.metaTokens === undefined) ||
        (c.tokens.includes(t) && [makerToken, takerToken].filter((v) => { var _a; return (_a = c.metaTokens) === null || _a === void 0 ? void 0 : _a.includes(v); }).length > 0)));
}
function getPlatypusInfoForPair(chainId, takerToken, makerToken) {
    if (chainId !== contract_addresses_1.ChainId.Avalanche) {
        return [];
    }
    return Object.values(constants_1.PLATYPUS_AVALANCHE_INFOS).filter((c) => [makerToken, takerToken].every((t) => c.tokens.includes(t)));
}
exports.getPlatypusInfoForPair = getPlatypusInfoForPair;
function getShellLikeInfosForPair(chainId, takerToken, makerToken, source) {
    switch (source) {
        case types_1.ERC20BridgeSource.Shell:
            return getShellsForPair(chainId, takerToken, makerToken);
        case types_1.ERC20BridgeSource.Component:
            return getComponentForPair(chainId, takerToken, makerToken);
        case types_1.ERC20BridgeSource.MStable:
            return getMStableForPair(chainId, takerToken, makerToken);
        default:
            throw new Error(`Unknown Shell like source ${source}`);
    }
}
exports.getShellLikeInfosForPair = getShellLikeInfosForPair;
function getCurveLikeInfosForPair(chainId, takerToken, makerToken, source) {
    let pools = [];
    switch (source) {
        case types_1.ERC20BridgeSource.Curve:
            pools = getCurveInfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.CurveV2:
            pools = getCurveV2InfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.Nerve:
            pools = getNerveInfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.Synapse:
            pools = getSynapseInfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.Belt:
            pools = getBeltInfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.Ellipsis:
            pools = getEllipsisInfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.Saddle:
            pools = getSaddleInfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.FirebirdOneSwap:
            pools = getFirebirdOneSwapInfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.IronSwap:
            pools = getIronSwapInfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.ACryptos:
            pools = getAcryptosInfosForPair(chainId, takerToken, makerToken);
            break;
        case types_1.ERC20BridgeSource.MobiusMoney:
            pools = getMobiusMoneyInfoForPair(chainId, takerToken, makerToken);
            break;
        default:
            throw new Error(`Unknown Curve like source ${source}`);
    }
    return pools.map((pool) => ({
        ...pool,
        makerTokenIdx: pool.tokens.indexOf(makerToken),
        takerTokenIdx: pool.tokens.indexOf(takerToken),
    }));
}
exports.getCurveLikeInfosForPair = getCurveLikeInfosForPair;
function uniswapV2LikeRouterAddress(chainId, source) {
    switch (source) {
        case types_1.ERC20BridgeSource.UniswapV2:
            return constants_1.UNISWAPV2_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.SushiSwap:
            return constants_1.SUSHISWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.CryptoCom:
            return constants_1.CRYPTO_COM_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.PancakeSwap:
            return constants_1.PANCAKESWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.PancakeSwapV2:
            return constants_1.PANCAKESWAPV2_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.BakerySwap:
            return constants_1.BAKERYSWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.ApeSwap:
            return constants_1.APESWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.QuickSwap:
            return constants_1.QUICKSWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.Dfyn:
            return constants_1.DFYN_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.WaultSwap:
            return constants_1.WAULTSWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.ShibaSwap:
            return constants_1.SHIBASWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.Pangolin:
            return constants_1.PANGOLIN_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.TraderJoe:
            return constants_1.TRADER_JOE_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.UbeSwap:
            return constants_1.UBESWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.MorpheusSwap:
            return constants_1.MORPHEUSSWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.SpookySwap:
            return constants_1.SPOOKYSWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.SpiritSwap:
            return constants_1.SPIRITSWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.BiSwap:
            return constants_1.BISWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.Yoshi:
            return constants_1.YOSHI_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.MeshSwap:
            return constants_1.MESHSWAP_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.MDex:
            return constants_1.MDEX_ROUTER_BY_CHAIN_ID[chainId];
        case types_1.ERC20BridgeSource.KnightSwap:
            return constants_1.KNIGHTSWAP_ROUTER_BY_CHAIN_ID[chainId];
        default:
            throw new Error(`Unknown UniswapV2 like source ${source}`);
    }
}
exports.uniswapV2LikeRouterAddress = uniswapV2LikeRouterAddress;
const BAD_TOKENS_BY_SOURCE = {
    [types_1.ERC20BridgeSource.Uniswap]: [
        '0xb8c77482e45f1f44de1745f52c74426c631bdd52', // BNB
    ],
};
function isBadTokenForSource(token, source) {
    return (BAD_TOKENS_BY_SOURCE[source] || []).includes(token.toLowerCase());
}
exports.isBadTokenForSource = isBadTokenForSource;
//# sourceMappingURL=bridge_source_utils.js.map