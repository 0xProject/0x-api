import { ETH_TOKEN_ADDRESS } from '@0x/order-utils';

import { NULL_ADDRESS } from './constants';
import { ChainId } from './types';

export interface TokenMetadataAndChainAddresses {
    symbol: string;
    decimals: number;
    name: string;
    tokenAddresses: {
        [ChainId.Mainnet]: string;
        [ChainId.Kovan]: string;
        [ChainId.Ganache]: string;
    };
}

// Most token metadata taken from https://github.com/MetaMask/eth-contract-metadata/
// And https://github.com/compound-finance/compound-protocol/blob/master/networks/kovan.json
// And https://developer.kyber.network/docs/Environments-Kovan/
// tslint:disable:max-file-line-count
export const TokenMetadatasForChains: TokenMetadataAndChainAddresses[] = [
    {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6b175474e89094c44da98b954eedeac495271d0f',
            [ChainId.Kovan]: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
            [ChainId.Ganache]: '0x34d402f14d58e001d8efbe6585051bf9706aa064',
        },
    },
    {
        symbol: 'REP',
        name: 'Augur Reputation',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1985365e9f78359a9B6AD760e32412f4a445E862',
            [ChainId.Kovan]: '0x4e5cb5a0caca30d1ad27d8cd8200a907854fb518',
            [ChainId.Ganache]: '0x34d402f14d58e001d8efbe6585051bf9706aa064',
        },
    },
    {
        symbol: 'ETH',
        name: 'Ether',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: ETH_TOKEN_ADDRESS,
            [ChainId.Kovan]: ETH_TOKEN_ADDRESS,
            [ChainId.Ganache]: ETH_TOKEN_ADDRESS,
        },
    },
    {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            [ChainId.Kovan]: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
            [ChainId.Ganache]: '0x0b1ba0af832d7c05fd64161e0db78e85978e8082',
        },
    },
    {
        symbol: 'ZRX',
        name: '0x Protocol Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            [ChainId.Kovan]: '0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa',
            [ChainId.Ganache]: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
        },
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            [ChainId.Kovan]: '0x75b0622cec14130172eae9cf166b92e5c112faff',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BAT',
        name: 'Basic Attention Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            [ChainId.Kovan]: '0x9f8cfb61d3b2af62864408dd703f9c3beb55dff7',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MKR',
        name: 'Maker',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
            [ChainId.Kovan]: '0xaaf64bfcc32d0f15873a02163e7e500671a4ffcd',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'WBTC',
        name: 'Wrapped BTC',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            [ChainId.Kovan]: '0xa0a5ad2296b38bd3e3eb59aaeaf1589e8d9a29a9',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'SNX',
        name: 'Synthetix Network Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'SUSD',
        name: 'sUSD',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'KNC',
        name: 'Kyber Network Crystal',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
            [ChainId.Kovan]: '0xad67cb4d63c9da94aca37fdf2761aadf780ff4a2',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'BNT',
        name: 'Bancor Network Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'GNO',
        name: 'Gnosis Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6810e776880c02933d47db1b9fc05908e5386b96',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'LINK',
        name: 'Chainlink Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x514910771af9ca656af840dff83e8264ecf986ca',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'REN',
        name: 'Republic Protocol',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x408e41876cccdc0f92210600ef50372656052a38',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'GNT',
        name: 'Golem Network Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa74476443119a942de498590fe1f2454d7d4ac0d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'OMG',
        name: 'OmiseGO',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'ANT',
        name: 'Aragon Network Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x960b236a07cf122663c4303350609a66a7b288c0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'SAI',
        name: 'Sai Stablecoin v1.0',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
            [ChainId.Kovan]: '0xc4375b7de8af5a38a93548eb8453a498222c4ff2',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'CVL',
        name: 'Civil Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x01fa555c97d7958fa6f771f3bbd5ccd508f81e22',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'DTH',
        name: 'Dether',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5adc961d6ac3f7062d2ea45fefb8d8167d44b190',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'FOAM',
        name: 'FOAM',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4946fcea7c692606e8908002e55a582af44ac121',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 4,
        symbol: 'AST',
        name: 'AirSwap Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x27054b13b1b798b345b591a4d22e6562d47ea75a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'AION',
        name: 'Aion Network',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'GEN',
        name: 'DAOstack',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x543ff227f64aa17ea132bf9886cab5db55dcaddf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'STORJ',
        name: 'Storj',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'MANA',
        name: 'Decentraland',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'ENTRP',
        name: 'Hut34 Entropy Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5bc7e5f0ab8b2e10d2d0a3f21739fce62459aef3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'MLN',
        name: 'Melon',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbeb9ef514a379b997e0798fdcc901ee474b6d9a1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'LOOM',
        name: 'Loom Network Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'CELR',
        name: 'Celer Network Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4f9254c83eb525f9fcf346490bbb3ed28a81c667',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 9,
        symbol: 'RLC',
        name: 'iExec RLC Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x607f4c5bb672230e8672085532f7e901544a7375',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'ICN',
        name: 'ICONOMI',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x888666ca69e0f178ded6d75b5726cee99a87d698',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 9,
        symbol: 'DGD',
        name: 'Digix',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 12,
        symbol: 'ZIL',
        name: 'Zilliqa',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'cBAT',
        name: 'Compound Basic Attention Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'cDAI',
        name: 'Compound Dai',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'cSAI',
        name: 'Compound Sai (Legacy Dai)',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf5dce57282a584d2746faf1593d3121fcac444dc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'cETH',
        name: 'Compound Ether',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'cREP',
        name: 'Compound Augur',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x158079ee67fce2f58472a96584a73c7ab9ac95c1',
            [ChainId.Kovan]: '0xfd874be7e6733bdc6dca9c7cdd97c225ec235d39',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'cUSDC',
        name: 'Compound USD Coin',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x39aa39c021dfbae8fac545936693ac917d5e7563',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'cZRX',
        name: 'Compound 0x',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407',
            [ChainId.Kovan]: '0xc014dc10a57ac78350c5fddb26bb66f1cb0960a0',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: '0xBTC',
        name: '0xBitcoin Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb6ed7644c69416d67b522e20bc294a9a9b405b31',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'SNT',
        name: 'Status Network Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x744d70fdbe2ba4cf95131626614a1763df805b9e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'SPANK',
        name: 'SPANK',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x42d6622dece394b54999fbd73d108123806f6a18',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'BOOTY',
        name: 'BOOTY',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6b01c3170ae1efebee1a3159172cb3f7a5ecf9e5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'UBT',
        name: 'UniBright',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8400d94a5cb0fa0d041a3788e395285d61c9ee5e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'ICX',
        name: 'ICON',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb5a5f22694352c15b00323844ad545abb2b11028',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'NMR',
        name: 'Numeraire',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1776e1f26f98b1a5df9cd347953a26dd3cb46671',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 2,
        symbol: 'GUSD',
        name: 'Gemini Dollar',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 8,
        symbol: 'FUN',
        name: 'FunFair',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x419d0d8bdd9af5e606ae2232ed285aff190e711b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'PAX',
        name: 'PAX Stablecoin',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'TUSD',
        name: 'TrueUSD',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0000000000085d4780b73119b644ae5ecd22b376',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'LPT',
        name: 'Livepeer',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x58b6a8a3302369daec383334672404ee733ab239',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'ENJ',
        name: 'EnjinCoin',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 6,
        symbol: 'POWR',
        name: 'PowerLedger',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x595832f8fc6bf59c85c527fec3740a1b7a361269',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'REQ',
        name: 'Request',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8f8221afbb33998d8584a2b05749ba73c37a938a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'DNT',
        name: 'district0x',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0abdace70d3790235af448c88547603b945604ea',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'MATIC',
        name: 'Matic Network Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'LRC',
        name: 'Loopring',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 18,
        symbol: 'RDN',
        name: 'Raiden Network Token',
        tokenAddresses: {
            [ChainId.Mainnet]: '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        decimals: 6,
        symbol: 'USDT',
        name: 'Tether USD',
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZWETH',
        name: 'Custom Kovan Wrapped Ether',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: NULL_ADDRESS,
            [ChainId.Kovan]: '0x1FcAf05ABa8c7062D6F08E25c77Bf3746fCe5433',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZUSDC',
        name: 'Custom Kovan USD Coin',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: NULL_ADDRESS,
            [ChainId.Kovan]: '0x5a719Cf3E02c17c876F6d294aDb5CB7C6eB47e2F',
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GST2',
        name: 'Gas Token 2',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0000000000b3f879cb30fe243b4dfee438691c04',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: '0xbe0037eaf2d64fe5529bca93c18c9702d3930376',
        },
    },
    {
        symbol: 'COMP',
        name: 'Compound',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc00e94cb662c3520282e6f5717214004a7f26888',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UMA',
        name: 'Universal Market Access',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x04fa0d235c4abf4bcf4787af4cf447de572ef828',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BZRX',
        name: 'bZx Protocol Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x56d811088235f11c8920698a204a5010a788f4b3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'renBTC',
        name: 'renBTC',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BAL',
        name: 'Balancer',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xba100000625a3754423978a60c9317c58a424e3d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LEND',
        name: 'Aave',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x80fb784b7ed66730e8b1dbd9820afd29931aab03',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AAVE',
        name: 'Aave',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFI',
        name: 'yearn.finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AMPL',
        name: 'Ampleforth',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd46ba6d942050d489dbd938a2c909a5d5039a161',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KEEP',
        name: 'Keep',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x85eee30c52b0b379b046fb0f85f4f3dc3009afec',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'mUSD',
        name: 'mStable USD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe2f2a5c287993345a840db3b0845fbc70f5935a5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'bUSD',
        name: 'Binance USD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRV',
        name: 'Curve DAO Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd533a949740bb3306d119cc777fa900ba034cd52',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SUSHI',
        name: 'Sushi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'swUSD',
        name: 'Swerve.fi swUSD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x77C6E4a580c0dCE4E5c7a17d0bc077188a83A059',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWRV',
        name: 'Swerve DAO Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xB8BAa0e4287890a5F79863aB62b7F175ceCbD433',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'sBTC',
        name: 'Synth sBTC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNI',
        name: 'Uniswap Protocol Governance Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'yUSD',
        name: 'yearn Curve.fi yDAI/yUSDC/yUSDT/yTUSD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5dbcf33d8c2e976c6b560249878e6f1491bca25c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ybCRV',
        name: 'yearn Curve.fi yDAI/yUSDC/yUSDT/yBUSD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2994529c0652d127b7842094103715ec5299bbed',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'yUSDC',
        name: 'yearn USDC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x597ad1e0c13bfe8025993d9e79c69e1c0233522e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'yDAI',
        name: 'yearn DAI',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xacd43e627e64355f1861cec6d3a6688b31a6f952',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'yUSDT',
        name: 'yearn USDT',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2f08119c6f07c006695e079aafc638b8789faf18',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'yTUSD',
        name: 'yearn TUSD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x37d19d1c4e1fa9dc47bd1ea12f742a0887eda74a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AKRO',
        name: 'Akropolis',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8ab7404063ec4dbcfd4598215992dc3f8ec853d7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AUDIO',
        name: 'Audius',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x18aaa7115705e8be94bffebde57af9bfc265b998',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BAND',
        name: 'Band Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BASED',
        name: 'Based Money',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x68a118ef45063051eac49c7e647ce5ace48a68a5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BUSD',
        name: 'Binance USD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CREAM',
        name: 'Cream',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2ba592f78db6436527729929aaf6c908497cb200',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DONUT',
        name: 'Donut',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc0f9bd5fa5698b6505f643900ffa515ea5df54a9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MTA',
        name: 'Meta',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa3bed4e1c75d00fa6f4e5e6922db7261b5e9acd2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'mUSD',
        name: 'mStable USD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe2f2a5c287993345a840db3b0845fbc70f5935a5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PAXG',
        name: 'PAX Gold',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x45804880de22913dafe09f4980848ece6ecbaf78',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PICKLE',
        name: 'Pickle Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x429881672b9ae42b8eba0e26cd9c73711b891ca5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RENZEC',
        name: 'renZEC',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1c5db575e2ff833e46a2e9864c22f4b22e0b37c2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'REP',
        name: 'Augur',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x221657776846890989a759ba2973e427dff5c9bb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SETH',
        name: 'sETH',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STAKE',
        name: 'xDAI Stake',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0ae055097c6d159879521c384f1d2123d1f195e6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TBTC',
        name: 'tBTC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8daebade922df735c38c80c7ebd708af50815faa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'dRAY',
        name: 'DRAY',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x86642d169db9f57a02c65052049cbbbfb3e3b08c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BKBT',
        name: 'BeeKan Beenews',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6a27348483d59150ae76ef4c0f3622a78b0ca698',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'POSH',
        name: 'Shill',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x685aea4f02e39e5a5bb7f7117e88db1151f38364',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SRK',
        name: 'SparkPoint',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0488401c3f535193fa8df029d9ffe615a06e74e6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DRGN',
        name: 'Dragonchain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RFR',
        name: 'Refereum',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd0929d411954c47438dc1d871dd6081f5c5e149c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RAC',
        name: 'RAC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc22b30e4cce6b78aaaadae91e44e73593929a3e9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YAMV2',
        name: 'YAM v2',
        decimals: 24,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaba8cac6866b83ae4eec97dd07ed254282f6ad8a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AKRO',
        name: 'Akropolis',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8ab7404063ec4dbcfd4598215992dc3f8ec853d7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MWT',
        name: 'MingWen Token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x82a6a22d68ffba4057d5b49f93de5c05e4416bd1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GUP',
        name: 'Guppy',
        decimals: 3,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf7b098298f7c69fc14610bf71d5e02c60792894c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KIMCHI',
        name: 'KIMCHI finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1e18821e69b9faa8e6e75dffe54e7e25754beda0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EMONT',
        name: 'EthermonToken',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x95daaab98046846bf4b2853e23cba236fa394a31',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BSC',
        name: 'Bitsonic Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe541504417670fb76b612b41b4392d967a1956c7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PLR',
        name: 'Pillar',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe3818504c1b32bf1557b16c238b2e01fd3149c17',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PHNX',
        name: 'PhoenixDAO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x38a2fdc11f526ddd5a607c1f251c065f40fbf2f7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UTK',
        name: 'UTRUST',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdc9ac3c20d1ed0b540df9b1fedc10039df13f99c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NFY',
        name: 'Non Fungible Yearn',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1cbb83ebcd552d5ebf8131ef8c9cd9d9bab342bc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FYZ',
        name: 'Fyooz',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6bff2fe249601ed0db3a87424a2e923118bb0312',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ICNQ',
        name: 'Iconic Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb3e2cb7cccfe139f8ff84013823bf22da6b6390a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BSC',
        name: 'Benscoin',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcfad57a67689809cda997f655802a119838c9cec',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VIDYA',
        name: 'Vidya',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3d3d35bb9bec23b06ca00fe472b50e7a4c692c30',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFN',
        name: 'Yearn Finance Netwo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x13cea0680b3ffecb835758046cc1dfe9080dbad5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JUICE',
        name: 'Moon Juice',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x889efb523cc39590b8483eb9491890ac71407f64',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CTG',
        name: 'Cryptorg Token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc760721eb65aa6b0a634df6a008887c48813ff63',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFT',
        name: 'Toshify finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9cd39da8f25ec50cf2ee260e464ac23ea23f6bb0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COIL',
        name: 'Coil',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3936ad01cf109a36489d93cabda11cf062fd3d48',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZIP',
        name: 'Zipper Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa9d2927d3a04309e008b6af6e2e282ae2952e7fd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MDS',
        name: 'MediShares',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x66186008c1050627f979d464eabb258860563dbe',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TMT',
        name: 'The Mart Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6f02055e3541dd74a1abd8692116c22ffafadc5d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LCS',
        name: 'LocalCoinSwap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaa19961b6b858d9f18a115f25aa1d98abc1fdba8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GTF',
        name: 'GLOBALTRUSTFUND TOK',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x40f8b7a82b6355d26546d363ce9c12ce104cf0ce',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'QHC',
        name: 'QChi Chain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5df94780f00140fe72d239d0d261f7797e3fbd1b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWSH',
        name: 'SwapShip',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3ac2ab91ddf57e2385089202ca221c360ced0062',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UDOO',
        name: 'Hyprr Howdoo ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x12f649a9e821f90bb143089a6e56846945892ffb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VIEW',
        name: 'View',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf03f8d65bafa598611c3495124093c56e8f638f0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ELF',
        name: 'elf',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbf2179859fc6d5bee9bf9158632dc51678a4100e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GEM',
        name: 'Cargo Gems',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x30b1efb052205e6ca3c4888c3c50c5b339cc0602',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BTB',
        name: 'Bitball',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x06e0feb0d74106c7ada8497754074d222ec6bcdf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHADS',
        name: 'CHADS VC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x69692d3345010a207b759a7d1af6fc7f38b35c5e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GALA',
        name: 'Gala',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x15d4c048f83bd7e37d49ea4c83a07267ec4203da',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BPOP',
        name: 'BPOP',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0452aed878805514e28fb5bd0b56bef92176e32a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRB',
        name: 'Tellor',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0ba45a8b5d5575935b8158a88c631e9f9c95a2e5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CNTR',
        name: 'Centaur',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x03042482d64577a7bdb282260e2ea4c8a89c064b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FARM',
        name: 'Harvest Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa0246c9032bc3a600820415ae600c6388619a14d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OST',
        name: 'OST',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BXIOT',
        name: 'bXIOT',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5c4ac68aac56ebe098d621cd8ce9f43270aaa355',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EBASE',
        name: 'EURBASE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa689dcea8f7ad59fb213be4bc624ba5500458dc6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PAMP',
        name: 'Pamp Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf0fac7104aac544e4a7ce1a55adf2b5a25c65bd1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VEDX',
        name: 'VEDX TOKEN',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd64904232b4674c24fa59170d12fc7df20f5880e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRED',
        name: 'Street Cred',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xed7fa212e100dfb3b13b834233e4b680332a3420',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AMLT',
        name: 'AMLT Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xca0e7269600d353f70b14ad118a49575455c0f2f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CNTM',
        name: 'Connectome',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0e5f00da8aaef196a719d045db89b5da8f371b32',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FRONT',
        name: 'Frontier',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf8c3527cc04340b208c854e985240c02f7b7793f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FYS',
        name: 'Fysical',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x587e276dc7f2c97d986e8adf9b82d3f14d6cd8d2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZEFU',
        name: 'Zenfuse',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb1e9157c2fdcc5a856c8da8b2d89b6c32b3c1229',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BTCWH',
        name: 'Bitcoin Wheelchair',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4588c3c165a5c66c020997d89c2162814aec9cd6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRUMP',
        name: 'YUGE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x012ba3ae1074ae43a34a14bca5c4ed0af01b6e53',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RBC',
        name: 'Rubic',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa4eed63db85311e22df4473f87ccfc3dadcfa3e3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YAX',
        name: 'yAxis',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb1dc9124c395c1e97773ab855d66e879f053a289',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TAUC',
        name: 'Taurus Coin',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd0f12a5d6d74c92e0600ce4274ac19ec6e7fe6ae',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YAM',
        name: 'YAM',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0aacfbec6a24756c20d41914f2caba817c0d8521',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NTS',
        name: 'Nerthus',
        decimals: 12,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3dfeaf13a6615e560aecc5648ace8fa50d7cf6bf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MODEX',
        name: 'Modex',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4bcea5e4d0f6ed53cf45e7a28febb2d3621d7438',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DNA',
        name: 'EncrypGen',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x82b0e50478eeafde392d45d1259ed1071b6fda81',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EASY',
        name: 'EasyFi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x913d8adf7ce6986a8cbfee5a54725d9eea4f0729',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNDB',
        name: 'unibot cash',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd03b6ae96cae26b743a6207dcee7cbe60a425c70',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRAFT',
        name: 'deCraft Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa09ff006c652496e72d648cef2f4ee6777efdf6f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SAM',
        name: 'Samurai',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x53378825d95281737914a8a2ac0e5a9304ae5ed7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFARMER',
        name: 'YFarmLand Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7b0f66fa5cf5cc28280c1e7051af881e06579362',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CENNZ',
        name: 'Centrality',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1122b6a0e00dce0563082b6e2953f3a943855c1f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PLU',
        name: 'Pluton',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd8912c10681d8b21fd3742244f44658dba12264e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DML',
        name: 'Decentralized Machi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbcdfe338d55c061c084d81fd793ded00a27f226d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AFCASH',
        name: 'AFRICUNIA BANK',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb8a5dba52fe8a0dd737bf15ea5043cea30c7e30b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FAME',
        name: 'Fame',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf2da15ae6ef94988534bad4b9e646f5911cbd487',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BKX',
        name: 'BANKEX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x45245bc59219eeaaf6cd3f382e078a461ff9de7b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SOUL',
        name: 'CryptoSoul',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbb1f24c0c1554b9990222f036b0aad6ee4caec29',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWAGG',
        name: 'Swagg Network',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa19a40fbd7375431fab013a4b08f00871b9a2791',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AGI',
        name: 'SingularityNET',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8eb24319393716668d768dcec29356ae9cffe285',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AMN',
        name: 'Amon',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x737f98ac8ca59f2c68ad658e3c3d8c8963e40a4c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BMJ',
        name: 'BMJ Master Nodes',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5913d0f34615923552ee913dbe809f9f348e706e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STEAK',
        name: 'Steaks Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeed9e4f2450035d6426276a8aa2084966ee3b1bb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MCX',
        name: 'Machi X',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd15ecdcf5ea68e3995b2d0527a0ae0a3258302f8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: '808TA',
        name: '808TA Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5b535edfa75d7cb706044da0171204e1c48d00e8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFDOT',
        name: 'Yearn Finance DOT',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2e6539edc3b76f1e21b71d214527faba875f70f3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DOGES',
        name: 'Dogeswap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb4fbed161bebcb37afb1cb4a6f7ca18b977ccb25',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MINI',
        name: 'Mini',
        decimals: 19,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4d953cf077c0c95ba090226e59a18fcf97db44ec',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MTL',
        name: 'Metal',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf433089366899d83a9f26a773d59ec7ecf30355e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PARETO',
        name: 'PARETO Rewards',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ONIGIRI',
        name: 'Onigiri',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcf9c692f7e62af3c571d4173fd4abf9a3e5330d0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YMEN',
        name: 'Ymen Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd0c59798f986d333554688cd667033d469c2398e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TAT',
        name: 'Tatcoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x37ee79e0b44866876de2fb7f416d0443dd5ae481',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COMB',
        name: 'Combine finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7d36cce46dd2b0d28dde12a859c2ace4a21e3678',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NUG',
        name: 'Nuggets',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x245ef47d4d0505ecf3ac463f4d81f41ade8f1fd1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FLUX',
        name: 'FLUX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x469eda64aed3a3ad6f868c44564291aa415cb1d9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ASNX',
        name: 'Aave SNX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x328c4c80bc7aca0834db37e6600a6c49e12da4de',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EVX',
        name: 'Everex',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf3db5fa2c66b7af3eb0c0b782510816cbe4813b8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WINGS',
        name: 'Wings',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x667088b212ce3d06a1b553a7221e1fd19000d9af',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VNXLU',
        name: 'VNX Exchange',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x00fc270c9cc13e878ab5363d00354bebf6f05c15',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MOF',
        name: 'Molecular Future',
        decimals: 16,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x653430560be843c4a3d143d0110e896c2ab8ac0d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CTSI',
        name: 'Cartesi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x491604c0fdf08347dd1fa4ee062a822a5dd06b5d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EQUAD',
        name: 'Quadrant Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc28e931814725bbeb9e670676fabbcb694fe7df2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TITAN',
        name: 'TitanSwap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3a8cccb969a61532d1e6005e2ce12c200caece87',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YMAX',
        name: 'YMAX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x062f90480551379791fbe2ed74c1fe69821b30d3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GL',
        name: 'Green Light',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x70fadbe1f2cccbaf98ac88fdcf94a0509a48e46d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MTBK',
        name: 'Metalblock',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1dfec1cf1336c572c2d2e34fe8f6aa2f409c8251',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STAKE',
        name: 'xDAI Stake',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0ae055097c6d159879521c384f1d2123d1f195e6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WCK',
        name: 'Wrapped CryptoKitti',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x09fe5f0236f0ea5d930197dce254d77b04128075',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LYXE',
        name: 'LUKSO Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa8b919680258d369114910511cc87595aec0be6d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VFI',
        name: 'VN Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x44001a5656baafa5a3359ced8fa38e150a71eea2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PNT',
        name: 'Penta Network Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x53066cddbc0099eb6c96785d9b3df2aaeede5da3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VALUE',
        name: 'Value Liquidity',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x49e833337ece7afe375e44f4e3e8481029218e5c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EAN',
        name: 'EANTO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb4742e2013f96850a5cef850a3bb74cf63b9a5d5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YLAB',
        name: 'Yearn finance Infra',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x454cb9d0845bb4a28462f98c21a4fafd16ceb25f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DGVC',
        name: 'DegenVC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x26e43759551333e57f073bb0772f50329a957b30',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SUTER',
        name: 'Suterusu',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xba8c0244fbdeb10f19f6738750daeedf7a5081eb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNISTAKE',
        name: 'Unistake',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9ed8e7c9604790f7ec589f99b94361d8aab64e5e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MRPH',
        name: 'Morpheus Network',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7b0c06043468469967dba22d1af33d77d44056c8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRIB',
        name: 'Contribute',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe09216f1d343dd39d6aa732a08036fee48555af0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PGS',
        name: 'Pegasus',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x931ad0628aa11791c26ff4d41ce23e40c31c5e4e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XANK',
        name: 'Xank',
        decimals: 16,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0e7f79e89ba8c4a13431129fb2db0d4f444b5b9a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YGY',
        name: 'Generation of Yield',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x11b0a8c0fa626627601ed518c3538a39d92d609e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VGX',
        name: 'Voyager Token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5af2be193a6abca9c8817001f45744777db30756',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DOV',
        name: 'Dovu',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xac3211a5025414af2866ff09c23fc18bc97e79b1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CBET',
        name: 'CryptoBet',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x35dd2ebf20746c6e658fac75cd80d4722fae62f6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WANATHA',
        name: 'Wrapped ANATHA',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3383c5a8969dc413bfddc9656eb80a1408e4ba20',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NEWS',
        name: 'CryptoNewsNet',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x130da3e198f092fe2a6e6c21893dc77746d7e406',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CAP',
        name: 'Cap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x43044f861ec040db59a7e324c40507addb673142',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHESS',
        name: 'Chess Coin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5f75112bbb4e1af516fbe3e21528c63da2b6a1a5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BID',
        name: 'Bidao',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x25e1474170c4c0aa64fa98123bdc8db49d7802fa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COZOM',
        name: 'CryptoPunk 3831 Sh',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x41523a22144f3d129dddf1e9a549333148d0c37d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UTU',
        name: 'UTU Coin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa58a4f5c4bb043d2cc1e170613b74e767c94189b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MFT',
        name: 'Mainframe',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdf2c7238198ad8b389666574f2d8bc411a4b7428',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TXL',
        name: 'Tixl',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8eef5a82e6aa222a60f009ac18c24ee12dbf4b41',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BAND',
        name: 'Band Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BAZT',
        name: 'Baz Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb020ed54651831878e5c967e0953a900786178f9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'QNT',
        name: 'Quant',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4a220e6096b25eadb88358cb44068a3248254675',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MYFI',
        name: 'Moon YFI',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1efb2286bf89f01488c6b2a22b2556c0f45e972b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EFS',
        name: 'EFSANE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x46761ee2f1ecec5b6e82fa8fee60e388ece0890d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VESTA',
        name: 'Vesta',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3aef8e803bd9be47e69b9f36487748d30d940b96',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFF',
        name: 'YFF Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8be6a6158f6b8a19fe60569c757d16e546c2296d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XETH',
        name: 'Xplosive Ethereum',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaa19673aa1b483a5c4f73b446b4f851629a7e7d6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FNSP',
        name: 'Finswap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3b78dc5736a49bd297dd2e4d62daa83d35a22749',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CND',
        name: 'Cindicator',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd4c435f5b09f855c3317c8524cb1f586e42795fa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DENT',
        name: 'Dent',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3597bfd533a99c9aa083587b074434e61eb0a258',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ETH3L',
        name: 'Amun Ether 3x Daily',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x239b0fa917d85c21cf6435464c2c6aa3d45f6720',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LTO',
        name: 'LTO Network',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3db6ba6ab6f95efed1a6e794cad492faaabf294d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DOS',
        name: 'DOS Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0a913bead80f321e7ac35285ee10d9d922659cb7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KIF',
        name: 'KittenFinance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x177ba0cac51bfc7ea24bad39d81dcefd59d74faa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HOT',
        name: 'Hydro Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9af839687f6c94542ac5ece2e317daae355493a1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFBETA',
        name: 'yfBeta',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x89ee58af4871b474c30001982c3d7439c933c838',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WOA',
        name: 'Wrapped Origin Axie',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xec0a0915a7c3443862b678b0d4721c7ab133fdcf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'QCORE',
        name: 'Qcore Finance',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x82866b4a71ba9d930fe338c386b6a45a7133eb36',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MBBASED',
        name: 'Moonbase',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x26cf82e4ae43d31ea51e72b663d26e26a75af729',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TAU',
        name: 'Lamden',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc27a2f05fa577a83ba0fdb4c38443c0718356501',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BD',
        name: 'BurnDrop',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x827eed050df933f6fda3a606b5f716cec660ecba',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AFROX',
        name: 'AfroDex',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x08130635368aa28b217a4dfb68e1bf8dc525621c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MCO',
        name: 'MCO',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb63b606ac810a52cca15e44bb630fd42d8d1d83d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CMCT',
        name: 'Crowd Machine',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x47bc01597798dcd7506dcca36ac4302fc93a8cfb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRD',
        name: 'CryptalDash',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcaaa93712bdac37f736c323c93d4d5fdefcc31cc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'POT',
        name: 'Hotpot Base Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x042afd3869a47e2d5d42cc787d5c9e19df32185f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SYFI',
        name: 'Soft Yearn',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x322124122df407b0d0d902cb713b3714fb2e2e1f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'INDEX',
        name: 'Index Cooperative',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0954906da0bf32d5479e25f46056d22f08464cab',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UCT',
        name: 'Ubique Chain of Thi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3c4bea627039f0b7e7d21e34bb9c9fe962977518',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CREAM',
        name: 'Cream',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2ba592f78db6436527729929aaf6c908497cb200',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'C8',
        name: 'Carboneum',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XSP',
        name: 'XSwap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9b06d48e0529ecf05905ff52dd426ebec0ea3011',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'USD',
        name: 'unified Stable Doll',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x44086035439e676c02d411880fccb9837ce37c57',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEV',
        name: 'Dev Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5caf454ba92e6f2c929df14667ee360ed9fd5b26',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AGVC',
        name: 'AgaveCoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8b79656fc38a04044e495e22fad747126ca305c4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NCC',
        name: 'NeuroChain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5d48f293baed247a2d0189058ba37aa238bd4725',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFUEL',
        name: 'YFUEL',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbd301be09eb78df47019aa833d29edc5d815d838',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DFIO',
        name: 'DeFi Omega',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xee3b9b531f4c564c70e14b7b3bb7d516f33513ff',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RPEPE',
        name: 'Rare Pepe',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0e9b56d2233ea2b5883861754435f9c51dbca141',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SBX',
        name: 'Sports Betting Mark',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7461c43bb1e96863233d72a09191008ee9217ee8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BNC',
        name: 'Bnoincoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbe5b336ef62d1626940363cf34be079e0ab89f20',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FAME',
        name: 'SAINT FAME Genesis',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x06f65b8cfcb13a9fe37d836fe9708da38ecb29b2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HEZ',
        name: 'Hermez Network Toke',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeef9f339514298c6a857efcfc1a762af84438dee',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DFX',
        name: 'Definitex',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf1f5de69c9c8d9be8a7b01773cc1166d4ec6ede2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DSLA',
        name: 'DSLA Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3affcca64c2a6f4e3b6bd9c64cd2c969efd1ecbe',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OUSD',
        name: 'Origin Dollar',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2a8e1e676ec238d8a992307b495b45b3feaa5e86',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SKULL',
        name: 'Skull',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbcc66ed2ab491e9ae7bf8386541fb17421fa9d35',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JRT',
        name: 'Jarvis Reward Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8a9c67fee641579deba04928c4bc45f66e26343a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DAP',
        name: 'Bloc',
        decimals: 10,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4bebe99fac607dc7ef2d99d352ca18999f51b709',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PMGT',
        name: 'Perth Mint Gold Tok',
        decimals: 5,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaffcdd96531bcd66faed95fc61e443d08f79efef',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IND',
        name: 'Indorse',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf8e386eda857484f5a12e4b5daa9984e06e73705',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NYB',
        name: 'New Year Bull',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x798a9055a98913835bbfb45a0bbc209438dcfd97',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AMP',
        name: 'Amp',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xff20817765cb7f73d4bde2e66e067e58d11095c2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HUSD',
        name: 'HUSD',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdf574c24545e5ffecb9a659c229253d4111d87e1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SLP',
        name: 'Small Love Potion',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x37236cd05b34cc79d3715af2383e96dd7443dcf1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KAI',
        name: 'KardiaChain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd9ec3ff1f8be459bb9369b4e79e9ebcf7141c093',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CV',
        name: 'carVertical',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xda6cb58a0d0c01610a29c5a65c303e13e885887c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STA',
        name: 'Statera',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa7de087329bfcda5639247f96140f9dabe3deed1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RAISE',
        name: 'Raise Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x10ba8c420e912bf07bedac03aa6908720db04e0c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GEX',
        name: 'Globex',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x03282f2d7834a97369cad58f888ada19eec46ab6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FRENS',
        name: 'Frens Community',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x907cb97615b7cd7320bc89bb7cdb46e37432ebe7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COV',
        name: 'Covesting',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xada86b1b313d1d5267e3fc0bb303f0a2b66d0ea7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SNC',
        name: 'SunContract',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf4134146af2d511dd5ea8cdb1c4ac88c57d60404',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CXN',
        name: 'CXN Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb48e0f69e6a3064f5498d495f77ad83e0874ab28',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TMPL',
        name: 'Truample',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x52132a43d7cae69b23abe77b226fa1a5bc66b839',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SBTC',
        name: 'SiamBitcoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb8e103b60a33597136ea9511f46b6dbeb643a3a5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IHF',
        name: 'Invictus Hyperion F',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaf1250fa68d7decd34fd75de8742bc03b29bd58e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KARMA',
        name: 'Karma DAO',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdfe691f37b6264a90ff507eb359c45d55037951c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SAFE',
        name: 'yieldfarming insure',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1aa61c196e76805fcbe394ea00e4ffced24fc469',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LIQUID',
        name: 'Netkoin Liquid',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xac2385e183d9301dd5e2bb08da932cbf9800dc9c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'THRN',
        name: 'Thorncoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x35a735b7d1d811887966656855f870c05fd0a86d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'REM',
        name: 'Remme',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x83984d6142934bb535793a82adb0a46ef0f66b6d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KASSIAHOME',
        name: 'Kassia Home',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4cc84b41ececc387244512242eec226eb7948a92',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DOCK',
        name: 'Dock',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe5dada80aa6477e85d09747f2842f7993d0df71c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TAUD',
        name: 'TrueAUD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x00006100f7090010005f1bd7ae6122c3c2cf0090',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MRO',
        name: 'Mero Currency',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6ff313fb38d53d7a458860b1bf7512f54a03e968',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DPI',
        name: 'DeFiPulse Index',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ASWAP',
        name: 'Arbiswap',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xad0887734461af8c6033068bde4047dbe84074cc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TIG',
        name: 'TIG Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x749826f1041caf0ea856a4b3578ba327b18335f8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EER',
        name: 'Ethereum eRush',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3cc5eb07e0e1227613f1df58f38b549823d11cb9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ULLU',
        name: 'ULLU',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5313e18463cf2f4b68b392a5b11f94de5528d01d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VGT',
        name: 'Vault Guardian Toke',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcc394f10545aeef24483d2347b32a34a44f20e6f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SLV',
        name: 'Silverway',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4c1c4957d22d8f373aed54d0853b090666f6f9de',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KATANA',
        name: 'Katana Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe6410569602124506658ff992f258616ea2d4a3d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BAST',
        name: 'Bast',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x47eb79217f42f92dbd741add1b1a6783a2c873cf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UTY',
        name: 'UnityDAO',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc6bf2a2a43ca360bb0ec6770f57f77cdde64bb3f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EYE',
        name: 'Behodler',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x155ff1a85f440ee0a382ea949f24ce4e0b751c65',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DANDY',
        name: 'Dandy Dego',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9dfc4b433d359024eb3e810d77d60fbe8b0d9b82',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BDG',
        name: 'BitDegree',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1961b3331969ed52770751fc718ef530838b6dee',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MNE',
        name: 'Minereum',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x426ca1ea2406c07d75db9585f22781c096e3d0e0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OXY',
        name: 'OXY',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd83a162d4808c370a1445646e64cc4861eb60b92',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WRC',
        name: 'WhiteRockCasino',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7c9d8fb3bde3d9ea6e89170618c2dc3d16695d36',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FOR',
        name: 'Force Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1fcdce58959f536621d76f5b7ffb955baa5a672f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HAKKA',
        name: 'Hakka Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0e29e5abbb5fd88e28b2d355774e73bd47de3bcd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VAMP',
        name: 'Vampire Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb2c822a1b923e06dbd193d2cfc7ad15388ea09dd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CUBE',
        name: 'Somnium Space CUBEs',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdf801468a808a32656d2ed2d2d80b72a129739f4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ADEL',
        name: 'Akropolis Delphi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x94d863173ee77439e4292284ff13fad54b3ba182',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHART',
        name: 'ChartEx',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1d37986f252d0e349522ea6c3b98cb935495e63e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEA',
        name: 'DEA',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x80ab141f324c3d6f2b18b030f1c4e95d4d658778',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RFUEL',
        name: 'RioDeFi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaf9f549774ecedbd0966c52f250acc548d3f36e5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFMB',
        name: 'YFMoonBeam',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7afac1d878c66a47263dce57976c371ae2e74882',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XNK',
        name: 'Ink Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbc86727e770de68b1060c91f6bb6945c73e10388',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XPAT',
        name: 'Pangea Arbitration ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbb1fa4fdeb3459733bf67ebc6f893003fa976a82',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LIBERTAS',
        name: 'LIBERTAS',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x49184e6dae8c8ecd89d8bdc1b950c597b8167c90',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DX',
        name: 'DxChain Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x973e52691176d36453868d9d86572788d27041a9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFIIG',
        name: 'YFII Gold',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xef8ba8cba86f81b3108f60186fce9c81b5096d5c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'QUO',
        name: 'Quoxent',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xefd720c94659f2ccb767809347245f917a145ed8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OPM',
        name: 'Omega Protocol Mone',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf4c17bc4979c1dc7b4ca50115358dec58c67fd9d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XNS',
        name: 'Xeonbit Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x79c71d3436f39ce382d0f58f1b011d88100b9d91',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'USDG',
        name: 'USDG',
        decimals: 3,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf906997808f73b09c1007b98ab539b189282b192',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UPT',
        name: 'Universal Protocol ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6ca88cc8d9288f5cad825053b6a1b179b05c76fc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ENCORE',
        name: 'EnCore',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe0e4839e0c7b2773c58764f9ec3b9622d01a0428',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KSC',
        name: 'KStarCoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x990e081a7b7d3ccba26a2f49746a68cc4ff73280',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SMOL',
        name: 'smol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2216e873ea4282ebef7a02ac5aea220be6391a7c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PEAK',
        name: 'PEAKDEFI',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x630d98424efe0ea27fb1b3ab7741907dffeaad78',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SXMR',
        name: 'sXMR',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5299d6f7472dcc137d7f3c4bcfbbb514babf341a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JET',
        name: 'Jetcoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8727c112c712c4a03371ac87a74dd6ab104af768',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LYNC',
        name: 'LYNC Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8f87ec6aad3b2a8c44f1298a1af56169b8e574cf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFSI',
        name: 'Yfscience',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1df6f1bb7454e5e4ba3bca882d3148fbf9b5697a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BLV',
        name: 'Bellevue Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8da25b8ed753a5910013167945a676921e864436',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HVN',
        name: 'Hiveterminal token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc0eb85285d83217cd7c891702bcbc0fc401e2d9d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OGN',
        name: 'Origin Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8207c1ffc5b6804f6024322ccf34f29c3541ae26',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PRINT',
        name: 'Printer Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x54b8c98268da0055971652a95f2bfd3a9349a38c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SHUF',
        name: 'Shuffle Monster',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3a9fff453d50d4ac52a6890647b823379ba36b9e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UP',
        name: 'UpToken',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6ba460ab75cd2c56343b3517ffeba60748654d26',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRAC',
        name: 'OriginTrail',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SAKE',
        name: 'SakeToken',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x066798d9ef0833ccc719076dab77199ecbd178b0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VSN',
        name: 'Vision Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x456ae45c0ce901e2e7c99c0718031cec0a7a59ff',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VIDT',
        name: 'VIDT Datalink',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfef4185594457050cc9c23980d301908fe057bb1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'REL',
        name: 'Relevant',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb6c4267c4877bb0d6b1685cfd85b0fbe82f105ec',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LIMIT',
        name: 'LimitSwap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1712aad2c773ee04bdc9114b32163c058321cd85',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VERI',
        name: 'Veritaseum',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8f3470a7388c05ee4e7af3d01d8c722b0ff52374',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BCTR',
        name: 'Bitcratic Revenue',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x579353231f3540b218239774422962c64a3693e7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PLAY',
        name: 'HEROcoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe477292f1b3268687a29376116b0ed27a9c76170',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XRT',
        name: 'Robonomics Network',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7de91b204c1c737bcee6f000aaa6569cf7061cb7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRBT',
        name: 'Tribute',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7031ab87dcc46818806ec07af46fa8c2ad2a2bfc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'INFD',
        name: 'InfinityDeFi',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x82dad985afd3708680bac660f4e527da4f0dcfa5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WING',
        name: 'Wing Shop',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcb3df3108635932d912632ef7132d03ecfc39080',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BDP',
        name: 'BidiPass',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x593114f03a0a575aece9ed675e52ed68d2172b8c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SGR',
        name: 'Sogur',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaea8e1b6cb5c05d1dac618551c76bcd578ea3524',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DHC',
        name: 'DeltaHub Community',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x152687bc4a7fcc89049cf119f9ac3e5acf2ee7ef',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHAIN',
        name: 'Chain Games',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc4c2614e694cf534d407ee49f8e44d125e4681c4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LIMEX',
        name: 'Limestone Network',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x400b1d8a7dd8c471026b2c8cbe1062b27d120538',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: '0XMR',
        name: '0xMonero',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x035df12e0f3ac6671126525f1015e47d79dfeddf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'METRIC',
        name: 'MetricExchange',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xefc1c73a3d8728dc4cf2a18ac5705fe93e5914ac',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COW',
        name: 'Cowboy Finance',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf0be50ed0620e0ba60ca7fc968ed14762e0a5dd3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JOON',
        name: 'JOON',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x174897edd3ce414084a009d22db31c7b7826400d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NEC',
        name: 'Nectar Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcc80c051057b774cd75067dc48f8987c4eb97a5e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MDTL',
        name: 'Medalte',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x625687081ba9fcbffb0ae6bfe8d7fad6f616f494',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFE',
        name: 'YFE Money',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x33811d4edbcaed10a685254eb5d3c4e4398520d2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BUIDL',
        name: 'dfohub',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7b123f53421b1bf8533339bfbdc7c98aa94163db',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ERC223',
        name: 'ERC223',
        decimals: 10,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf8f237d074f637d777bcd2a4712bde793f94272b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFA',
        name: 'YFA Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xef327568556310d344c49fb7ce6cbfe7b2bb83e6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NLINK',
        name: 'NuLINK',
        decimals: 3,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x493c8d6a973246a7b26aa8ef4b1494867a825de5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WZBLT',
        name: 'Wrapped ZEBELLION',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7a58da7c0568557ec65cd53c0dbe5b134a022a14',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ESH',
        name: 'Switch',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd6a55c63865affd67e2fb9f284f87b7a9e5ff3bd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ABUSD',
        name: 'Aave BUSD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6ee0f7bb50a54ab5253da0667b0dc2ee526c30a8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LCX',
        name: 'LCX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x037a54aab062628c9bbae1fdb1583c195585fe41',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CDT',
        name: 'Blox',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x177d39ac676ed1c67a2b268ad7f1e58826e5b0af',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KSEED',
        name: 'Kush Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3f09400313e83d53366147e3ea0e4e2279d80850',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OWL',
        name: 'OWL Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2a7f709ee001069771ceb6d42e85035f7d18e736',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TWOB',
        name: 'The Whale of Blockc',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x975ce667d59318e13da8acd3d2f534be5a64087b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WNXM',
        name: 'Wrapped NXM',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0d438f3b5175bebc262bf23753c1e53d03432bde',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EXNT',
        name: 'ExNetwork Token',
        decimals: 16,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd6c67b93a7b248df608a653d82a100556144c5da',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OCEAN',
        name: 'Ocean Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x967da4048cd07ab37855c090aaf366e4ce1b9f48',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'INTX',
        name: 'INTEXCOIN',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7533d63a2558965472398ef473908e1320520ae2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TST',
        name: 'TBC Shopping Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf67041758d3b6e56d6fdafa5b32038302c3634da',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SHAKE',
        name: 'SHAKE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6006fc2a849fedaba8330ce36f5133de01f96189',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PBL',
        name: 'Pebbles',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x55648de19836338549130b1af587f16bea46f66b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'THIRM',
        name: 'Thirm Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb526fd41360c98929006f3bdcbd16d55de4b0069',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XRPC',
        name: 'XRP Classic',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd4ca5c2aff1eefb0bea9e9eab16f88db2990c183',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XIO',
        name: 'XIO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0f7f961648ae6db43c75663ac7e5414eb79b5704',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ESS',
        name: 'Essentia',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfc05987bd2be489accf0f509e44b0145d68240f7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LINKETHRSI',
        name: 'LINK ETH RSI Ratio ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8933ea1ce67b946bdf2436ce860ffbb53ce814d2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XTP',
        name: 'Tap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6368e1e18c4c419ddfc608a0bed1ccb87b9250fc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ROT',
        name: 'Rotten',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd04785c4d8195e4a54d9dec3a9043872875ae9e2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BRAP',
        name: 'Brapper Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x905d3237dc71f7d8f604778e8b78f0c3ccff9377',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LEAD',
        name: 'Lead Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1dd80016e3d4ae146ee2ebb484e8edd92dacc4ce',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MX',
        name: 'MX Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x11eef04c884e24d9b7b4760e7476d06ddf797f36',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ONE',
        name: 'Menlo One',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4d807509aece24c0fa5a102b6a3b059ec6e14392',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'C20',
        name: 'CRYPTO20',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x26e75307fc0c021472feb8f727839531f112f317',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'APE',
        name: 'APEcoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x209c1808febf6c1ab7c65764bb61ad67d3923fcc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DONUT',
        name: 'Donut',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc0f9bd5fa5698b6505f643900ffa515ea5df54a9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MNT',
        name: 'Money Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x310da5e1e61cd9d6eced092f085941089267e71e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GZE',
        name: 'GazeCoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4ac00f287f36a6aad655281fe1ca6798c9cb727b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SYLO',
        name: 'Sylo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf293d23bf2cdc05411ca0eddd588eb1977e8dcd4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFDT',
        name: 'Yearn Finance Diamo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1378ec93ab2b07ba5a0eaef19cf354a33f64b9fd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CGC',
        name: 'CGC Token',
        decimals: 16,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2d9765a94ff22e0ca3afc3e3f4b116de2b67582a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LND',
        name: 'Lendingblock',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0947b0e6d821378805c9598291385ce7c791a6b2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SNOW',
        name: 'Snowswap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfe9a29ab92522d14fc65880d817214261d8479ae',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LOCK',
        name: 'LOCK Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb9464ef80880c5aea54c7324c0b8dd6ca6d05a90',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FMA',
        name: 'Flama',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0f8794f66c7170c4f9163a8498371a747114f6c4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SAN',
        name: 'Santiment Network T',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7c5a0ce9267ed19b22f8cae653f198e3e8daf098',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JUL',
        name: 'JustLiquidity',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5580ab97f226c324c671746a1787524aef42e415',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEXG',
        name: 'Dextoken Governance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb81d70802a816b5dacba06d708b5acf19dcd436d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RUGZ',
        name: 'pulltherug finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xedfbd6c48c3ddff5612ade14b45bb19f916809ba',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HYDRO',
        name: 'Hydro',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xebbdf302c940c6bfd49c6b165f457fdb324649bc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FDT',
        name: 'Food Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb2a01ad9738450f082e5238e43b17fe80781faae',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RENZEC',
        name: 'renZEC',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1c5db575e2ff833e46a2e9864c22f4b22e0b37c2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PROM',
        name: 'Prometeus',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfc82bb4ba86045af6f327323a46e80412b91b27d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NIOX',
        name: 'Autonio',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc813ea5e3b48bebeedb796ab42a30c5599b01740',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SHARE',
        name: 'Seigniorage Shares',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x39795344cbcc76cc3fb94b9d1b15c23c2070c66d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LIB',
        name: 'Libera',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0bf6261297198d91d4fa460242c69232146a5703',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TKT',
        name: 'Twinkle',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x13e9ec660d872f55405d70e5c52d872136f0970c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHR',
        name: 'Chromia',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x915044526758533dfb918eceb6e44bc21632060d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DSS',
        name: 'Defi Shopping Stake',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x213c53c96a01a89e6dcc5683cf16473203e17513',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CEL',
        name: 'Celsius Network',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ORB',
        name: 'Orb V2',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1b7c4d4f226ccf3211b0f99c4fdfb84a2606bf8e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ESD',
        name: 'Empty Set Dollar',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x36f3fd68e7325a35eb768f1aedaae9ea0689d723',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TGBP',
        name: 'TrueGBP',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x00000000441378008ea67f4284a57932b1c000a5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BI',
        name: 'Bitanium',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5b5bb9765eff8d26c24b9ff0daa09838a3cd78e9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MAKI',
        name: 'Maki Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x270d09cb4be817c98e84feffde03d5cd45e30a27',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RVX',
        name: 'Rivex',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x91d6f6e9026e43240ce6f06af6a4b33129ebde94',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MEXP',
        name: 'MOJI Experience Poi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xde201daec04ba73166d9917fdf08e1728e270f06',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ENG',
        name: 'Enigma',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf0ee6b27b759c9893ce4f094b49ad28fd15a23e4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BKY',
        name: 'BLUEKEY',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x646b41183bb0d18c01f75f630688d613a5774dc7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SAFE2',
        name: 'SAFE2',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x250a3500f48666561386832f1f1f1019b89a2699',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CGT',
        name: 'CACHE Gold',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf5238462e7235c7b62811567e63dd17d12c2eaa0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FTM',
        name: 'Fantom',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ALEX',
        name: 'Alex',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8ba6dcc667d3ff64c1a2123ce72ff5f0199e5315',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MILK2',
        name: 'MILK2',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x80c8c3dcfb854f9542567c8dac3f44d709ebc1de',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DUST',
        name: 'DUST Token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbca3c97837a39099ec3082df97e28ce91be14472',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHP',
        name: 'CoinPoker',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf3db7560e820834658b590c96234c333cd3d5e5e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VEY',
        name: 'VEY',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x70a63225bcadacc4430919f0c1a4f0f5fcffbaac',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YUNO',
        name: 'YUNo Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4b4f5286e0f93e965292b922b9cd1677512f1222',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'A',
        name: 'Alpha Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xffc63b9146967a1ba33066fb057ee3722221acf0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DESH',
        name: 'DeCash',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x95ba34760ac3d7fbe98ee8b2ab33b4f1a6d18878',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OWL',
        name: 'OWL',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1a5f9352af8af974bfc03399e3767df6370d82e4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFFII',
        name: 'YFFII Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6c4b85cab20c13af72766025f0e17e0fe558a553',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PKT',
        name: 'PlayKey',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2604fa406be957e542beb89e6754fcde6815e83f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TAPE',
        name: 'BOY Cassette Tape b',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9bfb088c9f311415e3f9b507da73081c52a49d8c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YTSLA',
        name: 'yTSLA Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5322a3556f979ce2180b30e689a9436fddcb1021',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FIRST',
        name: 'Harrison First',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9903a4cd589da8e434f264deafc406836418578e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DOGEFI',
        name: 'DogeFi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9b9087756eca997c5d595c840263001c9a26646d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DDIM',
        name: 'DuckDaoDime',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfbeea1c75e4c4465cb2fccc9c6d6afe984558e20',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MSP',
        name: 'Mothership',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x68aa3f232da9bdc2343465545794ef3eea5209bd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XMX',
        name: 'XMax',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0f8c45b896784a1e408526b9300519ef8660209c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NEWTON',
        name: 'Newtonium',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xae9cbe6ebf72a51c9fcea3830485614486318fd4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CPR',
        name: 'CIPHER',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x20ae0ca9d42e6ffeb1188f341a7d63450452def6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PCT',
        name: 'Percent',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbc16da9df0a22f01a16bc0620a27e7d6d6488550',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZOMB',
        name: 'Antique Zombie Shar',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x78175901e9b04090bf3b3d3cb7f91ca986fb1af6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SBTCCURVE',
        name: 'LP sBTC Curve',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x075b1bb99792c9e1041ba13afef80c91a1e70fb3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HGT',
        name: 'HelloGold',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xba2184520a1cc49a6159c57e61e1844e085615b6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EURS',
        name: 'STASIS EURO',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdb25f211ab05b1c97d595516f45794528a807ad8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ODEX',
        name: 'One DEX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa960d2ba7000d58773e7fa5754dec3bb40a069d5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YELD',
        name: 'Yeld Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x468ab3b1f63a1c14b361bc367c3cc92277588da1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DHT',
        name: 'dHedge DAO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xca1207647ff814039530d7d35df0e1dd2e91fa84',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KDAG',
        name: 'King DAG',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x95e40e065afb3059dcabe4aaf404c1f92756603a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFFC',
        name: 'yffc finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xea004e8fa3701b8e58e41b78d50996e0f7176cbd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEXE',
        name: 'DeXe',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xde4ee8057785a7e8e800db58f9784845a5c2cbd6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRADE',
        name: 'Unitrade',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6f87d756daf0503d08eb8993686c7fc01dc44fb1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHERRY',
        name: 'Cherry',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4ecb692b0fedecd7b486b4c99044392784877e8c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YAMV1',
        name: 'YAM v1',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0e2298e3b3390e3b945a5456fbf59ecc3f55da16',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COVAL',
        name: 'Circuits of Value',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3d658390460295fb963f54dc0899cfb1c30776df',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EMN',
        name: 'Eminence',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5ade7ae8660293f2ebfcefaba91d141d72d221e8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YI12',
        name: 'YI12 STFinance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x03e4bdce611104289333f35c8177558b04cc99ff',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RSR',
        name: 'Reserve Rights Toke',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8762db106b2c2a0bccb3a80d1ed41273552616e8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DYNMT',
        name: 'DYNAMITE Token',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3b7f247f21bf3a07088c2d3423f64233d4b069f7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CORE',
        name: 'cVault finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x62359ed7505efc61ff1d56fef82158ccaffa23d7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZAC',
        name: 'ZAC Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x98a90499b62ae48e151a66b0f647570b5a473b1c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TST',
        name: 'Touch Social',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd9bae39c725a1864b1133ad0ef1640d02f79b78c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SOFI',
        name: 'Social Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaea5e11e22e447fa9837738a0cd2848857748adf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SNGLS',
        name: 'SingularDTV',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaec2e87e0a235266d9c5adc9deb4b2e29b54d009',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RCN',
        name: 'Ripio Credit Networ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DRC',
        name: 'Dracula Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb78b3320493a4efaa1028130c5ba26f0b6085ef8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RMPL',
        name: 'RMPL',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe17f017475a709de58e976081eb916081ff4c9d5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RING',
        name: 'Darwinia Network Na',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9469d013805bffb7d3debe5e7839237e535ec483',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DARK',
        name: 'Dark Build',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3108ccfd96816f9e663baa0e8c5951d229e8c6da',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JIAOZI',
        name: 'Jiaozi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x94939d55000b31b7808904a80aa7bab05ef59ed6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'POWER',
        name: 'UniPower',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf2f9a7e93f845b3ce154efbeb64fb9346fcce509',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PLOT',
        name: 'PlotX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x72f020f8f3e8fd9382705723cd26380f8d0c66bb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'REP',
        name: 'Augur',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x221657776846890989a759ba2973e427dff5c9bb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFIKING',
        name: 'YFIKing Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5f7fa1a0ae94b5dd6bb6bd1708b5f3af01b57908',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PRQ',
        name: 'PARSIQ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x362bc847a3a9637d3af6624eec853618a43ed7d2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PDAI',
        name: 'Prime DAI',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9043d4d51c9d2e31e3f169de4551e416970c27ef',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEFI+S',
        name: 'PieDAO DEFI Small C',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xad6a626ae2b43dcb1b39430ce496d2fa0365ba9c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHSB',
        name: 'SwissBorg',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xba9d4199fab4f26efe3551d490e3821486f135ba',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SHIB',
        name: 'Shiba Inu',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ANK',
        name: 'Apple Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3c45b24359fb0e107a4eaa56bd0f2ce66c99a0e5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'USD',
        name: 'Dollars',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2f6081e3552b1c86ce4479b80062a1dda8ef23e3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRU',
        name: 'Crust Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x32a7c02e79c4ea1008dd6564b35f131428673c41',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TOL',
        name: 'Tolar',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd07d9fe2d2cc067015e2b4917d24933804f42cfa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CAT',
        name: 'Cat Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x56015bbe3c01fe05bc30a8a9a9fd9a88917e7db3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MFG',
        name: 'SyncFab',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6710c63432a2de02954fc0f851db07146a6c0312',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XDB',
        name: 'DigitalBits',
        decimals: 7,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb9eefc4b0d472a44be93970254df4f4016569d27',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BSOV',
        name: 'BitcoinSoV',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x26946ada5ecb57f3a1f91605050ce45c482c9eb1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ICK',
        name: ' ICK Mask',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x793e2602a8396468f3ce6e34c1b6c6fd6d985bad',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MLR',
        name: 'Mega Lottery Servic',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf26893f89b23084c4c6216038d6ebdbe9e96c5cb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ILK',
        name: 'INLOCK',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf784682c82526e245f50975190ef0fff4e4fc077',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MTN',
        name: 'Medicalchain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x41dbecc1cdc5517c6f76f6a6e836adbee2754de3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MAFI',
        name: 'Mafia Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4889f721f80c5e9fade6ea9b85835d405d79a4f4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FUSE',
        name: 'Fuse Network Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x970b9bb2c0444f5e81e9d0efb84c8ccdcdcaf84d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ARTE',
        name: 'ethArt',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x34612903db071e888a4dadcaa416d3ee263a87b9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFOX',
        name: 'YFOX Finance',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x706cb9e741cbfee00ad5b3f5acc8bd44d1644a74',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFPRO',
        name: 'YFPRO Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0fdc5313333533cc0c00c22792bff7383d3055f2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XBP',
        name: 'BlitzPredict',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x28dee01d53fed0edf5f6e310bf8ef9311513ae40',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NMT',
        name: 'NovaDeFi',
        decimals: 19,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd9a6803f41a006cbf389f21e55d7a6079dfe8df3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFIS',
        name: 'YFISCURITY',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x86965a86539e2446f9e72634cefca7983cc21a81',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TARM',
        name: 'ARMTOKEN',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcdd0a6b15b49a9eb3ce011cce22fac2ccf09ece6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WAR',
        name: 'YieldWars',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf4a81c18816c9b0ab98fac51b36dcb63b0e58fde',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HAUT',
        name: 'Hauteclere Shards',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3142dad33b1c6e1371d8627365f2ee2095eb6b37',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BPLC',
        name: 'BlackPearl Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x426fc8be95573230f6e6bc4af91873f0c67b21b4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HATE',
        name: 'Heavens Gate',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x054bd236b42385c938357112f419dc5943687886',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EDN',
        name: 'Edenchain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x89020f0d5c5af4f3407eb5fe185416c457b0e93e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNIFI',
        name: 'Unifi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9e78b8274e1d6a76a0dbbf90418894df27cbceb5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XBTC',
        name: 'xBTC',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xecbf566944250dde88322581024e611419715f7a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MBN',
        name: 'Membrana',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4eeea7b48b9c3ac8f70a9c932a8b1e8a5cb624c7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ONES',
        name: 'OneSwap DAO Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0b342c51d1592c41068d5d4b4da4a68c0a04d5a4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ADX',
        name: 'AdEx',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xade00c28244d5ce17d72e40330b1c318cd12b7c3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RAKU',
        name: 'RAKUN',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x51bc0deaf7bbe82bc9006b0c3531668a4206d27f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AOG',
        name: 'smARTOFGIVING',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8578530205cecbe5db83f7f29ecfeec860c297c2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WTF',
        name: 'Walnut finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0501e7a02c285b9b520fdbf1badc74ae931ad75d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LION',
        name: 'CoinLion',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2167fb82309cf76513e83b25123f8b0559d6b48f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CVD',
        name: 'Covid19',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6b466b0232640382950c45440ea5b630744eca99',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TBX',
        name: 'Tokenbox',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3a92bd396aef82af98ebc0aa9030d25a23b11c6b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TIKTOK',
        name: 'TIKTOK COIN',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf4eda77f0b455a12f3eb44f8653835f377e36b76',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BUILD',
        name: 'BUILD Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RLX',
        name: 'Relex',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4a42d2c580f83dce404acad18dab26db11a1750e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EMTRG',
        name: 'Meter Governance ma',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbd2949f67dcdc549c6ebe98696449fa79d988a9f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TIME',
        name: 'chrono tech',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6531f133e6deebe7f2dce5a0441aa7ef330b4e53',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SODA',
        name: 'Soda Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7afb39837fd244a651e4f0c5660b4037214d4adf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MEME',
        name: 'Meme',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd5525d397898e5502075ea5e830d8914f6f0affe',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BGTT',
        name: 'Baguette Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7a545ed3863221a974f327199ac22f7f12535f11',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'QBX',
        name: 'qiibee',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2467aa6b5a2351416fd4c3def8462d841feeecec',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HT',
        name: 'Huobi Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6f259637dcd74c767781e37bc6133cd6a68aa161',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SOLVE',
        name: 'SOLVE',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x446c9033e7516d820cc9a2ce2d0b7328b579406f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GOLD',
        name: 'Dragonereum GOLD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x150b0b96933b75ce27af8b92441f8fb683bf9739',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VLD',
        name: 'Vetri',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x922ac473a3cc241fd3a0049ed14536452d58d73c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CACXT',
        name: 'Convertible ACXT',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe2b8c4938a3103c1ab5c19a6b93d07ab6f9da2ba',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HOLE',
        name: 'Super Black Hole',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x03fb52d4ee633ab0d06c833e32efdd8d388f3e6a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFKA',
        name: 'Yield Farming Known',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4086692d53262b2be0b13909d804f0491ff6ec3e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TKP',
        name: 'TOKPIE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd31695a1d35e489252ce57b129fd4b1b05e6acac',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TACO',
        name: 'Tacos',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x00d1793d7c3aae506257ba985b34c76aaf642557',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WOM',
        name: 'WOM Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0c61f671a73744c080ef5bc2a5daa534b6ecb302',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFOS',
        name: 'YFOS finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcd254568ebf88f088e40f456db9e17731243cb25',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CBIX7',
        name: 'CBI Index 7',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcf8f9555d55ce45a3a33a81d6ef99a2a2e71dee2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UFR',
        name: 'Upfiring',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xea097a2b1db00627b2fa17460ad260c016016977',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STRONG',
        name: 'Strong',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x990f341946a3fdb507ae7e52d17851b87168017c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TOMOE',
        name: 'TomoChain ERC 20',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x05d3606d5c81eb9b7b18530995ec9b29da05faba',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DGX',
        name: 'Digix Gold',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ALD',
        name: 'Aludra Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb339fca531367067e98d7c4f9303ffeadff7b881',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PNK',
        name: 'Kleros',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x93ed3fbe21207ec2e8f2d3c3de6e058cb73bc04d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: '2KEY',
        name: '2key network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe48972fcd82a274411c01834e2f031d4377fa2c0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PBTC',
        name: 'pTokens BTC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5228a22e72ccc52d415ecfd199f99d0665e7733b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VRA',
        name: 'Verasity',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdf1d6405df92d981a2fb3ce68f6a03bac6c0e41f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MYST',
        name: 'Mysterium',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4cf89ca06ad997bc732dc876ed2a7f26a9e7f361',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZDEX',
        name: 'Zeedex',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5150956e082c748ca837a5dfa0a7c10ca4697f9c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TEL',
        name: 'Telcoin',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x467bccd9d29f223bce8043b84e8c8b282827790f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'S4F',
        name: 'S4FE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaec7d1069e3a914a3eb50f0bfb1796751f2ce48a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SASHIMI',
        name: 'Sashimi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc28e27870558cf22add83540d2126da2e4b464c2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TEAM',
        name: 'Team Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb05af453011d7ad68a92b0065ffd9d1277ed2741',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RPL',
        name: 'Rocket Pool',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb4efd85c19999d84251304bda99e90b92300bd93',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PERL',
        name: 'Perlin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeca82185adce47f39c684352b0439f030f860318',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BCDT',
        name: 'BCdiploma EvidenZ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xacfa209fb73bf3dd5bbfb1101b9bc999c49062a5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SALE',
        name: 'DxSale Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf063fe1ab7a291c5d06a86e14730b00bf24cb589',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SOCKS',
        name: 'Unisocks',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x23b608675a2b2fb1890d3abbd85c5775c51691d5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JEX',
        name: 'Jex Token',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xff98a08c143311719ca492e4b8c950c940f26872',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PLAAS',
        name: 'PLAAS FARMERS TOKEN',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x60571e95e12c78cba5223042692908f0649435a5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UOS',
        name: 'Ultra',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd13c7342e1ef687c5ad21b27c2b65d772cab5c8c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRO',
        name: 'Crypto com Coin',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SHIT',
        name: 'ShitCoin',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaa7fb1c8ce6f18d4fd4aabb61a2193d4d441c54f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YTRUMP',
        name: 'YES Trump Augur Pre',
        decimals: 15,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3af375d9f77ddd4f16f86a5d51a9386b7b4493fa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BRX',
        name: 'BerryX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3a4a0d5b8dfacd651ee28ed4ffebf91500345489',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DFT',
        name: 'DeFiat',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb6ee603933e024d8d53dde3faa0bf98fe2a3d6f1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AZBI',
        name: 'AZBI CORE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x82f39cd08a942f344ca7e7034461cc88c2009199',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FTX',
        name: 'FintruX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd559f20296ff4895da39b5bd9add54b442596a61',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VRTN',
        name: 'VINYL RECORDS TOKEN',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x24e96809b4e720ea911bc3de8341400e26d6e994',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PARTY',
        name: 'MONEY PARTY',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x314bd765cab4774b2e547eb0aa15013e03ff74d2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RCKT',
        name: 'Rocket Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbd03bd923c7d51019fd84571d84e4ebcf7213509',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BZKY',
        name: 'Bizkey',
        decimals: 16,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd28cfec79db8d0a225767d06140aee280718ab7e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SOUL',
        name: 'Phantasma',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x79c75e2e8720b39e258f41c37cc4f309e0b0ff80',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XMM',
        name: 'Momentum',
        decimals: 10,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9a7a4c141a3bcce4a31e42c1192ac6add35069b4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STBZ',
        name: 'Stabilize',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb987d48ed8f2c468d52d6405624eadba5e76d723',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KCAL',
        name: 'Phantasma Energy',
        decimals: 10,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x14eb60f5f270b059b0c788de0ddc51da86f8a06d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PUX',
        name: 'PolypuX',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe277ac35f9d327a670c1a3f3eec80a83022431e4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XFI',
        name: 'Xfinance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5befbb272290dd5b8521d4a938f6c4757742c430',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HUNT',
        name: 'HUNT',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9aab071b4129b083b01cb5a0cb513ce7eca26fa5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YLAND',
        name: 'Yearn Land',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd0658324074d6249a51876438916f7c423075451',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XBR',
        name: 'BitDinero',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x86ad632c36425f0e0af2fcd6f55c160e10c04b26',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PPBLZ',
        name: 'Pepemon Pepeballs',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4d2ee5dae46c86da2ff521f7657dad98834f97b8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YESTRUMP',
        name: 'Dai If Trump Wins T',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5963fd7ca9b17b85768476019f81cb43d9d1818e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BLOC',
        name: 'Blockcloud',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6f919d67967a97ea36195a2346d9244e60fe0ddb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFILD',
        name: 'YFILEND FINANCE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcec2387e04f9815bf12670dbf6cf03bba26df25f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZUT',
        name: 'Zero Utility Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x83f873388cd14b83a9f47fabde3c9850b5c74548',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HGET',
        name: 'Hedget',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7968bc6a03017ea2de509aaa816f163db0f35148',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFPI',
        name: 'Yearn Finance Passi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x05d27cdd23e22ca63e7f9c7c6d1b79ede9c4fcf5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DOKI',
        name: 'Doki Doki Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9ceb84f92a0561fa3cc4132ab9c0b76a59787544',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LID',
        name: 'Liquidity Dividends',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0417912b3a7af768051765040a55bb0925d4ddcf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PICKLE',
        name: 'Pickle Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x429881672b9ae42b8eba0e26cd9c73711b891ca5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SMT',
        name: 'Summit Coin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7aa82ec1cbd3769d2ea55cd3b7957b786d0eff49',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RI',
        name: 'RI Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x37e808f084101f75783612407e7c3f5f92d8ee3f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFMS',
        name: 'YFMoonshot',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfef3bef71a5eb97e097039038776fd967ae5b106',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ALEND',
        name: 'Aave LEND',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7d2d3688df45ce7c552e19c27e007673da9204b8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GIM',
        name: 'Gimli',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xae4f56f072c34c0a65b3ae3e4db797d831439d93',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HATCH',
        name: 'Hatch DAO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6f3009663470475f0749a6b76195375f95495fcb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DXD',
        name: 'DXDao',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa1d65e8fb6e87b60feccbc582f7f97804b725521',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CVC',
        name: 'Civic',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x41e5560054824ea6b0732e656e3ad64e20e94e45',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AXI',
        name: 'Axioms',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x73ee6d7e6b203125add89320e9f343d65ec7c39a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XSGD',
        name: 'XSGD',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x70e8de73ce538da2beed35d14187f6959a8eca96',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SRM',
        name: 'Serum',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x476c5e26a75bd202a9683ffd34359c0cc15be0ff',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FCN',
        name: 'FreelancerChain',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x051aab38d46f6ebb551752831c7280b2b42164db',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFARM',
        name: 'YFARM Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf5d0fefaab749d8b14c27f0de60cc6e9e7f848d1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HXY',
        name: 'HXY Money',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf3a2ace8e48751c965ea0a1d064303aca53842b9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEGO',
        name: 'Dego Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x88ef27e69108b2633f8e1c184cc37940a075cc02',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YKZ',
        name: 'Yakuza DFO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x87047986e8e4961c11d2edcd94285e3a1331d97b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XSTAR',
        name: 'StarCurve',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc0e47007e084eef3ee58eb33d777b3b4ca98622f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BID',
        name: 'DeFi Bids',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1da01e84f3d4e6716f274c987ae4bee5dc3c8288',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNICRAP',
        name: 'UniCrapToken xyz',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x64c5572e7a100af9901c148d75d72c619a7f1e9d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZOM',
        name: 'Zoom Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1a231e75538a931c395785ef5d1a5581ec622b0e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SHROOM',
        name: 'Shroom Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xed0439eacf4c4965ae4613d77a5c2efe10e5f183',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KFC',
        name: 'Chicken',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe63684bcf2987892cefb4caa79bd21b34e98a291',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PJM',
        name: 'Pajama Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x61bc1f530ac6193d73af1e1a6a14cb44b9c3f915',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PMA',
        name: 'PumaPay',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x846c66cf71c43f80403b51fe3906b3599d63336f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YOK',
        name: 'YOKcoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x05fcc72cfb4150abae415c885f7a433ff523296f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TON',
        name: 'TONToken',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6a6c2ada3ce053561c2fbc3ee211f23d9b8c520a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YNK',
        name: 'Yoink',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x87c00817abe35ed4c093e59043fae488238d2f74',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'USDS',
        name: 'Stably Dollar',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa4bdb11dc0a2bec88d24a3aa1e6bb17201112ebe',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PYLON',
        name: 'Pylon Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd7b7d3c0bda57723fb54ab95fd8f9ea033af37f2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CAG',
        name: 'Change',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7d4b8cce0591c9044a22ee543533b72e976e36c3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WHALE',
        name: 'WHALE',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9355372396e3f6daf13359b7b607a3374cc638e0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IDEX',
        name: 'IDEX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb705268213d593b8fd88d3fdeff93aff5cbdcfae',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DZAR',
        name: 'Digital Rand',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9cb2f26a23b8d89973f08c957c4d7cdf75cd341c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COT',
        name: 'CoTrader',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5c872500c00565505f3624ab435c222e558e9ff8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DOTX',
        name: 'DeFi of Thrones',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfab5a05c933f1a2463e334e011992e897d56ef0a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWM',
        name: 'Swarm Fund',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3505f494c3f0fed0b594e01fa41dd3967645ca39',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BNSD',
        name: 'BNSD Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x668dbf100635f593a3847c0bdaf21f0a09380188',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RNDR',
        name: 'Render Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DAOFI',
        name: 'DAOFi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd82bb924a1707950903e2c0a619824024e254cd1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FRY',
        name: 'FoundryDAO Logistic',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6c972b70c533e2e045f333ee28b9ffb8d717be69',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GEO',
        name: 'GeoDB',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x147faf8de9d8d8daae129b187f0d02d819126750',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KICK',
        name: 'KickToken',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc12d1c73ee7dc3615ba4e37e4abfdbddfa38907e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SOLARITE',
        name: 'Solarite',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x930ed81ad809603baf727117385d01f04354612e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ETHBN',
        name: 'EtherBone',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x96b52b5bf8d902252d0714a1bd2651a785fd2660',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OCTO',
        name: 'OctoFi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7240ac91f01233baaf8b064248e80feaa5912ba3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MOST',
        name: 'Most Protocol',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x784561b89a160990f46de6db19571ca1b5f14bce',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FRM',
        name: 'Ferrum Network',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe5caef4af8780e59df925470b050fb23c43ca68c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AAC',
        name: 'Acute Angle Cloud',
        decimals: 5,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe75ad3aab14e4b0df8c5da4286608dabb21bd864',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AIRDROP',
        name: 'Airdrop Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xba7435a4b4c747e0101780073eeda872a69bdcd4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EMTR',
        name: 'Meter Stable mapped',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x29e9fdf5933824ad21bc6dbb8bf156efa3735e32',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NTK',
        name: 'Netkoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5d4d57cd06fa7fe99e26fdc481b468f77f05073c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SEAL',
        name: 'Seal Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x33c2da7fd5b125e629b3950f3c38d7f721d7b30d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TCH',
        name: 'TigerCash',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9b39a0b97319a9bd5fed217c1db7b030453bac91',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SCHA',
        name: 'Schain Wallet',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2cad4991f62fc6fcd8ec219f37e7de52b688b75a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFIII',
        name: 'Dify Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4be40bc9681d0a7c24a99b4c92f85b9053fc2a45',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ALEPH',
        name: 'Aleph im',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x27702a26126e0b3702af63ee09ac4d1a084ef628',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'X8X',
        name: 'X8X Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x910dfc18d6ea3d6a7124a6f8b5458f281060fa4c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BTRS',
        name: 'Bitball Treasure',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x73c9275c3a2dd84b5741fd59aebf102c91eb033f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GRAP',
        name: 'Grap Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc8d2ab2a6fdebc25432e54941cb85b55b9f152db',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RAUX',
        name: 'ErcauX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x68496ee825dafe1cf66d4083f776b9eaab31e447',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MX3',
        name: 'Mega',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x291fa2725d153bcc6c7e1c304bcad47fdef1ef84',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFV',
        name: 'YFValue',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x45f24baeef268bb6d63aee5129015d69702bcdfa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NOTRUMP',
        name: 'Dai If Trump Loses ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x40ce0a1d8f4999807b92ec266a025f071814b15d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AGA',
        name: 'AGA Token',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2d80f5f5328fdcb6eceb7cacf5dd8aedaec94e20',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEUS',
        name: 'DEUS Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3b62f3820e0b035cc4ad602dece6d796bc325325',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SFG',
        name: 'S Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8a6aca71a218301c7081d4e96d64292d3b275ce0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FXC',
        name: 'Flexacoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4a57e687b9126435a9b19e4a802113e266adebde',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GOF',
        name: 'Golff',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x488e0369f9bc5c40c002ea7c1fe4fd01a198801c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IPM',
        name: 'Timers',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8feef860e9fa9326ff9d7e0058f637be8579cc29',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DUO',
        name: 'DUO Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x56e0b2c7694e6e10391e870774daa45cf6583486',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TMV',
        name: 'Timvi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5abfd418adb35e89c68313574eb16bdffc15e607',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ETHPY',
        name: 'Etherpay',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x601938988f0fdd937373ea185c33751462b1d194',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LIEN',
        name: 'Lien',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xab37e1358b639fd877f015027bb62d3ddaa7557e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SNTR',
        name: 'Silent Notary',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2859021ee7f2cb10162e67f33af2d22764b31aff',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BLT',
        name: 'Bloom',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x107c4504cd79c5d2696ea0030a8dd4e92601b82e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MKCY',
        name: 'Markaccy',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf3281c539716a08c754ec4c8f2b4cee0fab64bb9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEXTF',
        name: 'DEXTF',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5f64ab1544d28732f0a24f4713c2c8ec0da089f0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CYTR',
        name: 'Cyclops Treasure',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbd05cee8741100010d8e93048a80ed77645ac7bf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XQC',
        name: 'Quras Token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x70da48f4b7e83c386ef983d4cef4e58c2c09d8ac',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FANTA',
        name: 'Fanta Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbf06035c31386d0d024895a97d0cc6ef6884854f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BEPRO',
        name: 'BetProtocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcf3c8be2e2c42331da80ef210e9b1b307c03d36a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'Z502',
        name: '502 Bad Gateway Tok',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2cd9324ba13b77554592d453e6364086fbba446a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SRN',
        name: 'Sirin Labs Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x68d57c9a1c35f63e2c83ee8e49a64e9d70528d25',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BTMX',
        name: 'Bitmax Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcca0c9c383076649604ee31b20248bc04fdf61ca',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TCAD',
        name: 'TrueCAD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x00000100f2a2bd000715001920eb70d229700085',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BREE',
        name: 'CBDAO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4639cd8cd52ec1cf2e496a606ce28d8afb1c792f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DIA',
        name: 'DIA',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x84ca8bc7997272c7cfb4d0cd3d55cd942b3c9419',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFRB',
        name: 'yfrb Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5d1b1019d0afa5e6cc047b9e78081d44cc579fc4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FUD',
        name: 'FUD finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2688213fedd489762a281a67ae4f2295d8e17ecc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HTN',
        name: 'Heart Number',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4b4b1d389d4f4e082b30f75c6319c0ce5acbd619',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KERMAN',
        name: 'KERMAN',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7841b2a48d1f6e78acec359fed6d874eb8a0f63c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'REBASE',
        name: 'Rebase',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4208d8d500b1643dca98dd27ba6c0060bca311c5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UBOMB',
        name: 'Unibomb',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x265ba42daf2d20f3f358a7361d9f69cb4e28f0e6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AUC',
        name: 'Auctus',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc12d099be31567add4e4e4d0d45691c3f58f5663',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TECN',
        name: 'Teccoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7dee371a788f9bd6c546df83f0d74fbe37cbf006',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KIRO',
        name: 'Kirobo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb1191f691a355b43542bea9b8847bc73e7abb137',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RTC',
        name: 'Read This Contract',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7f9a00e03c2e53a3af6031c17a150dbedaaab3dc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HOLY',
        name: 'Holyheld',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x39eae99e685906ff1c11a962a743440d0a1a6e09',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNII',
        name: 'UNII Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x825130aa1beef07bdf4f389705321816d05b0d0f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HOT',
        name: 'Holo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6c6ee5e31d828de241282b9606c8e98ea48526e2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SNTVT',
        name: 'Sentivate',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7865af71cf0b288b4e7f654f4f7851eb46a2b7f8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AAPL',
        name: ' AAPL',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x41efc0253ee7ea44400abb5f907fdbfdebc82bec',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COFI',
        name: 'CoFiX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1a23a6bfbadb59fa563008c0fb7cf96dfcf34ea1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TDEX',
        name: 'TradePower Dex',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc5e19fd321b9bc49b41d9a3a5ad71bcc21cc3c54',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PNT',
        name: 'pNetwork',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x89ab32156e46f46d02ade3fecbe5fc4243b9aaed',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZIPT',
        name: 'Zippie',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xedd7c94fd7b4971b916d15067bc454b9e1bad980',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STM',
        name: 'Streamity',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0e22734e078d6e399bcee40a549db591c4ea46cb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DCORE',
        name: 'Decore',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb944b46bbd4ccca90c962ef225e2804e46691ccf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LGO',
        name: 'LGO Token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0a50c93c762fdd6e56d86215c24aaad43ab629aa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FCBTC',
        name: 'FC Bitcoin',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4c6e796bbfe5eb37f9e3e0f66c009c8bf2a5f428',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OKB',
        name: 'OKB',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x75231f58b43240c9718dd58b4967c5114342a86c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RENBCH',
        name: 'renBCH',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x459086f2376525bdceba5bdda135e4e9d3fef5bf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HBTC',
        name: 'Huobi BTC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0316eb71485b0ab14103307bf65a021042c6d380',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WLEO',
        name: 'Wrapped LEO',
        decimals: 3,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x352c0f76cfd34ab3a2724ef67f46cf4d3f61192b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XCHF',
        name: 'CryptoFranc',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb4272071ecadd69d933adcd19ca99fe80664fc08',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ORBI',
        name: 'Orbicular',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x11a2ab94ade17e96197c78f9d5f057332a19a0b9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHAI',
        name: 'Chai',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x06af07097c9eeb7fd685c692751d5c66db49c215',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BLUE',
        name: 'Blue Protocol',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x539efe69bcdd21a83efd9122571a64cc25e0282b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BITTO',
        name: 'BITTO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x55a290f08bb4cae8dcf1ea5635a3fcfd4da60456',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SNGJ',
        name: 'Singular J',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x249f71f8d9da86c60f485e021b509a206667a079',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KASH',
        name: 'Kids Cash',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2c50ba1ed5e4574c1b613b044bd1876f0b0b87a9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GHST',
        name: 'Aavegotchi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3f382dbd960e3a9bbceae22651e88158d2791550',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CUTE',
        name: 'Blockchain Cuties U',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x047686fb287e7263a23873dea66b4501015a2226',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KRL',
        name: 'KRYLL',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x464ebe77c293e473b48cfe96ddcf88fcf7bfdac0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SPC',
        name: 'SpaceChain ERC 20 ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8069080a922834460c3a092fb2c1510224dc066b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MLN',
        name: 'Melon',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xec67005c4e498ec7f55e092bd1d35cbc47c91892',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STT',
        name: 'Scatter cx',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xac9bb427953ac7fddc562adca86cf42d988047fd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YAH',
        name: 'JamaiCoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc2856a8310af421a2a65de16428c2dec6ceacb36',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZOMBIE',
        name: 'Zombie Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd55bd2c12b30075b325bc35aef0b46363b3818f8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FFYI',
        name: 'Fiscus FYI',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xca76baa777d749de63ca044853d22d56bc70bb47',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SHRIMP',
        name: 'Shrimp Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x38c4102d11893351ced7ef187fcf43d33eb1abe6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CTT',
        name: 'CITEX Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x13c2b7f851e756415cf7d51d04dcf4f94a5b382e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LEO',
        name: 'LEO Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BIO',
        name: 'BioCrypt',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf18432ef894ef4b2a5726f933718f5a8cf9ff831',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STBU',
        name: 'Stobox Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x212dd60d4bf0da8372fe8116474602d429e5735f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MOON',
        name: 'MoonSwap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x68a3637ba6e75c0f66b61a42639c4e9fcd3d4824',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GOLDX',
        name: 'dForce GOLDx',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x355c665e101b9da58704a8fddb5feef210ef20c0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NYAN',
        name: 'Nyan Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc9ce70a381910d0a90b30d408cc9c7705ee882de',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BWF',
        name: 'Beowulf',
        decimals: 5,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf7e04d8a32229b4ca63aa51eea9979c7287fea48',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NOIA',
        name: 'NOIA Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa8c8cfb141a3bb59fea1e2ea6b79b5ecbcd7b6ca',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FIN',
        name: 'DeFiner',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x054f76beed60ab6dbeb23502178c52d6c5debe40',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IYF',
        name: 'IYF finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5d762f76b9e91f71cc4f94391bdfe6333db8519c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IXT',
        name: 'iXledger',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfca47962d45adfdfd1ab2d972315db4ce7ccf094',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PERX',
        name: 'PeerEx Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3c6ff50c9ec362efa359317009428d52115fe643',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JNTRE',
        name: 'JNTR e',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1368452bfb5cd127971c8de22c58fbe89d35a6bf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FET',
        name: 'Fetch ai',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaea46a60368a7bd060eec7df8cba43b7ef41ad85',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ACPT',
        name: 'Crypto Accept',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcad2d4c4469ff09ab24d02a63bcedfcd44be0645',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PIPT',
        name: 'Power Index Pool To',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb2b9335791346e94245dcd316a9c9ed486e6dd7f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FACT',
        name: 'Fee Active Collater',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x23aeff664c1b2bba98422a0399586e96cc8a1c92',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UFT',
        name: 'UniLend Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0202be363b8a4820f3f4de7faf5224ff05943ab1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XPR',
        name: 'Proton',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd7efb00d12c2c13131fd319336fdf952525da2af',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZAP',
        name: 'Zap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6781a0f84c7e9e846dcb84a9a5bd49333067b104',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LINA',
        name: 'Linear',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3e9bc21c9b189c09df3ef1b824798658d5011937',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFED',
        name: 'YFED Finance',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2dbd330bc9b7f3a822a9173ab52172bdddcace2a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DUCATO',
        name: 'Ducato Protocol Tok',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa117ea1c0c85cef648df2b6f40e50bb5475c228d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BACON',
        name: 'BaconSwap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x175ab41e2cedf3919b2e4426c19851223cf51046',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CPC',
        name: 'CPChain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfae4ee59cdd86e3be9e8b90b53aa866327d7c090',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFFS',
        name: 'YFFS Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x90d702f071d2af33032943137ad0ab4280705817',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DFS',
        name: 'Fantasy Sports',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcec38306558a31cdbb2a9d6285947c5b44a24f3e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NUTS',
        name: 'Squirrel Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x84294fc9710e1252d407d3d80a84bc39001bd4a8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XOR',
        name: 'Sora',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x40fd72257597aa14c7231a7b1aaa29fce868f677',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFIX',
        name: 'YFIX finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa4f779074850d320b5553c9db5fc6a8ab15bd34a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VSF',
        name: 'VeriSafe',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xac9ce326e95f51b5005e9fe1dd8085a01f18450c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UETL',
        name: 'Useless Eth Token L',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa5a283557653f36cf9aa0d5cc74b1e30422349f2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JNB',
        name: 'Jinbi Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x21d5a14e625d767ce6b7a167491c2d18e0785fda',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: '1MT',
        name: '1Million Token',
        decimals: 7,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf0bc1ae4ef7ffb126a8347d06ac6f8add770e1ce',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DMME',
        name: 'DMme',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9556f8ee795d991ff371f547162d5efb2769425f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNITS',
        name: 'Imperial',
        decimals: 5,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x25cef4fb106e76080e88135a0e4059276fa9be87',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ADAI',
        name: 'Aave DAI',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OM',
        name: 'MANTRA DAO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2baecdf43734f22fd5c152db08e3c27233f0c7d2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WALT',
        name: 'Walletreum',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x15bcdfad12498de8a922e62442ae4cc4bd33bd25',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ORN',
        name: 'Orion Protocol',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0258f474786ddfd37abce6df6bbb1dd5dfc4434a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZUM',
        name: 'ZUM TOKEN',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe0b9bcd54bf8a730ea5d3f1ffce0885e911a502c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TIME',
        name: 'TimeMiner',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa54c67bd320da4f9725a6f585b7635a0c09b122e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IFUND',
        name: 'Unifund',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x04b5e13000c6e9a3255dc057091f3e3eeee7b0f0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STOP',
        name: 'SatoPay',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8c3ee4f778e282b59d42d693a97b80b1ed80f4ee',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HIPPO',
        name: 'HippoFinance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x81313f7c5c9c824236c9e4cba3ac4b049986e756',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MINDS',
        name: 'Minds',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb26631c6dda06ad89b93c71400d25692de89c068',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KEY',
        name: 'Key',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4cd988afbad37289baaf53c13e98e2bd46aaea8c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NFT',
        name: 'NFT Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcb8d1260f9c92a3a545d409466280ffdd7af7042',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ALINK',
        name: 'Aave LINK',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa64bd6c70cb9051f6a9ba1f163fdc07e0dfb5f84',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZZZ',
        name: 'zzz finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc75f15ada581219c95485c578e124df3985e4ce0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DYT',
        name: 'DoYourTip',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x740623d2c797b7d8d1ecb98e9b4afcf99ec31e14',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VYA',
        name: 'VAYLA',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xecf51a98b71f0421151a1d45e033ab8b88665221',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LUA',
        name: 'Lua Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb1f66997a5760428d3a87d68b90bfe0ae64121cc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NKN',
        name: 'NKN',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5cf04716ba20127f1e2297addcf4b5035000c9eb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRZ',
        name: 'TRADEZ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x23935765cdf2f7548f86042ff053d16a22c4e240',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MTLX',
        name: 'Mettalex',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2e1e15c44ffe4df6a0cb7371cd00d5028e571d14',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MOONS',
        name: 'MoonTools',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x260e63d91fccc499606bae3fe945c4ed1cf56a56',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FOX',
        name: 'FOX Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FORS',
        name: 'Foresight',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb1ec548f296270bc96b8a1b3b3c8f3f04b494215',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PTF',
        name: 'PowerTrade Fuel',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc57d533c50bc22247d49a368880fb49a1caa39f7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BRAIN',
        name: 'Nobrainer Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xea3cb156745a8d281a5fc174186c976f2dd04c2e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFT',
        name: 'Yield Farming Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x26b3038a7fc10b36c426846a9086ef87328da702',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COIN',
        name: 'Coin Artist',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x87b008e57f640d94ee44fd893f0323af933f9195',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'POLS',
        name: 'Polkastarter',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x83e6f1e41cdd28eaceb20cb649155049fac3d5aa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AHF',
        name: 'AmericanHorror Fina',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd6d3608f2d770d0a8d0da62d7afe21ea1da86d9c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AC',
        name: 'ACoconut',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9a0aba393aac4dfbff4333b06c407458002c6183',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWAP',
        name: 'SWAPS NETWORK',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc958e9fb59724f8b0927426a8836f1158f0d03cf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MPH',
        name: 'Morpher',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6369c3dadfc00054a42ba8b2c09c48131dd4aa38',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SSL',
        name: 'Sergey Save Link',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0d9227f9c4ab3972f994fccc6eeba3213c0305c4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TKN',
        name: 'Monolith',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaaaf91d9b90df800df4f55c205fd6989c977e73a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DODO',
        name: 'DODO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'APIX',
        name: 'APIX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf51ebf9a26dbc02b13f8b3a9110dac47a4d62d78',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ANJ',
        name: 'Aragon Court',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcd62b1c403fa761baadfc74c525ce2b51780b184',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GRT',
        name: 'Golden Ratio Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb83cd8d39462b761bb0092437d38b37812dd80a2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FNT',
        name: 'Falcon Project',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdc5864ede28bd4405aa04d93e05a0531797d9d59',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNIUSD',
        name: 'UniDollar',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x256845e721c0c46d54e6afbd4fa3b52cb72353ea',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ISLA',
        name: 'Insula',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x697ef32b4a3f5a4c39de1cb7563f24ca7bfc5947',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KTON',
        name: 'Darwinia Commitment',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9f284e1337a815fe77d2ff4ae46544645b20c5ff',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FSW',
        name: 'Falconswap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfffffffff15abf397da76f1dcc1a1604f45126db',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WNRZ',
        name: 'WinPlay',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4690d8f53e0d367f5b68f7f571e6eb4b72d39ace',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: '3CS',
        name: 'CryptoCricketClub',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4f56221252d117f35e2f6ab937a3f77cad38934d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LIT',
        name: 'Lition',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x763fa6806e1acf68130d2d0f0df754c93cc546b2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WENB',
        name: 'WenBurn',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x46f4e420c75401494a39b70653f4bbb88ad2d728',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ANKR',
        name: 'Ankr',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8290333cef9e6d528dd5618fb97a76f268f3edd4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LAYER',
        name: 'UniLayer',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0ff6ffcfda92c53f615a4a75d982f399c989366b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHOP',
        name: 'Porkchop',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x646707246d7d5c2a86d7206f41ca8199ea9ced69',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BPTN',
        name: 'Bit Public Talent N',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6c22b815904165f3599f0a4a092d458966bd8024',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YBREE',
        name: 'Yield Breeder DAO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x11f4c6b3e8f50c50935c7889edc56c96f41b5399',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ABYSS',
        name: 'Abyss',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0e8d6b471e332f140e7d9dbb99e5e3822f728da6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CPAY',
        name: 'Cryptopay',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0ebb614204e47c09b6c3feb9aaecad8ee060e23e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JGN',
        name: 'Juggernaut',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x73374ea518de7addd4c2b624c0e8b113955ee041',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PGT',
        name: 'Polyient Games Gove',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeaccb6e0f24d66cf4aa6cbda33971b9231d332a1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RAIN',
        name: 'RAIN Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x61cdb66e56fad942a7b5ce3f419ffe9375e31075',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DIP',
        name: 'Etherisc DIP Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc719d010b63e5bbf2c0551872cd5316ed26acd83',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CARD',
        name: 'Cardstack',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x954b890704693af242613edef1b603825afcd708',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SMDX',
        name: 'SOMIDAX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7e8539d1e5cb91d63e46b8e188403b3f262a949b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OBEE',
        name: 'Obee Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3678d8cc9eb08875a3720f34c1c8d1e1b31f5a11',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DRC',
        name: 'Digital Reserve Cur',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa150db9b1fa65b44799d4dd949d922c0a33ee606',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NPXS',
        name: 'Pundi X',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa15c7ebe1f07caf6bff097d8a589fb8ac49ae5b3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NU',
        name: 'NuCypher',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4fe83213d56308330ec302a8bd641f1d0113a4cc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BUSD',
        name: 'Binance USD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BONK',
        name: 'BONK Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6d6506e6f438ede269877a0a720026559110b7d5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TNT',
        name: 'Tierion',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x08f5a9235b08173b7569f83645d2c7fb55e8ccd8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ROPE',
        name: 'Rope',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9d47894f8becb68b9cf3428d256311affe8b068b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COM',
        name: 'Community Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1b4052d98fb1888c2bf3b8d3b930e0aff8a910df',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ALBT',
        name: 'AllianceBlock',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x00a8b738e453ffd858a7edf03bccfe20412f0eb0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RARI',
        name: 'Rarible',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfca59cd816ab1ead66534d82bc21e7515ce441cf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PAYT',
        name: 'PayAccept',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8ef47555856f6ce2e0cd7c36aef4fab317d2e2e2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWAG',
        name: 'SWAG Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x87edffde3e14c7a66c9b9724747a1c5696b742e6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CREED',
        name: 'Creed Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x675e7d927af7e6d0082e0153dc3485b687a6f0ad',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AETH',
        name: 'Aave ETH',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3a3a65aab0dd2a17e3f1947ba16138cd37d08c04',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IUT',
        name: 'ITO Utility Token',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd36a0e7b741542208ae0fbb35453c893d0136625',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PSHP',
        name: 'Payship',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x88d59ba796fdf639ded3b5e720988d59fdb71eb8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NEXO',
        name: 'NEXO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb62132e35a6c13ee1ee0f84dc5d40bad8d815206',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MT',
        name: 'Monarch Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4442556a08a841227bef04c67a7ba7acf01b6fc8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HY',
        name: 'Hybrix',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9b53e429b0badd98ef7f01f03702986c516a5715',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GTH',
        name: 'Gather',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc3771d47e2ab5a519e2917e61e23078d0c05ed7f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFII',
        name: 'DFI money',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa1d0e215a23d7030842fc67ce582a6afa3ccab83',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ON',
        name: 'OFIN TOKEN',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3b4caaaf6f3ce5bee2871c89987cbd825ac30822',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MANY',
        name: 'MANY',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xab7aaf9e485a3bc885985184abe9fc6aba727bd6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XIOT',
        name: 'Xiotri',
        decimals: 3,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x31024a4c3e9aeeb256b825790f5cb7ac645e7cd5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ATMI',
        name: 'Atonomi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x97aeb5066e1a590e868b511457beb6fe99d329f5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PIXBY',
        name: 'PIXBY',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb53e08b97724126bda6d237b94f766c0b81c90fe',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ERC20',
        name: 'ERC20',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc3761eb917cd790b30dad99f6cc5b4ff93c4f9ea',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ETY',
        name: 'Ethereum Cloud',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5acd07353106306a6530ac4d49233271ec372963',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SXP',
        name: 'Swipe',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8ce9137d39326ad0cd6491fb5cc0cba0e089b6a9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OUSD',
        name: 'Onyx USD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd2d01dd6aa7a2f5228c7c17298905a7c7e1dfe81',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HTX',
        name: 'Hashtrust',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xedbcc06b603ea1f512720a4073a62cc4fdefcb86',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MBC',
        name: 'Marblecoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8888889213dd4da823ebdd1e235b09590633c150',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFIB',
        name: 'YFI Business',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x47632da9227e322eda59f9e7691eacc6430ac87c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SXAU',
        name: 'sXAU',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x261efcdd24cea98652b9700800a13dfbca4103ff',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'H3X',
        name: 'H3X',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x85eba557c06c348395fd49e35d860f58a4f7c95a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XYS',
        name: 'ANALYSX',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfa91f4177476633f100c59d336c0f2ffad414cba',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TEND',
        name: 'Tendies',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1453dbb8a29551ade11d89825ca812e05317eaeb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GEM',
        name: 'GemSwap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x90f62b96a62801488b151ff3c65eac5fae21a962',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PIE',
        name: 'DeFiPie',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x607c794cda77efb21f8848b7910ecf27451ae842',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HTRE',
        name: 'HodlTree',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdea67845a51e24461d5fed8084e69b426af3d5db',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFIEC',
        name: 'Yearn Finance Ecosy',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2e6e152d29053b6337e434bc9be17504170f8a5b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UTO',
        name: 'UniTopia Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1f8f123bf24849443a56ed9fc42b9265b7f3a39a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'METM',
        name: 'MetaMorph',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfef3884b603c33ef8ed4183346e093a173c94da6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COOM',
        name: 'CoomCoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2f3e054d233c93c59140c0905227c7c607c70cbb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KASSIAHOTEL',
        name: 'Atlas',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x06ff1a3b08b63e3b2f98a5124bfc22dc0ae654d3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YF4',
        name: 'Yearn4 Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x38acefad338b870373fb8c810fe705569e1c7225',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OIN',
        name: 'OIN Finance',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9aeb50f542050172359a0e1a25a9933bc8c01259',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GRID',
        name: 'Grid ',
        decimals: 12,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x12b19d3e2ccc14da04fae33e63652ce469b3f2fd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FTT',
        name: 'FreeTip',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x174bea2cb8b20646681e855196cf34fcecec2489',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FLL',
        name: 'Feellike',
        decimals: 3,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9235bda06b8807161b8fbb1e102cb654555b212f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YEA',
        name: 'YeaFinance',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x40b92fce37cefa03baf7603e7913c1d34dd1a4ec',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PAR',
        name: 'Parachute',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1beef31946fbbb40b877a72e4ae04a8d1a5cee06',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRAD',
        name: 'CryptoAds Marketpla',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x608f006b6813f97097372d0d31fb0f11d1ca3e4e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GBP',
        name: 'Good Boy Points',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0cf58006b2400ebec3eb8c05b73170138a340563',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DICE',
        name: 'Etheroll',
        decimals: 16,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2e071d2966aa7d8decb1005885ba1977d6038a65',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OSPVS',
        name: 'Onyx S P 500 Short',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf7d1f35518950e78c18e5a442097ca07962f4d8a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BART',
        name: 'BarterTrade',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x54c9ea2e9c9e8ed865db4a4ce6711c2a0d5063ba',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SNOV',
        name: 'Snovian Space',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbdc5bac39dbe132b1e030e898ae3830017d7d969',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CMS',
        name: 'COMSA',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf83301c5cd1ccbb86f466a6b3c53316ed2f8465a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VGTN',
        name: 'VideoGamesToken',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb52fc0f17df38ad76f290467aab57cabaeeada14',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HEGIC',
        name: 'Hegic',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x584bc13c7d411c00c01a62e8019472de68768430',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HUE',
        name: 'Hue',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdcfe18bc46f5a0cd0d3af0c2155d2bcb5ade2fc5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FORCER',
        name: 'Forcer',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc1fb6c015fc535abd331d3029de76a62e412fb23',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFBT',
        name: 'Yearn Finance Bit',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf0a0f3a6fa6bed75345171a5ea18abcadf6453ba',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LOCK',
        name: 'Meridian Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x95172ccbe8344fecd73d0a30f54123652981bd6f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XYO',
        name: 'XYO Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x55296f69f40ea6d20e478533c15a6b08b654e758',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWRV',
        name: 'Swerve',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb8baa0e4287890a5f79863ab62b7f175cecbd433',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DAWN',
        name: 'Dawn Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x580c8520deda0a441522aeae0f9f7a5f29629afa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRYPL',
        name: 'Cryptolandy',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1062fdf250b44697216d07e41df93824519f47aa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BIGO',
        name: 'BIGOCOIN',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa6e7dc135bdf4b3fee7183eab2e87c0bb9684783',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DKA',
        name: 'dKargo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5dc60c4d5e75d22588fa17ffeb90a63e535efce0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BIKI',
        name: 'BIKI',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x70debcdab2ef20be3d1dbff6a845e9ccb6e46930',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VNDC',
        name: 'VNDC',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1f3f677ecc58f6a1f9e2cf410df4776a8546b5de',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EVED',
        name: 'Evedo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5aaefe84e0fb3dd1f0fcff6fa7468124986b91bd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GIV',
        name: 'GIV Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf6537fe0df7f0cc0985cf00792cc98249e73efa0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STMX',
        name: 'StormX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbe9375c6a420d2eeb258962efb95551a5b722803',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YNEF',
        name: 'Ynef Coin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1dae0680f6b8059c8945de6a8a93009e054417b4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TLN',
        name: 'Trustlines Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x679131f591b4f369acb8cd8c51e68596806c3916',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DSD',
        name: 'DeFi Nation Signals',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1e3a2446c729d34373b87fd2c9cbb39a93198658',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CMRA',
        name: 'Chimera',
        decimals: 3,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x37737ad7e32ed440c312910cfc4a2e4d52867caf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RDAI',
        name: 'rDAI',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x261b45d85ccfeabb11f022eba346ee8d1cd488c0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WRLD',
        name: 'TheWorldsAMine',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb2cf3a438acf46275839a38db7594065f64151d3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COMBO',
        name: 'Combo',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf10d9664828e80eea2f8bf139c3cc6041ae0cba0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZPAE',
        name: 'ZelaaPayAE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x045eb7e34e94b28c7a3641bc5e1a1f61f225af9f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRU',
        name: 'Crypto Unit Token',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfbc1473e245b8afbba3b46116e0b01f91a026633',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PLBT',
        name: 'Polybius',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0affa06e7fbe5bc9a764c979aa66e8256a631f02',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PGOLD',
        name: 'Pyrrhos Gold Token',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf02dab52205aff6bb3d47cc7b21624a5064f9fba',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SS',
        name: 'Sharder protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbbff862d906e348e9946bfb2132ecb157da3d4b4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ALIS',
        name: 'ALIS',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xea610b1153477720748dc13ed378003941d84fab',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PAN',
        name: 'Pantos',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x536381a8628dbcc8c70ac9a30a7258442eab4c92',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FOUR',
        name: '4thpillar technolog',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4730fb1463a6f1f44aeb45f6c5c422427f37f4d0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FIRE',
        name: 'FIRE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3f8a2f7bcd70e7f7bdd3fbb079c11d073588dea2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EQMT',
        name: 'Equus Mining Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa462d0e6bb788c7807b1b1c96992ce1f7069e195',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MFTU',
        name: 'Mainstream For The ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x05d412ce18f24040bb3fa45cf2c69e506586d8e8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CBR',
        name: 'Cybercoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4ba012f6e411a1be55b98e9e62c3a4ceb16ec88b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ELEC',
        name: 'Electrify Asia',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd49ff13661451313ca1553fd6954bd1d9b6e02b9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JREX',
        name: 'Jurasaur',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x638155f4bd8f85d401da32498d8866ee39a150b8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CWBTC',
        name: 'cWBTC',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PASTA',
        name: 'Spaghetti',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe54f9e6ab80ebc28515af8b8233c1aee6506a15e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'T1C',
        name: 'Travel1Click',
        decimals: 16,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa7c71d444bf9af4bfed2ade75595d7512eb4dd39',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YSR',
        name: 'Ystar',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd9a947789974bad9be77e45c2b327174a9c59d71',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ESWA',
        name: 'EasySwap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa0471cdd5c0dc2614535fd7505b17a651a8f0dab',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GET',
        name: 'GET Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8a854288a5976036a725879164ca3e91d30c6a1b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BBC',
        name: 'Blue Baikal',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x675ce995953136814cb05aaaa5d02327e7dc8c93',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LQD',
        name: 'Liquidity Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd29f0b5b3f50b07fe9a9511f7d86f4f4bac3f8c4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STEEL',
        name: 'Hands of Steel',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6f022e991ea21d26f85f6716c088e2864101dfec',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UCM',
        name: 'UCROWDME',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x722f97a435278b7383a1e3c47f41773bebf3232c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YMPL',
        name: 'YMPL',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb7ba8461664de526a3ae44189727dfc768625902',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AER',
        name: 'Aeryus',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xac4d22e40bf0b8ef4750a99ed4e935b99a42685e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WED',
        name: 'Wednesday Coin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7848ae8f19671dc05966dafbefbbbb0308bdfabd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IMS',
        name: 'IMSWallet',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3c4030839708a20fd2fb379cf11810dde4888d93',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IDRT',
        name: 'Rupiah Token',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x998ffe1e43facffb941dc337dd0468d52ba5b48a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EOST',
        name: 'EOS TRUST',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x87210f1d3422ba75b6c40c63c78d79324dabcd55',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BLAM',
        name: 'Blam Chain',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd80ccb84916e5622628714df75377523e49d8dfd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: '1WO',
        name: '1World',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfdbc1adc26f0f8f8606a5d63b7d3a3cd21c22b23',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ULT',
        name: 'Shardus',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x09617f6fd6cf8a71278ec86e23bbab29c04353a7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LBURST',
        name: 'LoanBurst',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x93ecd2ecdfb91ab2fee28a8779a6adfe2851cda6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YO',
        name: 'Yobit Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xebf4ca5319f406602eeff68da16261f1216011b5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UGC',
        name: 'ugChain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf485c5e679238f9304d986bb2fc28fe3379200e5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BMX',
        name: 'BitMart Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x986ee2b944c42d017f52af21c4c69b84dbea35d8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UWTC',
        name: 'UP Wallet',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x282cb0a611280ff5887ca122911a0ca6b841cb03',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BOX',
        name: 'BOX Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe1a178b681bd05964d3e3ed33ae731577d9d96dd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'USE',
        name: 'Usechain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd9485499499d66b175cf5ed54c0a19f1a6bcb61a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FSXA',
        name: 'FlashX Advance',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf0b0a13d908253d954ba031a425dfd54f94a2e3d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VIBS',
        name: 'Vibz8',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x53db6b7fee89383435e424764a8478acda4dd2cd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZOM',
        name: 'ZOM',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x42382f39e7c9f1add5fa5f0c6e24aa62f50be3b3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PAN',
        name: 'Panvala Pan',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd56dac73a4d6766464b38ec6d91eb45ce7457c44',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NANJ',
        name: 'NANJCOIN',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xffe02ee4c69edf1b340fcad64fbd6b37a7b9e265',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JAMM',
        name: 'FlynnJamm',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x56687cf29ac9751ce2a4e764680b6ad7e668942e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TSHP',
        name: '12Ships',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x525794473f7ab5715c81d06d10f52d11cc052804',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BEE',
        name: 'BEE Coin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1763ad73694d4d64fb71732b068e32ac72a345b1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BOXX',
        name: 'Blockparty',
        decimals: 15,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x780116d91e5592e58a3b3c76a351571b39abcec6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFR',
        name: 'YouForia',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd6940a1ffd9f3b025d1f1055abcfd9f7cda81ef9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SPAZ',
        name: 'SwapCoinz',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x810908b285f85af668f6348cd8b26d76b3ec12e1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MATH',
        name: 'MATH',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x08d967bb0134f2d07f7cfb6e246680c53927dd30',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AIDOC',
        name: 'AI Doctor',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x584b44853680ee34a0f337b712a8f66d816df151',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRND',
        name: 'Trendering',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc3dd23a0a854b4f9ae80670f528094e9eb607ccb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OMX',
        name: 'Project SHIVOM',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb5dbc6d3cf380079df3b27135664b6bcf45d1869',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AVT',
        name: 'Aventus',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0d88ed6e74bbfd96b831231638b66c05571e824f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRYB',
        name: 'BiLira',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2c537e5624e4af88a7ae4060c022609376c8d0eb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TBTC',
        name: 'tBTC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8daebade922df735c38c80c7ebd708af50815faa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PYRO',
        name: 'PYRO Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x14409b0fc5c7f87b5dad20754fe22d29a3de8217',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FREE',
        name: 'FREE coin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2f141ce366a2462f02cea3d12cf93e4dca49e4fd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VETH',
        name: 'Vether',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4ba6ddd7b89ed838fed25d208d4f644106e34279',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BNS',
        name: 'BNS Token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x695106ad73f506f9d0a9650a78019a93149ae07c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZEB',
        name: 'Zeb Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xee98a5c3fd8c9063c5d8777758d3901a88df957b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SXRP',
        name: 'sXRP',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa2b0fde6d710e201d0d608e924a484d1a5fed57c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COL',
        name: 'Unit Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc76fb75950536d98fa62ea968e1d6b45ffea2a55',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VXV',
        name: 'Vectorspace AI',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7d29a64504629172a429e64183d6673b9dacbfce',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COTR',
        name: 'Cotrace',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x40428fdd5588197c15dd00b22fe9b9a48afeeb23',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DCX',
        name: 'DecenTradex',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x199c3ddedb0e91db3897039af27c23286269f088',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ETHMNY',
        name: 'Ethereum Money',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbf4a2ddaa16148a9d0fa2093ffac450adb7cd4aa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MSV',
        name: 'Marvrodi Salute Vis',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3d3ab800d105fbd2f97102675a412da3dc934357',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AIRX',
        name: 'Aircoins',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8cb1d155a5a1d5d667611b7710920fd9d1cd727f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'USDX',
        name: 'USDx Stablecoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeb269732ab75a6fd61ea60b06fe994cd32a83549',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'COIN',
        name: 'Coin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeb547ed1d8a3ff1461abaa7f0022fed4836e00a4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PON',
        name: 'Proof of Nature Tok',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x19ddc3605052554a1ac2b174ae745c911456841f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DIO',
        name: 'Decimated',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x35a5cb585d51d836922b78a9bb1f5c04635c39b6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFI2',
        name: 'YEARN2 FINANCE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf6c151ea50a4f1a50983eb98998a18be0a549ad5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BTSE',
        name: 'BTSE Token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x666d875c600aa06ac1cf15641361dec3b00432ef',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ATIS',
        name: 'Atlantis Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x821144518dfe9e7b44fcf4d0824e15e8390d4637',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HTX',
        name: 'Huptex',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x38a0df9a08d18dc06cd91fc7ec94a0acdf28d994',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BDAI',
        name: 'bDAI',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6a4ffaafa8dd400676df8076ad6c724867b0e2e8',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MOD',
        name: 'Modum',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x957c30ab0426e0c93cd8241e2c60392d08c6ac8e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SEED',
        name: 'Seed Venture',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc969e16e63ff31ad4bcac3095c616644e6912d79',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CCH',
        name: 'Coinchase Token',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x40adfc7c23c22cc06f94f199a4750d7196f46fbe',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CUR',
        name: 'Curio',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x13339fd07934cd674269726edf3b5ccee9dd93de',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PROPS',
        name: 'Props Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6fe56c0bcdd471359019fcbc48863d6c3e9d4f41',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'WAIF',
        name: 'Waifu Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb2279b6769cfba691416f00609b16244c0cf4b20',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ASKO',
        name: 'Askobar Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeeee2a622330e6d2036691e983dee87330588603',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XFT',
        name: 'Offshift',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xabe580e7ee158da464b51ee1a83ac0289622e6be',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SGT',
        name: 'snglsDAO Governance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc4199fb6ffdb30a829614beca030f9042f1c3992',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DDTG',
        name: 'Davecoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x56cdbbeec9828962cecb3f1b69517d430295d952',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RTK',
        name: 'Ruletka',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1f6deadcb526c4710cf941872b86dcdfbbbd9211',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ANTS',
        name: 'FireAnts',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa9fbb83a2689f4ff86339a4b96874d718673b627',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ECA',
        name: 'European Coin Allia',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfab25d4469444f28023075db5932497d70094601',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LGCY',
        name: 'LGCY Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xae697f994fc5ebc000f8e22ebffee04612f98a0d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CRDT',
        name: 'CRDT',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdaab5e695bb0e8ce8384ee56ba38fa8290618e52',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KIWI',
        name: 'KIWI Token',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2bf91c18cd4ae9c2f2858ef9fe518180f7b5096d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWFL',
        name: 'Swapfolio',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xba21ef4c9f433ede00badefcc2754b8e74bd538a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'USD++',
        name: 'PieDAO USD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9a48bd0ec040ea4f1d3147c025cd4076a2e71e3e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DETS',
        name: 'Dextrust',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd379700999f4805ce80aa32db46a94df64561108',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UFC',
        name: 'Union Fair Coin',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x995de3d961b40ec6cdee0009059d48768ccbdd48',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GRAPH',
        name: 'UniGraph',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x165440036ce972c5f8ebef667086707e48b2623e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CREDIT',
        name: 'PROXI DeFi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc4cb5793bd58bad06bf51fb37717b86b02cbe8a4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWFTC',
        name: 'SWFT Blockchain',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0bb217e40f8a5cb79adf04e1aab60e5abd0dfc1e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HDAO',
        name: 'HyperDAO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x74faab6986560fd1140508e4266d8a7b87274ffd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ACED',
        name: 'Aced',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4b3a0c6d668b43f3f07904e124328659b90bb4ca',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SHIP',
        name: 'ShipChain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe25b0bba01dc5630312b6a21927e578061a13f55',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PKG',
        name: 'PKG Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x02f2d4a04e6e01ace88bd2cd632875543b2ef577',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GRG',
        name: 'RigoBlock',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4fbb350052bca5417566f188eb2ebce5b19bc964',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FLIXX',
        name: 'Flixxo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf04a8ac553fcedb5ba99a64799155826c136b0be',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XAUT',
        name: 'Tether Gold',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4922a015c4407f87432b179bb209e125432e4a2a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BONE',
        name: 'Bone',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5c84bc60a796534bfec3439af0e6db616a966335',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JNT',
        name: 'Jibrel Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa5fd1a791c4dfcaacc963d4f73c6ae5824149ea7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BTC++',
        name: 'PieDAO BTC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0327112423f3a68efdf1fcf402f6c5cb9f7c33fd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XTK',
        name: 'Xtake',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbff0e42eec4223fbd12260f47f3348d29876db42',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ARCONA',
        name: 'Arcona',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0f71b8de197a1c84d31de0f1fa7926c365f052b3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'JT',
        name: 'Jubi Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeb7355c2f217b3485a591332fe13c8c5a76a581d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BURN',
        name: 'BlockBurn',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8515cd0f00ad81996d24b9a9c35121a3b759d6cd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EBX',
        name: 'Ebliex',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc0a07eafb93acf9e897f787c79a9657e8e07d65c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CUB',
        name: 'Crypto User Base',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa8892bfc33fa44053a9e402b1839966f4fec74a4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OSPV',
        name: 'Onyx S P 500',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfcce9526e030f1691966d5a651f5ebe1a5b4c8e4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VGTG',
        name: 'VGTGToken',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe61eecfdba2ad1669cee138f1919d08ced070b83',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NEXE',
        name: 'Nexeum Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd9f7deaeb3450cd698fd6d45a7b05a18d84bb1e1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: '69C',
        name: '6ix9ine Chain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x02fdd6866333d8cd8b1ca022d382080698060bc2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CID',
        name: 'Cryptid',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4599836c212cd988eaccc54c820ee9261cdaac71',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DAY',
        name: 'Chronologic',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe814aee960a85208c3db542c53e7d4a6c8d5f60f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LMY',
        name: 'Lunch Money',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x66fd97a78d8854fec445cd1c80a07896b0b4851f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEFL',
        name: 'Deflacoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4ec2efb9cbd374786a03261e46ffce1a67756f3b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZEST',
        name: 'Zest Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x757703bd5b2c4bbcfde0be2c0b0e7c2f31fcf4e9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FUZE',
        name: 'FUZE Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x187d1018e8ef879be4194d6ed7590987463ead85',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LDEX',
        name: 'LogicDEX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb1d22dffb6c9bf70544116b3ce784454cf383577',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FBC',
        name: 'FightBackCoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xac9749c854b31bba3b3e71b30fdd7aea4fcc0db9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IETH',
        name: 'iETH',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa9859874e1743a32409f75bb11549892138bba1e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BLZN',
        name: 'Blaze Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x70efdc485a10210b056ef8e0a32993bc6529995e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TVT',
        name: 'TVT',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x98e0438d3ee1404fea48e38e92853bb08cfa68bd',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PTC',
        name: 'PropertyCoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x27e627d032593fe2a8ebbb30f3b1264b3b51a707',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PMC',
        name: 'Primebank Coin',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x767588059265d2a243445dd3f23db37b96018dd5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PRDX',
        name: 'Predix Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x556148562d5ddeb72545d7ec4b3ec8edc8f55ba7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LBA',
        name: 'LibraToken',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xfe5f141bf94fe84bc28ded0ab966c16b17490657',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SETH',
        name: 'sETH',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PDC',
        name: 'PLATINUM DIGITAL CO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xaf0336137c2f68e881cea7d95059e6b2ddcf7e57',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AT',
        name: 'Artfinity Token',
        decimals: 5,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe54b3458c47e44c37a267e7c633afef88287c294',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CXO',
        name: 'CargoX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb6ee9668771a79be7967ee29a63d4184f8097143',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VI',
        name: 'Vid',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd321ca7cd7a233483b8cd5a11a89e9337e70df84',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MXX',
        name: 'Multiplier',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x8a6f3bf52a26a21531514e23016eeae8ba7e7018',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BRD',
        name: 'Bread',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x558ec3152e2eb2174905cd19aea4e34a23de9ad6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEC',
        name: 'Decentr',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x30f271c9e86d2b7d00a6376cd96a1cfbd5f0b9b3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'INXT',
        name: 'Internxt',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa8006c4ca56f24d6836727d106349320db7fef82',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BOA',
        name: 'BOA',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf9c36c7ad7fa0f0862589c919830268d1a2581a1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NCT',
        name: 'PolySwarm',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9e46a38f5daabe8683e10793b06749eef7d733d1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'USDA',
        name: 'USDA',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3c7b464376db7c9927930cf50eefdea2eff3a66a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ETHV',
        name: 'Ethverse',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xeeeeeeeee2af8d0e1940679860398308e0ef24d6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZMN',
        name: 'ZMINE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x554ffc77f4251a9fb3c0e3590a6a205f8d4e067d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AFDLT',
        name: 'AfroDex Labs Token',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd8a8843b0a5aba6b030e92b3f4d669fad8a5be50',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFFI',
        name: 'yffi finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcee1d3c3a02267e37e6b373060f79d5d7b9e1669',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNI',
        name: 'Unipot',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3e370a6c8255b065bd42bc0ac9255b269cfcc172',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HILK',
        name: 'HilkCoin',
        decimals: 16,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9d54f8f50424b3b40055cf1261924e4c5a34e562',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MORK',
        name: 'MORK',
        decimals: 4,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf552b656022c218c26dad43ad88881fc04116f76',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFIVE',
        name: 'YFIVE FINANCE',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd3e8695d2bef061eab38b5ef526c0f714108119c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MUM',
        name: 'Maxum',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc9634da9b1eefd1cb3d88b598a91ec69e5afe4e4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BGF',
        name: 'Biograffi',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa8daa52ded91f7c82b4bb02b4b87c6a841db1fd5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SETH',
        name: 'Sether',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x78b039921e84e726eb72e7b1212bb35504c645ca',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AETH',
        name: 'AnarchETH',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x658bbe318260ab879af701043b18f7e8c4daf448',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VYBE',
        name: 'Vybe',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3a1c1d1c06be03cddc4d3332f7c20e1b37c97ce9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CLL',
        name: 'Attention Mining',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3dc9a42fa7afe57be03c58fd7f4411b1e466c508',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LIT',
        name: 'LITonium',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2e3c062e16c1a3a04ddc5003c62e294305d83684',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FGP',
        name: 'FingerPrint',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd9a8cfe21c232d485065cb62a96866799d4645f7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CURA',
        name: 'CuraDAI',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0a4b2d4b48a63088e0897a3f147ba37f81a27722',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'QCH',
        name: 'QChi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x687bfc3e73f6af55f0ccca8450114d107e781a0e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'THKD',
        name: 'TrueHKD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0000852600ceb001e08e00bc008be620d60031f2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SUKU',
        name: 'SUKU',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0763fdccf1ae541a5961815c0872a8c5bc6de4d7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRUST',
        name: 'TrustDAO',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x57700244b20f84799a31c6c96dadff373ca9d6c5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FAZR',
        name: 'Fazer',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6e4d93efc2beac20992197278ad41f8d10b3efaa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GEEQ',
        name: 'GEEQ',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6b9f031d718dded0d681c20cb754f97b3bb81b78',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LZR',
        name: 'LaserCoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3453769b660b7ee4261aaa043479aa3ca02243bf',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EBET',
        name: 'EthBet',
        decimals: 2,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7d5edcd23daa3fb94317d32ae253ee1af08ba14d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ONG',
        name: 'SoMee Social',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd341d1680eeee3255b8c4c75bcce7eb57f144dae',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PRIVATE',
        name: 'Buccaneer',
        decimals: 3,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x17540494ad5e39aefd49901774528e9ff17fe40b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PLM',
        name: 'Palmes',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x80d211718f9b9ba31959a14328acd8d8c9d5382f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EDO',
        name: 'Eidoo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xced4e93198734ddaff8492d525bd258d49eb388e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GEAR',
        name: 'Bitgear',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1b980e05943de3db3a459c72325338d327b6f5a9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'GRO',
        name: 'GROWTH DeFi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x09e64c2b61a5f1690ee6fbed9baf5d6990f8dfd0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TIEN',
        name: 'TiEN Blockchain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x67a1ca08e580af9f54dc9b03fd59ec2388ad7c6c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'REB',
        name: 'Rebased',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xe6279e1c65dd41b30ba3760dcac3cd8bbb4420d6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TTT',
        name: 'Tapcoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9f599410d207f3d2828a8712e5e543ac2e040382',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XDT',
        name: 'XWC Dice Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5f9d86fa0454ffd6a59ccc485e689b0a832313db',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SALT',
        name: 'SALT',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4156d3342d5c385a87d264f90653733592000581',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ATL',
        name: 'Atlant',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x78b7fada55a64dd895d8c8c35779dd8b67fa8a05',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRXC',
        name: 'TronClassic',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xad5fe5b0b8ec8ff4565204990e4405b2da117d8e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CYFM',
        name: 'CyberFM',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x32b87fb81674aa79214e51ae42d571136e29d385',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'VLT',
        name: 'Bankroll Vault',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6b785a0322126826d8226d77e173d75dafb84d11',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'AGS',
        name: 'Aegis',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdb2f2bcce3efa95eda95a233af45f3e0d4f00e2a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZXC',
        name: '0xcert',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x83e2be8d114f9661221384b3a50d24b96a5653f5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FRNK',
        name: 'Frinkcoin',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf938c9a22c6fc9e6b81b24b68db94b92dc4a7976',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BOT',
        name: 'Bounce Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5beabaebb3146685dd74176f68a0721f91297d37',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DUSD',
        name: 'DefiDollar',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5bc25f649fc4e26069ddf4cf4010f9f706c23831',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KGW',
        name: 'KAWANGGAWA',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x55eb5288c9b65037a4cd2289637f38a4f9db3a6b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MXT',
        name: 'MixTrust',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6251e725cd45fb1af99354035a414a2c0890b929',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RSV',
        name: 'Reserve',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x196f4727526ea7fb1e17b2071b3d8eaa38486988',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CLOUT',
        name: 'BLOCKCLOUT',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa10ae543db5d967a73e9abcc69c81a18a7fc0a78',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MET',
        name: 'Metronome',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa3d58c4e56fedcae3a7c43a725aee9a71f0ece4e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRUSD',
        name: 'TrustUSD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xdd436a0dce9244b36599ae7b22f0373b4e33992d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FSP',
        name: 'FlashSwap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0128e4fccf5ef86b030b28f0a8a029a3c5397a94',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNIFI',
        name: 'UNIFI DeFi',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0ef3b2024ae079e6dbc2b37435ce30d2731f0101',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'QKC',
        name: 'QuarkChain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xea26c4ac16d4a5a106820bc8aee85fd0b7b2b664',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CUSDT',
        name: 'cUSDT',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'EDI',
        name: 'Freight Trust Netwo',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x79c5a1ae586322a07bfb60be36e1b31ce8c84a1e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OCN',
        name: 'Odyssey',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4092678e4e78230f46a1534c0fbc8fa39780892b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'QSP',
        name: 'Quantstamp',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x99ea4db9ee77acd40b119bd1dc4e33e1c070b80d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ASUSD',
        name: 'Aave SUSD',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x625ae63000f46200499120b906716420bd059240',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MYX',
        name: 'MYX Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2129ff6000b95a973236020bcd2b2006b0d8e019',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SKYFT',
        name: 'SKYFchain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5dd0815a4cf119ad91ba045bbbf879f3f7de3c68',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SBTC',
        name: 'Soft Bitcoin',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x309013d55fb0e8c17363bcc79f25d92f711a5802',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TRST',
        name: 'WeTrust',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcb94be6f13a1182e4a4b6140cb7bf2025d28e41b',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'IMBTC',
        name: 'The Tokenized Bitco',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3212b29e33587a00fb1c83346f5dbfa69a458923',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CORN',
        name: 'Popcorn Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3080ec2a6960432f179c66d388099a48e82e2047',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ZCN',
        name: '0chain',
        decimals: 10,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb9ef770b6a5e12e45983c5d80545258aa38f3b78',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SLINK',
        name: 'Soft Link',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x10bae51262490b4f4af41e12ed52a0e744c1137a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FERA',
        name: 'Fera',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x539f3615c1dbafa0d008d87504667458acbd16fa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HEX',
        name: 'HEX',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SVB',
        name: 'Sendvibe',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3408b204d67ba2dbca13b9c50e8a45701d8a1ca6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KEN',
        name: 'Keysians Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6a7ef4998eb9d0f706238756949f311a59e05745',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'INFT',
        name: 'Infinito',
        decimals: 6,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x83d60e7aed59c6829fb251229061a55f35432c4d',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'TOB',
        name: 'Tokens of Babel',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x7777770f8a6632ff043c8833310e245eba9209e6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DMST',
        name: 'DMScript',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf29992d7b589a0a6bd2de7be29a97a6eb73eaf85',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FLOW',
        name: 'Flow Protocol',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xc6e64729931f60d2c8bc70a27d66d9e0c28d1bf9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HXRO',
        name: 'Hxro',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4bd70556ae3f8a6ec6c4080a0c327b24325438f3',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFP',
        name: 'Yearn Finance Proto',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x96d62cdcd1cc49cb6ee99c867cb8812bea86b9fa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XAMP',
        name: 'Antiample',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf911a7ec46a2c6fa49193212fe4a2a9b95851c27',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RUG',
        name: 'Rug',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xd0df3b1cf729a29b7404c40d61c750008e631ba7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: '1UP',
        name: 'Uptrennd',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x07597255910a51509ca469568b048f2597e72504',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MXC',
        name: 'MXC',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5ca381bbfb58f0092df149bd3d243b08b9a8386e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BEST',
        name: 'Bitpanda Ecosystem ',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1b073382e63411e3bcffe90ac1b9a43fefa1ec6f',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YFL',
        name: 'YF Link',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x28cb7e841ee97947a86b06fa4090c8451f64c0be',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PERP',
        name: 'Perpetual Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xbc396689893d065f41bc2c6ecbee5e0085233447',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CEEK',
        name: 'CEEK Smart VR Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb056c38f6b7dc4064367403e26424cd2c60655e1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ASTRO',
        name: 'AstroTools',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcbd55d4ffc43467142761a764763652b48b969ff',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DGMT',
        name: 'DigiMax',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0d4b4da5fb1a7d55e85f8e22f728701ceb6e44c9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNC',
        name: 'UniCrypt',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf29e46887ffae92f1ff87dfe39713875da541373',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ARPA',
        name: 'ARPA Chain',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xba50933c268f567bdc86e1ac131be072c6b0b71a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'UNT',
        name: 'Unimonitor',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x6dddf4111ad997a8c7be9b2e502aa476bf1f4251',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NEST',
        name: 'Nest Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x04abeda201850ac0124161f037efd70c74ddc74c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DISTX',
        name: 'DistX',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4b4701f3f827e1331fb22ff8e2beac24b17eb055',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SENT',
        name: 'Sentinel',
        decimals: 8,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa44e5137293e855b1b7bc7e2c6f8cd796ffcb037',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'REVV',
        name: 'REVV',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x557b933a7c2c45672b610f8954a3deb39a51a8ca',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'NOODLE',
        name: 'NOODLE Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x420ab548b18911717ed7c4ccbf46371ea758458c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'PAXG',
        name: 'PAX Gold',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x45804880de22913dafe09f4980848ece6ecbaf78',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BOOST',
        name: 'Boosted Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3e780920601d61cedb860fe9c4a90c9ea6a35e78',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SAND',
        name: 'SAND',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3845badade8e6dff049820680d1f14bd3903a5d0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'STONK',
        name: 'STONK',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xb4058411967d5046f3510943103805be61f0600e',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CVP',
        name: 'PowerPool Concentra',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MITX',
        name: 'Morpheus Labs',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4a527d8fc13c5203ab24ba0944f4cb14658d1db6',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'CHI',
        name: 'Chi Gastoken',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0000000000004946c0e9f43f4dee607b0ef1fa1c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DF',
        name: 'dForce Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x431ad2ff6a9c365805ebad47ee021148d6f7dbe0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ULU',
        name: 'Universal Liquidity',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x035bfe6057e15ea692c0dfdcab3bb41a64dd2ad4',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SWAP',
        name: 'Trustswap',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xcc4304a31d09258b0029ea7fe63d032f52e44efe',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FTT',
        name: 'FTX Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x50d1c9771902476076ecfc8b2a83ad6b9355a4c9',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DEXT',
        name: 'DexTools',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x26ce25148832c04f3d7f26f32478a9fe55197166',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OPT',
        name: 'OpenPredict Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4fe5851c9af07df9e5ad8217afae1ea72737ebda',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DAM',
        name: 'Datamine',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf80d589b3dbe130c270a69f1a69d050f268786df',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'KEY',
        name: 'SelfKey',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4cc19356f2d37338b9802aa8e8fc58b0373296e7',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HEX2T',
        name: 'Axion',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xed1199093b1abd07a368dd1c0cdc77d8517ba2a0',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'ORBS',
        name: 'Orbs',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MTA',
        name: 'Meta',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xa3bed4e1c75d00fa6f4e5e6922db7261b5e9acd2',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BOMB',
        name: 'BOMB',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x1c95b093d6c236d3ef7c796fe33f9cc6b8606714',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'LEV',
        name: 'Leverj',
        decimals: 9,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0f4ca92660efad97a9a70cb0fe969c755439772c',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'SKM',
        name: 'Skrumble Network',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x048fe49be32adfc9ed68c37d32b5ec9df17b3603',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'XCM',
        name: 'CoinMetro',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x44e2ca91cea1147f1b503e669f06cd11fb0c5490',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'RWS',
        name: 'Robonomics Web Serv',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x08ad83d779bdf2bbe1ad9cc0f78aa0d24ab97802',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MCB',
        name: 'MCDex',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'MYB',
        name: 'MyBit Token',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5d60d8d7ef6d37e16ebabc324de3be57f135e0bc',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BLZ',
        name: 'Bluzelle',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x5732046a883704404f284ce41ffadd5b007fd668',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YOUC',
        name: 'YOUcash',
        decimals: 10,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x3d371413dd5489f3a04c07c0c2ce369c20986ceb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'FAM',
        name: 'Yefam Finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x9d24364b97270961b2948734afe8d58832efd43a',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'YF-DAI',
        name: 'YfDAI finance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xf4cd3d3fda8d7fd6c5a500203e38640a70bf9577',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'OXT',
        name: 'Orchid Protocol',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x4575f41308ec1483f3d399aa9a2826d74da13deb',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DMG',
        name: 'DMM Governance',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0xed91879919b71bb6905f23af0a68d231ecf87b14',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'DATA',
        name: 'Streamr DATAcoin',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x0cf0ee63788a0849fe5297f3407f701e122cc023',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'HOUSE',
        name: 'Toast finance',
        decimals: 0,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x19810559df63f19cfe88923313250550edadb743',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
    {
        symbol: 'BASED',
        name: 'Based Money',
        decimals: 18,
        tokenAddresses: {
            [ChainId.Mainnet]: '0x68a118ef45063051eac49c7e647ce5ace48a68a5',
            [ChainId.Kovan]: NULL_ADDRESS,
            [ChainId.Ganache]: NULL_ADDRESS,
        },
    },
];
