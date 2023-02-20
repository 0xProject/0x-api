"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACRYPTOS_BSC_INFOS = exports.ELLIPSIS_BSC_INFOS = exports.BELT_BSC_INFOS = exports.CURVE_V2_ARBITRUM_INFOS = exports.CURVE_OPTIMISM_INFOS = exports.CURVE_V2_FANTOM_INFOS = exports.CURVE_FANTOM_INFOS = exports.CURVE_V2_AVALANCHE_INFOS = exports.CURVE_AVALANCHE_INFOS = exports.CURVE_V2_POLYGON_INFOS = exports.CURVE_POLYGON_INFOS = exports.CURVE_V2_MAINNET_INFOS = exports.CURVE_MAINNET_INFOS = void 0;
const types_1 = require("./types");
const constants_1 = require("./constants");
// Order dependent
const CURVE_TRI_POOL_MAINNET_TOKENS = [constants_1.MAINNET_TOKENS.DAI, constants_1.MAINNET_TOKENS.USDC, constants_1.MAINNET_TOKENS.USDT];
const CURVE_TRI_BTC_POOL_TOKEN = [constants_1.MAINNET_TOKENS.RenBTC, constants_1.MAINNET_TOKENS.WBTC, constants_1.MAINNET_TOKENS.sBTC];
const CURVE_POLYGON_ATRICRYPTO_UNDERLYING_TOKENS = [constants_1.POLYGON_TOKENS.DAI, constants_1.POLYGON_TOKENS.USDC, constants_1.POLYGON_TOKENS.USDT];
const CURVE_POLYGON_ATRICRYPTO_TOKENS = [constants_1.POLYGON_TOKENS.amDAI, constants_1.POLYGON_TOKENS.amUSDC, constants_1.POLYGON_TOKENS.amUSDT];
const CURVE_FANTOM_TWO_POOL_TOKENS = [constants_1.FANTOM_TOKENS.DAI, constants_1.FANTOM_TOKENS.USDC];
const CURVE_ARBITRUM_TWO_POOL_TOKENS = [constants_1.ARBITRUM_TOKENS.USDC, constants_1.ARBITRUM_TOKENS.USDT];
const CURVE_POOLS = {
    compound: '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56',
    // 1.USDT is dead
    PAX: '0x06364f10b501e868329afbc005b3492902d6c763',
    // 3.y is dead
    // 3.bUSD is dead
    sUSD: '0xa5407eae9ba41422680e2e00537571bcc53efbfd',
    renBTC: '0x93054188d876f558f4a66b2ef1d97d16edf0895b',
    sBTC: '0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714',
    HBTC: '0x4ca9b3063ec5866a4b82e437059d2c43d1be596f',
    TRI: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
    GUSD: '0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956',
    HUSD: '0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604',
    // 12.usdk is dead
    USDN: '0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1',
    // 14.linkusd is dead
    mUSD: '0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6',
    // 16.rsv is dead
    dUSD: '0x8038c01a0390a8c547446a0b2c18fc9aefecc10c',
    tBTC: '0xc25099792e9349c7dd09759744ea681c7de2cb66',
    pBTC: '0x7f55dde206dbad629c080068923b36fe9d6bdbef',
    bBTC: '0x071c661b4deefb59e2a3ddb20db036821eee8f4b',
    oBTC: '0xd81da8d904b52208541bade1bd6595d8a251f8dd',
    UST: '0x890f4e345b1daed0367a877a1612f86a1f86985f',
    eurs: '0x0ce6a5ff5217e38315f87032cf90686c96627caa',
    seth: '0xc5424b857f758e906013f3555dad202e4bdb4567',
    aave: '0xdebf20617708857ebe4f679508e7b7863a8a8eee',
    steth: '0xdc24316b9ae028f1497c275eb9192a3ea0f67022',
    saave: '0xeb16ae0052ed37f479f7fe63849198df1765a733',
    ankreth: '0xa96a65c051bf88b4095ee1f2451c2a9d43f53ae2',
    USDP: '0x42d7025938bec20b69cbae5a77421082407f053a',
    ib: '0x2dded6da1bf5dbdf597c45fcfaa3194e53ecfeaf',
    link: '0xf178c0b5bb7e7abf4e12a4838c7b7c5ba2c623c0',
    btrflyweth: '0xf43b15ab692fde1f9c24a9fce700adcc809d5391',
    stgusdc: '0x3211c6cbef1429da3d0d58494938299c92ad5860',
    // StableSwap "open pools" (crv.finance)
    TUSD: '0xecd5e75afb02efa118af914515d6521aabd189f1',
    STABLEx: '0x3252efd4ea2d6c78091a1f43982ee2c3659cc3d1',
    alUSD: '0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c',
    FRAX: '0xd632f22692fac7611d2aa1c0d552930d43caed3b',
    LUSD: '0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca',
    BUSD: '0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a',
    DSU3CRV: '0x6ec80df362d7042c50d4469bcfbc174c9dd9109a',
    cvxcrv: '0x9d0464996170c6b9e75eed71c68b99ddedf279e8',
    cvxfxs: '0xd658a338613198204dca1143ac3f01a722b5d94a',
    mim: '0x5a6a4d54456819380173272a5e8e9b9904bdf41b',
    eurt: '0xfd5db7463a3ab53fd211b4af195c5bccc1a03890',
    ethcrv: '0x8301ae4fc9c624d1d396cbdaa1ed877821d7c511',
    ethcvx: '0xb576491f1e6e5e62f1d8f26062ee822b40b0e0d4',
    fei_tri: '0x06cb22615ba53e60d67bf6c341a0fd5e718e1655',
    rai_tri: '0x618788357d0ebd8a37e763adab3bc575d54c2c7d',
    DOLA_tri: '0xaa5a67c256e27a5d80712c51971408db3370927d',
    OUSD_tri: '0x87650d7bbfc3a9f10587d7778206671719d9910d',
    d3pool: '0xbaaa1f5dba42c3389bdbc2c9d2de134f5cd0dc89',
    triEURpool: '0xb9446c4ef5ebe66268da6700d26f96273de3d571',
    ibEURsEUR: '0x19b080fe1ffa0553469d20ca36219f17fcf03859',
    wethyfi: '0xc26b89a667578ec7b3f11b2f98d6fd15c07c54ba',
    ycrvcrv: '0x453d92c7d4263201c69aacfaf589ed14202d83a4',
    bLUSD: '0x74ed5d42203806c8cdcf2f04ca5f60dc777b901c',
    rsr: '0x6a6283ab6e31c2aec3fa08697a8f806b740660b2',
    DOLAFRAX: '0xe57180685e3348589e9521aa53af0bcd497e884d',
    crvfrax: '0xdcef968d416a41cdac0ed8702fac8128a64241a2',
};
const CURVE_V2_POOLS = {
    tricrypto: '0x80466c64868e1ab14a1ddf27a676c3fcbe638fe5',
    tricrypto2: '0xd51a44d3fae010294c616388b506acda1bfaae46',
};
const CURVE_POLYGON_POOLS = {
    aave: '0x445fe580ef8d70ff569ab36e80c647af338db351',
    ren: '0xc2d95eef97ec6c17551d45e77b590dc1f9117c67',
};
const CURVE_V2_POLYGON_POOLS = {
    atricrypto3: '0x1d8b86e3d88cdb2d34688e87e72f388cb541b7c8',
};
const CURVE_AVALANCHE_POOLS = {
    aave: '0x7f90122bf0700f9e7e1f688fe926940e8839f353',
    mim: '0xaea2e71b631fa93683bcf256a8689dfa0e094fcd',
    USDC: '0x3a43a5851a3e3e0e25a3c1089670269786be1577',
};
const CURVE_V2_AVALANCHE_POOLS = {
    atricrypto: '0x58e57ca18b7a47112b877e31929798cd3d703b0f',
};
const CURVE_FANTOM_POOLS = {
    fUSDT: '0x92d5ebf3593a92888c25c0abef126583d4b5312e',
    twoPool: '0x27e611fd27b276acbd5ffd632e5eaebec9761e40',
    ren: '0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604',
    tri_v2: '0x2dd7c9371965472e5a5fd28fbe165007c61439e1',
    geist: '0x0fa949783947bf6c1b171db13aeacbb488845b3f',
    FRAX_twoPool: '0x7a656b342e14f745e2b164890e88017e27ae7320',
};
const CURVE_V2_FANTOM_POOLS = {
    tricrypto: '0x3a1659ddcf2339be3aea159ca010979fb49155ff',
};
const CURVE_OPTIMISM_POOLS = {
    tri: '0x1337bedc9d22ecbe766df105c9623922a27963ec',
};
const CURVE_V2_ARBITRUM_POOLS = {
    tri: '0x960ea3e3c7fb317332d990873d354e18d7645590',
    twoPool: '0x7f90122bf0700f9e7e1f688fe926940e8839f353',
    vstFrax: '0x59bf0545fca0e5ad48e13da269facd2e8c886ba4',
    MIM: '0x30df229cefa463e991e29d42db0bae2e122b2ac7',
    fraxBP: '0xc9b8a3fdecb9d5b218d02555a8baf332e5b740d5',
};
const BELT_POOLS = {
    vPool: '0xf16d312d119c13dd27fd0dc814b0bcdcaaa62dfd',
};
const ELLIPSIS_POOLS = {
    threePool: '0x160caed03795365f3a589f10c379ffa7d75d4e76',
};
const ACRYPTOS_POOLS = {
    acs4usd: '0xb3f0c9ea1f05e312093fdb031e789a756659b0ac',
    acs4vai: '0x191409d5a4effe25b0f4240557ba2192d18a191e',
    acs4ust: '0x99c92765efc472a9709ced86310d64c4573c4b77',
    acs3btc: '0xbe7caa236544d1b9a0e7f91e94b9f5bfd3b5ca81',
};
const createCurveExchangePool = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: info.tokens,
    metaTokens: undefined,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
