"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaTransactionService = void 0;
const order_utils_1 = require("@0x/order-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const kafkajs_1 = require("kafkajs");
const asset_swapper_1 = require("../asset-swapper");
const config_1 = require("../config");
const constants_1 = require("../constants");
const quote_report_utils_1 = require("../utils/quote_report_utils");
let kafkaProducer;
if (config_1.KAFKA_BROKERS !== undefined) {
    const kafka = new kafkajs_1.Kafka({
        clientId: '0x-api',
        brokers: config_1.KAFKA_BROKERS,
    });
    kafkaProducer = kafka.producer();
    kafkaProducer.connect();
}
class MetaTransactionService {
    constructor(swapService, contractAddresses) {
        this._exchangeProxyAddress = contractAddresses.exchangeProxy;
        this._swapService = swapService;
    }
    /**
     * Get meta-transaction v2 price. The function is currently a copy of (with minor modifications) `getMetaTransactionPriceAsync` for scaffolding.
     */
    async getMetaTransactionV2PriceAsync(params) {
        return this._getMetaTransactionV2QuoteAsync(params, 'price');
    }
    /**
     * Get meta-transaction v2 quote. The function is currently a copy of (with minor modifications) `getMetaTransactionQuoteAsync` for scaffolding.
     */
    async getMetaTransactionV2QuoteAsync(params) {
        const quote = await this._getMetaTransactionV2QuoteAsync(params, 'quote');
        const commonQuoteFields = {
            chainId: quote.chainId,
            price: quote.price,
            estimatedPriceImpact: quote.estimatedPriceImpact,
            sellTokenAddress: params.sellTokenAddress,
            buyTokenAddress: params.buyTokenAddress,
            buyAmount: quote.buyAmount,
            sellAmount: quote.sellAmount,
            sources: quote.sources,
            gasPrice: quote.gasPrice,
            estimatedGas: quote.estimatedGas,
            gas: quote.estimatedGas,
            protocolFee: quote.protocolFee,
            minimumProtocolFee: quote.minimumProtocolFee,
            value: quote.protocolFee,
            allowanceTarget: quote.allowanceTarget,
            sellTokenToEthRate: quote.sellTokenToEthRate,
            buyTokenToEthRate: quote.buyTokenToEthRate,
        };
        // Generate meta-transaction
        switch (params.metaTransactionVersion) {
            case 'v1': {
                const metaTransaction = this._generateMetaTransactionV1(quote.callData, quote.taker, constants_1.ZERO);
                return {
                    ...commonQuoteFields,
                    trade: {
                        kind: 'metatransaction',
                        hash: metaTransaction.getHash(),
                        metaTransaction,
                    },
                };
            }
            case 'v2':
            default:
                throw new Error(`metaTransactionVersion ${params.metaTransactionVersion} is not supported`);
        }
    }
    async getMetaTransactionV1PriceAsync(params) {
        return this._getMetaTransactionQuoteAsync(params, 'price');
    }
    async getMetaTransactionV1QuoteAsync(params) {
        const quote = await this._getMetaTransactionQuoteAsync(params, 'quote');
        const commonQuoteFields = {
            chainId: quote.chainId,
            price: quote.price,
            estimatedPriceImpact: quote.estimatedPriceImpact,
            sellTokenAddress: params.sellTokenAddress,
            buyTokenAddress: params.buyTokenAddress,
            buyAmount: quote.buyAmount,
            sellAmount: quote.sellAmount,
            // orders: quote.orders,
            sources: quote.sources,
            gasPrice: quote.gasPrice,
            estimatedGas: quote.estimatedGas,
            gas: quote.estimatedGas,
            protocolFee: quote.protocolFee,
            minimumProtocolFee: quote.minimumProtocolFee,
            value: quote.protocolFee,
            allowanceTarget: quote.allowanceTarget,
            sellTokenToEthRate: quote.sellTokenToEthRate,
            buyTokenToEthRate: quote.buyTokenToEthRate,
        };
        // Go through the Exchange Proxy.
        const metaTransaction = this._generateExchangeProxyMetaTransaction(quote.callData, quote.taker, normalizeGasPrice(quote.gasPrice), constants_1.ZERO);
        const metaTransactionHash = (0, order_utils_1.getExchangeProxyMetaTransactionHash)(metaTransaction);
        return {
            ...commonQuoteFields,
            metaTransaction,
            metaTransactionHash,
        };
    }
    // TODO: Remove this function and usages after /meta-transaction/v1 endpoints are deprecated
    _generateExchangeProxyMetaTransaction(callData, takerAddress, _gasPrice, protocolFee) {
        return {
            callData,
            minGasPrice: new utils_1.BigNumber(1),
            maxGasPrice: new utils_1.BigNumber(2).pow(48),
            expirationTimeSeconds: createExpirationTime(),
            salt: (0, order_utils_1.generatePseudoRandomSalt)(),
            signer: takerAddress,
            sender: constants_1.NULL_ADDRESS,
            feeAmount: constants_1.ZERO,
            feeToken: constants_1.NULL_ADDRESS,
            value: protocolFee,
            domain: {
                chainId: config_1.CHAIN_ID,
                verifyingContract: this._exchangeProxyAddress,
            },
        };
    }
    /**
     * Generate meta-transaction v1. This should be used in favor of `_generateExchangeProxyMetaTransaction` which
     * exists for historic reason.
     */
    _generateMetaTransactionV1(callData, takerAddress, protocolFee) {
        return new protocol_utils_1.MetaTransaction({
            callData,
            minGasPrice: constants_1.ZERO,
            maxGasPrice: new utils_1.BigNumber(2).pow(48),
            expirationTimeSeconds: createExpirationTime(),
            salt: (0, order_utils_1.generatePseudoRandomSalt)(),
            signer: takerAddress,
            sender: constants_1.NULL_ADDRESS,
            feeAmount: constants_1.ZERO,
            feeToken: constants_1.NULL_ADDRESS,
            value: protocolFee,
            chainId: config_1.CHAIN_ID,
            verifyingContract: this._exchangeProxyAddress,
        });
    }
    /**
     * Internal function to get meta-transaction v2 quote. The function is currently a copy of (with minor modifications) `_getMetaTransactionQuoteAsync` for scaffolding.
     */
    async _getMetaTransactionV2QuoteAsync(params, endpoint) {
        const wrappedNativeToken = asset_swapper_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[config_1.CHAIN_ID];
        const quoteParams = {
            ...params,
            // NOTE: Internally all ETH trades are for WETH, we just wrap/unwrap automatically
            buyToken: params.isETHBuy ? wrappedNativeToken : params.buyTokenAddress,
            endpoint,
            isUnwrap: false,
            isWrap: false,
            metaTransactionVersion: 'v1',
            sellToken: params.sellTokenAddress,
            shouldSellEntireBalance: false,
            skipValidation: true,
            isDebugEnabled: false,
        };
        const quote = await this._swapService.calculateSwapQuoteAsync(quoteParams);
        // Quote Report
        if (endpoint === 'quote' && quote.extendedQuoteReportSources && kafkaProducer) {
            const quoteId = getQuoteIdFromSwapQuote(quote);
            (0, quote_report_utils_1.publishQuoteReport)({
                quoteId,
                taker: params.takerAddress,
                quoteReportSources: quote.extendedQuoteReportSources,
                submissionBy: 'gaslessSwapAmm',
                decodedUniqueId: params.quoteUniqueId ? params.quoteUniqueId : quote.decodedUniqueId,
                buyTokenAddress: quote.buyTokenAddress,
                sellTokenAddress: quote.sellTokenAddress,
                buyAmount: params.buyAmount,
                sellAmount: params.sellAmount,
                integratorId: params.integratorId,
                blockNumber: quote.blockNumber,
                slippage: params.slippagePercentage,
                estimatedGas: quote.estimatedGas,
                enableSlippageProtection: false,
                expectedSlippage: quote.expectedSlippage,
                estimatedPriceImpact: quote.estimatedPriceImpact,
                priceImpactProtectionPercentage: params.priceImpactProtectionPercentage,
            }, true, kafkaProducer);
        }
        return {
            chainId: quote.chainId,
            price: quote.price,
            estimatedPriceImpact: quote.estimatedPriceImpact,
            gasPrice: quote.gasPrice,
            protocolFee: quote.protocolFee,
            sources: quote.sources,
            buyAmount: quote.buyAmount,
            sellAmount: quote.sellAmount,
            estimatedGas: quote.estimatedGas,
            allowanceTarget: quote.allowanceTarget,
            sellTokenToEthRate: quote.sellTokenToEthRate,
            buyTokenToEthRate: quote.buyTokenToEthRate,
            callData: quote.data,
            minimumProtocolFee: quote.protocolFee,
            buyTokenAddress: params.buyTokenAddress,
            sellTokenAddress: params.sellTokenAddress,
            taker: params.takerAddress,
        };
    }
    async _getMetaTransactionQuoteAsync(params, endpoint) {
        const wrappedNativeToken = asset_swapper_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[config_1.CHAIN_ID];
        const affiliateFee = {
            feeType: asset_swapper_1.AffiliateFeeType.GaslessFee,
            recipient: config_1.FEE_RECIPIENT_ADDRESS,
        };
        const quoteParams = {
            ...params,
            // NOTE: Internally all ETH trades are for WETH, we just wrap/unwrap automatically
            buyToken: params.isETHBuy ? wrappedNativeToken : params.buyTokenAddress,
            endpoint,
            isUnwrap: false,
            isWrap: false,
            metaTransactionVersion: 'v1',
            sellToken: params.sellTokenAddress,
            shouldSellEntireBalance: false,
            skipValidation: true,
            affiliateFee,
            isDebugEnabled: false,
        };
        const quote = await this._swapService.calculateSwapQuoteAsync(quoteParams);
        // Quote Report
        if (endpoint === 'quote' && quote.extendedQuoteReportSources && kafkaProducer) {
            const quoteId = getQuoteIdFromSwapQuote(quote);
            (0, quote_report_utils_1.publishQuoteReport)({
                quoteId,
                taker: params.takerAddress,
                quoteReportSources: quote.extendedQuoteReportSources,
                submissionBy: 'gaslessSwapAmm',
                decodedUniqueId: params.quoteUniqueId ? params.quoteUniqueId : quote.decodedUniqueId,
                buyTokenAddress: quote.buyTokenAddress,
                sellTokenAddress: quote.sellTokenAddress,
                buyAmount: params.buyAmount,
                sellAmount: params.sellAmount,
                integratorId: params.integratorId,
                blockNumber: quote.blockNumber,
                slippage: params.slippagePercentage,
                estimatedGas: quote.estimatedGas,
                enableSlippageProtection: false,
                expectedSlippage: quote.expectedSlippage,
                estimatedPriceImpact: quote.estimatedPriceImpact,
                priceImpactProtectionPercentage: params.priceImpactProtectionPercentage,
            }, true, kafkaProducer);
        }
        return {
            chainId: quote.chainId,
            price: quote.price,
            estimatedPriceImpact: quote.estimatedPriceImpact,
            gasPrice: quote.gasPrice,
            protocolFee: quote.protocolFee,
            sources: quote.sources,
            buyAmount: quote.buyAmount,
            sellAmount: quote.sellAmount,
            estimatedGas: quote.estimatedGas,
            allowanceTarget: quote.allowanceTarget,
            sellTokenToEthRate: quote.sellTokenToEthRate,
            buyTokenToEthRate: quote.buyTokenToEthRate,
            callData: quote.data,
            minimumProtocolFee: quote.protocolFee,
            buyTokenAddress: params.buyTokenAddress,
            sellTokenAddress: params.sellTokenAddress,
            taker: params.takerAddress,
        };
    }
}
exports.MetaTransactionService = MetaTransactionService;
function normalizeGasPrice(gasPrice) {
    return gasPrice.div(constants_1.ONE_GWEI).integerValue(utils_1.BigNumber.ROUND_UP).times(constants_1.ONE_GWEI);
}
function createExpirationTime() {
    return new utils_1.BigNumber(Date.now() + config_1.META_TX_EXPIRATION_BUFFER_MS)
        .div(constants_1.ONE_SECOND_MS)
        .integerValue(utils_1.BigNumber.ROUND_CEIL);
}
/*
 * Extract the quote ID from the quote filldata
 */
function getQuoteIdFromSwapQuote(quote) {
    const bytesPos = quote.data.indexOf(constants_1.AFFILIATE_DATA_SELECTOR);
    const quoteIdOffset = 118; // Offset of quoteId from Affiliate data selector
    const startingIndex = bytesPos + quoteIdOffset;
    const quoteId = quote.data.slice(startingIndex, startingIndex + 10);
    return quoteId;
}
//# sourceMappingURL=meta_transaction_service.js.map