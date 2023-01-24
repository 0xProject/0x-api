import {
    BigNumber,
    ERC20BridgeSource,
    FillData,
    FillQuoteTransformerOrderType,
    UniswapV2FillData,
} from '../../../src/asset-swapper';
import {
    AffiliateFeeAmount,
    AffiliateFeeType,
    FillBase,
    IPath,
    MarketBuySwapQuote,
    MarketOperation,
    MarketSellSwapQuote,
    OptimizedMarketBridgeOrder,
    OptimizedOrdersByType,
    SwapQuote,
} from '../../../src/asset-swapper/types';
import { MAX_UINT256 } from '../../../src/asset-swapper/utils/market_operation_utils/constants';
import { VelodromeFillData } from '../../../src/asset-swapper/utils/market_operation_utils/types';
import { NULL_ADDRESS } from '../../constants';

export const ONE_ETHER = new BigNumber(1e18);

export const NO_AFFILIATE_FEE: AffiliateFeeAmount = {
    feeType: AffiliateFeeType.None,
    recipient: NULL_ADDRESS,
    buyTokenFeeAmount: new BigNumber(0),
    sellTokenFeeAmount: new BigNumber(0),
};

const testConstants = {
    UNISWAP_V2_ROUTER: '0xf164fc0ec4e93095b804a4795bbe1e041497b92a',
    SUSHI_SWAP_ROUTER: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
    VELODROME_ROUTER: '0xa132dab612db5cb9fc9ac426a0cc215a3423f9c9',
};

function createFillData({
    source,
    takerToken,
    makerToken,
}: {
    source: ERC20BridgeSource;
    takerToken: string;
    makerToken: string;
}): FillData {
    switch (source) {
        case ERC20BridgeSource.UniswapV2:
        case ERC20BridgeSource.SushiSwap: {
            const fillData: UniswapV2FillData = {
                tokenAddressPath: [takerToken, makerToken],
                router:
                    source === ERC20BridgeSource.UniswapV2
                        ? testConstants.UNISWAP_V2_ROUTER
                        : testConstants.SUSHI_SWAP_ROUTER,
            };
            return fillData;
        }
        case ERC20BridgeSource.Velodrome: {
            const fillData: VelodromeFillData = {
                router: testConstants.VELODROME_ROUTER,
                stable: false,
            };
            return fillData;
        }

        default:
            throw new Error(`createFillData: unimplemented source: ${source}`);
    }
}

function createBridgeOrder({
    source,
    takerToken,
    makerToken,
    takerAmount,
    makerAmount,
}: {
    source: ERC20BridgeSource;
    takerToken: string;
    makerToken: string;
    takerAmount: BigNumber;
    makerAmount: BigNumber;
}): OptimizedMarketBridgeOrder {
    return {
        source,
        takerToken,
        makerToken,
        takerAmount,
        makerAmount,
        type: FillQuoteTransformerOrderType.Bridge,
        fillData: createFillData({ source, takerToken, makerToken }),
        // Currently unused by the tests that depends.
        fill: undefined as unknown as FillBase,
    };
}

function createPath(partialOrdersByType: Partial<OptimizedOrdersByType>): IPath {
    const ordersByType = {
        bridgeOrders: [],
        nativeOrders: [],
        twoHopOrders: [],
        ...partialOrdersByType,
    };
    const { bridgeOrders, nativeOrders, twoHopOrders } = ordersByType;
    const twoHopIndividualOrders = twoHopOrders.flatMap(({ firstHopOrder, secondHopOrder }) => [
        firstHopOrder,
        secondHopOrder,
    ]);
    0;
    const orders = [...bridgeOrders, ...nativeOrders, ...twoHopIndividualOrders];
    return {
        getOrders: () => orders,
        getSlippedOrders: () => orders,
        getOrdersByType: () => ordersByType,
        getSlippedOrdersByType: () => ordersByType,
        hasTwoHop: () => ordersByType.twoHopOrders.length > 0,
    };
}

