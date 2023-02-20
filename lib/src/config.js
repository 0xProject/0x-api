"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SENTRY_ENVIRONMENT = exports.SENTRY_ENABLED = exports.KAFKA_TOPIC_QUOTE_REPORT = exports.ZERO_EX_GAS_API_URL = exports.PROMETHEUS_PORT = exports.ENABLE_PROMETHEUS_METRICS = exports.SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS = exports.RFQT_REQUEST_MAX_RESPONSE_MS = exports.META_TX_EXPIRATION_BUFFER_MS = exports.RFQM_MAKER_ASSET_OFFERINGS = exports.RFQT_MAKER_ASSET_OFFERINGS = exports.ALT_RFQ_MM_API_KEY = exports.ALT_RFQ_MM_ENDPOINT = exports.RFQT_TX_ORIGIN_BLACKLIST = exports.ENABLE_RFQT_TX_ORIGIN_BLACKLIST = exports.RFQ_API_URL = exports.MATCHA_INTEGRATOR_ID = exports.RFQT_API_KEY_WHITELIST = exports.RFQT_INTEGRATOR_IDS = exports.RFQT_REGISTRY_PASSWORDS = exports.LOGGER_INCLUDE_TIMESTAMP = exports.POSTGRES_READ_REPLICA_URIS = exports.POSTGRES_URI = exports.SRA_ORDER_EXPIRATION_BUFFER_SECONDS = exports.MAX_ORDER_EXPIRATION_BUFFER_SECONDS = exports.TAKER_FEE_UNIT_AMOUNT = exports.ZERO_EX_FEE_TOKENS = exports.ZERO_EX_FEE_RECIPIENT_ADDRESS = exports.FEE_RECIPIENT_ADDRESS = exports.WEBSOCKET_ORDER_UPDATES_PATH = exports.KAFKA_BROKERS = exports.ORDER_WATCHER_KAFKA_TOPIC = exports.ORDER_WATCHER_URL = exports.META_TX_MIN_ALLOWED_SLIPPAGE = exports.SLIPPAGE_MODEL_REFRESH_INTERVAL_MS = exports.SLIPPAGE_MODEL_S3_FILE_VALID_INTERVAL_MS = exports.SLIPPAGE_MODEL_S3_API_VERSION = exports.SLIPPAGE_MODEL_S3_FILE_NAME = exports.SLIPPAGE_MODEL_S3_BUCKET_NAME = exports.PROMETHEUS_LABEL_STATUS_ERROR = exports.PROMETHEUS_LABEL_STATUS_OK = exports.PROMETHEUS_RESPONSE_SIZE_BUCKETS = exports.PROMETHEUS_REQUEST_SIZE_BUCKETS = exports.PROMETHEUS_REQUEST_BUCKETS = exports.DB_ORDERS_UPDATE_CHUNK_SIZE = exports.WHITELISTED_TOKENS = exports.CHAIN_ID = exports.LOG_LEVEL = exports.RFQ_MAKER_CONFIGS = exports.getApiKeyWhitelistFromIntegratorsAcl = void 0;
exports.getIntegratorIdForApiKey = exports.getIntegratorByIdOrThrow = exports.defaultHttpServiceConfig = exports.SWAP_QUOTER_OPTS = exports.CHAIN_HAS_VIPS = exports.ASSET_SWAPPER_MARKET_ORDERS_OPTS_NO_VIP = exports.ASSET_SWAPPER_MARKET_ORDERS_OPTS = exports.WRAP_QUOTE_GAS = exports.UNWRAP_QUOTE_GAS = exports.PROTOCOL_FEE_MULTIPLIER = exports.MAX_PER_PAGE = exports.GASLESS_SWAP_FEE_ENABLED = exports.SENTRY_TRACES_SAMPLE_RATE = exports.SENTRY_SAMPLE_RATE = exports.SENTRY_DSN = void 0;
const assert_1 = require("@0x/assert");
const token_metadata_1 = require("@0x/token-metadata");
const utils_1 = require("@0x/utils");
const fs = require("fs");
const _ = require("lodash");
const prom_client_1 = require("prom-client");
const validateUUID = require("uuid-validate");
const asset_swapper_1 = require("./asset-swapper");
const constants_1 = require("./constants");
const schemas_1 = require("./schemas");
const schema_utils_1 = require("./utils/schema_utils");
var EnvVarType;
(function (EnvVarType) {
    EnvVarType[EnvVarType["AddressList"] = 0] = "AddressList";
    EnvVarType[EnvVarType["StringList"] = 1] = "StringList";
    EnvVarType[EnvVarType["Integer"] = 2] = "Integer";
    EnvVarType[EnvVarType["Float"] = 3] = "Float";
    EnvVarType[EnvVarType["Port"] = 4] = "Port";
    EnvVarType[EnvVarType["KeepAliveTimeout"] = 5] = "KeepAliveTimeout";
    EnvVarType[EnvVarType["ChainId"] = 6] = "ChainId";
    EnvVarType[EnvVarType["ETHAddressHex"] = 7] = "ETHAddressHex";
    EnvVarType[EnvVarType["UnitAmount"] = 8] = "UnitAmount";
    EnvVarType[EnvVarType["Url"] = 9] = "Url";
    EnvVarType[EnvVarType["UrlList"] = 10] = "UrlList";
    EnvVarType[EnvVarType["WhitelistAllTokens"] = 11] = "WhitelistAllTokens";
    EnvVarType[EnvVarType["Boolean"] = 12] = "Boolean";
    EnvVarType[EnvVarType["NonEmptyString"] = 13] = "NonEmptyString";
    EnvVarType[EnvVarType["APIKeys"] = 14] = "APIKeys";
    EnvVarType[EnvVarType["PrivateKeys"] = 15] = "PrivateKeys";
    EnvVarType[EnvVarType["RfqMakerAssetOfferings"] = 16] = "RfqMakerAssetOfferings";
    EnvVarType[EnvVarType["RateLimitConfig"] = 17] = "RateLimitConfig";
    EnvVarType[EnvVarType["JsonStringList"] = 18] = "JsonStringList";
})(EnvVarType || (EnvVarType = {}));
/**
 * Configuration which represents taker-integrators of the 0x API. The configuration contains the label, id,
 * api keys, and allowed liquidity sources for each integrator.
 */