const createCurveExchangeUnderlyingPool = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_underlying,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: info.tokens,
    metaTokens: undefined,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
const createCurveMetaTriPool = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_underlying,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: [...info.tokens, ...CURVE_TRI_POOL_MAINNET_TOKENS],
    metaTokens: info.tokens,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
const createCurveMetaTriBtcPool = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_underlying,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: [...info.tokens, ...CURVE_TRI_BTC_POOL_TOKEN],
    metaTokens: info.tokens,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
const createCurveMetaTwoPoolFantom = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_underlying,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: [...info.tokens, ...CURVE_FANTOM_TWO_POOL_TOKENS],
    metaTokens: info.tokens,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
const createCurveMetaTwoPoolArbitrum = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_underlying,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: [...info.tokens, ...CURVE_ARBITRUM_TWO_POOL_TOKENS],
    metaTokens: info.tokens,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
const createCurveExchangeV2Pool = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_v2,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_v2,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: info.tokens,
    metaTokens: undefined,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
const createCurveV2MetaTriPool = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying_v2,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_underlying_v2,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: [...CURVE_POLYGON_ATRICRYPTO_UNDERLYING_TOKENS, ...info.tokens],
    metaTokens: info.tokens,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
const createCurveFactoryCryptoExchangePool = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying_uint256,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_uint256,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: info.tokens,
    metaTokens: undefined,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
