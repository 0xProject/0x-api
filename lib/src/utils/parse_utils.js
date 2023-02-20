"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUtils = void 0;
const asset_swapper_1 = require("../asset-swapper");
const constants_1 = require("../constants");
const errors_1 = require("../errors");
const types_1 = require("../types");
exports.parseUtils = {
    parseRequestForExcludedSources(request, validApiKeys, endpoint) {
        const excludedIds = request.excludedSources ? request.excludedSources.split(',') : [];
        const includedIds = request.includedSources ? request.includedSources.split(',') : [];
        // Ensure that both filtering arguments cannot be present.
        if (excludedIds.length !== 0 && includedIds.length !== 0) {
            throw new errors_1.ValidationError([
                {
                    field: 'excludedSources',
                    code: errors_1.ValidationErrorCodes.IncorrectFormat,
                    reason: errors_1.ValidationErrorReasons.ConflictingFilteringArguments,
                },
                {
                    field: 'includedSources',
                    code: errors_1.ValidationErrorCodes.IncorrectFormat,
                    reason: errors_1.ValidationErrorReasons.ConflictingFilteringArguments,
                },
            ]);
        }
        // If excludedSources is present, just return those.
        if (excludedIds.length > 0) {
            return {
                excludedSources: exports.parseUtils.parseStringArrForERC20BridgeSources(excludedIds),
                includedSources: [],
                // Exclude open orderbook if 'Mesh' is excluded.
                nativeExclusivelyRFQT: excludedIds.includes('Mesh') && !excludedIds.includes('0x') && !excludedIds.includes('Native'),
            };
        }
        // Is RFQT is being explicitly requested?
        if (includedIds.includes('RFQT')) {
            // We assume that if a `takerAddress` key is present, it's value was already validated by the JSON
            // schema.
            if (request.takerAddress === undefined) {
                throw new errors_1.ValidationError([
                    {
                        field: 'takerAddress',
                        code: errors_1.ValidationErrorCodes.RequiredField,
                        reason: errors_1.ValidationErrorReasons.TakerAddressInvalid,
                    },
                ]);
            }
            // We enforce a valid API key - we don't want to fail silently.
            if (request.apiKey === undefined) {
                throw new errors_1.ValidationError([
                    {
                        field: '0x-api-key',
                        code: errors_1.ValidationErrorCodes.RequiredField,
                        reason: errors_1.ValidationErrorReasons.InvalidApiKey,
                    },
                ]);
            }
            if (!validApiKeys.includes(request.apiKey)) {
                throw new errors_1.ValidationError([
                    {
                        field: '0x-api-key',
                        code: errors_1.ValidationErrorCodes.FieldInvalid,
                        reason: errors_1.ValidationErrorReasons.InvalidApiKey,
                    },
                ]);
            }
            // If the user is requesting a firm quote, we want to make sure that `intentOnFilling` is set to "true".
            if (endpoint === 'quote' && request.intentOnFilling !== 'true') {
                throw new errors_1.ValidationError([
                    {
                        field: 'intentOnFilling',
                        code: errors_1.ValidationErrorCodes.RequiredField,
                        reason: errors_1.ValidationErrorReasons.RequiresIntentOnFilling,
                    },
                ]);
            }
            return {
                excludedSources: [],
                includedSources: exports.parseUtils.parseStringArrForERC20BridgeSources(['0x', ...includedIds]),
                nativeExclusivelyRFQT: !includedIds.includes('0x') && !includedIds.includes('Native'),
            };
        }
        return {
            excludedSources: [],
            includedSources: exports.parseUtils.parseStringArrForERC20BridgeSources(includedIds),
            nativeExclusivelyRFQT: false,
        };
    },
    parseStringArrForERC20BridgeSources(sources) {
        // Need to compare value of the enum instead of the key, as values are used by asset-swapper
        // CurveUsdcDaiUsdt = 'Curve_USDC_DAI_USDT' is sources=Curve_USDC_DAI_USDT
        // Also remove duplicates by assigning to an object then converting to keys.
        return Object.keys(Object.assign({}, ...sources
            .map((source) => (source === '0x' ? 'Native' : source))
            .filter((source) => Object.values(asset_swapper_1.ERC20BridgeSource).includes(source))
            .map((s) => ({ [s]: s }))));
    },
    parseAssetDatasStringFromQueryParam(field) {
        if (field.indexOf(',') !== -1) {
            const fields = field.split(',');
            return fields;
        }
        return field;
    },
    parseAffiliateFeeOptions(req) {
        const { feeRecipient } = req.query;
        const sellTokenPercentageFee = Number.parseFloat(req.query.sellTokenPercentageFee) || 0;
        const buyTokenPercentageFee = Number.parseFloat(req.query.buyTokenPercentageFee) || 0;
        if (sellTokenPercentageFee > 0) {
            throw new errors_1.ValidationError([
                {
                    field: 'sellTokenPercentageFee',
                    code: errors_1.ValidationErrorCodes.UnsupportedOption,
                    reason: errors_1.ValidationErrorReasons.ArgumentNotYetSupported,
                },
            ]);
        }
        if (buyTokenPercentageFee > 1) {
            throw new errors_1.ValidationError([
                {
                    field: 'buyTokenPercentageFee',
                    code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                    reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
                },
            ]);
        }
        let feeType = asset_swapper_1.AffiliateFeeType.None;
        if (buyTokenPercentageFee > 0) {
            feeType = asset_swapper_1.AffiliateFeeType.PercentageFee;
        }
        else if (req.query.feeType === types_1.FeeParamTypes.GASLESS_FEE) {
            feeType = asset_swapper_1.AffiliateFeeType.GaslessFee;
        }
        if (feeType !== asset_swapper_1.AffiliateFeeType.None && feeRecipient === undefined) {
            throw new errors_1.ValidationError([
                {
                    field: 'feeRecipient',
                    code: errors_1.ValidationErrorCodes.UnsupportedOption,
                    reason: errors_1.ValidationErrorReasons.FeeRecipientMissing,
                },
            ]);
        }
        const affiliateFee = feeRecipient
            ? {
                feeType,
                recipient: feeRecipient,
                sellTokenPercentageFee,
                buyTokenPercentageFee,
            }
            : {
                feeType,
                recipient: constants_1.NULL_ADDRESS,
                sellTokenPercentageFee: 0,
                buyTokenPercentageFee: 0,
            };
        return affiliateFee;
    },
};
//# sourceMappingURL=parse_utils.js.map