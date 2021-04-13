import { MarketOperation, QuoteRequestor } from '@0x/asset-swapper';

import { RFQT_REQUEST_MAX_RESPONSE_MS } from '../config';
import { NULL_ADDRESS } from '../constants';
import {
    FetchFirmQuoteParams,
    FetchFirmQuoteResponse,
    FetchIndicativeQuoteParams,
    FetchIndicativeQuoteResponse,
} from '../types';

/**
 * RfqmService is the coordination layer for HTTP based RFQM flows
 */
export class RfqmService {
    constructor(private readonly _quoteRequestor: QuoteRequestor) {}

    /**
     * Fetch the best indicative quote available
     */
    public async fetchIndicativeQuoteAsync(params: FetchIndicativeQuoteParams): Promise<FetchIndicativeQuoteResponse> {
        const { sellAmount, buyAmount, sellToken, buyToken, apiKey } = params;

        // Map params to the terminology of Quote Requestor
        const isSelling = sellAmount !== undefined;
        const marketOperation = isSelling ? MarketOperation.Sell : MarketOperation.Buy;
        const assetFillAmount = isSelling ? sellAmount! : buyAmount!;
        const makerToken = buyToken;
        const takerToken = sellToken;

        // Fetch quotes
        const opts = {
            takerAddress: NULL_ADDRESS,
            txOrigin: NULL_ADDRESS, // TODO - set to worker registry
            apiKey,
            intentOnFilling: false, // TODO - safe to hardcode?
            isIndicative: true,
            makerEndpointMaxResponseTimeMs: RFQT_REQUEST_MAX_RESPONSE_MS,
            nativeExclusivelyRFQ: true,
            altRfqAssetOfferings: {}, // TODO - set this to the alt rfq asset offerings
            isLastLook: true,
        };
        const indicativeQuotes = await this._quoteRequestor.requestRfqmIndicativeQuotesAsync(
            makerToken,
            takerToken,
            assetFillAmount,
            marketOperation,
            undefined,
            opts,
        );

        // Filter only quotes that are 100% filled, and sort by best price
        const sortedQuotes = indicativeQuotes
            .filter((q) => q.takerAmount.eq(assetFillAmount))
            .sort((a, b) => {
                const aPrice = a.makerAmount.div(a.takerAmount);
                const bPrice = b.makerAmount.div(b.takerAmount);
                return bPrice.minus(aPrice).toNumber();
            });

        // No quotes found
        if (sortedQuotes.length === 0) {
            return Promise.reject(new Error('No valid quotes'));
        }

        // Prepare response
        // TODO: handle decimals properly in price
        return {
            buyAmount: sortedQuotes[0].makerAmount,
            buyTokenAddress: sortedQuotes[0].makerToken,
            sellAmount: sortedQuotes[0].takerAmount,
            sellTokenAddress: sortedQuotes[0].takerToken,
            price: isSelling
                ? sortedQuotes[0].makerAmount.div(sortedQuotes[0].takerAmount)
                : sortedQuotes[0].takerAmount.div(sortedQuotes[0].makerAmount),
        };
    }

    /**
     * Fetch the best firm quote available, as a signable metatransaction
     */
    public async fetchFirmQuoteAsync(params: FetchFirmQuoteParams): Promise<FetchFirmQuoteResponse> {
        const { sellAmount, buyAmount, sellToken, buyToken, apiKey } = params;

        // Map params to the terminology of Quote Requestor
        const marketOperation = sellAmount !== undefined ? MarketOperation.Sell : MarketOperation.Buy;
        const assetFillAmount = sellAmount !== undefined ? sellAmount! : buyAmount!;
        const makerToken = buyToken;
        const takerToken = sellToken;

        // Fetch quotes
        const opts = {
            takerAddress: NULL_ADDRESS,
            txOrigin: NULL_ADDRESS, // TODO - set to worker registry
            apiKey,
            intentOnFilling: false, // TODO - safe to hardcode?
            isIndicative: false,
            makerEndpointMaxResponseTimeMs: RFQT_REQUEST_MAX_RESPONSE_MS,
            nativeExclusivelyRFQ: true,
            altRfqAssetOfferings: {}, // TODO - set this to the alt rfq asset offerings
            isLastLook: true,
        };
        const firmQuotes = await this._quoteRequestor.requestRfqmFirmQuotesAsync(
            makerToken,
            takerToken,
            assetFillAmount,
            marketOperation,
            undefined,
            opts,
        );

        // Filter only quotes that are 100% filled, and sort by best price
        const sortedQuotes = firmQuotes
            .filter((q) => q.order.takerAmount.eq(assetFillAmount))
            .sort((a, b) => {
                const aPrice = a.order.makerAmount.div(a.order.takerAmount);
                const bPrice = b.order.makerAmount.div(b.order.takerAmount);
                return bPrice.minus(aPrice).toNumber();
            });

        // TODO - transform the result into a metatransaction
        return sortedQuotes.length > 0 ? Promise.resolve({}) : Promise.reject(new Error('No valid quotes'));
    }
}

// tslint:disable:max-file-line-count
