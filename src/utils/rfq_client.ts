import { OtcOrder, RfqOrder } from '@0x/protocol-utils';
import { BigNumber } from '@0x/utils';
import { AxiosInstance } from 'axios';
import { OK } from 'http-status-codes';

import {
    RfqClientV1PriceRequest,
    RfqClientV1PriceResponse,
    RfqClientV1QuoteRequest,
    RfqClientV1QuoteResponse,
} from '../asset-swapper';
import { RfqtV2Prices, RfqtV2Quotes, RfqtV2Request } from '../asset-swapper/types';
import { RFQT_REQUEST_MAX_RESPONSE_MS, RFQ_CLIENT_ROLLOUT_PERCENT } from '../config';
import { logger } from '../logger';
import { isHashSmallEnough } from './hash_utils';

// A mapper function to return a serialized RfqOrder into one with BigNumbers
const toRfqOrder = (obj: any): RfqOrder => {
    return new RfqOrder({
        makerToken: obj.makerToken,
        takerToken: obj.takerToken,
        makerAmount: new BigNumber(obj.makerAmount),
        takerAmount: new BigNumber(obj.takerAmount),
        maker: obj.maker,
        taker: obj.taker,
        chainId: obj.chainId,
        verifyingContract: obj.verifyingContract,
        txOrigin: obj.txOrigin,
        pool: obj.pool,
        salt: new BigNumber(obj.salt),
        expiry: new BigNumber(obj.expiry),
    });
};

// A mapper function to return a serialized OtcOrder into one with BigNumbers
const toOtcOrder = (obj: any): OtcOrder => {
    return new OtcOrder({
        makerToken: obj.makerToken,
        takerToken: obj.takerToken,
        makerAmount: new BigNumber(obj.makerAmount),
        takerAmount: new BigNumber(obj.takerAmount),
        maker: obj.maker,
        taker: obj.taker,
        chainId: obj.chainId,
        verifyingContract: obj.verifyingContract,
        txOrigin: obj.txOrigin,
        expiryAndNonce: new BigNumber(obj.expiryAndNonce),
    });
};

export class RfqClient {
    private static isRolledOut(request: RfqtV2Request): boolean {
        return isHashSmallEnough({
            message:
                `${request.txOrigin}-${request.takerToken}-${request.makerToken}-${request.assetFillAmount}-${request.marketOperation}`.toLowerCase(),
            threshold: RFQ_CLIENT_ROLLOUT_PERCENT / 100,
        });
    }

    constructor(private readonly _rfqApiUrl: string, private readonly _axiosInstance: AxiosInstance) {}

    /**
     * Communicates to an RFQ Client to fetch available prices
     */
    public async getV1PricesAsync(request: RfqClientV1PriceRequest): Promise<RfqClientV1PriceResponse> {
        try {
            const response = await this._axiosInstance.post(`${this._rfqApiUrl}/rfqt/v1/prices`, request, {
                timeout: RFQT_REQUEST_MAX_RESPONSE_MS + 150,
                headers: {
                    '0x-chain-id': request.chainId,
                },
            });

            if (response.status !== OK) {
                logger.warn({ request }, 'Unable to get RFQt v1 prices');
                return {
                    prices: [],
                };
            }

            return response.data as RfqClientV1PriceResponse;
        } catch (error) {
            logger.error({ errorMessage: error.message }, 'Encountered an error fetching for /rfqt/v1/prices');
            return {
                prices: [],
            };
        }
    }

    /**
     * Communicates to an RFQ Client to fetch available signed quotes
     */
    public async getV1QuotesAsync(request: RfqClientV1QuoteRequest): Promise<RfqClientV1QuoteResponse> {
        try {
            const response = await this._axiosInstance.post(`${this._rfqApiUrl}/rfqt/v1/quotes`, request, {
                timeout: RFQT_REQUEST_MAX_RESPONSE_MS + 150,
                headers: {
                    '0x-chain-id': request.chainId,
                },
            });

            if (response.status !== OK) {
                logger.warn({ request }, 'Unable to get RFQt v1 quotes');
                return {
                    quotes: [],
                };
            }

            const updatedQuotes = response.data?.quotes.map((q: any) => {
                return {
                    signature: q.signature,
                    makerUri: q.makerUri,
                    order: toRfqOrder(q.order),
                };
            });
            return {
                quotes: updatedQuotes,
            };
        } catch (error) {
            logger.error({ errorMessage: error.message }, 'Encountered an error fetching for /rfqt/v1/quotes');
            return {
                quotes: [],
            };
        }
    }

    /**
     * Communicates to an RFQ Client to fetch available v2 prices
     */
    public async getV2PricesAsync(request: RfqtV2Request): Promise<RfqtV2Prices> {
        // Short circuit if not rolled out
        if (!RfqClient.isRolledOut(request)) {
            return [];
        }

        try {
            const response = await this._axiosInstance.post(`${this._rfqApiUrl}/internal/rfqt/v2/prices`, request, {
                timeout: RFQT_REQUEST_MAX_RESPONSE_MS + 150,
                headers: {
                    '0x-chain-id': request.chainId,
                },
            });

            if (response.status !== OK) {
                logger.warn({ request }, 'Unable to get RFQt v2 prices');
                return [];
            }

            // return response.data as RfqtV2Prices;

            return response.data?.map((q: any) => {
                return {
                    ...q,
                    expiry: new BigNumber(q.expiry),
                    makerAmount: new BigNumber(q.makerAmount),
                    takerAmount: new BigNumber(q.takerAmount),
                };
            });
        } catch (error) {
            logger.error({ errorMessage: error.message }, 'Encountered an error fetching for /internal/rfqt/v2/prices');
            return [];
        }
    }

    /**
     * Communicates to an RFQ Client to fetch available signed v2 quotes
     */
    public async getV2QuotesAsync(request: RfqtV2Request): Promise<RfqtV2Quotes> {
        // Short circuit if not rolled out
        if (!RfqClient.isRolledOut(request)) {
            return [];
        }
        try {
            const response = await this._axiosInstance.post(`${this._rfqApiUrl}/internal/rfqt/v2/quotes`, request, {
                timeout: RFQT_REQUEST_MAX_RESPONSE_MS + 150,
                headers: {
                    '0x-chain-id': request.chainId,
                },
            });

            if (response.status !== OK) {
                logger.warn({ request }, 'Unable to get RFQt v2 quotes');
                return [];
            }

            const quotes: RfqtV2Quotes = response.data?.map((q: any) => {
                return {
                    fillableMakerAmount: new BigNumber(q.fillableMakerAmount),
                    fillableTakerAmount: new BigNumber(q.fillableTakerAmount),
                    fillableTakerFeeAmount: new BigNumber(q.fillableTakerFeeAmount),
                    signature: q.signature,
                    makerUri: q.makerUri,
                    makerId: q.makerId,
                    order: toOtcOrder(q.order),
                };
            });
            return quotes;
        } catch (error) {
            logger.error({ errorMessage: error.message }, 'Encountered an error fetching for /internal/rfqt/v2/quotes');
            return [];
        }
    }
}
