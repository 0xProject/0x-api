"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMakerTakerTokens = exports.createBridgeOrder = exports.createNativeOptimizedOrder = exports.createBridgeDataForBridgeOrder = exports.getErc20BridgeSourceToBridgeSource = exports.createOrdersFromTwoHopSample = void 0;
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const types_1 = require("../../types");
const constants_1 = require("./constants");
const types_2 = require("./types");
function createOrdersFromTwoHopSample(sample, pathContext) {
    const { side } = pathContext;
    const { makerToken, takerToken } = getMakerTakerTokens(pathContext);
    const { firstHopSource, secondHopSource, intermediateToken } = sample.fillData;
    const firstHopFill = {
        sourcePathId: '',
        source: firstHopSource.source,
        type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
        input: side === types_1.MarketOperation.Sell ? sample.input : constants_1.ZERO_AMOUNT,
        output: side === types_1.MarketOperation.Sell ? constants_1.ZERO_AMOUNT : sample.output,
        adjustedOutput: side === types_1.MarketOperation.Sell ? constants_1.ZERO_AMOUNT : sample.output,
        fillData: firstHopSource.fillData,
        flags: BigInt(0),
        gas: 1,
    };
    const secondHopFill = {
        sourcePathId: '',
        source: secondHopSource.source,
        type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
        input: side === types_1.MarketOperation.Sell ? constants_1.MAX_UINT256 : sample.input,
        output: side === types_1.MarketOperation.Sell ? sample.output : constants_1.MAX_UINT256,
        adjustedOutput: side === types_1.MarketOperation.Sell ? sample.output : constants_1.MAX_UINT256,
        fillData: secondHopSource.fillData,
        flags: BigInt(0),
        gas: 1,
    };
    return {
        firstHopOrder: createBridgeOrder(firstHopFill, intermediateToken, takerToken, side),
        secondHopOrder: createBridgeOrder(secondHopFill, makerToken, intermediateToken, side),
    };
}
exports.createOrdersFromTwoHopSample = createOrdersFromTwoHopSample;
function getErc20BridgeSourceToBridgeSource(source) {
    switch (source) {
        case types_1.ERC20BridgeSource.Balancer:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Balancer, 'Balancer');
        case types_1.ERC20BridgeSource.BalancerV2:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.BalancerV2Batch, 'BalancerV2');
        case types_1.ERC20BridgeSource.Bancor:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Bancor, 'Bancor');
        case types_1.ERC20BridgeSource.Curve:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Curve, 'Curve');
        case types_1.ERC20BridgeSource.CryptoCom:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.CryptoCom, 'CryptoCom');
        case types_1.ERC20BridgeSource.Dodo:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Dodo, 'Dodo');
        case types_1.ERC20BridgeSource.MakerPsm:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.MakerPsm, 'MakerPsm');
        case types_1.ERC20BridgeSource.Mooniswap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Mooniswap, 'Mooniswap');
        case types_1.ERC20BridgeSource.MStable:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.MStable, 'MStable');
        case types_1.ERC20BridgeSource.Shell:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Shell, 'Shell');
        case types_1.ERC20BridgeSource.SushiSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'SushiSwap');
        case types_1.ERC20BridgeSource.Uniswap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Uniswap, 'Uniswap');
        case types_1.ERC20BridgeSource.UniswapV2:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'UniswapV2');
        case types_1.ERC20BridgeSource.DodoV2:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.DodoV2, 'DodoV2');
        case types_1.ERC20BridgeSource.PancakeSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'PancakeSwap');
        case types_1.ERC20BridgeSource.PancakeSwapV2:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'PancakeSwapV2');
        case types_1.ERC20BridgeSource.BakerySwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'BakerySwap');
        case types_1.ERC20BridgeSource.Nerve:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Nerve, 'Nerve');
        case types_1.ERC20BridgeSource.Synapse:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Nerve, 'Synapse');
        case types_1.ERC20BridgeSource.Belt:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Curve, 'Belt');
        case types_1.ERC20BridgeSource.Ellipsis:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Curve, 'Ellipsis');
        case types_1.ERC20BridgeSource.Component:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Shell, 'Component');
        case types_1.ERC20BridgeSource.Saddle:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Nerve, 'Saddle');
        case types_1.ERC20BridgeSource.ApeSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'ApeSwap');
        case types_1.ERC20BridgeSource.UniswapV3:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV3, 'UniswapV3');
        case types_1.ERC20BridgeSource.KyberDmm:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.KyberDmm, 'KyberDmm');
        case types_1.ERC20BridgeSource.QuickSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'QuickSwap');
        case types_1.ERC20BridgeSource.Dfyn:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'Dfyn');
        case types_1.ERC20BridgeSource.CurveV2:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.CurveV2, 'CurveV2');
        case types_1.ERC20BridgeSource.WaultSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'WaultSwap');
        case types_1.ERC20BridgeSource.FirebirdOneSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Nerve, 'FirebirdOneSwap');
        case types_1.ERC20BridgeSource.Lido:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Lido, 'Lido');
        case types_1.ERC20BridgeSource.ShibaSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'ShibaSwap');
        case types_1.ERC20BridgeSource.IronSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Nerve, 'IronSwap');
        case types_1.ERC20BridgeSource.ACryptos:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Curve, 'ACryptoS');
        case types_1.ERC20BridgeSource.Pangolin:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'Pangolin');
        case types_1.ERC20BridgeSource.TraderJoe:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'TraderJoe');
        case types_1.ERC20BridgeSource.UbeSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'UbeSwap');
        case types_1.ERC20BridgeSource.Beethovenx:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.BalancerV2Batch, 'Beethovenx');
        case types_1.ERC20BridgeSource.SpiritSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'SpiritSwap');
        case types_1.ERC20BridgeSource.SpookySwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'SpookySwap');
        case types_1.ERC20BridgeSource.MorpheusSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'MorpheusSwap');
        case types_1.ERC20BridgeSource.Yoshi:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'Yoshi');
        case types_1.ERC20BridgeSource.AaveV2:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.AaveV2, 'AaveV2');
        case types_1.ERC20BridgeSource.AaveV3:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.AaveV3, 'AaveV3');
        case types_1.ERC20BridgeSource.Compound:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Compound, 'Compound');
        case types_1.ERC20BridgeSource.MobiusMoney:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Nerve, 'MobiusMoney');
        case types_1.ERC20BridgeSource.BiSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'BiSwap');
        case types_1.ERC20BridgeSource.MDex:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'MDex');
        case types_1.ERC20BridgeSource.KnightSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'KnightSwap');
        case types_1.ERC20BridgeSource.GMX:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.GMX, 'GMX');
        case types_1.ERC20BridgeSource.Platypus:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Platypus, 'Platypus');
        case types_1.ERC20BridgeSource.MeshSwap:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'MeshSwap');
        case types_1.ERC20BridgeSource.BancorV3:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.BancorV3, 'BancorV3');
        case types_1.ERC20BridgeSource.Velodrome:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Solidly, 'Velodrome');
        case types_1.ERC20BridgeSource.Dystopia:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Solidly, 'Dystopia');
        case types_1.ERC20BridgeSource.Synthetix:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Synthetix, 'Synthetix');
        case types_1.ERC20BridgeSource.WOOFi:
            return (0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.WOOFi, 'WOOFi');
        default:
            throw new Error(types_2.AggregationError.NoBridgeForSource);
    }
}
exports.getErc20BridgeSourceToBridgeSource = getErc20BridgeSourceToBridgeSource;
function createBridgeDataForBridgeOrder(order) {
    let bridgeData;
    if (order.source === types_1.ERC20BridgeSource.MultiHop || order.source === types_1.ERC20BridgeSource.Native) {
        throw new Error('Invalid order to encode for Bridge Data');
    }
    const encoder = BRIDGE_ENCODERS[order.source];
    if (!encoder) {
        throw new Error(types_2.AggregationError.NoBridgeForSource);
    }
    switch (order.source) {
        case types_1.ERC20BridgeSource.Curve:
        case types_1.ERC20BridgeSource.CurveV2:
        case types_1.ERC20BridgeSource.Nerve:
        case types_1.ERC20BridgeSource.Synapse:
        case types_1.ERC20BridgeSource.Belt:
        case types_1.ERC20BridgeSource.Ellipsis:
        case types_1.ERC20BridgeSource.Saddle:
        case types_1.ERC20BridgeSource.FirebirdOneSwap:
        case types_1.ERC20BridgeSource.IronSwap:
        case types_1.ERC20BridgeSource.ACryptos:
        case types_1.ERC20BridgeSource.MobiusMoney: {
            const curveFillData = order.fillData;
            bridgeData = encoder.encode([
                curveFillData.pool.poolAddress,
                curveFillData.pool.exchangeFunctionSelector,
                curveFillData.fromTokenIdx,
                curveFillData.toTokenIdx,
            ]);
            break;
        }
        case types_1.ERC20BridgeSource.Balancer: {
            const balancerFillData = order.fillData;
            bridgeData = encoder.encode([balancerFillData.poolAddress]);
            break;
        }
        case types_1.ERC20BridgeSource.Beethovenx:
        case types_1.ERC20BridgeSource.BalancerV2:
            {
                const balancerV2FillData = order.fillData;
                bridgeData = encoder.encode([
                    balancerV2FillData.vault,
                    balancerV2FillData.swapSteps,
                    balancerV2FillData.assets,
                ]);
            }
            break;
        case types_1.ERC20BridgeSource.Bancor: {
            const bancorFillData = order.fillData;
            bridgeData = encoder.encode([bancorFillData.networkAddress, bancorFillData.path]);
            break;
        }
        case types_1.ERC20BridgeSource.UniswapV2:
        case types_1.ERC20BridgeSource.SushiSwap:
        case types_1.ERC20BridgeSource.CryptoCom:
        case types_1.ERC20BridgeSource.PancakeSwap:
        case types_1.ERC20BridgeSource.PancakeSwapV2:
        case types_1.ERC20BridgeSource.BakerySwap:
        case types_1.ERC20BridgeSource.ApeSwap:
        case types_1.ERC20BridgeSource.QuickSwap:
        case types_1.ERC20BridgeSource.Dfyn:
        case types_1.ERC20BridgeSource.WaultSwap:
        case types_1.ERC20BridgeSource.ShibaSwap:
        case types_1.ERC20BridgeSource.Pangolin:
        case types_1.ERC20BridgeSource.TraderJoe:
        case types_1.ERC20BridgeSource.UbeSwap:
        case types_1.ERC20BridgeSource.SpiritSwap:
        case types_1.ERC20BridgeSource.SpookySwap:
        case types_1.ERC20BridgeSource.MorpheusSwap:
        case types_1.ERC20BridgeSource.BiSwap:
        case types_1.ERC20BridgeSource.MDex:
        case types_1.ERC20BridgeSource.KnightSwap:
        case types_1.ERC20BridgeSource.Yoshi:
        case types_1.ERC20BridgeSource.MeshSwap: {
            const uniswapV2FillData = order.fillData;
            bridgeData = encoder.encode([uniswapV2FillData.router, uniswapV2FillData.tokenAddressPath]);
            break;
        }
        case types_1.ERC20BridgeSource.Mooniswap: {
            const mooniswapFillData = order.fillData;
            bridgeData = encoder.encode([mooniswapFillData.poolAddress]);
            break;
        }
        case types_1.ERC20BridgeSource.Dodo: {
            const dodoFillData = order.fillData;
            bridgeData = encoder.encode([
                dodoFillData.helperAddress,
                dodoFillData.poolAddress,
                dodoFillData.isSellBase,
            ]);
            break;
        }
        case types_1.ERC20BridgeSource.DodoV2: {
            const dodoV2FillData = order.fillData;
            bridgeData = encoder.encode([dodoV2FillData.poolAddress, dodoV2FillData.isSellBase]);
            break;
        }
        case types_1.ERC20BridgeSource.Shell:
        case types_1.ERC20BridgeSource.Component: {
            const shellFillData = order.fillData;
            bridgeData = encoder.encode([shellFillData.poolAddress]);
            break;
        }
        case types_1.ERC20BridgeSource.Uniswap: {
            const uniFillData = order.fillData;
            bridgeData = encoder.encode([uniFillData.router]);
            break;
        }
        case types_1.ERC20BridgeSource.MStable: {
            const mStableFillData = order.fillData;
            bridgeData = encoder.encode([mStableFillData.router]);
            break;
        }
        case types_1.ERC20BridgeSource.MakerPsm: {
            const psmFillData = order.fillData;
            bridgeData = encoder.encode([psmFillData.psmAddress, psmFillData.gemTokenAddress]);
            break;
        }
        case types_1.ERC20BridgeSource.UniswapV3: {
            const uniswapV3FillData = order.fillData;
            bridgeData = encoder.encode([uniswapV3FillData.router, uniswapV3FillData.path]);
            break;
        }
        case types_1.ERC20BridgeSource.KyberDmm: {
            const kyberDmmFillData = order.fillData;
            bridgeData = encoder.encode([
                kyberDmmFillData.router,
                kyberDmmFillData.poolsPath,
                kyberDmmFillData.tokenAddressPath,
            ]);
            break;
        }
        case types_1.ERC20BridgeSource.Lido: {
            const lidoFillData = order.fillData;
            bridgeData = encoder.encode([lidoFillData.stEthTokenAddress, lidoFillData.wstEthTokenAddress]);
            break;
        }
        case types_1.ERC20BridgeSource.AaveV3: {
            const aaveFillData = order.fillData;
            const i = _.findIndex(aaveFillData.l2EncodedParams, (l) => l.inputAmount.isEqualTo(order.makerAmount) || l.inputAmount.isEqualTo(order.takerAmount));
            if (i === -1) {
                throw new Error('Invalid order to encode for Bridge Data');
            }
            bridgeData = encoder.encode([
                aaveFillData.lendingPool,
                aaveFillData.aToken,
                aaveFillData.l2EncodedParams[i].l2Parameter,
            ]);
            break;
        }
        case types_1.ERC20BridgeSource.AaveV2: {
            const aaveFillData = order.fillData;
            bridgeData = encoder.encode([aaveFillData.lendingPool, aaveFillData.aToken]);
            break;
        }
        case types_1.ERC20BridgeSource.Compound: {
            const compoundFillData = order.fillData;
            bridgeData = encoder.encode([compoundFillData.cToken]);
            break;
        }
        case types_1.ERC20BridgeSource.GMX: {
            const gmxFillData = order.fillData;
            bridgeData = encoder.encode([
                gmxFillData.router,
                gmxFillData.reader,
                gmxFillData.vault,
                gmxFillData.tokenAddressPath,
            ]);
            break;
        }
        case types_1.ERC20BridgeSource.Platypus: {
            const platypusFillData = order.fillData;
            bridgeData = encoder.encode([
                platypusFillData.router,
                platypusFillData.pool,
                platypusFillData.tokenAddressPath,
            ]);
            break;
        }
        case types_1.ERC20BridgeSource.BancorV3: {
            const bancorV3FillData = order.fillData;
            bridgeData = encoder.encode([bancorV3FillData.networkAddress, bancorV3FillData.path]);
            break;
        }
        case types_1.ERC20BridgeSource.Dystopia:
        case types_1.ERC20BridgeSource.Velodrome: {
            const velodromeFillData = order.fillData;
            bridgeData = encoder.encode([velodromeFillData.router, velodromeFillData.stable]);
            break;
        }
        case types_1.ERC20BridgeSource.Synthetix: {
            const fillData = order.fillData;
            bridgeData = encoder.encode([
                fillData.synthetix,
                fillData.takerTokenSymbolBytes32,
                fillData.makerTokenSymbolBytes32,
            ]);
            break;
        }
        case types_1.ERC20BridgeSource.WOOFi: {
            const woofiFillData = order.fillData;
            bridgeData = encoder.encode([woofiFillData.router]);
            break;
        }
        default:
            throw new Error(types_2.AggregationError.NoBridgeForSource);
    }
    return bridgeData;
}
exports.createBridgeDataForBridgeOrder = createBridgeDataForBridgeOrder;
const poolEncoder = utils_1.AbiEncoder.create([{ name: 'poolAddress', type: 'address' }]);
const curveEncoder = utils_1.AbiEncoder.create([
    { name: 'curveAddress', type: 'address' },
    { name: 'exchangeFunctionSelector', type: 'bytes4' },
    { name: 'fromTokenIdx', type: 'int128' },
    { name: 'toTokenIdx', type: 'int128' },
]);
const makerPsmEncoder = utils_1.AbiEncoder.create([
    { name: 'psmAddress', type: 'address' },
    { name: 'gemTokenAddress', type: 'address' },
]);
const balancerV2BatchEncoder = utils_1.AbiEncoder.create([
    { name: 'vault', type: 'address' },
    {
        name: 'swapSteps',
        type: 'tuple[]',
        components: [
            { name: 'poolId', type: 'bytes32' },
            { name: 'assetInIndex', type: 'uint256' },
            { name: 'assetOutIndex', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
            { name: 'userData', type: 'bytes' },
        ],
    },
    { name: 'assets', type: 'address[]' },
]);
const routerAddressPathEncoder = utils_1.AbiEncoder.create('(address,address[])');
const BRIDGE_ENCODERS = {
    // Curve like
    [types_1.ERC20BridgeSource.Curve]: curveEncoder,
    [types_1.ERC20BridgeSource.CurveV2]: curveEncoder,
    [types_1.ERC20BridgeSource.Nerve]: curveEncoder,
    [types_1.ERC20BridgeSource.Synapse]: curveEncoder,
    [types_1.ERC20BridgeSource.Belt]: curveEncoder,
    [types_1.ERC20BridgeSource.Ellipsis]: curveEncoder,
    [types_1.ERC20BridgeSource.Saddle]: curveEncoder,
    [types_1.ERC20BridgeSource.FirebirdOneSwap]: curveEncoder,
    [types_1.ERC20BridgeSource.IronSwap]: curveEncoder,
    [types_1.ERC20BridgeSource.ACryptos]: curveEncoder,
    [types_1.ERC20BridgeSource.MobiusMoney]: curveEncoder,
    // UniswapV2 like, (router, address[])
    [types_1.ERC20BridgeSource.Bancor]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.BancorV3]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.UniswapV2]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.SushiSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.CryptoCom]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.ShibaSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.Pangolin]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.TraderJoe]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.SpiritSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.SpookySwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.MorpheusSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.BiSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.MDex]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.KnightSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.Yoshi]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.MeshSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.UbeSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.PancakeSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.PancakeSwapV2]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.BakerySwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.ApeSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.WaultSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.QuickSwap]: routerAddressPathEncoder,
    [types_1.ERC20BridgeSource.Dfyn]: routerAddressPathEncoder,
    // Generic pools
    [types_1.ERC20BridgeSource.Shell]: poolEncoder,
    [types_1.ERC20BridgeSource.Component]: poolEncoder,
    [types_1.ERC20BridgeSource.Mooniswap]: poolEncoder,
    [types_1.ERC20BridgeSource.MStable]: poolEncoder,
    [types_1.ERC20BridgeSource.Balancer]: poolEncoder,
    [types_1.ERC20BridgeSource.Uniswap]: poolEncoder,
    // Custom integrations
    [types_1.ERC20BridgeSource.Dodo]: utils_1.AbiEncoder.create([
        { name: 'helper', type: 'address' },
        { name: 'poolAddress', type: 'address' },
        { name: 'isSellBase', type: 'bool' },
    ]),
    [types_1.ERC20BridgeSource.DodoV2]: utils_1.AbiEncoder.create([
        { name: 'poolAddress', type: 'address' },
        { name: 'isSellBase', type: 'bool' },
    ]),
    [types_1.ERC20BridgeSource.GMX]: utils_1.AbiEncoder.create('(address,address,address,address[])'),
    [types_1.ERC20BridgeSource.Platypus]: utils_1.AbiEncoder.create('(address,address[],address[])'),
    [types_1.ERC20BridgeSource.MakerPsm]: makerPsmEncoder,
    [types_1.ERC20BridgeSource.BalancerV2]: balancerV2BatchEncoder,
    [types_1.ERC20BridgeSource.Beethovenx]: balancerV2BatchEncoder,
    [types_1.ERC20BridgeSource.UniswapV3]: utils_1.AbiEncoder.create([
        { name: 'router', type: 'address' },
        { name: 'path', type: 'bytes' },
    ]),
    [types_1.ERC20BridgeSource.KyberDmm]: utils_1.AbiEncoder.create('(address,address[],address[])'),
    [types_1.ERC20BridgeSource.Lido]: utils_1.AbiEncoder.create('(address,address)'),
    [types_1.ERC20BridgeSource.AaveV2]: utils_1.AbiEncoder.create('(address,address)'),
    [types_1.ERC20BridgeSource.AaveV3]: utils_1.AbiEncoder.create('(address,address,bytes32)'),
    [types_1.ERC20BridgeSource.Compound]: utils_1.AbiEncoder.create('(address)'),
    [types_1.ERC20BridgeSource.Velodrome]: utils_1.AbiEncoder.create('(address,bool)'),
    [types_1.ERC20BridgeSource.Dystopia]: utils_1.AbiEncoder.create('(address,bool)'),
    [types_1.ERC20BridgeSource.Synthetix]: utils_1.AbiEncoder.create('(address,bytes32,bytes32)'),
    [types_1.ERC20BridgeSource.WOOFi]: utils_1.AbiEncoder.create('(address)'),
};
function getFillTokenAmounts(fill, side) {
    return [
        // Maker asset amount.
        side === types_1.MarketOperation.Sell ? fill.output.integerValue(utils_1.BigNumber.ROUND_DOWN) : fill.input,
        // Taker asset amount.
        side === types_1.MarketOperation.Sell ? fill.input : fill.output.integerValue(utils_1.BigNumber.ROUND_UP),
    ];
}
function createNativeOptimizedOrder(fill, side) {
    const fillData = fill.fillData;
    const [makerAmount, takerAmount] = getFillTokenAmounts(fill, side);
    const base = {
        type: fill.type,
        source: types_1.ERC20BridgeSource.Native,
        makerToken: fillData.order.makerToken,
        takerToken: fillData.order.takerToken,
        makerAmount,
        takerAmount,
        fillData,
        fill: toFillBase(fill),
    };
    switch (fill.type) {
        case protocol_utils_1.FillQuoteTransformerOrderType.Rfq:
            return { ...base, type: protocol_utils_1.FillQuoteTransformerOrderType.Rfq, fillData: fillData };
        case protocol_utils_1.FillQuoteTransformerOrderType.Limit:
            return {
                ...base,
                type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
                fillData: fillData,
            };
        case protocol_utils_1.FillQuoteTransformerOrderType.Otc:
            return { ...base, type: protocol_utils_1.FillQuoteTransformerOrderType.Otc, fillData: fillData };
        case protocol_utils_1.FillQuoteTransformerOrderType.Bridge:
            throw new Error('BridgeOrder is not a Native Order');
        default:
            ((_x) => {
                throw new Error('unreachable');
            })(fill.type);
    }
}
exports.createNativeOptimizedOrder = createNativeOptimizedOrder;
function createBridgeOrder(fill, makerToken, takerToken, side) {
    const [makerAmount, takerAmount] = getFillTokenAmounts(fill, side);
    return {
        type: protocol_utils_1.FillQuoteTransformerOrderType.Bridge,
        source: fill.source,
        makerToken,
        takerToken,
        makerAmount,
        takerAmount,
        fillData: createFinalBridgeOrderFillDataFromCollapsedFill(fill),
        fill: toFillBase(fill),
    };
}
exports.createBridgeOrder = createBridgeOrder;
function toFillBase(fill) {
    return _.pick(fill, ['input', 'output', 'adjustedOutput', 'gas']);
}
function createFinalBridgeOrderFillDataFromCollapsedFill(fill) {
    switch (fill.source) {
        case types_1.ERC20BridgeSource.UniswapV3: {
            const fd = fill.fillData;
            const { path: uniswapPath, gasUsed } = getBestUniswapV3PathAmountForInputAmount(fd, fill.input);
            const finalFillData = {
                router: fd.router,
                tokenAddressPath: fd.tokenAddressPath,
                path: uniswapPath,
                gasUsed,
            };
            return finalFillData;
        }
        default:
            break;
    }
    return fill.fillData;
}
function getBestUniswapV3PathAmountForInputAmount(fillData, inputAmount) {
    if (fillData.pathAmounts.length === 0) {
        throw new Error(`No Uniswap V3 paths`);
    }
    // Find the best path that can satisfy `inputAmount`.
    // Assumes `fillData.pathAmounts` is sorted ascending.
    for (const pathAmount of fillData.pathAmounts) {
        if (pathAmount.inputAmount.gte(inputAmount)) {
            return pathAmount;
        }
    }
    return fillData.pathAmounts[fillData.pathAmounts.length - 1];
}
function getMakerTakerTokens(pathContext) {
    const { side, inputToken, outputToken } = pathContext;
    const makerToken = side === types_1.MarketOperation.Sell ? outputToken : inputToken;
    const takerToken = side === types_1.MarketOperation.Sell ? inputToken : outputToken;
    return { makerToken, takerToken };
}
exports.getMakerTakerTokens = getMakerTakerTokens;
//# sourceMappingURL=orders.js.map