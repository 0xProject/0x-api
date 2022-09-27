import { generatePseudoRandomSalt, getExchangeProxyMetaTransactionHash } from '@0x/order-utils';
import { ExchangeProxyMetaTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Kafka, Producer } from 'kafkajs';

import { ContractAddresses, NATIVE_FEE_TOKEN_BY_CHAIN_ID } from '../asset-swapper';
import { CHAIN_ID, KAFKA_BROKERS, META_TX_EXPIRATION_BUFFER_MS } from '../config';
import { AFFILIATE_DATA_SELECTOR, NULL_ADDRESS, ONE_GWEI, ONE_SECOND_MS, ZERO } from '../constants';
import { MetaTransactionQuoteParams, GetSwapQuoteResponse, QuoteBase, MetaTransactionQuoteResponse } from '../types';
import { publishQuoteReport } from '../utils/quote_report_utils';
import { SwapService } from './swap_service';

export interface MetaTransactionQuoteResult extends QuoteBase {
    buyTokenAddress: string;
    callData: string;
    sellTokenAddress: string;
    taker: string;
}

let kafkaProducer: Producer | undefined;
if (KAFKA_BROKERS !== undefined) {
    const kafka = new Kafka({
        clientId: '0x-api',
        brokers: KAFKA_BROKERS,
    });

    kafkaProducer = kafka.producer();
    kafkaProducer.connect();
}

export class MetaTransactionService {
    private readonly _swapService: SwapService;
    private readonly _exchangeProxyAddress: string;

    constructor(swapService: SwapService, contractAddresses: ContractAddresses) {
        this._exchangeProxyAddress = contractAddresses.exchangeProxy;
        this._swapService = swapService;
    }

    public async getMetaTransactionPriceAsync(params: MetaTransactionQuoteParams): Promise<MetaTransactionQuoteResult> {
        return this._getMetaTransactionQuoteAsync(params, 'price');
    }

    public async getMetaTransactionQuoteAsync(
        params: MetaTransactionQuoteParams,
    ): Promise<MetaTransactionQuoteResponse> {
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
        const metaTransaction = this._generateExchangeProxyMetaTransaction(
            quote.callData,
            quote.taker,
            normalizeGasPrice(quote.gasPrice),
            ZERO, // protocol fee
        );

        const metaTransactionHash = getExchangeProxyMetaTransactionHash(metaTransaction);
        return {
            ...commonQuoteFields,
            metaTransaction,
            metaTransactionHash,
        };
    }

    private _generateExchangeProxyMetaTransaction(
        callData: string,
        takerAddress: string,
        _gasPrice: BigNumber,
        protocolFee: BigNumber,
    ): ExchangeProxyMetaTransaction {
        return {
            callData,
            minGasPrice: new BigNumber(1),
            maxGasPrice: new BigNumber(2).pow(48), // high value 0x1000000000000
            expirationTimeSeconds: createExpirationTime(),
            salt: generatePseudoRandomSalt(),
            signer: takerAddress,
            sender: NULL_ADDRESS,
            feeAmount: ZERO,
            feeToken: NULL_ADDRESS,
            value: protocolFee,
            domain: {
                chainId: CHAIN_ID,
                verifyingContract: this._exchangeProxyAddress,
            },
        };
    }

    private async _getMetaTransactionQuoteAsync(
        params: MetaTransactionQuoteParams,
        endpoint: 'price' | 'quote',
    ): Promise<MetaTransactionQuoteResult> {
        const wrappedNativeToken = NATIVE_FEE_TOKEN_BY_CHAIN_ID[CHAIN_ID];

        const quoteParams = {
            ...params,
            // NOTE: Internally all ETH trades are for WETH, we just wrap/unwrap automatically
            buyToken: params.isETHBuy ? wrappedNativeToken : params.buyTokenAddress,
            endpoint,
            isMetaTransaction: true,
            isUnwrap: false,
            isWrap: false,
            sellToken: params.sellTokenAddress,
            shouldSellEntireBalance: false,
            skipValidation: true,
        };

        const quote = await this._swapService.calculateSwapQuoteAsync(quoteParams);

        // Quote Report
        if (endpoint === 'quote' && quote.extendedQuoteReportSources && kafkaProducer) {
            const quoteId = getQuoteIdFromSwapQuote(quote);
            publishQuoteReport(
                {
                    quoteId,
                    taker: params.takerAddress,
                    quoteReportSources: quote.extendedQuoteReportSources,
                    submissionBy: 'gaslessSwapAmm',
                    ammQuoteUniqueId: params.quoteUniqueId,
                    buyTokenAddress: quote.buyTokenAddress,
                    sellTokenAddress: quote.sellTokenAddress,
                    buyAmount: params.buyAmount,
                    sellAmount: params.sellAmount,
                    integratorId: params.integratorId,
                    blockNumber: quote.blockNumber,
                    slippage: params.slippagePercentage,
                    estimatedGas: quote.estimatedGas,
                },
                true,
                kafkaProducer,
            );
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

function normalizeGasPrice(gasPrice: BigNumber): BigNumber {
    return gasPrice.div(ONE_GWEI).integerValue(BigNumber.ROUND_UP).times(ONE_GWEI);
}

function createExpirationTime(): BigNumber {
    return new BigNumber(Date.now() + META_TX_EXPIRATION_BUFFER_MS)
        .div(ONE_SECOND_MS)
        .integerValue(BigNumber.ROUND_CEIL);
}

/*
 * Extract the quote ID from the quote filldata
 */
function getQuoteIdFromSwapQuote(quote: GetSwapQuoteResponse): string {
    const bytesPos = quote.data.indexOf(AFFILIATE_DATA_SELECTOR);
    const quoteIdOffset = 118; // Offset of quoteId from Affiliate data selector
    const startingIndex = bytesPos + quoteIdOffset;
    const quoteId = quote.data.slice(startingIndex, startingIndex + 10);
    return quoteId;
}
