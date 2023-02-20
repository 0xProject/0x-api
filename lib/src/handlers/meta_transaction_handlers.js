"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaTransactionHandlers = void 0;
const api_utils_1 = require("@0x/api-utils");
const token_metadata_1 = require("@0x/token-metadata");
const utils_1 = require("@0x/utils");
const http_status_codes_1 = require("http-status-codes");
const _ = require("lodash");
const asset_swapper_1 = require("../asset-swapper");
const config_1 = require("../config");
const constants_1 = require("../constants");
const errors_1 = require("../errors");
const logger_1 = require("../logger");
const schemas_1 = require("../schemas");
const address_utils_1 = require("../utils/address_utils");
const parse_utils_1 = require("../utils/parse_utils");
const schema_utils_1 = require("../utils/schema_utils");
class MetaTransactionHandlers {
    constructor(metaTransactionService) {
        this._metaTransactionService = metaTransactionService;
    }
    static rootAsync(_req, res) {
        const message = `This is the root of the Meta Transaction API. Visit ${constants_1.META_TRANSACTION_DOCS_URL} for details about this API.`;
        res.status(http_status_codes_1.StatusCodes.OK).send({ message });
    }
    /**
     * Handler for the /meta_transaction/v2/quote endpoint
     */
    async getV2QuoteAsync(req, res) {
        schema_utils_1.schemaUtils.validateSchema(req.body, schemas_1.schemas.metaTransactionQuoteRequestSchema);
        // parse query prams
        const params = parseV2RequestBody(req);
        const { buyTokenAddress, sellTokenAddress } = params;
        const isETHBuy = (0, token_metadata_1.isNativeSymbolOrAddress)(buyTokenAddress, config_1.CHAIN_ID);
        // ETH selling isn't supported.
        if ((0, token_metadata_1.isNativeSymbolOrAddress)(sellTokenAddress, config_1.CHAIN_ID)) {
            throw new errors_1.EthSellNotSupportedError();
        }
        try {
            const metaTransactionQuote = await this._metaTransactionService.getMetaTransactionV2QuoteAsync({
                ...params,
                isETHBuy,
                isETHSell: false,
                from: params.takerAddress,
            });
            res.status(http_status_codes_1.StatusCodes.OK).send(metaTransactionQuote);
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
                        field: params.buyAmount ? 'buyAmount' : 'sellAmount',
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        reason: asset_swapper_1.SwapQuoterError.InsufficientAssetLiquidity,
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
            logger_1.logger.info({ errorMessage, stack: e.stack }, 'Uncaught error in `getV2QuoteAsync`');
            throw e;
        }
    }
    /**
     * Handler for the /meta_transaction/v2/price endpoint
     */
    async getV2PriceAsync(req, res) {
        schema_utils_1.schemaUtils.validateSchema(req.body, schemas_1.schemas.metaTransactionQuoteRequestSchema);
        // parse query params
        const params = parseV2RequestBody(req);
        const { buyTokenAddress, sellTokenAddress } = params;
        // ETH selling isn't supported.
        if ((0, token_metadata_1.isNativeSymbolOrAddress)(sellTokenAddress, config_1.CHAIN_ID)) {
            throw new errors_1.EthSellNotSupportedError();
        }
        const isETHBuy = (0, token_metadata_1.isNativeSymbolOrAddress)(buyTokenAddress, config_1.CHAIN_ID);
        try {
            const metaTransactionPriceCalculation = await this._metaTransactionService.getMetaTransactionV2PriceAsync({
                ...params,
                from: params.takerAddress,
                isETHBuy,
                isETHSell: false,
            });
            const metaTransactionPriceResponse = {
                ..._.omit(metaTransactionPriceCalculation, 'orders', 'quoteReport', 'estimatedGasTokenRefund'),
                value: metaTransactionPriceCalculation.protocolFee,
                gas: metaTransactionPriceCalculation.estimatedGas,
            };
            res.status(http_status_codes_1.StatusCodes.OK).send(metaTransactionPriceResponse);
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
                        field: params.buyAmount ? 'buyAmount' : 'sellAmount',
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        reason: asset_swapper_1.SwapQuoterError.InsufficientAssetLiquidity,
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
            logger_1.logger.info({ errorMessage, stack: e.stack }, 'Uncaught error in `getV2PriceAsync`');
            throw new errors_1.InternalServerError(e.message);
        }
    }
    /**
     * Handler for the /meta_transaction/v1/quote endpoint
     */
    async getV1QuoteAsync(req, res) {
        schema_utils_1.schemaUtils.validateSchema(req.query, schemas_1.schemas.metaTransactionQuoteRequestSchema);
        // parse query params
        const params = parseV1RequestParams(req);
        const { buyTokenAddress, sellTokenAddress } = params;
        const isETHBuy = (0, token_metadata_1.isNativeSymbolOrAddress)(buyTokenAddress, config_1.CHAIN_ID);
        // ETH selling isn't supported.
        if ((0, token_metadata_1.isNativeSymbolOrAddress)(sellTokenAddress, config_1.CHAIN_ID)) {
            throw new errors_1.EthSellNotSupportedError();
        }
        try {
            const metaTransactionQuote = await this._metaTransactionService.getMetaTransactionV1QuoteAsync({
                ...params,
                isETHBuy,
                isETHSell: false,
                from: params.takerAddress,
            });
            res.status(http_status_codes_1.StatusCodes.OK).send(metaTransactionQuote);
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
                        field: params.buyAmount ? 'buyAmount' : 'sellAmount',
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        reason: asset_swapper_1.SwapQuoterError.InsufficientAssetLiquidity,
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
            logger_1.logger.info({ errorMessage, stack: e.stack }, 'Uncaught error in `getV1QuoteAsync`');
            throw e;
        }
    }
    /**
     * Handler for the /meta_transaction/v1/price endpoint
     */
    async getV1PriceAsync(req, res) {
        schema_utils_1.schemaUtils.validateSchema(req.query, schemas_1.schemas.metaTransactionQuoteRequestSchema);
        // parse query params
        const params = parseV1RequestParams(req);
        const { buyTokenAddress, sellTokenAddress } = params;
        // ETH selling isn't supported.
        if ((0, token_metadata_1.isNativeSymbolOrAddress)(sellTokenAddress, config_1.CHAIN_ID)) {
            throw new errors_1.EthSellNotSupportedError();
        }
        const isETHBuy = (0, token_metadata_1.isNativeSymbolOrAddress)(buyTokenAddress, config_1.CHAIN_ID);
        try {
            const metaTransactionPriceCalculation = await this._metaTransactionService.getMetaTransactionV1PriceAsync({
                ...params,
                from: params.takerAddress,
                isETHBuy,
                isETHSell: false,
            });
            const metaTransactionPriceResponse = {
                ..._.omit(metaTransactionPriceCalculation, 'orders', 'quoteReport', 'estimatedGasTokenRefund'),
                value: metaTransactionPriceCalculation.protocolFee,
                gas: metaTransactionPriceCalculation.estimatedGas,
            };
            res.status(http_status_codes_1.StatusCodes.OK).send(metaTransactionPriceResponse);
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
                        field: params.buyAmount ? 'buyAmount' : 'sellAmount',
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        reason: asset_swapper_1.SwapQuoterError.InsufficientAssetLiquidity,
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
            logger_1.logger.info({ errorMessage, stack: e.stack }, 'Uncaught error in `getV1PriceAsync`');
            throw new errors_1.InternalServerError(e.message);
        }
    }
}
exports.MetaTransactionHandlers = MetaTransactionHandlers;
function parseV1RequestParams(req) {
    const affiliateAddress = req.query.affiliateAddress;
    const affiliateFee = parse_utils_1.parseUtils.parseAffiliateFeeOptions(req);
    const buyAmount = req.query.buyAmount === undefined ? undefined : new utils_1.BigNumber(req.query.buyAmount);
    const buyToken = req.query.buyToken;
    const buyTokenAddress = (0, address_utils_1.findTokenAddressOrThrowApiError)(buyToken, 'buyToken', config_1.CHAIN_ID);
    const integratorId = req.query.integratorId;
    const quoteUniqueId = req.query.quoteUniqueId;
    const sellAmount = req.query.sellAmount === undefined ? undefined : new utils_1.BigNumber(req.query.sellAmount);
    const sellToken = req.query.sellToken;
    const sellTokenAddress = (0, address_utils_1.findTokenAddressOrThrowApiError)(sellToken, 'sellToken', config_1.CHAIN_ID);
    const takerAddress = req.query.takerAddress.toLowerCase();
    const slippagePercentage = parseFloat(req.query.slippagePercentage) || constants_1.DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE;
    if (slippagePercentage >= 1) {
        throw new errors_1.ValidationError([
            {
                field: 'slippagePercentage',
                code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
            },
        ]);
    }
    if (slippagePercentage < config_1.META_TX_MIN_ALLOWED_SLIPPAGE) {
        throw new errors_1.ValidationError([
            {
                field: 'slippagePercentage',
                code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                reason: errors_1.ValidationErrorReasons.MinSlippageTooLow,
            },
        ]);
    }
    const priceImpactProtectionPercentage = req.query.priceImpactProtectionPercentage === undefined
        ? constants_1.DEFAULT_PRICE_IMPACT_PROTECTION_PERCENTAGE
        : Number.parseFloat(req.query.priceImpactProtectionPercentage);
    // Note: no RFQT config is passed through here so RFQT is excluded
    const excludedSources = req.query.excludedSources === undefined
        ? []
        : parse_utils_1.parseUtils.parseStringArrForERC20BridgeSources(req.query.excludedSources.split(','));
    const includedSources = req.query.includedSources === undefined
        ? undefined
        : parse_utils_1.parseUtils.parseStringArrForERC20BridgeSources(req.query.includedSources.split(','));
    return {
        takerAddress,
        sellTokenAddress,
        buyTokenAddress,
        sellAmount,
        buyAmount,
        slippagePercentage,
        excludedSources,
        includedSources,
        affiliateFee,
        affiliateAddress,
        integratorId,
        quoteUniqueId,
        priceImpactProtectionPercentage,
    };
}
/**
 * Parse meta-transaction v2 quote and price body.
 */
