import { AssetSwapperContractAddresses, MarketOperation, ProtocolFeeUtils, QuoteRequestor } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';

import { META_TX_WORKER_REGISTRY, RFQT_REQUEST_MAX_RESPONSE_MS } from '../config';
import { NULL_ADDRESS, ONE_MINUTE_MS } from '../constants';

export interface FetchIndicativeQuoteParams {
    apiKey: string;
    buyAmount?: BigNumber;
    sellAmount?: BigNumber;
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
    gas: BigNumber;
    allowanceTarget?: string;
}

export const EMPTY_QUOTE_RESPONSE = {
    buyAmount: new BigNumber(0),
    buyTokenAddress: '',
    price: new BigNumber(0),
    sellAmount: new BigNumber(0),
    sellTokenAddress: '',
    gas: new BigNumber(0),
    allowanceTarget: NULL_ADDRESS,
};

const RFQM_DEFAULT_OPTS = {
    takerAddress: NULL_ADDRESS,
    txOrigin: META_TX_WORKER_REGISTRY || NULL_ADDRESS,
    makerEndpointMaxResponseTimeMs: RFQT_REQUEST_MAX_RESPONSE_MS,
    nativeExclusivelyRFQ: true,
    altRfqAssetOfferings: {},
    isLastLook: true,
};

/**
 * RfqmService is the coordination layer for HTTP based RFQM flows
 */
export class RfqmService {
    constructor(
        private readonly _quoteRequestor: QuoteRequestor,
        private readonly _protocolFeeUtils: ProtocolFeeUtils,
        private readonly _contractAddresses: AssetSwapperContractAddresses,
    ) {}

    /**
     * Fetch the best indicative quote available.
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
            ...RFQM_DEFAULT_OPTS,
            apiKey,
            intentOnFilling: false, // TODO - safe to hardcode?
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

        // Filter out quotes that:
        // - are for the wrong pair
        // - cannot fill 100 % of the requested amount
        // - expire in less than 3 minutes
        //
        // And sort by best price
        const now = new BigNumber(Date.now());
        const sortedQuotes = indicativeQuotes
            .filter((q) => q.takerToken === takerToken && q.makerToken === makerToken)
            .filter((q) => {
                const requestedAmount = isSelling ? q.takerAmount : q.makerAmount;
                return requestedAmount.gte(assetFillAmount);
            })
            // tslint:disable-next-line: custom-no-magic-numbers
            .filter((q) => q.expiry.gte(now.plus(ONE_MINUTE_MS * 3)))
            .sort((a, b) => {
                // Want the most amount of maker tokens for each taker token
                const aPrice = a.makerAmount.div(a.takerAmount);
                const bPrice = b.makerAmount.div(b.takerAmount);
                return bPrice.minus(aPrice).toNumber();
            });

        // No quotes found
        if (sortedQuotes.length === 0) {
            return Promise.resolve(EMPTY_QUOTE_RESPONSE);
        }

        const bestQuote = sortedQuotes[0];

        // Prepare gas estimate
        const gas = await this._protocolFeeUtils.getGasPriceEstimationOrThrowAsync();

        // Prepare response
        // TODO: handle decimals properly in price
        return {
            price: bestQuote.makerAmount.div(bestQuote.takerAmount),
            gas,
            buyAmount: bestQuote.makerAmount,
            buyTokenAddress: bestQuote.makerToken,
            sellAmount: bestQuote.takerAmount,
            sellTokenAddress: bestQuote.takerToken,
            allowanceTarget: this._contractAddresses.exchangeProxy,
        };
    }
}

// tslint:disable:max-file-line-count
