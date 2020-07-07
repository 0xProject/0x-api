export const ganacheZrxWethOrder1 = {
    chainId: 1337,
    exchangeAddress: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
    makerAddress: '0x5409ED021D9299bf6814279A6A1411A7e866A631',
    takerAddress: '0x6ecbe1db9ef729cbe972c83fb886247691fb6beb',
    feeRecipientAddress: '0x1000000000000000000000000000000000000011',
    senderAddress: '0x0000000000000000000000000000000000000000',
    makerAssetAmount: '100000000000000000',
    takerAssetAmount: '100000000000000000',
    makerFee: '0',
    takerFee: '0',
    expirationTimeSeconds: '33122559973',
    salt: '1586559973114',
    makerAssetData: '0xf47261b0000000000000000000000000871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
    takerAssetData: '0xf47261b00000000000000000000000000b1ba0af832d7c05fd64161e0db78e85978e8082',
    makerFeeAssetData: '0x',
    takerFeeAssetData: '0x',
    signature:
        '0x1b3ac5f86ffd9b243ed27b8964ecee82988893e740e976b700557c83c03a38275517ae18fecdc5979bd0db950f87c76f3a6f548af35b7226a76ff675ae8f6eee5502',
};

export const ganacheZrxWethOrderExchangeProxy = {
    chainId: 1337,
    exchangeAddress: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
    makerAddress: '0x5409ed021d9299bf6814279a6a1411a7e866a631',
    takerAddress: '0xdec8629610e2f4087bd9cc441d10ca8be0c6f6c5',
    feeRecipientAddress: '0x1000000000000000000000000000000000000011',
    senderAddress: '0x0000000000000000000000000000000000000000',
    makerAssetAmount: '100000000000000000',
    takerAssetAmount: '100000000000000000',
    makerFee: '0',
    takerFee: '0',
    expirationTimeSeconds: '33122559973',
    salt: '1586559973114',
    makerAssetData: '0xf47261b0000000000000000000000000871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
    takerAssetData: '0xf47261b00000000000000000000000000b1ba0af832d7c05fd64161e0db78e85978e8082',
    makerFeeAssetData: '0x',
    takerFeeAssetData: '0x',
    signature: '0x', // TODOO
};

export const rfqtIndicativeQuoteResponse = {
    makerAssetAmount: '100000000000000000',
    takerAssetAmount: '100000000000000000',
    makerAssetData: '0xf47261b0000000000000000000000000871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
    takerAssetData: '0xf47261b00000000000000000000000000b1ba0af832d7c05fd64161e0db78e85978e8082',
    expirationTimeSeconds: '1903620548', // in the year 2030
};

export const liquiditySources0xOnly = [
    { name: '0x', proportion: '1' },
    { name: 'Uniswap', proportion: '0' },
    { name: 'Uniswap_V2', proportion: '0' },
    { name: 'Uniswap_V2_ETH', proportion: '0' },
    { name: 'Eth2Dai', proportion: '0' },
    { name: 'Kyber', proportion: '0' },
    { name: 'Curve_USDC_DAI', proportion: '0' },
    { name: 'Curve_USDC_DAI_USDT', proportion: '0' },
    { name: 'Curve_USDC_DAI_USDT_TUSD', proportion: '0' },
    { name: 'Curve_USDC_DAI_USDT_BUSD', proportion: '0' },
    { name: 'Curve_USDC_DAI_USDT_SUSD', proportion: '0' },
    { name: 'LiquidityProvider', proportion: '0' },
    { name: 'MultiBridge', proportion: '0' },
];