function parseV2RequestBody(req) {
    const affiliateAddress = req.body.affiliateAddress;
    const affiliateFee = {
        feeType: asset_swapper_1.AffiliateFeeType.None,
        recipient: constants_1.NULL_ADDRESS,
        sellTokenPercentageFee: 0,
        buyTokenPercentageFee: 0,
    };
    const buyAmount = req.body.buyAmount === undefined ? undefined : new utils_1.BigNumber(req.body.buyAmount);
    const buyToken = req.body.buyToken;
    const buyTokenAddress = (0, address_utils_1.findTokenAddressOrThrowApiError)(buyToken, 'buyToken', config_1.CHAIN_ID);
    const integratorId = req.body.integratorId;
    const quoteUniqueId = req.body.quoteUniqueId;
    const sellAmount = req.body.sellAmount === undefined ? undefined : new utils_1.BigNumber(req.body.sellAmount);
    const sellToken = req.body.sellToken;
    const sellTokenAddress = (0, address_utils_1.findTokenAddressOrThrowApiError)(sellToken, 'sellToken', config_1.CHAIN_ID);
    const takerAddress = req.body.takerAddress.toLowerCase();
    const metaTransactionVersion = req.body.metaTransactionVersion;
    if (metaTransactionVersion !== 'v1' && metaTransactionVersion !== 'v2') {
        throw new errors_1.ValidationError([
            {
                field: 'metaTransactionVersion',
                code: errors_1.ValidationErrorCodes.IncorrectFormat,
                reason: errors_1.ValidationErrorReasons.InvalidMetaTransactionVersion,
            },
        ]);
    }
    const slippagePercentage = parseFloat(req.body.slippagePercentage) || constants_1.DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE;
    if (slippagePercentage >= 1) {
        throw new errors_1.ValidationError([
            {
                field: 'slippagePercentage',
                code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
            },
        ]);
    }
    if (slippagePercentage < config_1.META_TX_MIN_ALLOWED_SLIPPAGE) {
        throw new errors_1.ValidationError([
            {
                field: 'slippagePercentage',
                code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                reason: errors_1.ValidationErrorReasons.MinSlippageTooLow,
            },
        ]);
    }
    const priceImpactProtectionPercentage = req.body.priceImpactProtectionPercentage === undefined
        ? constants_1.DEFAULT_PRICE_IMPACT_PROTECTION_PERCENTAGE
        : Number.parseFloat(req.body.priceImpactProtectionPercentage);
    // Note: no RFQT config is passed through here so RFQT is excluded
    const excludedSources = req.body.excludedSources === undefined
        ? []
        : parse_utils_1.parseUtils.parseStringArrForERC20BridgeSources(req.body.excludedSources.split(','));
    const includedSources = req.body.includedSources === undefined
        ? undefined
        : parse_utils_1.parseUtils.parseStringArrForERC20BridgeSources(req.body.includedSources.split(','));
    const parsedFeeConfigs = _parseFeeConfigs(req);
    return {
        takerAddress,
        sellTokenAddress,
        buyTokenAddress,
        sellAmount,
        buyAmount,
        slippagePercentage,
        excludedSources,
        includedSources,
        affiliateFee,
        affiliateAddress,
        integratorId,
        metaTransactionVersion,
        quoteUniqueId,
        priceImpactProtectionPercentage,
        feeConfigs: parsedFeeConfigs,
    };
}
/**
 * Parse the fee config param.
 */
