import { FunctionSelector } from '../types';

const VIP_SELECTORS = new Set([
    FunctionSelector.SellToUniswap,
    FunctionSelector.SellTokenForEthToUniswapV3,
    FunctionSelector.SellTokenForTokenToUniswapV3,
    FunctionSelector.SellEthForTokenToUniswapV3,
    FunctionSelector.SellToPancakeSwap,
    FunctionSelector.SellToLiquidityProvider,
    FunctionSelector.FillRfqOrder,
    FunctionSelector.BatchFillRfqOrders,
    FunctionSelector.FillOtcOrderWithEth,
    FunctionSelector.FillOtcOrderForEth,
    FunctionSelector.FillOtcOrder,
]);

// Checks if the function selector is a VIP selector
export function isVIP(selector: FunctionSelector): boolean {
    return VIP_SELECTORS.has(selector);
}