function createSimpleSwapQuoteWithBridgeOrder({
    side,
    source,
    takerToken,
    makerToken,
    takerAmount,
    makerAmount,
    slippage,
    takerAmountPerEth,
    makerAmountPerEth,
    gasPrice,
}: {
    side: MarketOperation;
    source: ERC20BridgeSource;
    takerToken: string;
    makerToken: string;
    takerAmount: BigNumber;
    makerAmount: BigNumber;
    slippage: number;
    takerAmountPerEth?: BigNumber;
    makerAmountPerEth?: BigNumber;
    gasPrice?: number;
}): SwapQuote {
    // NOTES: consider using `slippage` to generate different amounts for `worstCaseQuoteInfo` and
    // slipped orders of `path`.
    return {
        ...(side === MarketOperation.Buy
            ? { type: MarketOperation.Buy, makerTokenFillAmount: makerAmount }
            : { type: MarketOperation.Sell, takerTokenFillAmount: takerAmount }),
        takerToken,
        makerToken,
        gasPrice: new BigNumber(gasPrice || 0),
        path: createPath({
            bridgeOrders: [createBridgeOrder({ source, takerToken, makerToken, takerAmount, makerAmount })],
        }),
        bestCaseQuoteInfo: {
            takerAmount,
            makerAmount,
            totalTakerAmount: takerAmount,
            protocolFeeInWeiAmount: new BigNumber(0),
            gas: 42,
            slippage: 0,
        },
        worstCaseQuoteInfo: {
            takerAmount,
            makerAmount,
            totalTakerAmount: takerAmount,
            protocolFeeInWeiAmount: new BigNumber(0),
            gas: 42,
            slippage,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sourceBreakdown: {} as any,
        makerTokenDecimals: 18,
        takerTokenDecimals: 18,
        takerAmountPerEth: takerAmountPerEth || new BigNumber(0),
        makerAmountPerEth: makerAmountPerEth || new BigNumber(0),
        blockNumber: 424242,
    };
}

export function createSimpleSellSwapQuoteWithBridgeOrder(params: {
    source: ERC20BridgeSource;
    takerToken: string;
    makerToken: string;
    takerAmount: BigNumber;
    makerAmount: BigNumber;
    slippage: number;
    takerAmountPerEth?: BigNumber;
    makerAmountPerEth?: BigNumber;
    gasPrice?: number;
}): MarketSellSwapQuote {
    return createSimpleSwapQuoteWithBridgeOrder({
        side: MarketOperation.Sell,
        ...params,
    }) as MarketSellSwapQuote;
}

export function createSimpleBuySwapQuoteWithBridgeOrder(params: {
    source: ERC20BridgeSource;
    takerToken: string;
    makerToken: string;
    takerAmount: BigNumber;
    makerAmount: BigNumber;
    slippage: number;
    takerAmountPerEth?: BigNumber;
    makerAmountPerEth?: BigNumber;
    gasPrice?: number;
}): MarketBuySwapQuote {
    return createSimpleSwapQuoteWithBridgeOrder({
        side: MarketOperation.Buy,
        ...params,
    }) as MarketBuySwapQuote;
}

export function createTwoHopSellQuote({
    takerToken,
    intermediateToken,
    makerToken,
    firstHopSource,
    secondHopSource,
    takerAmount,
    makerAmount,
    slippage,
    takerAmountPerEth,
    makerAmountPerEth,
    gasPrice,
}: {
    takerToken: string;
    intermediateToken: string;
    makerToken: string;
    firstHopSource: ERC20BridgeSource;
    secondHopSource: ERC20BridgeSource;
    takerAmount: BigNumber;
    makerAmount: BigNumber;
    slippage?: number;
    takerAmountPerEth?: BigNumber;
    makerAmountPerEth?: BigNumber;
    gasPrice?: number;
}): MarketSellSwapQuote {
    const firstHopOrder = createBridgeOrder({
        source: firstHopSource,
        takerToken,
        makerToken: intermediateToken,
        takerAmount,
        makerAmount: new BigNumber(0),
    });

    const secondHopOrder = createBridgeOrder({
        source: secondHopSource,
        takerToken: intermediateToken,
        makerToken,
        takerAmount: MAX_UINT256,
        makerAmount,
    });

    return {
        type: MarketOperation.Sell,
        takerTokenFillAmount: takerAmount,
        takerToken,
        makerToken,
        gasPrice: new BigNumber(gasPrice || 0),
        path: createPath({
            twoHopOrders: [{ firstHopOrder, secondHopOrder }],
        }),
        bestCaseQuoteInfo: {
            takerAmount,
            makerAmount,
            totalTakerAmount: takerAmount,
            protocolFeeInWeiAmount: new BigNumber(0),
            gas: 42,
            slippage: 0,
        },
        worstCaseQuoteInfo: {
            takerAmount,
            makerAmount,
            totalTakerAmount: takerAmount,
            protocolFeeInWeiAmount: new BigNumber(0),
            gas: 42,
            slippage: slippage || 0,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sourceBreakdown: {} as any,
        makerTokenDecimals: 18,
        takerTokenDecimals: 18,
        takerAmountPerEth: takerAmountPerEth || new BigNumber(0),
        makerAmountPerEth: makerAmountPerEth || new BigNumber(0),
        blockNumber: 424242,
    };
}