/**
 * Mainnet Curve configuration
 * The tokens are in order of their index, which each curve defines
 * I.e DaiUsdc curve has DAI as index 0 and USDC as index 1
 */
exports.CURVE_MAINNET_INFOS = {
    [CURVE_POOLS.compound]: createCurveExchangeUnderlyingPool({
        tokens: [constants_1.MAINNET_TOKENS.DAI, constants_1.MAINNET_TOKENS.USDC],
        pool: CURVE_POOLS.compound,
        gasSchedule: 587e3,
    }),
    [CURVE_POOLS.PAX]: createCurveExchangeUnderlyingPool({
        tokens: [constants_1.MAINNET_TOKENS.DAI, constants_1.MAINNET_TOKENS.USDC, constants_1.MAINNET_TOKENS.USDT, constants_1.MAINNET_TOKENS.PAX],
        pool: CURVE_POOLS.PAX,
        gasSchedule: 742e3,
    }),
    [CURVE_POOLS.sUSD]: createCurveExchangeUnderlyingPool({
        tokens: [constants_1.MAINNET_TOKENS.DAI, constants_1.MAINNET_TOKENS.USDC, constants_1.MAINNET_TOKENS.USDT, constants_1.MAINNET_TOKENS.sUSD],
        pool: CURVE_POOLS.sUSD,
        gasSchedule: 302e3,
    }),
    [CURVE_POOLS.renBTC]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.RenBTC, constants_1.MAINNET_TOKENS.WBTC],
        pool: CURVE_POOLS.renBTC,
        gasSchedule: 171e3,
    }),
    [CURVE_POOLS.sBTC]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.RenBTC, constants_1.MAINNET_TOKENS.WBTC, constants_1.MAINNET_TOKENS.sBTC],
        pool: CURVE_POOLS.sBTC,
        gasSchedule: 327e3,
    }),
    [CURVE_POOLS.HBTC]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.hBTC, constants_1.MAINNET_TOKENS.WBTC],
        pool: CURVE_POOLS.HBTC,
        gasSchedule: 210e3,
    }),
    [CURVE_POOLS.TRI]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.DAI, constants_1.MAINNET_TOKENS.USDC, constants_1.MAINNET_TOKENS.USDT],
        pool: CURVE_POOLS.TRI,
        gasSchedule: 176e3,
    }),
    [CURVE_POOLS.GUSD]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.GUSD],
        pool: CURVE_POOLS.GUSD,
        gasSchedule: 411e3,
    }),
    [CURVE_POOLS.HUSD]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.HUSD],
        pool: CURVE_POOLS.HUSD,
        gasSchedule: 396e3,
    }),
    [CURVE_POOLS.USDN]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.USDN],
        pool: CURVE_POOLS.USDN,
        gasSchedule: 398e3,
    }),
    [CURVE_POOLS.mUSD]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.mUSD],
        pool: CURVE_POOLS.mUSD,
        gasSchedule: 385e3,
    }),
    [CURVE_POOLS.dUSD]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.dUSD],
        pool: CURVE_POOLS.dUSD,
        gasSchedule: 371e3,
    }),
    [CURVE_POOLS.tBTC]: createCurveMetaTriBtcPool({
        tokens: [constants_1.MAINNET_TOKENS.tBTC],
        pool: CURVE_POOLS.tBTC,
        gasSchedule: 482e3,
    }),
    [CURVE_POOLS.pBTC]: createCurveMetaTriBtcPool({
        tokens: [constants_1.MAINNET_TOKENS.pBTC],
        pool: CURVE_POOLS.pBTC,
        gasSchedule: 503e3,
    }),
    [CURVE_POOLS.bBTC]: createCurveMetaTriBtcPool({
        tokens: [constants_1.MAINNET_TOKENS.bBTC],
        pool: CURVE_POOLS.bBTC,
        gasSchedule: 497e3,
    }),
    [CURVE_POOLS.oBTC]: createCurveMetaTriBtcPool({
        tokens: [constants_1.MAINNET_TOKENS.oBTC],
        pool: CURVE_POOLS.oBTC,
        gasSchedule: 488e3,
    }),
    [CURVE_POOLS.UST]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.UST],
        pool: CURVE_POOLS.UST,
        gasSchedule: 340e3,
    }),
    [CURVE_POOLS.eurs]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.EURS, constants_1.MAINNET_TOKENS.sEUR],
        pool: CURVE_POOLS.eurs,
        gasSchedule: 320e3,
    }),
    [CURVE_POOLS.eurt]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.EURT, constants_1.MAINNET_TOKENS.sEUR],
        pool: CURVE_POOLS.eurt,
        gasSchedule: 320e3,
    }),
    [CURVE_POOLS.aave]: createCurveExchangeUnderlyingPool({
        tokens: [constants_1.MAINNET_TOKENS.DAI, constants_1.MAINNET_TOKENS.USDC, constants_1.MAINNET_TOKENS.USDT],
        pool: CURVE_POOLS.aave,
        gasSchedule: 580e3,
    }),
    [CURVE_POOLS.aave]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.aDAI, constants_1.MAINNET_TOKENS.aUSDC, constants_1.MAINNET_TOKENS.aUSDT],
        pool: CURVE_POOLS.aave,
        gasSchedule: 580e3,
    }),
    [CURVE_POOLS.saave]: createCurveExchangeUnderlyingPool({
        tokens: [constants_1.MAINNET_TOKENS.DAI, constants_1.MAINNET_TOKENS.sUSD],
        pool: CURVE_POOLS.saave,
        gasSchedule: 580e3,
    }),
    [CURVE_POOLS.saave]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.aDAI, constants_1.MAINNET_TOKENS.aSUSD],
        pool: CURVE_POOLS.saave,
        gasSchedule: 580e3,
    }),
    [CURVE_POOLS.USDP]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.USDP],
        pool: CURVE_POOLS.USDP,
        gasSchedule: 374e3,
    }),
    //@todo investigate Underlying tokens not being able to support swap
    // [CURVE_POOLS.ib]: createCurveExchangeUnderlyingPool({
    //     tokens: [MAINNET_TOKENS.DAI, MAINNET_TOKENS.USDC, MAINNET_TOKENS.USDT],
    //     pool: CURVE_POOLS.ib,
    //     gasSchedule: 646e3,
    // }),
    [CURVE_POOLS.link]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.LINK, constants_1.MAINNET_TOKENS.sLINK],
        pool: CURVE_POOLS.link,
        gasSchedule: 319e3,
    }),
    [CURVE_POOLS.TUSD]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.TUSD],
        pool: CURVE_POOLS.TUSD,
        gasSchedule: 404e3,
    }),
    [CURVE_POOLS.STABLEx]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.STABLEx],
        pool: CURVE_POOLS.STABLEx,
        gasSchedule: 397e3,
    }),
    [CURVE_POOLS.alUSD]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.alUSD],
        pool: CURVE_POOLS.alUSD,
        gasSchedule: 387e3,
    }),
    [CURVE_POOLS.FRAX]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.FRAX],
        pool: CURVE_POOLS.FRAX,
        gasSchedule: 387e3,
    }),
    [CURVE_POOLS.LUSD]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.LUSD],
        pool: CURVE_POOLS.LUSD,
        gasSchedule: 387e3,
    }),
    [CURVE_POOLS.BUSD]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.BUSD],
        pool: CURVE_POOLS.BUSD,
        gasSchedule: 387e3,
    }),
    [CURVE_POOLS.steth]: createCurveExchangePool({
        // This pool uses ETH
        tokens: [constants_1.MAINNET_TOKENS.WETH, constants_1.MAINNET_TOKENS.stETH],
        pool: CURVE_POOLS.steth,
        gasSchedule: 151e3,
    }),
    [CURVE_POOLS.seth]: createCurveExchangePool({
        // This pool uses ETH
        tokens: [constants_1.MAINNET_TOKENS.WETH, constants_1.MAINNET_TOKENS.sETH],
        pool: CURVE_POOLS.seth,
        gasSchedule: 187e3,
    }),
    [CURVE_POOLS.ankreth]: createCurveExchangePool({
        // This pool uses ETH
        tokens: [constants_1.MAINNET_TOKENS.WETH, constants_1.MAINNET_TOKENS.ankrETH],
        pool: CURVE_POOLS.ankreth,
        gasSchedule: 125e3,
    }),
    [CURVE_POOLS.DSU3CRV]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.DSU],
        pool: CURVE_POOLS.DSU3CRV,
        gasSchedule: 387e3,
    }),
    [CURVE_POOLS.mim]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.MIM],
        pool: CURVE_POOLS.mim,
        gasSchedule: 300e3,
    }),
    [CURVE_POOLS.cvxcrv]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.CRV, constants_1.MAINNET_TOKENS.cvxCRV],
        pool: CURVE_POOLS.cvxcrv,
        gasSchedule: 105e3,
    }),
    [CURVE_POOLS.ethcrv]: {
        ...createCurveExchangePool({
            // This pool uses ETH
            tokens: [constants_1.MAINNET_TOKENS.WETH, constants_1.MAINNET_TOKENS.CRV],
            pool: CURVE_POOLS.ethcrv,
            gasSchedule: 350e3,
        }),
        // This pool has a custom get_dy and exchange selector with uint256
        sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_uint256,
        exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying_uint256,
    },
    [CURVE_POOLS.ethcvx]: {
        ...createCurveExchangePool({
            // This pool uses ETH
            tokens: [constants_1.MAINNET_TOKENS.WETH, constants_1.MAINNET_TOKENS.CVX],
            pool: CURVE_POOLS.ethcvx,
            gasSchedule: 350e3,
        }),
        // This pool has a custom get_dy and exchange selector with uint256
        sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_uint256,
        exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying_uint256,
    },
    [CURVE_POOLS.fei_tri]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.FEI],
        pool: CURVE_POOLS.fei_tri,
        gasSchedule: 340e3,
    }),
    [CURVE_POOLS.rai_tri]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.RAI],
        pool: CURVE_POOLS.rai_tri,
        gasSchedule: 340e3,
    }),
    [CURVE_POOLS.DOLA_tri]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.DOLA],
        pool: CURVE_POOLS.DOLA_tri,
        gasSchedule: 340e3,
    }),
    [CURVE_POOLS.OUSD_tri]: createCurveMetaTriPool({
        tokens: [constants_1.MAINNET_TOKENS.OUSD],
        pool: CURVE_POOLS.OUSD_tri,
        gasSchedule: 340e3,
    }),
    [CURVE_POOLS.d3pool]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.FRAX, constants_1.MAINNET_TOKENS.FEI, constants_1.MAINNET_TOKENS.alUSD],
        pool: CURVE_POOLS.d3pool,
        gasSchedule: 176e3,
    }),
    [CURVE_POOLS.triEURpool]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.agEUR, constants_1.MAINNET_TOKENS.EURT, constants_1.MAINNET_TOKENS.EURS],
        pool: CURVE_POOLS.triEURpool,
        gasSchedule: 176e3,
    }),
    [CURVE_POOLS.ibEURsEUR]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.ibEUR, constants_1.MAINNET_TOKENS.sEUR],
        pool: CURVE_POOLS.ibEURsEUR,
        gasSchedule: 176e3,
    }),
    [CURVE_POOLS.btrflyweth]: createCurveFactoryCryptoExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.WETH, constants_1.MAINNET_TOKENS.BTRFLY],
        pool: CURVE_POOLS.btrflyweth,
        gasSchedule: 250e3,
    }),
    [CURVE_POOLS.wethyfi]: createCurveFactoryCryptoExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.WETH, constants_1.MAINNET_TOKENS.YFI],
        pool: CURVE_POOLS.wethyfi,
        gasSchedule: 250e3,
    }),
    [CURVE_POOLS.stgusdc]: createCurveFactoryCryptoExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.STG, constants_1.MAINNET_TOKENS.USDC],
        pool: CURVE_POOLS.stgusdc,
        gasSchedule: 250e3,
    }),
    [CURVE_POOLS.cvxfxs]: createCurveFactoryCryptoExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.FXS, constants_1.MAINNET_TOKENS.cvxFXS],
        pool: CURVE_POOLS.cvxfxs,
        gasSchedule: 390e3,
    }),
    [CURVE_POOLS.ycrvcrv]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.CRV, constants_1.MAINNET_TOKENS.ynCRV],
        pool: CURVE_POOLS.ycrvcrv,
        gasSchedule: 450e3,
    }),
    [CURVE_POOLS.bLUSD]: createCurveFactoryCryptoExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.bLUSD, constants_1.MAINNET_TOKENS.LUSDCRV],
        pool: CURVE_POOLS.bLUSD,
        gasSchedule: 390e3,
    }),
    [CURVE_POOLS.crvfrax]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.FRAX, constants_1.MAINNET_TOKENS.USDC],
        pool: CURVE_POOLS.crvfrax,
        gasSchedule: 390e3,
    }),
    [CURVE_POOLS.rsr]: createCurveFactoryCryptoExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.rsr, constants_1.MAINNET_TOKENS.crvFRAX],
        pool: CURVE_POOLS.rsr,
        gasSchedule: 390e3,
    }),
    [CURVE_POOLS.DOLAFRAX]: createCurveExchangePool({
        tokens: [constants_1.MAINNET_TOKENS.DOLA, constants_1.MAINNET_TOKENS.crvFRAX],
        pool: CURVE_POOLS.DOLAFRAX,
        gasSchedule: 260e3,
    }),
};
exports.CURVE_V2_MAINNET_INFOS = {
    [CURVE_V2_POOLS.tricrypto]: createCurveExchangeV2Pool({
        tokens: [constants_1.MAINNET_TOKENS.USDT, constants_1.MAINNET_TOKENS.WBTC, constants_1.MAINNET_TOKENS.WETH],
        pool: CURVE_V2_POOLS.tricrypto,
        gasSchedule: 300e3,
    }),
    [CURVE_V2_POOLS.tricrypto2]: createCurveExchangeV2Pool({
        tokens: [constants_1.MAINNET_TOKENS.USDT, constants_1.MAINNET_TOKENS.WBTC, constants_1.MAINNET_TOKENS.WETH],
        pool: CURVE_V2_POOLS.tricrypto2,
        gasSchedule: 300e3,
    }),
};
exports.CURVE_POLYGON_INFOS = {
    ['aave_exchangeunderlying']: createCurveExchangeUnderlyingPool({
        tokens: CURVE_POLYGON_ATRICRYPTO_UNDERLYING_TOKENS,
        pool: CURVE_POLYGON_POOLS.aave,
        gasSchedule: 300e3,
    }),
    ['aave_exchange']: createCurveExchangePool({
        tokens: CURVE_POLYGON_ATRICRYPTO_TOKENS,
        pool: CURVE_POLYGON_POOLS.aave,
        gasSchedule: 150e3,
    }),
    [CURVE_POLYGON_POOLS.ren]: createCurveExchangeUnderlyingPool({
        tokens: [constants_1.POLYGON_TOKENS.WBTC, constants_1.POLYGON_TOKENS.renBTC],
        pool: CURVE_POLYGON_POOLS.ren,
        gasSchedule: 350e3,
    }),
};
exports.CURVE_V2_POLYGON_INFOS = {
    [CURVE_V2_POLYGON_POOLS.atricrypto3]: createCurveV2MetaTriPool({
        tokens: [constants_1.POLYGON_TOKENS.WBTC, constants_1.POLYGON_TOKENS.WETH],
        pool: CURVE_V2_POLYGON_POOLS.atricrypto3,
        gasSchedule: 300e3,
    }),
};
exports.CURVE_AVALANCHE_INFOS = {
    ['aave_exchangeunderlying']: createCurveExchangeUnderlyingPool({
        tokens: [constants_1.AVALANCHE_TOKENS.DAI, constants_1.AVALANCHE_TOKENS.USDC, constants_1.AVALANCHE_TOKENS.USDT],
        pool: CURVE_AVALANCHE_POOLS.aave,
        gasSchedule: 850e3,
    }),
    ['aave_exchange']: createCurveExchangePool({
        tokens: [constants_1.AVALANCHE_TOKENS.aDAI, constants_1.AVALANCHE_TOKENS.aUSDC, constants_1.AVALANCHE_TOKENS.aUSDT],
        pool: CURVE_AVALANCHE_POOLS.aave,
        gasSchedule: 150e3,
    }),
    [CURVE_AVALANCHE_POOLS.mim]: createCurveExchangePool({
        tokens: [constants_1.AVALANCHE_TOKENS.MIM, constants_1.AVALANCHE_TOKENS.USDT, constants_1.AVALANCHE_TOKENS.USDC],
        pool: CURVE_AVALANCHE_POOLS.mim,
        gasSchedule: 150e3,
    }),
    [CURVE_AVALANCHE_POOLS.USDC]: createCurveExchangePool({
        tokens: [constants_1.AVALANCHE_TOKENS.USDC, constants_1.AVALANCHE_TOKENS.nUSDC],
        pool: CURVE_AVALANCHE_POOLS.USDC,
        gasSchedule: 150e3,
    }),
};
exports.CURVE_V2_AVALANCHE_INFOS = {
    [CURVE_V2_AVALANCHE_POOLS.atricrypto]: {
        exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying_v2,
        sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_underlying_v2,
        buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
        tokens: [
            constants_1.AVALANCHE_TOKENS.DAI,
            constants_1.AVALANCHE_TOKENS.USDC,
            constants_1.AVALANCHE_TOKENS.USDT,
            constants_1.AVALANCHE_TOKENS.WBTC,
            constants_1.AVALANCHE_TOKENS.WETH,
        ],
        metaTokens: undefined,
        poolAddress: CURVE_V2_AVALANCHE_POOLS.atricrypto,
        gasSchedule: 1300e3,
    },
};
// TODO: modify gasSchedule
exports.CURVE_FANTOM_INFOS = {
    [CURVE_FANTOM_POOLS.ren]: createCurveExchangePool({
        tokens: [constants_1.FANTOM_TOKENS.WBTC, constants_1.FANTOM_TOKENS.renBTC],
        pool: CURVE_FANTOM_POOLS.ren,
        gasSchedule: 171e3,
    }),
    [CURVE_FANTOM_POOLS.twoPool]: createCurveExchangePool({
        tokens: [constants_1.FANTOM_TOKENS.DAI, constants_1.FANTOM_TOKENS.USDC],
        pool: CURVE_FANTOM_POOLS.twoPool,
        gasSchedule: 176e3,
    }),
    [CURVE_FANTOM_POOLS.fUSDT]: createCurveExchangeUnderlyingPool({
        tokens: [constants_1.FANTOM_TOKENS.fUSDT, constants_1.FANTOM_TOKENS.DAI, constants_1.FANTOM_TOKENS.USDC],
        pool: CURVE_FANTOM_POOLS.fUSDT,
        gasSchedule: 587e3,
    }),
    [CURVE_FANTOM_POOLS.tri_v2]: createCurveExchangePool({
        tokens: [constants_1.FANTOM_TOKENS.MIM, constants_1.FANTOM_TOKENS.fUSDT, constants_1.FANTOM_TOKENS.USDC],
        pool: CURVE_FANTOM_POOLS.tri_v2,
        gasSchedule: 176e3,
    }),
    [CURVE_FANTOM_POOLS.FRAX_twoPool]: createCurveMetaTwoPoolFantom({
        tokens: [constants_1.FANTOM_TOKENS.FRAX],
        pool: CURVE_FANTOM_POOLS.FRAX_twoPool,
        gasSchedule: 411e3,
    }),
};
exports.CURVE_V2_FANTOM_INFOS = {
    [CURVE_V2_FANTOM_POOLS.tricrypto]: createCurveExchangeV2Pool({
        tokens: [constants_1.FANTOM_TOKENS.fUSDT, constants_1.FANTOM_TOKENS.WBTC, constants_1.FANTOM_TOKENS.WETH],
        pool: CURVE_V2_FANTOM_POOLS.tricrypto,
        gasSchedule: 300e3,
    }),
};
exports.CURVE_OPTIMISM_INFOS = {
    [CURVE_OPTIMISM_POOLS.tri]: createCurveExchangePool({
        tokens: [constants_1.OPTIMISM_TOKENS.DAI, constants_1.OPTIMISM_TOKENS.USDC, constants_1.OPTIMISM_TOKENS.USDT],
        pool: CURVE_OPTIMISM_POOLS.tri,
        gasSchedule: 150e3,
    }),
};
exports.CURVE_V2_ARBITRUM_INFOS = {
    [CURVE_V2_ARBITRUM_POOLS.tri]: createCurveExchangeV2Pool({
        tokens: [constants_1.ARBITRUM_TOKENS.USDT, constants_1.ARBITRUM_TOKENS.WBTC, constants_1.ARBITRUM_TOKENS.WETH],
        pool: CURVE_V2_ARBITRUM_POOLS.tri,
        gasSchedule: 600e3,
    }),
    [CURVE_V2_ARBITRUM_POOLS.twoPool]: createCurveExchangePool({
        tokens: [constants_1.ARBITRUM_TOKENS.USDC, constants_1.ARBITRUM_TOKENS.USDT],
        pool: CURVE_V2_ARBITRUM_POOLS.twoPool,
        gasSchedule: 400e3,
    }),
    [CURVE_V2_ARBITRUM_POOLS.MIM]: createCurveMetaTwoPoolArbitrum({
        tokens: [constants_1.ARBITRUM_TOKENS.MIM],
        pool: CURVE_V2_ARBITRUM_POOLS.MIM,
        gasSchedule: 400e3,
    }),
    [CURVE_V2_ARBITRUM_POOLS.fraxBP]: createCurveExchangePool({
        tokens: [constants_1.ARBITRUM_TOKENS.FRAX, constants_1.ARBITRUM_TOKENS.USDC],
        pool: CURVE_V2_ARBITRUM_POOLS.fraxBP,
        gasSchedule: 200e3,
    }),
    [CURVE_V2_ARBITRUM_POOLS.vstFrax]: createCurveExchangePool({
        tokens: [constants_1.ARBITRUM_TOKENS.VST, constants_1.ARBITRUM_TOKENS.FRAX],
        pool: CURVE_V2_ARBITRUM_POOLS.vstFrax,
        gasSchedule: 200e3,
    }),
};
exports.BELT_BSC_INFOS = {
    [BELT_POOLS.vPool]: createCurveExchangeUnderlyingPool({
        tokens: [constants_1.BSC_TOKENS.DAI, constants_1.BSC_TOKENS.USDC, constants_1.BSC_TOKENS.USDT, constants_1.BSC_TOKENS.BUSD],
        pool: BELT_POOLS.vPool,
        gasSchedule: 4490e3,
    }),
};
exports.ELLIPSIS_BSC_INFOS = {
    [ELLIPSIS_POOLS.threePool]: createCurveExchangePool({
        tokens: [constants_1.BSC_TOKENS.BUSD, constants_1.BSC_TOKENS.USDC, constants_1.BSC_TOKENS.USDT],
        pool: ELLIPSIS_POOLS.threePool,
        gasSchedule: 140e3,
    }),
};
const ACRYPTOS_ACS4USD_POOL_BSC_TOKENS = [constants_1.BSC_TOKENS.BUSD, constants_1.BSC_TOKENS.USDT, constants_1.BSC_TOKENS.DAI, constants_1.BSC_TOKENS.USDC];
const createAcryptosMetaUsdPool = (info) => ({
    exchangeFunctionSelector: types_1.CurveFunctionSelectors.exchange_underlying,
    sellQuoteFunctionSelector: types_1.CurveFunctionSelectors.get_dy_underlying,
    buyQuoteFunctionSelector: types_1.CurveFunctionSelectors.None,
    tokens: [...info.tokens, ...ACRYPTOS_ACS4USD_POOL_BSC_TOKENS],
    metaTokens: info.tokens,
    poolAddress: info.pool,
    gasSchedule: info.gasSchedule,
});
exports.ACRYPTOS_BSC_INFOS = {
    [ACRYPTOS_POOLS.acs4usd]: createCurveExchangePool({
        tokens: ACRYPTOS_ACS4USD_POOL_BSC_TOKENS,
        pool: ACRYPTOS_POOLS.acs4usd,
        gasSchedule: 145e3,
    }),
    [ACRYPTOS_POOLS.acs4vai]: createAcryptosMetaUsdPool({
        tokens: [constants_1.BSC_TOKENS.VAI],
        pool: ACRYPTOS_POOLS.acs4vai,
        gasSchedule: 300e3,
    }),
    [ACRYPTOS_POOLS.acs4ust]: createAcryptosMetaUsdPool({
        tokens: [constants_1.BSC_TOKENS.UST],
        pool: ACRYPTOS_POOLS.acs4ust,
        gasSchedule: 300e3,
    }),
    [ACRYPTOS_POOLS.acs3btc]: createCurveExchangePool({
        tokens: [constants_1.BSC_TOKENS.BTCB, constants_1.BSC_TOKENS.renBTC, constants_1.BSC_TOKENS.pBTC],
        pool: ACRYPTOS_POOLS.acs3btc,
        gasSchedule: 145e3,
    }),
};
//# sourceMappingURL=curve.js.map