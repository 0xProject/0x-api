import { MarketOperation, QuoteRequestor, RfqFirmQuoteValidator, SwapQuote } from '@0x/asset-swapper';
import { WETH9Contract } from '@0x/contract-wrappers';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { NULL_ADDRESS } from '../constants';
import { AffiliateFee } from '../types';

const ONE_SECOND_MS = 1000;
// tslint:disable-next-line: custom-no-magic-numbers
export const KEEP_ALIVE_TTL = 5 * 60 * ONE_SECOND_MS;

export class SwapService {
    private readonly _firmQuoteValidator: RfqFirmQuoteValidator | undefined;
    private _altRfqMarketsCache: any;

    constructor(private readonly _quoteRequestor: QuoteRequestor) {}

    public async fetchPricesAsync(
        makerToken: string,
        takerToken: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
    ) {
        const opts = {
            takerAddress: NULL_ADDRESS,
            txOrigin: 'TODO - worker registry',
            apiKey: 'uuid',
            intentOnFilling: false, // TODO - what is this?
            isIndicative: true,
            makerEndpointMaxResponseTimeMs: 600, // TODO - get the real thing
            nativeExclusivelyRFQ: true,
            altRfqAssetOfferings: {}, // TODO - set this to the rfq asset offerings
            isLastLook: true,
        };
        return this._quoteRequestor.requestRfqmIndicativeQuotesAsync(
            makerToken,
            takerToken,
            assetFillAmount,
            marketOperation,
            undefined,
            opts,
        );
    }

    public async fetchQuotesAsync(
        makerToken: string,
        takerToken: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
    ) {
        const opts = {
            takerAddress: NULL_ADDRESS,
            txOrigin: 'TODO - worker registry',
            apiKey: 'uuid',
            intentOnFilling: false, // TODO - what is this?
            isIndicative: false,
            makerEndpointMaxResponseTimeMs: 600, // TODO - get the real thing
            nativeExclusivelyRFQ: true,
            altRfqAssetOfferings: {}, // TODO - set this to the rfq asset offerings
            isLastLook: true,
        };
        return this._quoteRequestor.requestRfqmFirmQuotesAsync(
            makerToken,
            takerToken,
            assetFillAmount,
            marketOperation,
            undefined,
            opts,
        );
    }
}

// tslint:disable:max-file-line-count