function _parseFeeConfigs(req) {
    let parsedFeeConfigs;
    if (req.body.feeConfigs) {
        const feeConfigs = req.body.feeConfigs;
        parsedFeeConfigs = {};
        // Parse the integrator fee config
        if (feeConfigs.integratorFee) {
            const integratorFee = feeConfigs.integratorFee;
            if (integratorFee.type !== 'volume') {
                throw new errors_1.ValidationError([
                    {
                        field: 'feeConfigs',
                        code: errors_1.ValidationErrorCodes.IncorrectFormat,
                        reason: errors_1.ValidationErrorReasons.InvalidGaslessFeeType,
                    },
                ]);
            }
            const volumePercentage = new utils_1.BigNumber(integratorFee.volumePercentage);
            if (volumePercentage.gte(1)) {
                throw new errors_1.ValidationError([
                    {
                        field: 'feeConfigs',
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
                    },
                ]);
            }
            parsedFeeConfigs.integratorFee = {
                type: 'volume',
                feeRecipient: integratorFee.feeRecipient,
                billingType: integratorFee.billingType,
                volumePercentage,
            };
        }
        // Parse the 0x fee config
        if (feeConfigs.zeroExFee) {
            const zeroExFee = feeConfigs.zeroExFee;
            if (zeroExFee.type !== 'volume' && zeroExFee.type !== 'integrator_share') {
                throw new errors_1.ValidationError([
                    {
                        field: 'feeConfigs',
                        code: errors_1.ValidationErrorCodes.IncorrectFormat,
                        reason: errors_1.ValidationErrorReasons.InvalidGaslessFeeType,
                    },
                ]);
            }
            if (zeroExFee.type === 'volume') {
                const feePercentage = new utils_1.BigNumber(zeroExFee.volumePercentage);
                if (feePercentage.gte(1)) {
                    throw new errors_1.ValidationError([
                        {
                            field: 'feeConfigs',
                            code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                            reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
                        },
                    ]);
                }
                parsedFeeConfigs.zeroExFee = {
                    type: 'volume',
                    feeRecipient: zeroExFee.feeRecipient,
                    billingType: zeroExFee.billingType,
                    volumePercentage: feePercentage,
                };
            }
            else if (zeroExFee.type === 'integrator_share') {
                if (!parsedFeeConfigs.integratorFee) {
                    throw new errors_1.ValidationError([
                        {
                            field: 'feeConfigs',
                            code: errors_1.ValidationErrorCodes.IncorrectFormat,
                            reason: errors_1.ValidationErrorReasons.InvalidGaslessFeeType,
                        },
                    ]);
                }
                const feePercentage = new utils_1.BigNumber(zeroExFee.integratorSharePercentage);
                if (feePercentage.gte(1)) {
                    throw new errors_1.ValidationError([
                        {
                            field: 'feeConfigs',
                            code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                            reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
                        },
                    ]);
                }
                parsedFeeConfigs.zeroExFee = {
                    type: 'integrator_share',
                    feeRecipient: zeroExFee.feeRecipient,
                    billingType: zeroExFee.billingType,
                    integratorSharePercentage: feePercentage,
                };
            }
        }
        // Parse the gas fee config
        if (feeConfigs.gasFee) {
            const gasFee = feeConfigs.gasFee;
            if (gasFee.type !== 'gas') {
                throw new errors_1.ValidationError([
                    {
                        field: 'feeConfigs',
                        code: errors_1.ValidationErrorCodes.IncorrectFormat,
                        reason: errors_1.ValidationErrorReasons.InvalidGaslessFeeType,
                    },
                ]);
            }
            parsedFeeConfigs.gasFee = {
                type: 'gas',
                feeRecipient: gasFee.feeRecipient,
                billingType: gasFee.billingType,
            };
        }
    }
    return parsedFeeConfigs;
}
//# sourceMappingURL=meta_transaction_handlers.js.map