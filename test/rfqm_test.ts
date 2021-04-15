// tslint:disable:max-file-line-count
import {
    MockedRfqQuoteResponse,
    QuoteRequestor,
    RfqMakerAssetOfferings,
    rfqtMocker,
    RfqtQuoteEndpoint,
} from '@0x/asset-swapper';
import { ContractAddresses } from '@0x/contract-addresses';
import { expect } from '@0x/contracts-test-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import Axios, { AxiosInstance } from 'axios';
import { Server } from 'http';
import * as HttpStatus from 'http-status-codes';
import 'mocha';
import * as request from 'supertest';

import { getDefaultAppDependenciesAsync } from '../src/app';
import * as config from '../src/config';
import { RFQM_PATH } from '../src/constants';
import { runHttpRfqmServiceAsync } from '../src/runners/http_rfqm_service_runner';
import { RfqmService } from '../src/services/rfqm_service';

import { CONTRACT_ADDRESSES, getProvider, NULL_ADDRESS } from './constants';
import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';

// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../src/app')];

const SUITE_NAME = 'RFQM Integration Tests';

// RFQM Market Maker request specific constants
const MARKET_MAKER_1 = 'https://mock-rfqt1.club';
const MARKET_MAKER_2 = 'https://mock-rfqt2.club';
const BASE_RFQM_REQUEST_PARAMS = {
    txOrigin: NULL_ADDRESS,
    takerAddress: NULL_ADDRESS,
    protocolVersion: '4',
    comparisonPrice: undefined,
    isLastLook: 'true',
};
const API_KEY = 'koolApiKey';

describe.only(SUITE_NAME, () => {
    const contractAddresses: ContractAddresses = CONTRACT_ADDRESSES;
    let makerAddress: string;
    let takerAddress: string;
    let axiosClient: AxiosInstance;
    let app: Express.Application;
    let server: Server;

    before(async () => {
        // docker-compose up
        await setupDependenciesAsync(SUITE_NAME);

        // Create a Provider
        const provider = getProvider();
        const web3Wrapper = new Web3Wrapper(provider);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [makerAddress, takerAddress] = accounts;

        // Build default dependencies
        const dependencyConfigs = config.defaultHttpServiceConfig;
        delete dependencyConfigs.meshHttpUri;
        delete dependencyConfigs.meshWebsocketUri;
        delete dependencyConfigs.metaTxnRateLimiters;
        const defaultDeps = await getDefaultAppDependenciesAsync(provider, dependencyConfigs);

        // Create Axios client
        axiosClient = Axios.create();

        // Mock config for the asset offerings in this test
        const mockAssetOfferings: RfqMakerAssetOfferings = {
            [MARKET_MAKER_1]: [[contractAddresses.zrxToken, contractAddresses.etherToken]],
            [MARKET_MAKER_2]: [[contractAddresses.zrxToken, contractAddresses.etherToken]],
        };

        // Build QuoteRequestor, note that Axios client it accessible outside of this scope
        const quoteRequestor = new QuoteRequestor({}, mockAssetOfferings, axiosClient);

        // Override the "default" rfqmService with our special one
        const dependencies = {
            ...defaultDeps,
            rfqmService: new RfqmService(quoteRequestor),
        };

        // Start the server
        const res = await runHttpRfqmServiceAsync(dependencies, config.defaultHttpServiceConfig);
        app = res.app;
        server = res.server;
    });

    after(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((err?: Error) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        await teardownDependenciesAsync(SUITE_NAME);
    });

    describe('rfqm/v1/price', async () => {
        it('should return an indicative quote', async () => {
            const sellAmount = 100000000000000000;
            const winningQuote = 200000000000000000;
            const losingQuote = 150000000000000000;
            const params = new URLSearchParams({
                buyToken: 'ZRX',
                sellToken: 'WETH',
                sellAmount: sellAmount.toString(),
                takerAddress,
                intentOnFilling: 'false',
                skipValidation: 'true',
            });

            const expectedPrice = '2';
            return rfqtMocker.withMockedRfqtQuotes(
                [
                    {
                        // Quote from MM 1
                        endpoint: MARKET_MAKER_1,
                        requestApiKey: API_KEY,
                        requestParams: {
                            ...BASE_RFQM_REQUEST_PARAMS,
                            sellAmountBaseUnits: sellAmount.toString(),
                            buyTokenAddress: contractAddresses.zrxToken,
                            sellTokenAddress: contractAddresses.etherToken,
                        },
                        responseCode: 200,
                        responseData: {
                            makerAmount: losingQuote.toString(),
                            takerAmount: sellAmount.toString(),
                            makerToken: contractAddresses.zrxToken,
                            takerToken: contractAddresses.etherToken,
                            expiry: '1903620548', // in the year 2030
                        },
                    },
                    {
                        // Quote from MM 2
                        endpoint: MARKET_MAKER_2,
                        requestApiKey: API_KEY,
                        requestParams: {
                            ...BASE_RFQM_REQUEST_PARAMS,
                            sellAmountBaseUnits: sellAmount.toString(),
                            buyTokenAddress: contractAddresses.zrxToken,
                            sellTokenAddress: contractAddresses.etherToken,
                        },
                        responseCode: 200,
                        responseData: {
                            makerAmount: winningQuote.toString(),
                            takerAmount: sellAmount.toString(),
                            makerToken: contractAddresses.zrxToken,
                            takerToken: contractAddresses.etherToken,
                            expiry: '1903620548', // in the year 2030
                        },
                    },
                ] as MockedRfqQuoteResponse[],
                RfqtQuoteEndpoint.Indicative,
                async () => {
                    const appResponse = await request(app)
                        .get(`${RFQM_PATH}/price?${params.toString()}`)
                        .set('0x-api-key', API_KEY)
                        .expect(HttpStatus.OK)
                        .expect('Content-Type', /json/);

                    expect(appResponse.body.price).to.equal(expectedPrice);
                },
                axiosClient,
            );
        });
    });
});
