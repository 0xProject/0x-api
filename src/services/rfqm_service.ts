// tslint:disable:max-file-line-count
import { AssetSwapperContractAddresses, MarketOperation, ProtocolFeeUtils, QuoteRequestor } from '@0x/asset-swapper';
import { MetaTransaction, RfqOrder } from '@0x/protocol-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { CHAIN_ID, META_TX_WORKER_REGISTRY, RFQT_REQUEST_MAX_RESPONSE_MS } from '../config';
import { NULL_ADDRESS, RFQM_MINIMUM_EXPIRY_DURATION_MS } from '../constants';
import { getBestQuote } from '../utils/quote_comparison_utils';
import { RfqBlockchainUtils } from '../utils/rfq_blockchain_utils';

export interface FetchIndicativeQuoteParams {
    apiKey: string;
    buyAmount?: BigNumber;
    buyToken: string;
    buyTokenDecimals: number;
    sellAmount?: BigNumber;
    sellToken: string;
    sellTokenDecimals: number;
    takerAddress?: string;
}

export interface FetchIndicativeQuoteResponse {
    allowanceTarget?: string;
    buyAmount: BigNumber;
    buyTokenAddress: string;
    gas: BigNumber;
    price: BigNumber;
    sellAmount: BigNumber;
    sellTokenAddress: string;
}
export interface FetchFirmQuoteParams {
    apiKey: string;
    buyAmount?: BigNumber;
    buyToken: string;
    buyTokenDecimals: number;
    sellAmount?: BigNumber;
    sellToken: string;
    sellTokenDecimals: number;
    takerAddress: string;
}

export interface FetchFirmQuoteResponse {
    allowanceTarget?: string;
    buyAmount: BigNumber;
    buyTokenAddress: string;
    gas: BigNumber;
    price: BigNumber;
    sellAmount: BigNumber;
    sellTokenAddress: string;
    metaTransaction: MetaTransaction;
    metaTransactionHash: string;
}

const RFQM_DEFAULT_OPTS = {
    takerAddress: NULL_ADDRESS,
    txOrigin: META_TX_WORKER_REGISTRY || NULL_ADDRESS,
    makerEndpointMaxResponseTimeMs: RFQT_REQUEST_MAX_RESPONSE_MS,
    nativeExclusivelyRFQ: true,
    altRfqAssetOfferings: {},
    isLastLook: true,
};

/**
 * RfqmService is the coordination layer for HTTP based RFQM flows.
 */
export class RfqmService {
    constructor(
        private readonly _quoteRequestor: QuoteRequestor,
        private readonly _protocolFeeUtils: ProtocolFeeUtils,
        private readonly _contractAddresses: AssetSwapperContractAddresses,
        private readonly _registryAddress: string,
        private readonly _blockchainUtils: RfqBlockchainUtils,
    ) {
        if (_registryAddress === NULL_ADDRESS) {
            throw new Error('Must set the worker registry to valid address');
        }
    }

    /**
     * Fetch the best indicative quote available. Returns null if no valid quotes found
     */
    public async fetchIndicativeQuoteAsync(
        params: FetchIndicativeQuoteParams,
    ): Promise<FetchIndicativeQuoteResponse | null> {
        // Extract params
        const {
            sellAmount,
            buyAmount,
            sellToken: takerToken,
            buyToken: makerToken,
            sellTokenDecimals: takerTokenDecimals,
            buyTokenDecimals: makerTokenDecimals,
            apiKey,
        } = params;

        // Quote Requestor specific params
        const isSelling = sellAmount !== undefined;
        const marketOperation = isSelling ? MarketOperation.Sell : MarketOperation.Buy;
        const assetFillAmount = isSelling ? sellAmount! : buyAmount!;

        // Prepare gas estimate
        const gas: BigNumber = await this._protocolFeeUtils.getGasPriceEstimationOrThrowAsync();

        // Fetch quotes
        const opts = {
            ...RFQM_DEFAULT_OPTS,
            txOrigin: this._registryAddress,
            apiKey,
            intentOnFilling: false,
            isIndicative: true,
        };
        const indicativeQuotes = await this._quoteRequestor.requestRfqmIndicativeQuotesAsync(
            makerToken,
            takerToken,
            assetFillAmount,
            marketOperation,
            undefined,
            opts,
        );

        // Get the best quote
        const bestQuote = getBestQuote(
            indicativeQuotes,
            isSelling,
            takerToken,
            makerToken,
            assetFillAmount,
            RFQM_MINIMUM_EXPIRY_DURATION_MS,
        );

        // No quotes found
        if (bestQuote === null) {
            return null;
        }

        // Prepare the price
        const makerAmountInUnit = Web3Wrapper.toUnitAmount(bestQuote.makerAmount, makerTokenDecimals);
        const takerAmountInUnit = Web3Wrapper.toUnitAmount(bestQuote.takerAmount, takerTokenDecimals);
        const price = isSelling ? makerAmountInUnit.div(takerAmountInUnit) : takerAmountInUnit.div(makerAmountInUnit);

        // Prepare response
        return {
            price,
            gas,
            buyAmount: bestQuote.makerAmount,
            buyTokenAddress: bestQuote.makerToken,
            sellAmount: bestQuote.takerAmount,
            sellTokenAddress: bestQuote.takerToken,
            allowanceTarget: this._contractAddresses.exchangeProxy,
        };
    }