const INTEGRATORS_ACL = (() => {
    let integrators;
    try {
        integrators = resolveEnvVar('INTEGRATORS_ACL', EnvVarType.JsonStringList, []);
        schema_utils_1.schemaUtils.validateSchema(integrators, schemas_1.schemas.integratorsAclSchema);
    }
    catch (e) {
        throw new Error(`INTEGRATORS_ACL was defined but is not valid JSON per the schema: ${e}`);
    }
    return integrators;
})();
/**
 * Extracts the integrator API keys from the `INTEGRATORS_ACL` environment variable for the provided group type.
 */
const getApiKeyWhitelistFromIntegratorsAcl = (groupType) => {
    return INTEGRATORS_ACL.filter((i) => i[groupType])
        .flatMap((i) => i.apiKeys)
        .sort();
};
exports.getApiKeyWhitelistFromIntegratorsAcl = getApiKeyWhitelistFromIntegratorsAcl;
/**
 * Gets the integrator ID for the provided label.
 */
const getIntegratorIdFromLabel = (label) => {
    for (const integrator of INTEGRATORS_ACL) {
        if (integrator.label === label) {
            return integrator.integratorId;
        }
    }
};
/**
 * A list of type RfqMakerConfig, read from the RFQ_MAKER_CONFIGS env variable
 */
exports.RFQ_MAKER_CONFIGS = (() => {
    try {
        const makerConfigs = resolveEnvVar('RFQ_MAKER_CONFIGS', EnvVarType.JsonStringList, []);
        schema_utils_1.schemaUtils.validateSchema(makerConfigs, schemas_1.schemas.rfqMakerConfigListSchema);
        return makerConfigs;
    }
    catch (e) {
        throw new Error(`RFQ_MAKER_CONFIGS was defined but is not valid JSON per the schema: ${e}`);
    }
})();
// Log level for pino.js
exports.LOG_LEVEL = _.isEmpty(process.env.LOG_LEVEL)
    ? 'info'
    : assertEnvVarType('LOG_LEVEL', process.env.LOG_LEVEL, EnvVarType.NonEmptyString);
// Network port to listen on
const HTTP_PORT = _.isEmpty(process.env.HTTP_PORT)
    ? 3000
    : assertEnvVarType('HTTP_PORT', process.env.HTTP_PORT, EnvVarType.Port);
// Network port for the healthcheck service at /healthz, if not provided, it uses the HTTP_PORT value.
const HEALTHCHECK_HTTP_PORT = _.isEmpty(process.env.HEALTHCHECK_HTTP_PORT)
    ? HTTP_PORT
    : assertEnvVarType('HEALTHCHECK_HTTP_PORT', process.env.HEALTHCHECK_HTTP_PORT, EnvVarType.Port);
// Number of milliseconds of inactivity the servers waits for additional
// incoming data aftere it finished writing last response before a socket will
// be destroyed.
// Ref: https://nodejs.org/api/http.html#http_server_keepalivetimeout
const HTTP_KEEP_ALIVE_TIMEOUT = _.isEmpty(process.env.HTTP_KEEP_ALIVE_TIMEOUT)
    ? 76 * 1000
    : assertEnvVarType('HTTP_KEEP_ALIVE_TIMEOUT', process.env.HTTP_KEEP_ALIVE_TIMEOUT, EnvVarType.KeepAliveTimeout);
// Limit the amount of time the parser will wait to receive the complete HTTP headers.
// NOTE: This value HAS to be higher than HTTP_KEEP_ALIVE_TIMEOUT.
// Ref: https://nodejs.org/api/http.html#http_server_headerstimeout
const HTTP_HEADERS_TIMEOUT = _.isEmpty(process.env.HTTP_HEADERS_TIMEOUT)
    ? 77 * 1000
    : assertEnvVarType('HTTP_HEADERS_TIMEOUT', process.env.HTTP_HEADERS_TIMEOUT, EnvVarType.KeepAliveTimeout);
// Default chain id to use when not specified
exports.CHAIN_ID = _.isEmpty(process.env.CHAIN_ID)
    ? asset_swapper_1.ChainId.Mainnet
    : assertEnvVarType('CHAIN_ID', process.env.CHAIN_ID, EnvVarType.ChainId);
