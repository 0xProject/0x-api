import { MarketOperation, QuoteRequestor } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';

import { RFQT_REQUEST_MAX_RESPONSE_MS } from '../config';
import { NULL_ADDRESS } from '../constants';

export interface FetchIndicativeQuoteParams {
    apiKey: string;
    amount: BigNumber; // in terms of the amount the taker is selling
    buyToken: string;
    sellToken: string;
    takerAddress?: string;
}

export interface FetchIndicativeQuoteResponse {
    buyAmount: BigNumber;
    buyTokenAddress: string;
    price: BigNumber;
    sellAmount: BigNumber;
    sellTokenAddress: string;
}

/**
 * RfqmService is the coordination layer for HTTP based RFQM flows
 */
export class RfqmService {
    constructor(private readonly _quoteRequestor: QuoteRequestor) {}

    /**
     * Fetch the best indicative quote available.
     */
    public async fetchIndicativeQuoteAsync(params: FetchIndicativeQuoteParams): Promise<FetchIndicativeQuoteResponse> {
        const { amount, sellToken, buyToken, apiKey } = params;

        // Map params to the terminology of Quote Requestor
        const marketOperation = MarketOperation.Sell;
        const assetFillAmount = amount;
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

        // Filter out quotes that:
        // - are for the wrong pair
        // - cannot fill 100 % of the requested amount
        //
        // And sort by best price
        const sortedQuotes = indicativeQuotes
            .filter((q) => q.takerToken === takerToken && q.makerToken === makerToken)
            .filter((q) => q.takerAmount.gte(assetFillAmount))
            .sort((a, b) => {
                const aPrice = a.makerAmount.div(a.takerAmount);
                const bPrice = b.makerAmount.div(b.takerAmount);
                return bPrice.minus(aPrice).toNumber();
            });

        // No quotes found
        if (sortedQuotes.length === 0) {
            return Promise.reject(new Error('No valid quotes'));
        }

        const bestQuote = sortedQuotes[0];

        // Prepare response
        // TODO: handle decimals properly in price
        return {
            buyAmount: bestQuote.makerAmount,
            buyTokenAddress: bestQuote.makerToken,
            sellAmount: bestQuote.takerAmount,
            sellTokenAddress: bestQuote.takerToken,
            price: bestQuote.makerAmount.div(bestQuote.takerAmount),
        };
    }
}

// tslint:disable:max-file-line-count
