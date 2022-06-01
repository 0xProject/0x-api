import {
    IRfqClient,
    RfqClientV1PriceRequest,
    RfqClientV1PriceResponse,
    RfqClientV1QuoteRequest,
    RfqClientV1QuoteResponse,
} from '@0x/asset-swapper';
import { AxiosInstance } from 'axios';
import { OK } from 'http-status-codes';

import { RFQT_REQUEST_MAX_RESPONSE_MS } from '../config';
import { logger } from '../logger';

export class RfqClient implements IRfqClient {
    constructor(private readonly _rfqApiUrl: string, private readonly _axiosInstance: AxiosInstance) {}

    /**
     * Communicates to an RFQ Client to fetch available prices
     */
    public async getV1PricesAsync(request: RfqClientV1PriceRequest): Promise<RfqClientV1PriceResponse> {
        try {
            const response = await this._axiosInstance.post(
                `${this._rfqApiUrl}/rfqt/v1/prices`,
                {
                    altRfqAssetOfferings: request.altRfqAssetOfferings,
                    assetFillAmount: request.assetFillAmount,
                    chainId: request.chainId,
                    comparisonPrice: request.comparisonPrice,
                    integratorId: request.integratorId,
                    intentOnFilling: request.intentOnFilling,
                    makerToken: request.makerToken,
                    marketOperation: request.marketOperation,
                    takerAddress: request.takerAddress,
                    takerToken: request.takerToken,
                    txOrigin: request.txOrigin,
                },
                {
                    // tslint:disable-next-line: custom-no-magic-numbers
                    timeout: RFQT_REQUEST_MAX_RESPONSE_MS + 150,
                    headers: {
                        '0x-chain-id': request.chainId,
                    },
                },
            );

            if (response.status !== OK) {
                logger.warn({ request }, 'Unable to get RFQt v1 prices');
                return {
                    prices: [],
                };
            }

            const priceResponse = response.data as RfqClientV1PriceResponse;
            logger.info({ priceResponse }, 'RFQt v1 price response');
            return priceResponse;
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
            const response = await this._axiosInstance.post(
                `${this._rfqApiUrl}/rfqt/v1/quotes`,
                {
                    altRfqAssetOfferings: request.altRfqAssetOfferings,
                    assetFillAmount: request.assetFillAmount,
                    chainId: request.chainId,
                    comparisonPrice: request.comparisonPrice,
                    integratorId: request.integratorId,
                    intentOnFilling: request.intentOnFilling,
                    makerToken: request.makerToken,
                    marketOperation: request.marketOperation,
                    takerAddress: request.takerAddress,
                    takerToken: request.takerToken,
                    txOrigin: request.txOrigin,
                },
                {
                    // tslint:disable-next-line: custom-no-magic-numbers
                    timeout: RFQT_REQUEST_MAX_RESPONSE_MS + 150,
                    headers: {
                        '0x-chain-id': request.chainId,
                    },
                },
            );

            if (response.status !== OK) {
                logger.warn({ request }, 'Unable to get RFQt v1 quotes');
                return {
                    quotes: [],
                };
            }

            const quoteResponse = response.data as RfqClientV1QuoteResponse;
            logger.info({ quoteReesponse: quoteResponse }, 'RFQt v1 quote response');
            return quoteResponse;
        } catch (error) {
            logger.error({ errorMessage: error.message }, 'Encountered an error fetching for /rfqt/v1/quotes');
            return {
                quotes: [],
            };
        }
    }
}