// Whitelisted token addresses. Set to a '*' instead of an array to allow all tokens.
exports.WHITELISTED_TOKENS = _.isEmpty(process.env.WHITELIST_ALL_TOKENS)
    ? token_metadata_1.TokenMetadatasForChains.map((tm) => tm.tokenAddresses[exports.CHAIN_ID])
    : assertEnvVarType('WHITELIST_ALL_TOKENS', process.env.WHITELIST_ALL_TOKENS, EnvVarType.WhitelistAllTokens);
exports.DB_ORDERS_UPDATE_CHUNK_SIZE = 300;
// Ethereum RPC Url list
const ETHEREUM_RPC_URL = assertEnvVarType('ETHEREUM_RPC_URL', process.env.ETHEREUM_RPC_URL, EnvVarType.UrlList);
// Timeout in seconds to wait for an RPC request (default 5000)
const RPC_REQUEST_TIMEOUT = _.isEmpty(process.env.RPC_REQUEST_TIMEOUT)
    ? 5000
    : assertEnvVarType('RPC_REQUEST_TIMEOUT', process.env.RPC_REQUEST_TIMEOUT, EnvVarType.Integer);
// Prometheus shared metrics
exports.PROMETHEUS_REQUEST_BUCKETS = (0, prom_client_1.linearBuckets)(0, 0.25, RPC_REQUEST_TIMEOUT / 1000 / 0.25); // [ 0,  0.25,  0.5,  0.75, ... 5 ]
exports.PROMETHEUS_REQUEST_SIZE_BUCKETS = (0, prom_client_1.linearBuckets)(0, 50000, 20); // A single step is 50kb, up to 1mb.
exports.PROMETHEUS_RESPONSE_SIZE_BUCKETS = (0, prom_client_1.linearBuckets)(0, 50000, 20); // A single step is 50kb, up to 1mb.
exports.PROMETHEUS_LABEL_STATUS_OK = 'ok';
exports.PROMETHEUS_LABEL_STATUS_ERROR = 'error';
// Enable client side content compression when sending RPC requests (default false)
const ENABLE_RPC_REQUEST_COMPRESSION = _.isEmpty(process.env.ENABLE_RPC_REQUEST_COMPRESSION)
    ? false
    : assertEnvVarType('ENABLE_RPC_REQUEST_COMPRESSION', process.env.ENABLE_RPC_REQUEST_COMPRESSION, EnvVarType.Boolean);
// S3 bucket for slippage model file
exports.SLIPPAGE_MODEL_S3_BUCKET_NAME = _.isEmpty(process.env.SLIPPAGE_MODEL_S3_BUCKET_NAME)
    ? undefined
    : assertEnvVarType('SLIPPAGE_MODEL_S3_BUCKET_NAME', process.env.SLIPPAGE_MODEL_S3_BUCKET_NAME, EnvVarType.NonEmptyString);
exports.SLIPPAGE_MODEL_S3_FILE_NAME = `SlippageModel-${exports.CHAIN_ID}.json`;
exports.SLIPPAGE_MODEL_S3_API_VERSION = '2006-03-01';
exports.SLIPPAGE_MODEL_S3_FILE_VALID_INTERVAL_MS = constants_1.ONE_HOUR_MS * 2;
exports.SLIPPAGE_MODEL_REFRESH_INTERVAL_MS = constants_1.ONE_MINUTE_MS * 1;
exports.META_TX_MIN_ALLOWED_SLIPPAGE = _.isEmpty(process.env.META_TX_MIN_ALLOWED_SLIPPAGE)
    ? constants_1.DEFAULT_META_TX_MIN_ALLOWED_SLIPPAGE
    : assertEnvVarType('META_TX_MIN_ALLOWED_SLIPPAGE', process.env.META_TX_MIN_ALLOWED_SLIPPAGE, EnvVarType.Float);
exports.ORDER_WATCHER_URL = _.isEmpty(process.env.ORDER_WATCHER_URL)
    ? 'http://127.0.0.1:8080'
    : assertEnvVarType('ORDER_WATCHER_URL', process.env.ORDER_WATCHER_URL, EnvVarType.Url);
exports.ORDER_WATCHER_KAFKA_TOPIC = _.isEmpty(process.env.ORDER_WATCHER_KAFKA_TOPIC)
    ? 'order_watcher_events'
    : assertEnvVarType('ORDER_WATCHER_KAFKA_TOPIC', process.env.ORDER_WATCHER_KAFKA_TOPIC, EnvVarType.NonEmptyString);
exports.KAFKA_BROKERS = _.isEmpty(process.env.KAFKA_BROKERS)
    ? undefined
    : assertEnvVarType('KAFKA_BROKERS', process.env.KAFKA_BROKERS, EnvVarType.StringList);
const KAFKA_CONSUMER_GROUP_ID = _.isEmpty(process.env.KAFKA_CONSUMER_GROUP_ID)
    ? undefined
    : assertEnvVarType('KAFKA_CONSUMER_GROUP_ID', process.env.KAFKA_CONSUMER_GROUP_ID, EnvVarType.NonEmptyString);
// The path for the Websocket order-watcher updates
exports.WEBSOCKET_ORDER_UPDATES_PATH = _.isEmpty(process.env.WEBSOCKET_ORDER_UPDATES_PATH)
    ? constants_1.ORDERBOOK_PATH
    : assertEnvVarType('WEBSOCKET_ORDER_UPDATES_PATH', process.env.WEBSOCKET_ORDER_UPDATES_PATH, EnvVarType.NonEmptyString);
