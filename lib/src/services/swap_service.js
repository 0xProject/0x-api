"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapService = void 0;
const contract_wrappers_1 = require("@0x/contract-wrappers");
const protocol_utils_1 = require("@0x/protocol-utils");
const token_metadata_1 = require("@0x/token-metadata");
const types_1 = require("@0x/types");
const utils_1 = require("@0x/utils");
const web3_wrapper_1 = require("@0x/web3-wrapper");
const axios_1 = require("axios");
const _ = require("lodash");
const prom_client_1 = require("prom-client");
const asset_swapper_1 = require("../asset-swapper");
const exchange_proxy_swap_quote_consumer_1 = require("../asset-swapper/quote_consumers/exchange_proxy_swap_quote_consumer");
const config_1 = require("../config");
const constants_1 = require("../constants");
const errors_1 = require("../errors");
const logger_1 = require("../logger");
const alt_mm_utils_1 = require("../utils/alt_mm_utils");
const result_cache_1 = require("../utils/result_cache");
const service_utils_1 = require("../utils/service_utils");
const slippage_model_fill_adjustor_1 = require("../utils/slippage_model_fill_adjustor");
const utils_2 = require("../utils/utils");
const PRICE_IMPACT_TOO_HIGH = new prom_client_1.Counter({
    name: 'price_impact_too_high',
    help: 'The number of price impact events',
    labelNames: ['reason'],
});
class SwapService {
    constructor(orderbook, provider, contractAddresses, _rfqClient, firmQuoteValidator, rfqDynamicBlacklist, slippageModelManager) {
        this._rfqClient = _rfqClient;
        this.slippageModelManager = slippageModelManager;
        this._provider = provider;
        this._firmQuoteValidator = firmQuoteValidator;
        this._swapQuoterOpts = {
            ...config_1.SWAP_QUOTER_OPTS,
            rfqt: {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                ...config_1.SWAP_QUOTER_OPTS.rfqt,
                warningLogger: logger_1.logger.warn.bind(logger_1.logger),
            },
            contractAddresses,
        };
        if (this._swapQuoterOpts.rfqt !== undefined && rfqDynamicBlacklist !== undefined) {
            this._swapQuoterOpts.rfqt.txOriginBlacklist = rfqDynamicBlacklist;
        }
        if (config_1.CHAIN_ID === asset_swapper_1.ChainId.Ganache) {
            this._swapQuoterOpts.samplerOverrides = {
                block: asset_swapper_1.BlockParamLiteral.Latest,
                overrides: {},
                to: contractAddresses.erc20BridgeSampler,
                ...(this._swapQuoterOpts.samplerOverrides || {}),
            };
        }
        this._swapQuoter = new asset_swapper_1.SwapQuoter(this._provider, orderbook, this._swapQuoterOpts);
        this._swapQuoteConsumer = exchange_proxy_swap_quote_consumer_1.ExchangeProxySwapQuoteConsumer.create(config_1.CHAIN_ID, contractAddresses);
        this._web3Wrapper = new web3_wrapper_1.Web3Wrapper(this._provider);
        this._contractAddresses = contractAddresses;
        this._wethContract = new contract_wrappers_1.WETH9Contract(this._contractAddresses.etherToken, this._provider);
        this._fakeTaker = new asset_swapper_1.FakeTakerContract(constants_1.NULL_ADDRESS, this._provider);
    }
    /**
     * Returns an estimated price impact percent. This is estimated
     * as the information used for calculation is based off of
     * median values (fee sources) and not an exhaustive set of liquidity sources
     * @param price the final price from the swap quote (inverted if buys)
     * @param sellTokenToEthRate the rate of selling the sellToken to the native asset (e.g USDC->FTM)
     * @param buyTokenToEthRate  the rate of selling the buy token to the native asset (e.g DAI->FTM)
     * @param marketSide whether this is a sell or a buy (as the price is flipped)
     * @returns an estimated price impact percentage calculated from the fee sources (median value).
     * We return null if we are unable to calculate a price impact
     */
    static _calculateEstimatedPriceImpactPercent(price, sellTokenToEthRate, buyTokenToEthRate, marketSide) {
        // There are cases where our fee source information is limited
        // since it is only a shallow search, as such we can't calculate price impact
        if (sellTokenToEthRate.isZero() || buyTokenToEthRate.isZero()) {
            return null;
        }
        // ETH to USDC
        // price: "2418.92"
        // sellTokenToEthRate: "1"
        // buyTokenToEthRate: "2438.74"
        // If sell then price is in taker token, if buy price is inverted
        const normalizedPrice = marketSide === types_1.MarketOperation.Sell ? price : new utils_1.BigNumber(1).dividedBy(price);
        // 2418.92 / (2438.74/1) = 0.99187 or 99.187%
        const actualPriceToEstimatedPriceRatio = normalizedPrice.dividedBy(buyTokenToEthRate.dividedBy(sellTokenToEthRate));
        // 0.99187 -> 0.812%
        const estimatedPriceImpactPercentage = new utils_1.BigNumber(1)
            .minus(actualPriceToEstimatedPriceRatio)
            .times(100)
            .decimalPlaces(4, utils_1.BigNumber.ROUND_CEIL);
        // In theory, price impact should always be positive
        // the sellTokenToEthRate and buyTokenToEthRate are calculated
        // from fee sources which is a median and not an exhaustive list
        // of all sources, so it's possible that the median price is less
        // than the best route
        if (estimatedPriceImpactPercentage.isLessThanOrEqualTo(0)) {
            return asset_swapper_1.ZERO_AMOUNT;
        }
        return estimatedPriceImpactPercentage;
    }
    static _getSwapQuotePrice(buyAmount, buyTokenDecimals, sellTokenDecimals, swapQuote, affiliateFee) {
        const { makerAmount, totalTakerAmount } = swapQuote.bestCaseQuoteInfo;
        const { totalTakerAmount: guaranteedTotalTakerAmount, makerAmount: guaranteedMakerAmount } = swapQuote.worstCaseQuoteInfo;
        const unitMakerAmount = web3_wrapper_1.Web3Wrapper.toUnitAmount(makerAmount, buyTokenDecimals);
        const unitTakerAmount = web3_wrapper_1.Web3Wrapper.toUnitAmount(totalTakerAmount, sellTokenDecimals);
        const guaranteedUnitMakerAmount = web3_wrapper_1.Web3Wrapper.toUnitAmount(guaranteedMakerAmount, buyTokenDecimals);
        const guaranteedUnitTakerAmount = web3_wrapper_1.Web3Wrapper.toUnitAmount(guaranteedTotalTakerAmount, sellTokenDecimals);
        const affiliateFeeUnitMakerAmount = guaranteedUnitMakerAmount.times((0, service_utils_1.getBuyTokenPercentageFeeOrZero)(affiliateFee));
        const isSelling = buyAmount === undefined;
        // NOTE: In order to not communicate a price better than the actual quote we
        // should make sure to always round towards a worse price
        const roundingStrategy = isSelling ? utils_1.BigNumber.ROUND_FLOOR : utils_1.BigNumber.ROUND_CEIL;
        // Best price
        const price = isSelling
            ? unitMakerAmount
                .minus(affiliateFeeUnitMakerAmount)
                .dividedBy(unitTakerAmount)
                .decimalPlaces(buyTokenDecimals, roundingStrategy)
            : unitTakerAmount
                .dividedBy(unitMakerAmount.minus(affiliateFeeUnitMakerAmount))
                .decimalPlaces(sellTokenDecimals, roundingStrategy);
        // Guaranteed price before revert occurs
        const guaranteedPrice = isSelling
            ? guaranteedUnitMakerAmount
                .minus(affiliateFeeUnitMakerAmount)
                .dividedBy(guaranteedUnitTakerAmount)
                .decimalPlaces(buyTokenDecimals, roundingStrategy)
            : guaranteedUnitTakerAmount
                .dividedBy(guaranteedUnitMakerAmount.minus(affiliateFeeUnitMakerAmount))
                .decimalPlaces(sellTokenDecimals, roundingStrategy);
        return {
            price,
            guaranteedPrice,
        };
    }
    async calculateSwapQuoteAsync(params) {
        const { endpoint, takerAddress, sellAmount, buyAmount, buyToken, sellToken, slippagePercentage, gasPrice: providedGasPrice, isETHSell, isETHBuy, excludedSources, includedSources, integrator, metaTransactionVersion, rfqt, affiliateAddress, affiliateFee, skipValidation, shouldSellEntireBalance, enableSlippageProtection, priceImpactProtectionPercentage, } = params;
        let _rfqt;
        // If rfqt is exclusively asked but the service is unavailable, throw an explicit error.
        if (rfqt && _.isEqual(includedSources, ['RFQT']) && !this._rfqClient.isRfqtEnabled()) {
            throw new errors_1.ServiceDisabledError('RFQt Service is not available');
        }
        // Only enable RFQT if there's an API key and either (a) it's a
        // forwarder transaction (isETHSell===true), (b) there's a taker
        // address present, or (c) it's an indicative quote.
        const shouldEnableRfqt = integrator !== undefined && (isETHSell || takerAddress !== undefined || (rfqt && rfqt.isIndicative));
        // Check if integrator ID specifically whitelists a set of maker URIs. If whitelist is "undefined" then it
        // means all integrators will be enabled.
        if (shouldEnableRfqt) {
            const altRfqAssetOfferings = await this._getAltMarketOfferingsAsync(1500);
            _rfqt = {
                ...rfqt,
                intentOnFilling: rfqt && rfqt.intentOnFilling ? true : false,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                integrator: integrator,
                makerEndpointMaxResponseTimeMs: config_1.RFQT_REQUEST_MAX_RESPONSE_MS,
                // Note 0xAPI maps takerAddress query parameter to txOrigin as takerAddress is always Exchange Proxy or a VIP
                takerAddress: constants_1.NULL_ADDRESS,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                txOrigin: takerAddress,
                firmQuoteValidator: this._firmQuoteValidator,
                altRfqAssetOfferings,
            };
        }
        // only generate quote reports for rfqt firm quotes
        const shouldGenerateQuoteReport = rfqt && rfqt.intentOnFilling;
        let swapQuoteRequestOpts;
        if (
        // Is a MetaTransaction
        metaTransactionVersion !== undefined ||
            shouldSellEntireBalance ||
            // Note: We allow VIP to continue ahead when positive slippage fee is enabled
            affiliateFee.feeType === asset_swapper_1.AffiliateFeeType.PercentageFee ||
            !(0, config_1.CHAIN_HAS_VIPS)(config_1.CHAIN_ID)) {
            swapQuoteRequestOpts = config_1.ASSET_SWAPPER_MARKET_ORDERS_OPTS_NO_VIP;
        }
        else {
            swapQuoteRequestOpts = config_1.ASSET_SWAPPER_MARKET_ORDERS_OPTS;
        }
        const assetSwapperOpts = {
            ...swapQuoteRequestOpts,
            bridgeSlippage: slippagePercentage,
            gasPrice: providedGasPrice,
            excludedSources: excludedSources.concat(swapQuoteRequestOpts.excludedSources || []),
            includedSources,
            rfqt: _rfqt,
            shouldGenerateQuoteReport,
            fillAdjustor: enableSlippageProtection && this.slippageModelManager
                ? new slippage_model_fill_adjustor_1.SlippageModelFillAdjustor(this.slippageModelManager, sellToken, buyToken, slippagePercentage || constants_1.DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE)
                : new asset_swapper_1.IdentityFillAdjustor(),
            endpoint: endpoint,
        };
        const marketSide = sellAmount !== undefined ? types_1.MarketOperation.Sell : types_1.MarketOperation.Buy;
        const amount = marketSide === types_1.MarketOperation.Sell
            ? sellAmount
            : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                buyAmount.times((0, service_utils_1.getBuyTokenPercentageFeeOrZero)(affiliateFee) + 1).integerValue(utils_1.BigNumber.ROUND_DOWN);
        // Fetch the Swap quote
        const swapQuote = await this._swapQuoter.getSwapQuoteAsync(buyToken, sellToken, 
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
        amount, // was validated earlier
        marketSide, assetSwapperOpts, this._rfqClient);
        const { makerAmount, totalTakerAmount, protocolFeeInWeiAmount: bestCaseProtocolFee, } = swapQuote.bestCaseQuoteInfo;
        const { protocolFeeInWeiAmount: protocolFee, gas: worstCaseGas } = swapQuote.worstCaseQuoteInfo;
        const { gasPrice, sourceBreakdown, quoteReport, extendedQuoteReportSources } = swapQuote;
        // Prepare Sell Token Fees
        const sellTokenFeeAmounts = [];
        // Prepare Buy Token Fees
        const { gasCost: affiliateFeeGasCost, buyTokenFeeAmount } = service_utils_1.serviceUtils.getBuyTokenFeeAmounts(swapQuote, affiliateFee);
        const buyTokenFeeAmounts = [
            {
                recipient: affiliateFee.recipient,
                feeType: affiliateFee.feeType,
                buyTokenFeeAmount,
                sellTokenFeeAmount: constants_1.ZERO,
            },
        ];
        // By default, add a positive slippage fee for allowed pairs.
        // Integrators may turn this off by setting positiveSlippagePercent to 0
        // NOTE that we do not yet allow for a specified percent of the positive slippage to be taken, it's all or nothing.
        // TODO: customize the positive slippage by the percent
        const isPairAllowed = config_1.ZERO_EX_FEE_TOKENS.has(buyToken.toLowerCase()) && config_1.ZERO_EX_FEE_TOKENS.has(sellToken.toLowerCase());
        const isDefaultPositiveSlippageFee = (integrator === null || integrator === void 0 ? void 0 : integrator.positiveSlippagePercent) === undefined;
        const isPostiveSlippageEnabled = (integrator === null || integrator === void 0 ? void 0 : integrator.positiveSlippagePercent) !== undefined && integrator.positiveSlippagePercent > 0; // 0 is falsy, must check undefined explicitly
        const positiveSlippageFee = isPairAllowed && (isDefaultPositiveSlippageFee || isPostiveSlippageEnabled)
            ? {
                recipient: (integrator === null || integrator === void 0 ? void 0 : integrator.feeRecipient) || config_1.ZERO_EX_FEE_RECIPIENT_ADDRESS,
                feeType: asset_swapper_1.AffiliateFeeType.PositiveSlippageFee,
                buyTokenFeeAmount: constants_1.ZERO,
                sellTokenFeeAmount: constants_1.ZERO, // we don't need this for positive slippage fee
            }
            : undefined;
        logger_1.logger.info({
            isPairAllowed,
            isDefaultPositiveSlippageFee,
            isPostiveSlippageEnabled,
            positiveSlippageFee,
            integratorPositiveSlippagePercent: integrator === null || integrator === void 0 ? void 0 : integrator.positiveSlippagePercent,
        }, 'Positive slippage values');
        // Grab the encoded version of the swap quote
        const { to, value, data, decodedUniqueId, gasOverhead } = this.getSwapQuotePartialTransaction(swapQuote, isETHSell, isETHBuy, shouldSellEntireBalance, affiliateAddress, buyTokenFeeAmounts, sellTokenFeeAmounts, positiveSlippageFee, metaTransactionVersion);
        let conservativeBestCaseGasEstimate = new utils_1.BigNumber(worstCaseGas).plus(affiliateFeeGasCost);
        // Cannot eth_gasEstimate for /price when RFQ Native liquidity is included
        const isNativeIncluded = swapQuote.sourceBreakdown.singleSource.Native !== undefined;
        const isQuote = endpoint === 'quote';
        const canEstimateGas = isQuote || !isNativeIncluded;
        // If the taker address is provided we can provide a more accurate gas estimate
        // using eth_gasEstimate
        // If an error occurs we attempt to provide a better message then "Transaction Reverted"
        if (takerAddress && !skipValidation && canEstimateGas) {
            try {
                // Record the faux gas estimate
                const fauxGasEstimate = conservativeBestCaseGasEstimate;
                let estimateGasCallResult = await this._estimateGasOrThrowRevertErrorAsync({
                    to,
                    data,
                    from: takerAddress,
                    value,
                    gasPrice,
                });
                // Add any underterministic gas overhead the encoded transaction has detected
                estimateGasCallResult = estimateGasCallResult.plus(gasOverhead);
                // Add a little buffer to eth_estimateGas as it is not always correct
                const realGasEstimate = estimateGasCallResult.times(constants_1.GAS_LIMIT_BUFFER_MULTIPLIER).integerValue();
                // Take the max of the faux estimate or the real estimate
                conservativeBestCaseGasEstimate = utils_1.BigNumber.max(fauxGasEstimate, realGasEstimate);
                logger_1.logger.info({
                    fauxGasEstimate,
                    realGasEstimate,
                    delta: realGasEstimate.minus(fauxGasEstimate),
                    accuracy: realGasEstimate.minus(fauxGasEstimate).dividedBy(realGasEstimate).toFixed(4),
                    buyToken,
                    sellToken,
                    sources: _.uniq(swapQuote.path.getOrders().map((o) => o.source)),
                }, 'Improved gas estimate');
            }
            catch (error) {
                if (isQuote) {
                    // On /quote, when skipValidation=false, we want to raise an error
                    throw error;
                }
                logger_1.logger.warn({ takerAddress, data, value, gasPrice, error: error === null || error === void 0 ? void 0 : error.message }, 'Unable to use eth_estimateGas. Falling back to faux estimate');
            }
        }
        const worstCaseGasEstimate = conservativeBestCaseGasEstimate;
        const { makerTokenDecimals, takerTokenDecimals } = swapQuote;
        const { price, guaranteedPrice } = SwapService._getSwapQuotePrice(buyAmount, makerTokenDecimals, takerTokenDecimals, swapQuote, affiliateFee);
        let adjustedValue = value;
        adjustedValue = isETHSell ? protocolFee.plus(swapQuote.worstCaseQuoteInfo.takerAmount) : protocolFee;
        // No allowance target is needed if this is an ETH sell, so set to 0x000..
        const allowanceTarget = isETHSell ? constants_1.NULL_ADDRESS : this._contractAddresses.exchangeProxy;
        const { takerAmountPerEth: takerTokenToEthRate, makerAmountPerEth: makerTokenToEthRate } = swapQuote;
        // Convert into unit amounts
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
        const wethToken = (0, token_metadata_1.getTokenMetadataIfExists)('WETH', config_1.CHAIN_ID);
        const sellTokenToEthRate = takerTokenToEthRate
            .times(new utils_1.BigNumber(10).pow(wethToken.decimals - takerTokenDecimals))
            .decimalPlaces(takerTokenDecimals);
        const buyTokenToEthRate = makerTokenToEthRate
            .times(new utils_1.BigNumber(10).pow(wethToken.decimals - makerTokenDecimals))
            .decimalPlaces(makerTokenDecimals);
        const estimatedPriceImpact = SwapService._calculateEstimatedPriceImpactPercent(price, sellTokenToEthRate, buyTokenToEthRate, marketSide);
        const apiSwapQuote = {
            chainId: config_1.CHAIN_ID,
            price,
            guaranteedPrice,
            estimatedPriceImpact,
            to,
            data,
            value: adjustedValue,
            gas: worstCaseGasEstimate,
            estimatedGas: conservativeBestCaseGasEstimate,
            from: takerAddress,
            gasPrice,
            protocolFee,
            minimumProtocolFee: utils_1.BigNumber.min(protocolFee, bestCaseProtocolFee),
            // NOTE: Internally all ETH trades are for WETH, we just wrap/unwrap automatically
            buyTokenAddress: isETHBuy ? protocol_utils_1.ETH_TOKEN_ADDRESS : buyToken,
            sellTokenAddress: isETHSell ? protocol_utils_1.ETH_TOKEN_ADDRESS : sellToken,
            buyAmount: makerAmount.minus(buyTokenFeeAmount),
            sellAmount: totalTakerAmount,
            sources: service_utils_1.serviceUtils.convertToLiquiditySources(sourceBreakdown),
            orders: swapQuote.path.getOrders(),
            allowanceTarget,
            decodedUniqueId,
            extendedQuoteReportSources,
            sellTokenToEthRate,
            buyTokenToEthRate,
            quoteReport,
            blockNumber: swapQuote.blockNumber,
            debugData: params.isDebugEnabled ? { samplerGasUsage: swapQuote.samplerGasUsage } : undefined,
        };
        if (apiSwapQuote.buyAmount.lte(new utils_1.BigNumber(0))) {
            throw new errors_1.InsufficientFundsError();
        }
        if (isQuote &&
            apiSwapQuote.estimatedPriceImpact &&
            apiSwapQuote.estimatedPriceImpact.gt(priceImpactProtectionPercentage * 100)) {
            PRICE_IMPACT_TOO_HIGH.labels('ValueOutOfRange').inc();
            throw new errors_1.ValidationError([
                {
                    field: 'priceImpactProtectionPercentage',
                    code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                    reason: errors_1.ValidationErrorReasons.PriceImpactTooHigh,
                    description: `estimated price impact of ${apiSwapQuote.estimatedPriceImpact} is greater than priceImpactProtectionPercentage ${priceImpactProtectionPercentage * 100}`,
                },
            ]);
        }
        // If the slippage Model is forced on for the integrator, or if they have opted in to slippage protection
        if ((integrator === null || integrator === void 0 ? void 0 : integrator.slippageModel) === true || enableSlippageProtection) {
            if (this.slippageModelManager) {
                apiSwapQuote.expectedSlippage = this.slippageModelManager.calculateExpectedSlippage(buyToken, sellToken, apiSwapQuote.buyAmount, apiSwapQuote.sellAmount, apiSwapQuote.sources, 
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                slippagePercentage);
            }
            else {
                apiSwapQuote.expectedSlippage = null;
            }
        }
        return apiSwapQuote;
    }
    async getSwapQuoteForWrapAsync(params) {
        return this._getSwapQuoteForNativeWrappedAsync(params, false);
    }
    async getSwapQuoteForUnwrapAsync(params) {
        return this._getSwapQuoteForNativeWrappedAsync(params, true);
    }
    async _getSwapQuoteForNativeWrappedAsync(params, isUnwrap) {
        const { takerAddress, buyToken, sellToken, buyAmount, sellAmount, affiliateAddress, gasPrice: providedGasPrice, } = params;
        const amount = buyAmount || sellAmount;
        if (amount === undefined) {
            throw new Error('sellAmount or buyAmount required');
        }
        const data = (isUnwrap ? this._wethContract.withdraw(amount) : this._wethContract.deposit()).getABIEncodedTransactionData();
        const value = isUnwrap ? constants_1.ZERO : amount;
        const attributedCalldata = service_utils_1.serviceUtils.attributeCallData(data, affiliateAddress);
        // TODO: consider not using protocol fee utils due to lack of need for an aggresive gas price for wrapping/unwrapping
        const gasPrice = providedGasPrice || (await this._swapQuoter.getGasPriceEstimationOrThrowAsync());
        const gasEstimate = isUnwrap ? config_1.UNWRAP_QUOTE_GAS : config_1.WRAP_QUOTE_GAS;
        const apiSwapQuote = {
            chainId: config_1.CHAIN_ID,
            estimatedPriceImpact: asset_swapper_1.ZERO_AMOUNT,
            price: constants_1.ONE,
            guaranteedPrice: constants_1.ONE,
            to: asset_swapper_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[config_1.CHAIN_ID],
            data: attributedCalldata.affiliatedData,
            decodedUniqueId: attributedCalldata.decodedUniqueId,
            value,
            gas: gasEstimate,
            estimatedGas: gasEstimate,
            from: takerAddress,
            gasPrice,
            protocolFee: constants_1.ZERO,
            minimumProtocolFee: constants_1.ZERO,
            buyTokenAddress: isUnwrap ? protocol_utils_1.ETH_TOKEN_ADDRESS : buyToken,
            sellTokenAddress: isUnwrap ? sellToken : protocol_utils_1.ETH_TOKEN_ADDRESS,
            buyAmount: amount,
            sellAmount: amount,
            sources: [],
            orders: [],
            sellTokenToEthRate: new utils_1.BigNumber(1),
            buyTokenToEthRate: new utils_1.BigNumber(1),
            allowanceTarget: constants_1.NULL_ADDRESS,
            blockNumber: undefined,
        };
        return apiSwapQuote;
    }
    async _estimateGasOrThrowRevertErrorAsync(txData) {
        let revertError;
        let gasEstimate = constants_1.ZERO;
        let callResult = { success: false, resultData: constants_1.NULL_BYTES, gasUsed: constants_1.ZERO };
        let callResultGanacheRaw;
        try {
            // NOTE: Ganache does not support overrides
            if (config_1.CHAIN_ID === asset_swapper_1.ChainId.Ganache) {
                // Default to true as ganache provides us less info and we cannot override
                callResult.success = true;
                const gas = await this._web3Wrapper.estimateGasAsync(txData).catch((_e) => {
                    // If an estimate error happens on ganache we say it failed
                    callResult.success = false;
                    return constants_1.DEFAULT_VALIDATION_GAS_LIMIT;
                });
                callResultGanacheRaw = await this._web3Wrapper.callAsync({
                    ...txData,
                    gas,
                });
                callResult.resultData = callResultGanacheRaw;
                callResult.gasUsed = new utils_1.BigNumber(gas);
                gasEstimate = new utils_1.BigNumber(gas);
            }
            else {
                // Split out the `to` and `data` so it doesn't override
                const { data, to, ...rest } = txData;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                callResult = await this._fakeTaker.execute(to, data).callAsync({
                    ...rest,
                    // Set the `to` to be the user address with a fake contract at that address
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                    to: txData.from,
                    // TODO jacob this has issues with protocol fees, but a gas amount is needed to use gasPrice
                    gasPrice: 0,
                    overrides: {
                        // Override the user address with the Fake Taker contract
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                        [txData.from]: {
                            code: _.get(asset_swapper_1.artifacts.FakeTaker, 'compilerOutput.evm.deployedBytecode.object'),
                        },
                    },
                });
            }
        }
        catch (e) {
            if (e.message && /insufficient funds/.test(e.message)) {
                throw new errors_1.InsufficientFundsError();
            }
            // RPCSubprovider can throw if .error exists on the response payload
            // This `error` response occurs from Parity nodes (incl Alchemy) and Geth nodes >= 1.9.14
            // Geth 1.9.15
            if (e.message && /execution reverted/.test(e.message) && e.data) {
                try {
                    revertError = protocol_utils_1.RevertError.decode(e.data, false);
                }
                catch (e) {
                    logger_1.logger.error(`Could not decode revert error: ${e}`);
                    throw new Error(e.message);
                }
            }
            else {
                try {
                    revertError = (0, utils_1.decodeThrownErrorAsRevertError)(e);
                }
                catch (e) {
                    // Could not decode the revert error
                }
            }
            if (revertError) {
                throw revertError;
            }
        }
        try {
            if (callResultGanacheRaw) {
                revertError = protocol_utils_1.RevertError.decode(callResultGanacheRaw, false);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            }
            else if (callResult && !callResult.success) {
                revertError = protocol_utils_1.RevertError.decode(callResult.resultData, false);
            }
        }
        catch (e) {
            // No revert error
        }
        if (revertError) {
            throw revertError;
        }
        // Add in the overhead of call data
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
        gasEstimate = callResult.gasUsed.plus(utils_2.utils.calculateCallDataGas(txData.data));
        // If there's a revert and we still are unable to decode it, just throw it.
        // This can happen in VIPs where there are no real revert reasons
        if (!callResult.success) {
            throw new errors_1.GasEstimationError();
        }
        return gasEstimate;
    }
    getSwapQuotePartialTransaction(swapQuote, isFromETH, isToETH, shouldSellEntireBalance, affiliateAddress, buyTokenAffiliateFees, sellTokenAffiliateFees, positiveSlippageFee, metaTransactionVersion) {
        const opts = {
            isFromETH,
            isToETH,
            metaTransactionVersion,
            shouldSellEntireBalance,
            buyTokenAffiliateFees,
            sellTokenAffiliateFees,
            positiveSlippageFee,
        };
        const { calldataHexString: data, ethAmount: value, toAddress: to, gasOverhead, } = this._swapQuoteConsumer.getCalldataOrThrow(swapQuote, opts);
        const { affiliatedData, decodedUniqueId } = service_utils_1.serviceUtils.attributeCallData(data, affiliateAddress);
        return {
            to,
            value,
            data: affiliatedData,
            decodedUniqueId,
            gasOverhead,
        };
    }
    async _getAltMarketOfferingsAsync(timeoutMs) {
        if (!this._altRfqMarketsCache) {
            this._altRfqMarketsCache = (0, result_cache_1.createResultCache)(async () => {
                if (config_1.ALT_RFQ_MM_ENDPOINT === undefined || config_1.ALT_RFQ_MM_API_KEY === undefined) {
                    return {};
                }
                try {
                    const response = await axios_1.default.get(`${config_1.ALT_RFQ_MM_ENDPOINT}/markets`, {
                        headers: { Authorization: `Bearer ${config_1.ALT_RFQ_MM_API_KEY}` },
                        timeout: timeoutMs,
                    });
                    return (0, alt_mm_utils_1.altMarketResponseToAltOfferings)(response.data, config_1.ALT_RFQ_MM_ENDPOINT);
                }
                catch (err) {
                    logger_1.logger.warn(`error fetching alt RFQ markets: ${err}`);
                    return {};
                }
                // refresh cache every 6 hours
            }, constants_1.ONE_MINUTE_MS * 360);
        }
        return (await this._altRfqMarketsCache.getResultAsync()).result;
    }
}
exports.SwapService = SwapService;
//# sourceMappingURL=swap_service.js.map