    /**
     * Fetch the best firm quote available, including a metatransaction. Returns null if no valid quotes found
     */
    public async fetchFirmQuoteAsync(params: FetchFirmQuoteParams): Promise<FetchFirmQuoteResponse | null> {
        // Extract params
        const {
            sellAmount,
            buyAmount,
            sellToken: takerToken,
            buyToken: makerToken,
            sellTokenDecimals: takerTokenDecimals,
            buyTokenDecimals: makerTokenDecimals,
            apiKey,
            takerAddress,
        } = params;

        // Quote Requestor specific params
        const isSelling = sellAmount !== undefined;
        const marketOperation = isSelling ? MarketOperation.Sell : MarketOperation.Buy;
        const assetFillAmount = isSelling ? sellAmount! : buyAmount!;

        // Prepare gas estimate
        const gas: BigNumber = await this._protocolFeeUtils.getGasPriceEstimationOrThrowAsync();

        // Fetch quotes
        const opts = {
            ...RFQM_DEFAULT_OPTS,
            takerAddress,
            txOrigin: this._registryAddress,
            apiKey,
            intentOnFilling: true,
            isIndicative: false,
        };
        const firmQuotes = await this._quoteRequestor.requestRfqmFirmQuotesAsync(
            makerToken,
            takerToken,
            assetFillAmount,
            marketOperation,
            undefined,
            opts,
        );

        // Get the best quote
        const bestQuote = getBestQuote(
            firmQuotes,
            isSelling,
            takerToken,
            makerToken,
            assetFillAmount,
            RFQM_MINIMUM_EXPIRY_DURATION_MS,
        );

        // No quote found
        if (bestQuote === null) {
            return null;
        }

        // Generate the Meta Transaction and its hash
        const rfqOrder = bestQuote.order as RfqOrder;
        const metaTransaction = this._blockchainUtils.generateMetaTransaction(
            rfqOrder,
            bestQuote.signature,
            takerAddress,
            bestQuote.order.takerAmount,
            CHAIN_ID,
        );
        const metaTransactionHash = metaTransaction.getHash();

        // TODO: Save a record of the metatransactionHash (indexed), orderHash, and fee (a json blob)

        // Prepare the price
        const makerAmountInUnit = Web3Wrapper.toUnitAmount(bestQuote.order.makerAmount, makerTokenDecimals);
        const takerAmountInUnit = Web3Wrapper.toUnitAmount(bestQuote.order.takerAmount, takerTokenDecimals);
        const price = isSelling ? makerAmountInUnit.div(takerAmountInUnit) : takerAmountInUnit.div(makerAmountInUnit);

        // Prepare response
        return {
            price,
            gas,
            buyAmount: bestQuote.order.makerAmount,
            buyTokenAddress: bestQuote.order.makerToken,
            sellAmount: bestQuote.order.takerAmount,
            sellTokenAddress: bestQuote.order.takerToken,
            allowanceTarget: this._contractAddresses.exchangeProxy,
            metaTransaction,
            metaTransactionHash,
        };
    }
}
