"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ENABLE_SLIPPAGE_PROTECTION = exports.ONE_IN_BASE_POINTS = exports.DEFAULT_CACHE_AGE_SECONDS = exports.RFQ_DYNAMIC_BLACKLIST_TTL = exports.RFQM_TX_GAS_ESTIMATE = exports.RFQM_MINIMUM_EXPIRY_DURATION_MS = exports.RFQ_ALLOWANCE_TARGET = exports.RFQ_FIRM_QUOTE_CACHE_EXPIRY = exports.ETH_DECIMALS = exports.DEFAULT_ZERO_EX_GAS_API_URL = exports.META_TRANSACTION_DOCS_URL = exports.SRA_DOCS_URL = exports.SWAP_DOCS_URL = exports.HEALTHCHECK_PATH = exports.ORDERBOOK_PATH = exports.METRICS_PATH = exports.META_TRANSACTION_V2_PATH = exports.META_TRANSACTION_V1_PATH = exports.SWAP_PATH = exports.SRA_PATH = exports.DEFAULT_META_TX_MIN_ALLOWED_SLIPPAGE = exports.AFFILIATE_DATA_SELECTOR = exports.ONE_GWEI = exports.POSITIVE_SLIPPAGE_FEE_TRANSFORMER_GAS = exports.AFFILIATE_FEE_TRANSFORMER_GAS = exports.TX_BASE_GAS = exports.PERCENTAGE_SIG_DIGITS = exports.DEFAULT_PRICE_IMPACT_PROTECTION_PERCENTAGE = exports.DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE = exports.GAS_LIMIT_BUFFER_MULTIPLIER = exports.QUOTE_ORDER_EXPIRATION_BUFFER_MS = exports.HEX_BASE = exports.DEFAULT_VALIDATION_GAS_LIMIT = exports.TEN_MINUTES_MS = exports.ONE_HOUR_MS = exports.ONE_MINUTE_MS = exports.ONE_SECOND_MS = exports.DEFAULT_LOGGER_INCLUDE_TIMESTAMP = exports.ONE = exports.ZERO = exports.DEFAULT_PER_PAGE = exports.DEFAULT_PAGE = exports.NULL_BYTES = exports.NULL_ADDRESS = void 0;
const utils_1 = require("@0x/utils");
exports.NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
exports.NULL_BYTES = '0x';
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_PER_PAGE = 20;
exports.ZERO = new utils_1.BigNumber(0);
exports.ONE = new utils_1.BigNumber(1);
exports.DEFAULT_LOGGER_INCLUDE_TIMESTAMP = true;
exports.ONE_SECOND_MS = 1000;
exports.ONE_MINUTE_MS = exports.ONE_SECOND_MS * 60;
exports.ONE_HOUR_MS = exports.ONE_MINUTE_MS * 60;
exports.TEN_MINUTES_MS = exports.ONE_MINUTE_MS * 10;
exports.DEFAULT_VALIDATION_GAS_LIMIT = 10e6;
exports.HEX_BASE = 16;
// Swap Quoter
exports.QUOTE_ORDER_EXPIRATION_BUFFER_MS = exports.ONE_SECOND_MS * 60; // Ignore orders that expire in 60 seconds
const GAS_LIMIT_BUFFER_PERCENTAGE = 0.1; // Add 10% to the estimated gas limit
exports.GAS_LIMIT_BUFFER_MULTIPLIER = GAS_LIMIT_BUFFER_PERCENTAGE + 1;
exports.DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE = 0.01; // 1% Slippage
exports.DEFAULT_PRICE_IMPACT_PROTECTION_PERCENTAGE = 1.0; // 100%
exports.PERCENTAGE_SIG_DIGITS = 4;
exports.TX_BASE_GAS = new utils_1.BigNumber(21000);
exports.AFFILIATE_FEE_TRANSFORMER_GAS = new utils_1.BigNumber(15000);
exports.POSITIVE_SLIPPAGE_FEE_TRANSFORMER_GAS = new utils_1.BigNumber(30000);
exports.ONE_GWEI = new utils_1.BigNumber(1000000000);
exports.AFFILIATE_DATA_SELECTOR = '869584cd';
exports.DEFAULT_META_TX_MIN_ALLOWED_SLIPPAGE = 0.001;
// API namespaces
exports.SRA_PATH = '/sra/v4';
exports.SWAP_PATH = '/swap/v1';
exports.META_TRANSACTION_V1_PATH = '/meta_transaction/v1';
exports.META_TRANSACTION_V2_PATH = '/meta_transaction/v2';
exports.METRICS_PATH = '/metrics';
exports.ORDERBOOK_PATH = '/orderbook/v1';
exports.HEALTHCHECK_PATH = '/healthz';
// Docs
exports.SWAP_DOCS_URL = 'https://0x.org/docs/api#swap';
exports.SRA_DOCS_URL = 'https://0x.org/docs/api#sra';
exports.META_TRANSACTION_DOCS_URL = 'https://0x.org/docs/api#meta_transaction';
exports.DEFAULT_ZERO_EX_GAS_API_URL = 'https://gas.api.0x.org/source/median';
exports.ETH_DECIMALS = 18;
// RFQ Quote Validator expiration threshold
exports.RFQ_FIRM_QUOTE_CACHE_EXPIRY = exports.ONE_MINUTE_MS * 2;
exports.RFQ_ALLOWANCE_TARGET = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';
exports.RFQM_MINIMUM_EXPIRY_DURATION_MS = exports.ONE_MINUTE_MS;
exports.RFQM_TX_GAS_ESTIMATE = 165e3;
exports.RFQ_DYNAMIC_BLACKLIST_TTL = exports.ONE_SECOND_MS * 30;
// General cache control
exports.DEFAULT_CACHE_AGE_SECONDS = 13;
// Number of base points in 1
exports.ONE_IN_BASE_POINTS = 10000;
// Whether Slippage Protect is enabled by default
exports.DEFAULT_ENABLE_SLIPPAGE_PROTECTION = true;
//# sourceMappingURL=constants.js.map