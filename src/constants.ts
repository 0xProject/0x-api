import { BigNumber } from '@0x/utils';

// tslint:disable:custom-no-magic-numbers

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
export const NULL_BYTES = '0x';
export const ZRX_DECIMALS = 18;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;
export const ZERO = new BigNumber(0);
export const ONE = new BigNumber(1);
export const MAX_TOKEN_SUPPLY_POSSIBLE = new BigNumber(2).pow(256);
export const DEFAULT_LOCAL_POSTGRES_URI = 'postgresql://api:api@localhost/api';
export const DEFAULT_LOGGER_INCLUDE_TIMESTAMP = true;
export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
export const TEN_MINUTES_MS = ONE_MINUTE_MS * 10;
export const ERC20_BRIDGE_ASSET_PREFIX = '0xdc1600f3';

// The number of orders to post to Mesh at one time
export const MESH_ORDERS_BATCH_SIZE = 200;
// 5242880 appears to be the max HTTP content length with Mesh
export const MESH_ORDERS_BATCH_HTTP_BYTE_LENGTH = 2500000;

// Swap Quoter
export const QUOTE_ORDER_EXPIRATION_BUFFER_MS = ONE_SECOND_MS * 90; // Ignore orders that expire in 90 seconds
export const GAS_LIMIT_BUFFER_PERCENTAGE = 0.2; // Add 20% to the estimated gas limit
export const DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE = 0.03; // 3% Slippage
export const DEFAULT_FALLBACK_SLIPPAGE_PERCENTAGE = 0.015; // 1.5% Slippage in a fallback route
export const ETH_SYMBOL = 'ETH';
export const WETH_SYMBOL = 'WETH';
export const ADDRESS_HEX_LENGTH = 42;
export const DEFAULT_TOKEN_DECIMALS = 18;
export const FIRST_PAGE = 1;
export const PERCENTAGE_SIG_DIGITS = 4;
export const PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS = 6000;
export const UNWRAP_QUOTE_GAS = new BigNumber(60000);
export const WRAP_QUOTE_GAS = new BigNumber(40000);

// API namespaces
export const SRA_PATH = '/sra/v3';
export const STAKING_PATH = '/staking';
export const SWAP_PATH = '/swap/v0';
export const META_TRANSACTION_PATH = '/meta_transaction/v0';

// Signing service
export const SIGN_PATH = '/sign';

// Docs
export const SWAP_DOCS_URL = 'https://0x.org/docs/api#swap';
export const SRA_DOCS_URL = 'https://0x.org/docs/api#sra';
export const META_TRANSACTION_DOCS_URL = 'https://0x.org/docs/api#meta_transaction';

// Sender keys
export const SENDER_ADDRESS = '0xccd3d176bc555c8905be150e122d7f3e121381d5';
export const SENDER_PRIVATE_KEY = '6d15b7a4a12a94a844c0e40984f01b5ce2b967af9e14190a29643b8d36b987a5';

// Taker keys
export const TAKER_ADDRESS = '0xa3ece5d5b6319fa785efc10d3112769a46c6e149';
export const TAKER_PRIVATE_KEY = '965a7f431d229aad724b2cca424420b721df64539f7956f466c0c3eadf0011a6';