// LEGACY: This is now the fallback affiliate address for tagging (becomes "Unknown Affiliate")
exports.FEE_RECIPIENT_ADDRESS = _.isEmpty(process.env.FEE_RECIPIENT_ADDRESS)
    ? constants_1.NULL_ADDRESS
    : assertEnvVarType('FEE_RECIPIENT_ADDRESS', process.env.FEE_RECIPIENT_ADDRESS, EnvVarType.ETHAddressHex);
// The fee recipient for 0x
exports.ZERO_EX_FEE_RECIPIENT_ADDRESS = resolveEnvVar('ZERO_EX_FEE_RECIPIENT_ADDRESS', EnvVarType.ETHAddressHex, constants_1.NULL_ADDRESS);
// The set of fee tokens for 0x
exports.ZERO_EX_FEE_TOKENS = new Set(resolveEnvVar('ZERO_EX_FEE_TOKENS', EnvVarType.JsonStringList, []).map((addr) => addr.toLowerCase()));
// A flat fee that should be charged to the order taker
exports.TAKER_FEE_UNIT_AMOUNT = _.isEmpty(process.env.TAKER_FEE_UNIT_AMOUNT)
    ? new utils_1.BigNumber(0)
    : assertEnvVarType('TAKER_FEE_UNIT_AMOUNT', process.env.TAKER_FEE_UNIT_AMOUNT, EnvVarType.UnitAmount);
// If there are any orders in the orderbook that are expired by more than x seconds, log an error
exports.MAX_ORDER_EXPIRATION_BUFFER_SECONDS = _.isEmpty(process.env.MAX_ORDER_EXPIRATION_BUFFER_SECONDS)
    ? 3 * 60
    : assertEnvVarType('MAX_ORDER_EXPIRATION_BUFFER_SECONDS', process.env.MAX_ORDER_EXPIRATION_BUFFER_SECONDS, EnvVarType.KeepAliveTimeout);
// Ignore orders greater than x seconds when responding to SRA requests
exports.SRA_ORDER_EXPIRATION_BUFFER_SECONDS = _.isEmpty(process.env.SRA_ORDER_EXPIRATION_BUFFER_SECONDS)
    ? 10
    : assertEnvVarType('SRA_ORDER_EXPIRATION_BUFFER_SECONDS', process.env.SRA_ORDER_EXPIRATION_BUFFER_SECONDS, EnvVarType.KeepAliveTimeout);
exports.POSTGRES_URI = _.isEmpty(process.env.POSTGRES_URI)
    ? undefined
    : assertEnvVarType('POSTGRES_URI', process.env.POSTGRES_URI, EnvVarType.Url);
exports.POSTGRES_READ_REPLICA_URIS = _.isEmpty(process.env.POSTGRES_READ_REPLICA_URIS)
    ? undefined
    : assertEnvVarType('POSTGRES_READ_REPLICA_URIS', process.env.POSTGRES_READ_REPLICA_URIS, EnvVarType.UrlList);
// Should the logger include time field in the output logs, defaults to true.
exports.LOGGER_INCLUDE_TIMESTAMP = _.isEmpty(process.env.LOGGER_INCLUDE_TIMESTAMP)
    ? constants_1.DEFAULT_LOGGER_INCLUDE_TIMESTAMP
    : assertEnvVarType('LOGGER_INCLUDE_TIMESTAMP', process.env.LOGGER_INCLUDE_TIMESTAMP, EnvVarType.Boolean);
exports.RFQT_REGISTRY_PASSWORDS = resolveEnvVar('RFQT_REGISTRY_PASSWORDS', EnvVarType.JsonStringList, []);
const RFQT_INTEGRATORS = INTEGRATORS_ACL.filter((i) => i.rfqt);
exports.RFQT_INTEGRATOR_IDS = INTEGRATORS_ACL.filter((i) => i.rfqt).map((i) => i.integratorId);
exports.RFQT_API_KEY_WHITELIST = (0, exports.getApiKeyWhitelistFromIntegratorsAcl)('rfqt');
exports.MATCHA_INTEGRATOR_ID = getIntegratorIdFromLabel('Matcha');
exports.RFQ_API_URL = resolveEnvVar('RFQ_API_URL', EnvVarType.NonEmptyString, '');
// TODO(byeongminp): migrate tx blacklist
exports.ENABLE_RFQT_TX_ORIGIN_BLACKLIST = !_.isEmpty(process.env.RFQT_TX_ORIGIN_BLACKLIST);
exports.RFQT_TX_ORIGIN_BLACKLIST = new Set(resolveEnvVar('RFQT_TX_ORIGIN_BLACKLIST', EnvVarType.JsonStringList, []).map((addr) => addr.toLowerCase()));
exports.ALT_RFQ_MM_ENDPOINT = _.isEmpty(process.env.ALT_RFQ_MM_ENDPOINT)
    ? undefined
    : assertEnvVarType('ALT_RFQ_MM_ENDPOINT', process.env.ALT_RFQ_MM_ENDPOINT, EnvVarType.Url);
