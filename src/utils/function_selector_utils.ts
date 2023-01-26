const VIP_SELECTORS = new Set([
    '0xd9627aa4', // sellToUniswap(address[],uint256,uint256,bool),
    '0x3598d8ab', // sellEthForTokenToUniswapV3(bytes,uint256,address),
    '0x803ba26d', // sellTokenForEthToUniswapV3(bytes,uint256,uint256,address),
    '0x6af479b2', // sellTokenForTokenToUniswapV3(bytes,uint256,uint256,address),
    '0xc43c9ef6', // sellToPancakeSwap(address[],uint256,uint256,uint8),
    '0xf7fcd384', // sellToLiquidityProvider(address,address,address,address,uint256,uint256,bytes),
    '0xaa77476c', // fillRfqOrder((address,address,uint128,uint128,address,address,address,bytes32,uint64,uint256),(uint8,uint8,bytes32,bytes32),uint128),
    '0x75103cb9', // batchFillRfqOrders((address,address,uint128,uint128,address,address,address,bytes32,uint64,uint256)[],(uint8,uint8,bytes32,bytes32)[],uint128[],bool),
    '0x706394d5', // fillOtcOrderWithEth((address,address,uint128,uint128,address,address,address,uint256),(uint8,uint8,bytes32,bytes32)),
    '0xa578efaf', // fillOtcOrderForEth((address,address,uint128,uint128,address,address,address,uint256),(uint8,uint8,bytes32,bytes32),uint128),
    '0xdac748d4', // fillOtcOrder((address,address,uint128,uint128,address,address,address,uint256),(uint8,uint8,bytes32,bytes32),uint128)
]);

// Checks if the function selector is a VIP selector
export function isVIP(selector: string): boolean {
    return VIP_SELECTORS.has(selector);
}
