"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapHandlers = void 0;
const api_utils_1 = require("@0x/api-utils");
const token_metadata_1 = require("@0x/token-metadata");
const utils_1 = require("@0x/utils");
const http_status_codes_1 = require("http-status-codes");
const kafkajs_1 = require("kafkajs");
const _ = require("lodash");
const prom_client_1 = require("prom-client");
const asset_swapper_1 = require("../asset-swapper");
const constants_1 = require("../asset-swapper/utils/market_operation_utils/constants");
const constants_2 = require("../asset-swapper/constants");
const config_1 = require("../config");
const constants_3 = require("../constants");
const errors_1 = require("../errors");
const schemas_1 = require("../schemas");
const address_utils_1 = require("../utils/address_utils");
const l2_gas_utils_1 = require("../utils/l2_gas_utils");
const parse_utils_1 = require("../utils/parse_utils");
const quote_report_utils_1 = require("../utils/quote_report_utils");
const schema_utils_1 = require("../utils/schema_utils");
const asset_swapper_2 = require("../asset-swapper");
let kafkaProducer;
if (config_1.KAFKA_BROKERS !== undefined) {
    const kafka = new kafkajs_1.Kafka({
        clientId: '0x-api',
        brokers: config_1.KAFKA_BROKERS,
    });
    kafkaProducer = kafka.producer();
    kafkaProducer.connect();
}
const BEARER_REGEX = /^Bearer\s(.{36})$/;
const REGISTRY_SET = new Set(config_1.RFQT_REGISTRY_PASSWORDS);
const REGISTRY_ENDPOINT_FETCHED = new prom_client_1.Counter({
    name: 'swap_handler_registry_endpoint_fetched',
    help: 'Requests to the swap handler',
    labelNames: ['identifier'],
});
const HTTP_SWAP_RESPONSE_TIME = new prom_client_1.Histogram({
    name: 'http_swap_response_time',
    help: 'The response time of a HTTP Swap request',
    buckets: config_1.PROMETHEUS_REQUEST_BUCKETS,
});
const HTTP_SWAP_REQUESTS = new prom_client_1.Counter({
    name: 'swap_requests',
    help: 'Total number of swap requests',
    labelNames: ['endpoint', 'chain_id', 'api_key', 'integrator_id'],
});
const PRICE_IMPACT_PROTECTION_SPECIFIED = new prom_client_1.Counter({
    name: 'price_impact_protection_specified',
    help: 'price impact protection was specified by client',
});
class SwapHandlers {
    constructor(swapService) {
        this._swapService = swapService;
    }
    static root(_req, res) {
        const message = `This is the root of the Swap API. Visit ${constants_3.SWAP_DOCS_URL} for details about this API.`;
        res.status(http_status_codes_1.StatusCodes.OK).send({ message });
    }
    static getLiquiditySources(_req, res) {
        const sources = constants_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[config_1.CHAIN_ID].sources
            .map((s) => (s === asset_swapper_1.ERC20BridgeSource.Native ? '0x' : s))
            .sort((a, b) => a.localeCompare(b));
        res.status(http_status_codes_1.StatusCodes.OK).send({ records: sources });
    }
    static getRfqRegistry(req, res) {
        const auth = req.header('Authorization');
        REGISTRY_ENDPOINT_FETCHED.labels(auth || 'N/A').inc();
        if (auth === undefined) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).end();
        }
        const authTokenRegex = auth.match(BEARER_REGEX);
        if (!authTokenRegex) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).end();
        }
        const authToken = authTokenRegex[1];
        if (!REGISTRY_SET.has(authToken)) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).end();
        }
        res.status(http_status_codes_1.StatusCodes.OK).send(config_1.RFQT_INTEGRATOR_IDS).end();
    }
    async getQuoteAsync(req, res) {
        var _a, _b, _c, _d, _e;
        const begin = Date.now();
        const params = parseSwapQuoteRequestParams(req, 'quote');
        const quote = await this._getSwapQuoteAsync(params);
        if (params.rfqt !== undefined) {
            req.log.info({
                firmQuoteServed: {
                    taker: params.takerAddress,
                    affiliateAddress: params.affiliateAddress,
                    // TODO (MKR-123): remove once the log consumers have been updated
                    apiKey: (_a = params.integrator) === null || _a === void 0 ? void 0 : _a.integratorId,
                    integratorId: (_b = params.integrator) === null || _b === void 0 ? void 0 : _b.integratorId,
                    integratorLabel: (_c = params.integrator) === null || _c === void 0 ? void 0 : _c.label,
                    origin: params.origin,
                    rawApiKey: params.apiKey,
                    buyToken: params.buyToken,
                    sellToken: params.sellToken,
                    buyAmount: params.buyAmount,
                    sellAmount: params.sellAmount,
                    // makers: quote.orders.map(order => order.makerAddress),
                },
            });
        }
        if (quote.extendedQuoteReportSources && kafkaProducer) {
            const quoteId = getQuoteIdFromSwapQuote(quote);
            (0, quote_report_utils_1.publishQuoteReport)({
                quoteId,
                taker: params.takerAddress,
                quoteReportSources: quote.extendedQuoteReportSources,
                submissionBy: 'taker',
                decodedUniqueId: quote.decodedUniqueId,
                buyTokenAddress: quote.buyTokenAddress,
                sellTokenAddress: quote.sellTokenAddress,
                buyAmount: params.buyAmount,
                sellAmount: params.sellAmount,
                integratorId: (_d = params.integrator) === null || _d === void 0 ? void 0 : _d.integratorId,
                blockNumber: quote.blockNumber,
                slippage: params.slippagePercentage,
                estimatedGas: quote.estimatedGas,
                enableSlippageProtection: params.enableSlippageProtection,
                expectedSlippage: quote.expectedSlippage,
                estimatedPriceImpact: quote.estimatedPriceImpact,
                priceImpactProtectionPercentage: params.priceImpactProtectionPercentage,
            }, true, kafkaProducer);
        }
        const response = _.omit({
            ...quote,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
            orders: quote.orders.map((o) => _.omit(o, 'fills')),
        }, 'quoteReport', 'extendedQuoteReportSources', 'blockNumber');
        const duration = (new Date().getTime() - begin) / constants_3.ONE_SECOND_MS;
        HTTP_SWAP_RESPONSE_TIME.observe(duration);
        HTTP_SWAP_REQUESTS.labels('quote', config_1.CHAIN_ID.toString(), params.apiKey !== undefined ? params.apiKey : 'N/A', ((_e = params.integrator) === null || _e === void 0 ? void 0 : _e.integratorId) || 'N/A').inc();
        res.status(http_status_codes_1.StatusCodes.OK).send(response);
    }
    async getQuotePriceAsync(req, res) {
        var _a, _b, _c, _d, _e;
        const params = parseSwapQuoteRequestParams(req, 'price');
        const quote = await this._getSwapQuoteAsync({ ...params });
        req.log.info({
            indicativeQuoteServed: {
                taker: params.takerAddress,
                affiliateAddress: params.affiliateAddress,
                // TODO (MKR-123): remove once the log source is updated
                apiKey: (_a = params.integrator) === null || _a === void 0 ? void 0 : _a.integratorId,
                integratorId: (_b = params.integrator) === null || _b === void 0 ? void 0 : _b.integratorId,
                integratorLabel: (_c = params.integrator) === null || _c === void 0 ? void 0 : _c.label,
                origin: params.origin,
                rawApiKey: params.apiKey,
                buyToken: params.buyToken,
                sellToken: params.sellToken,
                buyAmount: params.buyAmount,
                sellAmount: params.sellAmount,
                // makers: quote.orders.map(o => o.makerAddress),
            },
        });
        const response = _.pick(quote, 'chainId', 'price', 'estimatedPriceImpact', 'value', 'gasPrice', 'gas', 'estimatedGas', 'protocolFee', 'minimumProtocolFee', 'buyTokenAddress', 'buyAmount', 'sellTokenAddress', 'sellAmount', 'sources', 'allowanceTarget', 'sellTokenToEthRate', 'buyTokenToEthRate', 'expectedSlippage');
        if (quote.extendedQuoteReportSources && kafkaProducer) {
            const quoteId = getQuoteIdFromSwapQuote(quote);
            (0, quote_report_utils_1.publishQuoteReport)({
                quoteId,
                taker: params.takerAddress,
                quoteReportSources: quote.extendedQuoteReportSources,
                submissionBy: 'taker',
                decodedUniqueId: quote.decodedUniqueId,
                buyTokenAddress: quote.buyTokenAddress,
                sellTokenAddress: quote.sellTokenAddress,
                buyAmount: params.buyAmount,
                sellAmount: params.sellAmount,
                integratorId: (_d = params.integrator) === null || _d === void 0 ? void 0 : _d.integratorId,
                slippage: params.slippagePercentage,
                blockNumber: quote.blockNumber,
                estimatedGas: quote.estimatedGas,
                enableSlippageProtection: params.enableSlippageProtection,
                expectedSlippage: quote.expectedSlippage,
                estimatedPriceImpact: quote.estimatedPriceImpact,
                priceImpactProtectionPercentage: params.priceImpactProtectionPercentage,
            }, false, kafkaProducer);
        }
        HTTP_SWAP_REQUESTS.labels('price', config_1.CHAIN_ID.toString(), params.apiKey !== undefined ? params.apiKey : 'N/A', ((_e = params.integrator) === null || _e === void 0 ? void 0 : _e.integratorId) || 'N/A').inc();
        res.status(http_status_codes_1.StatusCodes.OK).send(response);
    }
    async _getSwapQuoteAsync(params) {
        try {
            let swapQuote;
            if (params.isUnwrap) {
                swapQuote = await this._swapService.getSwapQuoteForUnwrapAsync(params);
            }
            else if (params.isWrap) {
                swapQuote = await this._swapService.getSwapQuoteForWrapAsync(params);
            }
            else {
                swapQuote = await this._swapService.calculateSwapQuoteAsync(params);
            }
            // Add additional L1 gas cost.
            if (config_1.CHAIN_ID === asset_swapper_1.ChainId.Arbitrum) {
                const gasUtils = asset_swapper_2.GasPriceUtils.getInstance(constants_2.constants.PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS, config_1.ZERO_EX_GAS_API_URL);
                const gasPrices = await gasUtils.getGasPriceEstimationOrDefault({
                    fast: 100000000, // 0.1 gwei in wei
                });
                const l1GasCostEstimate = new utils_1.BigNumber((0, l2_gas_utils_1.estimateArbitrumL1CalldataGasCost)({
                    l2GasPrice: gasPrices.fast,
                    l1CalldataPricePerUnit: gasPrices.l1CalldataPricePerUnit,
                    calldata: swapQuote.data,
                }));
                swapQuote.estimatedGas = swapQuote.estimatedGas.plus(l1GasCostEstimate);
                swapQuote.gas = swapQuote.gas.plus(l1GasCostEstimate);
            }
            return swapQuote;
        }
        catch (e) {
            // If this is already a transformed error then just re-throw
            if ((0, api_utils_1.isAPIError)(e)) {
                throw e;
            }
            // Wrap a Revert error as an API revert error
            if ((0, api_utils_1.isRevertError)(e)) {
                throw new errors_1.RevertAPIError(e);
            }
            const errorMessage = e.message;
            // TODO AssetSwapper can throw raw Errors or InsufficientAssetLiquidityError
            if (errorMessage.startsWith(asset_swapper_1.SwapQuoterError.InsufficientAssetLiquidity) ||
                errorMessage.startsWith('NO_OPTIMAL_PATH')) {
                throw new errors_1.ValidationError([
                    {
                        field: params.sellAmount ? 'sellAmount' : 'buyAmount',
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        reason: asset_swapper_1.SwapQuoterError.InsufficientAssetLiquidity,
                        description: 'We are not able to fulfill an order for this token pair at the requested amount due to a lack of liquidity',
                    },
                ]);
            }
            if (errorMessage.startsWith(asset_swapper_1.SwapQuoterError.AssetUnavailable)) {
                throw new errors_1.ValidationError([
                    {
                        field: 'token',
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        reason: e.message,
                    },
                ]);
            }
            throw new errors_1.InternalServerError(e.message);
        }
    }
}
exports.SwapHandlers = SwapHandlers;
const parseSwapQuoteRequestParams = (req, endpoint) => {
    // HACK typescript typing does not allow this valid json-schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
    schema_utils_1.schemaUtils.validateSchema(req.query, schemas_1.schemas.swapQuoteRequestSchema);
    const apiKey = req.header('0x-api-key');
    const origin = req.header('origin');
    let integratorId;
    if (apiKey) {
        integratorId = (0, config_1.getIntegratorIdForApiKey)(apiKey);
    }
    // Parse string params
    const { takerAddress, affiliateAddress } = req.query;
    // Parse boolean params and defaults
    // The /quote and /price endpoints should have different default behavior on skip validation
    const defaultSkipValidation = endpoint === 'quote' ? false : true;
    // Allow the query parameter skipValidation to override the default
    let skipValidation = req.query.skipValidation === undefined ? defaultSkipValidation : req.query.skipValidation === 'true';
    if (endpoint === 'quote' && integratorId !== undefined && integratorId === config_1.MATCHA_INTEGRATOR_ID) {
        // NOTE: force skip validation to false if the quote comes from Matcha
        // NOTE: allow skip validation param if the quote comes from unknown integrators (without API keys or Simbot)
        skipValidation = false;
    }
    // Whether the entire callers balance should be sold, used for contracts where the
    // amount available is non-deterministic
    const shouldSellEntireBalance = req.query.shouldSellEntireBalance === 'true' ? true : false;
    const isDebugEnabled = req.query.debug === 'true' ? true : false;
    // Parse tokens and eth wrap/unwraps
    const sellTokenRaw = req.query.sellToken;
    const buyTokenRaw = req.query.buyToken;
    const isNativeSell = (0, token_metadata_1.isNativeSymbolOrAddress)(sellTokenRaw, config_1.CHAIN_ID);
    const isNativeBuy = (0, token_metadata_1.isNativeSymbolOrAddress)(buyTokenRaw, config_1.CHAIN_ID);
    // NOTE: Internally all Native token (like ETH) trades are for their wrapped equivalent (ie WETH), we just wrap/unwrap automatically
    const sellToken = (0, address_utils_1.findTokenAddressOrThrowApiError)(isNativeSell ? constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[config_1.CHAIN_ID] : sellTokenRaw, 'sellToken', config_1.CHAIN_ID).toLowerCase();
    const buyToken = (0, address_utils_1.findTokenAddressOrThrowApiError)(isNativeBuy ? constants_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[config_1.CHAIN_ID] : buyTokenRaw, 'buyToken', config_1.CHAIN_ID).toLowerCase();
    const isWrap = isNativeSell && (0, token_metadata_1.isNativeWrappedSymbolOrAddress)(buyToken, config_1.CHAIN_ID);
    const isUnwrap = (0, token_metadata_1.isNativeWrappedSymbolOrAddress)(sellToken, config_1.CHAIN_ID) && isNativeBuy;
    // if token addresses are the same but a unwrap or wrap operation is requested, ignore error
    if (!isUnwrap && !isWrap && sellToken === buyToken) {
        throw new errors_1.ValidationError(['buyToken', 'sellToken'].map((field) => {
            return {
                field,
                code: errors_1.ValidationErrorCodes.RequiredField,
                reason: 'buyToken and sellToken must be different',
            };
        }));
    }
    if (sellToken === utils_1.NULL_ADDRESS || buyToken === utils_1.NULL_ADDRESS) {
        throw new errors_1.ValidationError(['buyToken', 'sellToken'].map((field) => {
            return {
                field,
                code: errors_1.ValidationErrorCodes.FieldInvalid,
                reason: 'Invalid token combination',
            };
        }));
    }
    // Parse number params
    const sellAmount = req.query.sellAmount === undefined ? undefined : new utils_1.BigNumber(req.query.sellAmount);
    const buyAmount = req.query.buyAmount === undefined ? undefined : new utils_1.BigNumber(req.query.buyAmount);
    const gasPrice = req.query.gasPrice === undefined ? undefined : new utils_1.BigNumber(req.query.gasPrice);
    const slippagePercentage = req.query.slippagePercentage === undefined
        ? constants_3.DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE
        : Number.parseFloat(req.query.slippagePercentage);
    if (slippagePercentage > 1) {
        throw new errors_1.ValidationError([
            {
                field: 'slippagePercentage',
                code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
            },
        ]);
    }
    let priceImpactProtectionPercentage = constants_3.DEFAULT_PRICE_IMPACT_PROTECTION_PERCENTAGE;
    if (req.query.priceImpactProtectionPercentage !== undefined) {
        PRICE_IMPACT_PROTECTION_SPECIFIED.inc();
        priceImpactProtectionPercentage = Number.parseFloat(req.query.priceImpactProtectionPercentage);
        if (priceImpactProtectionPercentage > 1) {
            throw new errors_1.ValidationError([
                {
                    field: 'priceImpactProtectionPercentage',
                    code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                    reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
                    description: 'priceImpactProtectionPercentage should be between 0 and 1.0',
                },
            ]);
        }
    }
    // Parse sources
    const { excludedSources, includedSources, nativeExclusivelyRFQT } = parse_utils_1.parseUtils.parseRequestForExcludedSources({
        excludedSources: req.query.excludedSources,
        includedSources: req.query.includedSources,
        intentOnFilling: req.query.intentOnFilling,
        takerAddress: takerAddress,
        apiKey,
    }, config_1.RFQT_API_KEY_WHITELIST, endpoint);
    const isAllExcluded = Object.values(asset_swapper_1.ERC20BridgeSource).every((s) => excludedSources.includes(s));
    if (isAllExcluded) {
        throw new errors_1.ValidationError([
            {
                field: 'excludedSources',
                code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                reason: 'Request excluded all sources',
            },
        ]);
    }
    const rfqt = (() => {
        if (apiKey) {
            if (endpoint === 'quote' && takerAddress) {
                return {
                    intentOnFilling: req.query.intentOnFilling === 'true',
                    isIndicative: false,
                    nativeExclusivelyRFQT,
                };
            }
            else if (endpoint === 'price') {
                return {
                    intentOnFilling: false,
                    isIndicative: true,
                    nativeExclusivelyRFQT,
                };
            }
        }
        return undefined;
    })();
    const affiliateFee = parse_utils_1.parseUtils.parseAffiliateFeeOptions(req);
    const integrator = integratorId ? (0, config_1.getIntegratorByIdOrThrow)(integratorId) : undefined;
    const enableSlippageProtection = parseOptionalBooleanParam(req.query.enableSlippageProtection, constants_3.DEFAULT_ENABLE_SLIPPAGE_PROTECTION);
    // Log the request if it passes all validations
    req.log.info({
        type: 'swapRequest',
        endpoint,
        excludedSources,
        nativeExclusivelyRFQT,
        // TODO (MKR-123): Remove once the log source has been updated.
        apiKey: integratorId || 'N/A',
        integratorId: integratorId || 'N/A',
        integratorLabel: (integrator === null || integrator === void 0 ? void 0 : integrator.label) || 'N/A',
        rawApiKey: apiKey || 'N/A',
        enableSlippageProtection,
        priceImpactProtectionPercentage,
    });
    return {
        affiliateAddress: affiliateAddress,
        affiliateFee,
        apiKey,
        buyAmount,
        buyToken,
        endpoint,
        excludedSources,
        gasPrice,
        includedSources,
        integrator,
        isETHBuy: isNativeBuy,
        isETHSell: isNativeSell,
        isUnwrap,
        isWrap,
        metaTransactionVersion: undefined,
        origin,
        rfqt,
        sellAmount,
        sellToken,
        shouldSellEntireBalance,
        skipValidation,
        slippagePercentage,
        takerAddress: takerAddress,
        enableSlippageProtection,
        priceImpactProtectionPercentage,
        isDebugEnabled,
    };
};
/**
 * If undefined, use the default value, else parse the value as a boolean.
 */
function parseOptionalBooleanParam(param, defaultValue) {
    if (param === undefined || param === '') {
        return defaultValue;
    }
    return param === 'true';
}
/*
 * Extract the quote ID from the quote filldata
 */
function getQuoteIdFromSwapQuote(quote) {
    const bytesPos = quote.data.indexOf(constants_3.AFFILIATE_DATA_SELECTOR);
    const quoteIdOffset = 118; // Offset of quoteId from Affiliate data selector
    const startingIndex = bytesPos + quoteIdOffset;
    const quoteId = quote.data.slice(startingIndex, startingIndex + 10);
    return quoteId;
}
//# sourceMappingURL=swap_handlers.js.map