exports.ALT_RFQ_MM_API_KEY = _.isEmpty(process.env.ALT_RFQ_MM_API_KEY)
    ? undefined
    : assertEnvVarType('ALT_RFQ_MM_API_KEY', process.env.ALT_RFQ_MM_API_KEY, EnvVarType.NonEmptyString);
const ALT_RFQ_MM_PROFILE = _.isEmpty(process.env.ALT_RFQ_MM_PROFILE)
    ? undefined
    : assertEnvVarType('ALT_RFQ_MM_PROFILE', process.env.ALT_RFQ_MM_PROFILE, EnvVarType.NonEmptyString);
exports.RFQT_MAKER_ASSET_OFFERINGS = resolveEnvVar('RFQT_MAKER_ASSET_OFFERINGS', EnvVarType.RfqMakerAssetOfferings, {});
exports.RFQM_MAKER_ASSET_OFFERINGS = resolveEnvVar('RFQM_MAKER_ASSET_OFFERINGS', EnvVarType.RfqMakerAssetOfferings, {});
exports.META_TX_EXPIRATION_BUFFER_MS = constants_1.TEN_MINUTES_MS;
exports.RFQT_REQUEST_MAX_RESPONSE_MS = _.isEmpty(process.env.RFQT_REQUEST_MAX_RESPONSE_MS)
    ? 600
    : assertEnvVarType('RFQT_REQUEST_MAX_RESPONSE_MS', process.env.RFQT_REQUEST_MAX_RESPONSE_MS, EnvVarType.Integer);
// Whitelisted 0x API keys that can post orders to the SRA and have them persist indefinitely
exports.SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS = process.env.SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS === undefined
    ? []
    : assertEnvVarType('SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS', process.env.SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS, EnvVarType.APIKeys);
// Whether or not prometheus metrics should be enabled.
exports.ENABLE_PROMETHEUS_METRICS = _.isEmpty(process.env.ENABLE_PROMETHEUS_METRICS)
    ? false
    : assertEnvVarType('ENABLE_PROMETHEUS_METRICS', process.env.ENABLE_PROMETHEUS_METRICS, EnvVarType.Boolean);
exports.PROMETHEUS_PORT = _.isEmpty(process.env.PROMETHEUS_PORT)
    ? 8080
    : assertEnvVarType('PROMETHEUS_PORT', process.env.PROMETHEUS_PORT, EnvVarType.Port);
// ZeroEx Gas API URL
exports.ZERO_EX_GAS_API_URL = _.isEmpty(process.env.ZERO_EX_GAS_API_URL)
    ? constants_1.DEFAULT_ZERO_EX_GAS_API_URL
    : assertEnvVarType('ZERO_EX_GAS_API_URL', process.env.ZERO_EX_GAS_API_URL, EnvVarType.Url);
exports.KAFKA_TOPIC_QUOTE_REPORT = _.isEmpty(process.env.KAFKA_TOPIC_QUOTE_REPORT)
    ? undefined
    : assertEnvVarType('KAFKA_TOPIC_QUOTE_REPORT', process.env.KAFKA_TOPIC_QUOTE_REPORT, EnvVarType.NonEmptyString);
exports.SENTRY_ENABLED = _.isEmpty(process.env.SENTRY_ENABLED)
    ? false
    : assertEnvVarType('SENTRY_ENABLED', process.env.SENTRY_ENABLED, EnvVarType.Boolean);
exports.SENTRY_ENVIRONMENT = _.isEmpty(process.env.SENTRY_ENVIRONMENT)
    ? 'development'
    : assertEnvVarType('SENTRY_ENVIRONMENT', process.env.SENTRY_ENVIRONMENT, EnvVarType.NonEmptyString);
exports.SENTRY_DSN = _.isEmpty(process.env.SENTRY_DSN)
    ? undefined
    : assertEnvVarType('SENTRY_DSN', process.env.SENTRY_DSN, EnvVarType.Url);
exports.SENTRY_SAMPLE_RATE = _.isEmpty(process.env.SENTRY_SAMPLE_RATE)
    ? 0.1
    : assertEnvVarType('SENTRY_SAMPLE_RATE', process.env.SENTRY_SAMPLE_RATE, EnvVarType.Float);
exports.SENTRY_TRACES_SAMPLE_RATE = _.isEmpty(process.env.SENTRY_TRACES_SAMPLE_RATE)
    ? 0.1
    : assertEnvVarType('SENTRY_TRACES_SAMPLE_RATE', process.env.SENTRY_TRACES_SAMPLE_RATE, EnvVarType.Float);
exports.GASLESS_SWAP_FEE_ENABLED = _.isEmpty(process.env.GASLESS_SWAP_FEE_ENABLED)
    ? false
    : assertEnvVarType('GASLESS_SWAP_FEE_ENABLED', process.env.GASLESS_SWAP_FEE_ENABLED, EnvVarType.Boolean);
// Max number of entities per page
exports.MAX_PER_PAGE = 1000;
exports.PROTOCOL_FEE_MULTIPLIER = new utils_1.BigNumber(0);
const UNWRAP_GAS_BY_CHAIN_ID = (0, token_metadata_1.valueByChainId)({
    // NOTE: FTM uses a different WFTM implementation than WETH which uses more gas
    [asset_swapper_1.ChainId.Fantom]: new utils_1.BigNumber(37000),
}, new utils_1.BigNumber(25000));
const UNWRAP_WETH_GAS = UNWRAP_GAS_BY_CHAIN_ID[exports.CHAIN_ID];
exports.UNWRAP_QUOTE_GAS = constants_1.TX_BASE_GAS.plus(UNWRAP_WETH_GAS);
exports.WRAP_QUOTE_GAS = exports.UNWRAP_QUOTE_GAS;
const FILL_QUOTE_TRANSFORMER_GAS_OVERHEAD = new utils_1.BigNumber(150e3);
const EXCHANGE_PROXY_OVERHEAD_NO_VIP = () => FILL_QUOTE_TRANSFORMER_GAS_OVERHEAD;
const MULTIPLEX_BATCH_FILL_SOURCE_FLAGS = asset_swapper_1.SOURCE_FLAGS.Uniswap_V2 |
    asset_swapper_1.SOURCE_FLAGS.SushiSwap |
    asset_swapper_1.SOURCE_FLAGS.RfqOrder |
    asset_swapper_1.SOURCE_FLAGS.Uniswap_V3 |
    asset_swapper_1.SOURCE_FLAGS.OtcOrder;
const MULTIPLEX_MULTIHOP_FILL_SOURCE_FLAGS = asset_swapper_1.SOURCE_FLAGS.Uniswap_V2 | asset_swapper_1.SOURCE_FLAGS.SushiSwap | asset_swapper_1.SOURCE_FLAGS.Uniswap_V3;
const EXCHANGE_PROXY_OVERHEAD_FULLY_FEATURED = (sourceFlags) => {
    if ([asset_swapper_1.SOURCE_FLAGS.Uniswap_V2, asset_swapper_1.SOURCE_FLAGS.SushiSwap].includes(sourceFlags)) {
        // Uniswap and forks VIP
        return constants_1.TX_BASE_GAS;
    }
    else if ([
        asset_swapper_1.SOURCE_FLAGS.SushiSwap,
        asset_swapper_1.SOURCE_FLAGS.PancakeSwap,
        asset_swapper_1.SOURCE_FLAGS.PancakeSwap_V2,
        asset_swapper_1.SOURCE_FLAGS.BakerySwap,
        asset_swapper_1.SOURCE_FLAGS.ApeSwap,
    ].includes(sourceFlags) &&
        exports.CHAIN_ID === asset_swapper_1.ChainId.BSC) {
        // PancakeSwap and forks VIP
        return constants_1.TX_BASE_GAS;
    }
    else if (asset_swapper_1.SOURCE_FLAGS.Uniswap_V3 === sourceFlags) {
        // Uniswap V3 VIP
        return constants_1.TX_BASE_GAS.plus(5e3);
    }
    else if (asset_swapper_1.SOURCE_FLAGS.Curve === sourceFlags) {
        // Curve pseudo-VIP
        return constants_1.TX_BASE_GAS.plus(40e3);
    }
    else if (asset_swapper_1.SOURCE_FLAGS.RfqOrder === sourceFlags) {
        // RFQ VIP
        return constants_1.TX_BASE_GAS.plus(5e3);
    }
    else if (asset_swapper_1.SOURCE_FLAGS.OtcOrder === sourceFlags) {
        // OtcOrder VIP
        // NOTE: Should be 15k cheaper after the first tx from txOrigin than RfqOrder
        // Use 5k less for now as not to over bias
        return constants_1.TX_BASE_GAS;
    }
    else if ((MULTIPLEX_BATCH_FILL_SOURCE_FLAGS | sourceFlags) === MULTIPLEX_BATCH_FILL_SOURCE_FLAGS) {
        if ((sourceFlags & asset_swapper_1.SOURCE_FLAGS.OtcOrder) === asset_swapper_1.SOURCE_FLAGS.OtcOrder) {
            // Multiplex that has OtcOrder
            return constants_1.TX_BASE_GAS.plus(10e3);
        }
        // Multiplex batch fill
        return constants_1.TX_BASE_GAS.plus(15e3);
    }
    else if ((MULTIPLEX_MULTIHOP_FILL_SOURCE_FLAGS | sourceFlags) ===
        (MULTIPLEX_MULTIHOP_FILL_SOURCE_FLAGS | asset_swapper_1.SOURCE_FLAGS.MultiHop)) {
        // Multiplex multi-hop fill
        return constants_1.TX_BASE_GAS.plus(25e3);
    }
    else {
        return FILL_QUOTE_TRANSFORMER_GAS_OVERHEAD;
    }
};
const NEON_ROUTER_NUM_SAMPLES = 14;
// TODO(kimpers): Due to an issue with the Rust router we want to use equidistant samples when using the Rust router
const DEFAULT_SAMPLE_DISTRIBUTION_BASE = 1;
const SAMPLE_DISTRIBUTION_BASE = _.isEmpty(process.env.SAMPLE_DISTRIBUTION_BASE)
    ? DEFAULT_SAMPLE_DISTRIBUTION_BASE
    : assertEnvVarType('SAMPLE_DISTRIBUTION_BASE', process.env.SAMPLE_DISTRIBUTION_BASE, EnvVarType.Float);
exports.ASSET_SWAPPER_MARKET_ORDERS_OPTS = {
    bridgeSlippage: constants_1.DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE,
    numSamples: 13,
    sampleDistributionBase: SAMPLE_DISTRIBUTION_BASE,
    neonRouterNumSamples: NEON_ROUTER_NUM_SAMPLES,
    exchangeProxyOverhead: EXCHANGE_PROXY_OVERHEAD_FULLY_FEATURED,
    shouldGenerateQuoteReport: true,
};
exports.ASSET_SWAPPER_MARKET_ORDERS_OPTS_NO_VIP = {
    ...exports.ASSET_SWAPPER_MARKET_ORDERS_OPTS,
    exchangeProxyOverhead: EXCHANGE_PROXY_OVERHEAD_NO_VIP,
};
const CHAIN_HAS_VIPS = (chainId) => {
    return [asset_swapper_1.ChainId.Mainnet, asset_swapper_1.ChainId.BSC].includes(chainId);
};
exports.CHAIN_HAS_VIPS = CHAIN_HAS_VIPS;
const SAMPLER_OVERRIDES = (() => {
    switch (exports.CHAIN_ID) {
        case asset_swapper_1.ChainId.Ganache:
            return { overrides: {}, block: asset_swapper_1.BlockParamLiteral.Latest };
        default:
            return undefined;
    }
})();
let SWAP_QUOTER_RFQT_OPTS = {
    integratorsWhitelist: RFQT_INTEGRATORS,
    txOriginBlacklist: exports.RFQT_TX_ORIGIN_BLACKLIST,
};
if (exports.ALT_RFQ_MM_API_KEY && ALT_RFQ_MM_PROFILE) {
    SWAP_QUOTER_RFQT_OPTS = {
        ...SWAP_QUOTER_RFQT_OPTS,
        altRfqCreds: {
            altRfqApiKey: exports.ALT_RFQ_MM_API_KEY,
            altRfqProfile: ALT_RFQ_MM_PROFILE,
        },
    };
}
exports.SWAP_QUOTER_OPTS = {
    chainId: exports.CHAIN_ID,
    expiryBufferMs: constants_1.QUOTE_ORDER_EXPIRATION_BUFFER_MS,
    rfqt: SWAP_QUOTER_RFQT_OPTS,
    zeroExGasApiUrl: exports.ZERO_EX_GAS_API_URL,
    permittedOrderFeeTypes: new Set([asset_swapper_1.OrderPrunerPermittedFeeTypes.NoFees]),
    samplerOverrides: SAMPLER_OVERRIDES,
    tokenAdjacencyGraph: asset_swapper_1.DEFAULT_TOKEN_ADJACENCY_GRAPH_BY_CHAIN_ID[exports.CHAIN_ID],
};
exports.defaultHttpServiceConfig = {
    httpPort: HTTP_PORT,
    healthcheckHttpPort: HEALTHCHECK_HTTP_PORT,
    healthcheckPath: constants_1.HEALTHCHECK_PATH,
    ethereumRpcUrl: ETHEREUM_RPC_URL,
    httpKeepAliveTimeout: HTTP_KEEP_ALIVE_TIMEOUT,
    httpHeadersTimeout: HTTP_HEADERS_TIMEOUT,
    enablePrometheusMetrics: exports.ENABLE_PROMETHEUS_METRICS,
    prometheusPort: exports.PROMETHEUS_PORT,
    prometheusPath: constants_1.METRICS_PATH,
    kafkaBrokers: exports.KAFKA_BROKERS,
    kafkaConsumerGroupId: KAFKA_CONSUMER_GROUP_ID,
    rpcRequestTimeout: RPC_REQUEST_TIMEOUT,
    shouldCompressRequest: ENABLE_RPC_REQUEST_COMPRESSION,
};
exports.getIntegratorByIdOrThrow = ((integratorsMap) => (integratorId) => {
    const integrator = integratorsMap.get(integratorId);
    if (!integrator) {
        throw new Error(`Integrator ${integratorId} does not exist.`);
    }
    return integrator;
})(transformIntegratorsAcl(INTEGRATORS_ACL, 'integratorId'));
/**
 * Gets the integrator ID for a given API key. If the API key is not in the configuration, returns `undefined`.
 */
exports.getIntegratorIdForApiKey = ((integratorsMap) => (apiKey) => {
    const integrator = integratorsMap.get(apiKey);
    return integrator === null || integrator === void 0 ? void 0 : integrator.integratorId;
})(transformIntegratorsAcl(INTEGRATORS_ACL, 'apiKeys'));
/**
 * Utility function to transform INTEGRATORS_ACL into a map of apiKey => integrator. The result can
 * be used to optimize the lookup of the integrator when a request comes in with an api key. Lookup complexity
 * becomes O(1) with the map instead of O(# integrators * # api keys) with the array.
 *
 * @param integrators the integrators map from the environment variable
 * @param keyBy either apiKeys (creates map keyed by every API key) or 'integratorId' (integratorId => Integrator)
 */
function transformIntegratorsAcl(integrators, keyBy) {
    const result = new Map();
    integrators.forEach((integrator) => {
        let mapKeys;
        switch (keyBy) {
            case 'apiKeys':
                mapKeys = integrator.apiKeys;
                break;
            case 'integratorId':
                mapKeys = [integrator.integratorId];
                break;
            default:
                throw new Error(`Parameter "${keyBy}" is misconfigured`);
        }
        mapKeys.forEach((apiKey) => {
            result.set(apiKey, integrator);
        });
    });
    return result;
}
/**
 * Resolves a config of type T for an Enviornment Variable. Checks:
 *  - If the env variable is undefined, use the hardcoded fallback
 *  - If the env variable points to a filepath, resolve it
 *  - Otherwise, just use the env variable
 *
 * @param envVar - the name of the Environment Variable
 * @param envVarType - the type
 * @param fallback  - A hardcoded fallback value
 * @returns The config
 */
function resolveEnvVar(envVar, envVarType, fallback) {
    const rawEnvVar = process.env[envVar];
    if (rawEnvVar === undefined || _.isEmpty(rawEnvVar)) {
        return fallback;
    }
    // If the enviornment variable points to a file
    if (fs.existsSync(rawEnvVar)) {
        return JSON.parse(fs.readFileSync(rawEnvVar, 'utf8'));
    }
    return assertEnvVarType(envVar, process.env[envVar], envVarType);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
function assertEnvVarType(name, value, expectedType) {
    if (value === undefined) {
        throw new Error(`${name} is not defined`);
    }
    let returnValue;
    switch (expectedType) {
        case EnvVarType.Port: {
            returnValue = parseInt(value, 10);
            const isWithinRange = returnValue >= 0 && returnValue <= 65535;
            if (isNaN(returnValue) || !isWithinRange) {
                throw new Error(`${name} must be between 0 to 65535, found ${value}.`);
            }
            return returnValue;
        }
        case EnvVarType.ChainId:
        case EnvVarType.KeepAliveTimeout:
        case EnvVarType.Integer:
            returnValue = parseInt(value, 10);
            if (isNaN(returnValue)) {
                throw new Error(`${name} must be a valid integer, found ${value}.`);
            }
            return returnValue;
        case EnvVarType.Float:
            returnValue = parseFloat(value);
            if (isNaN(returnValue)) {
                throw new Error(`${name} must be a valid float, found ${value}`);
            }
            return returnValue;
        case EnvVarType.ETHAddressHex:
            assert_1.assert.isETHAddressHex(name, value);
            return value;
        case EnvVarType.Url:
            assert_1.assert.isUri(name, value);
            return value;
        case EnvVarType.UrlList: {
            assert_1.assert.isString(name, value);
            const urlList = value.split(',');
            urlList.forEach((url, i) => assert_1.assert.isUri(`${name}[${i}]`, url));
            return urlList;
        }
        case EnvVarType.Boolean:
            return value === 'true';
        case EnvVarType.UnitAmount:
            returnValue = new utils_1.BigNumber(parseFloat(value));
            if (returnValue.isNaN() || returnValue.isNegative()) {
                throw new Error(`${name} must be valid number greater than 0.`);
            }
            return returnValue;
        case EnvVarType.AddressList: {
            assert_1.assert.isString(name, value);
            const addressList = value.split(',').map((a) => a.toLowerCase());
            addressList.forEach((a, i) => assert_1.assert.isETHAddressHex(`${name}[${i}]`, a));
            return addressList;
        }
        case EnvVarType.StringList: {
            assert_1.assert.isString(name, value);
            const stringList = value.split(',');
            return stringList;
        }
        case EnvVarType.WhitelistAllTokens:
            return '*';
        case EnvVarType.NonEmptyString:
            assert_1.assert.isString(name, value);
            if (value === '') {
                throw new Error(`${name} must be supplied`);
            }
            return value;
        case EnvVarType.APIKeys: {
            assert_1.assert.isString(name, value);
            const apiKeys = value.split(',').filter((key) => !!key.trim());
            apiKeys.forEach((apiKey) => {
                const isValidUUID = validateUUID(apiKey);
                if (!isValidUUID) {
                    throw new Error(`API Key ${apiKey} isn't UUID compliant`);
                }
            });
            return apiKeys;
        }
        case EnvVarType.JsonStringList: {
            assert_1.assert.isString(name, value);
            return JSON.parse(value);
        }
        case EnvVarType.RfqMakerAssetOfferings: {
            const offerings = JSON.parse(value);
            for (const makerEndpoint in offerings) {
                assert_1.assert.isWebUri('market maker endpoint', makerEndpoint);
                const assetOffering = offerings[makerEndpoint];
                assert_1.assert.isArray(`value in maker endpoint mapping, for index ${makerEndpoint},`, assetOffering);
                assetOffering.forEach((assetPair, i) => {
                    assert_1.assert.isArray(`asset pair array ${i} for maker endpoint ${makerEndpoint}`, assetPair);
                    assert_1.assert.assert(assetPair.length === 2, `asset pair array ${i} for maker endpoint ${makerEndpoint} does not consist of exactly two elements.`);
                    assert_1.assert.isETHAddressHex(`first token address for asset pair ${i} for maker endpoint ${makerEndpoint}`, assetPair[0]);
                    assert_1.assert.isETHAddressHex(`second token address for asset pair ${i} for maker endpoint ${makerEndpoint}`, assetPair[1]);
                    assert_1.assert.assert(assetPair[0] !== assetPair[1], `asset pair array ${i} for maker endpoint ${makerEndpoint} has identical assets`);
                });
            }
            return offerings;
        }
        default:
            throw new Error(`Unrecognised EnvVarType: ${expectedType} encountered for variable ${name}.`);
    }
}
//# sourceMappingURL=config.js.map