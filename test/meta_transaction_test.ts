import { WETH9Contract } from '@0x/contract-wrappers';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { assertRoughlyEquals, expect } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, Web3ProviderEngine, Web3Wrapper } from '@0x/dev-utils';
import { OtcOrder } from '@0x/protocol-utils';
import { isNativeSymbolOrAddress } from '@0x/token-metadata';
import { BigNumber } from '@0x/utils';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { Server } from 'http';
import * as HttpStatus from 'http-status-codes';
import * as _ from 'lodash';
import 'mocha';
import supertest from 'supertest';

import { getAppAsync } from '../src/app';
import { getDefaultAppDependenciesAsync } from '../src/runners/utils';
import { AppDependencies } from '../src/types';
import { LimitOrderFields } from '../src/asset-swapper';
import * as config from '../src/config';
import { META_TRANSACTION_V1_PATH, META_TRANSACTION_V2_PATH, ONE_SECOND_MS } from '../src/constants';
import { getDBConnectionOrThrow } from '../src/db_connection';
import { ValidationErrorCodes, ValidationErrorItem, ValidationErrorReasons } from '../src/errors';
import { GetSwapQuoteResponse, SignedLimitOrder } from '../src/types';

import {
    CHAIN_ID,
    CONTRACT_ADDRESSES,
    ETHEREUM_RPC_URL,
    getProvider,
    MAX_INT,
    MAX_MINT_AMOUNT,
    NULL_ADDRESS,
    SYMBOL_TO_ADDRESS,
    WETH_TOKEN_ADDRESS,
    ZRX_TOKEN_ADDRESS,
} from './constants';
import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';
import { constructRoute, httpGetAsync, httpPostAsync } from './utils/http_utils';
import { MockOrderWatcher } from './utils/mock_order_watcher';
import { getRandomSignedLimitOrderAsync } from './utils/orders';
import { before } from 'mocha';

// Force reload of the app avoid variables being polluted between test suites
// Warning: You probably don't want to move this
delete require.cache[require.resolve('../src/app')];
delete require.cache[require.resolve('../src/runners/utils')];

const SUITE_NAME = 'Meta-transaction API';
const MAKER_WETH_AMOUNT = new BigNumber('1000000000000000000');
const ONE_THOUSAND_IN_BASE = new BigNumber('1000000000000000000000');

const ZERO_EX_SOURCE = { name: '0x', proportion: new BigNumber('1') };

const INTEGRATOR_ID = 'test-integrator-id-1';
const TAKER_ADDRESS = '0x70a9f34f9b34c64957b9c401a97bfed35b95049e';

const RFQ_API_URL = 'https://mock-rfqt1.club';

describe(SUITE_NAME, () => {
    let app: Express.Application;
    let server: Server;
    let dependencies: AppDependencies;
    let accounts: string[];
    let takerAddress: string;
    let makerAddress: string;
    let txOrigin: string;
    const invalidTakerAddress = '0x0000000000000000000000000000000000000001';

    let blockchainLifecycle: BlockchainLifecycle;
    let provider: Web3ProviderEngine;
    let mockAxios: AxiosMockAdapter;

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        const connection = await getDBConnectionOrThrow();
        await connection.runMigrations();
        provider = getProvider();
        const web3Wrapper = new Web3Wrapper(provider);
        blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

        mockAxios = new AxiosMockAdapter(axios);

        const mockOrderWatcher = new MockOrderWatcher(connection);
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        [, makerAddress, takerAddress, txOrigin] = accounts;

        // Set up liquidity.
        await blockchainLifecycle.startAsync();

        const wethToken = new WETH9Contract(CONTRACT_ADDRESSES.etherToken, provider);
        const zrxToken = new DummyERC20TokenContract(CONTRACT_ADDRESSES.zrxToken, provider);
        // EP setup so maker address can take
        await zrxToken.mint(MAX_MINT_AMOUNT).awaitTransactionSuccessAsync({ from: takerAddress });
        await zrxToken.mint(MAX_MINT_AMOUNT).awaitTransactionSuccessAsync({ from: makerAddress });
        await wethToken.deposit().awaitTransactionSuccessAsync({ from: takerAddress, value: MAKER_WETH_AMOUNT });
        await wethToken.deposit().awaitTransactionSuccessAsync({ from: makerAddress, value: MAKER_WETH_AMOUNT });
        await wethToken
            .approve(CONTRACT_ADDRESSES.exchangeProxy, MAX_INT)
            .awaitTransactionSuccessAsync({ from: takerAddress });
        await wethToken
            .approve(CONTRACT_ADDRESSES.exchangeProxy, MAX_INT)
            .awaitTransactionSuccessAsync({ from: makerAddress });
        await zrxToken
            .approve(CONTRACT_ADDRESSES.exchangeProxy, MAX_INT)
            .awaitTransactionSuccessAsync({ from: takerAddress });
        await zrxToken
            .approve(CONTRACT_ADDRESSES.exchangeProxy, MAX_INT)
            .awaitTransactionSuccessAsync({ from: makerAddress });

        const limitOrders: Partial<LimitOrderFields>[] = [
            {
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
                makerAmount: ONE_THOUSAND_IN_BASE,
                takerAmount: ONE_THOUSAND_IN_BASE,
                maker: makerAddress,
            },
            {
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
                makerAmount: ONE_THOUSAND_IN_BASE,
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(2),
                maker: makerAddress,
            },
            {
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
                makerAmount: MAX_MINT_AMOUNT,
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(3),
                maker: makerAddress,
            },
            {
                makerToken: WETH_TOKEN_ADDRESS,
                takerToken: ZRX_TOKEN_ADDRESS,
                makerAmount: MAKER_WETH_AMOUNT,
                takerAmount: ONE_THOUSAND_IN_BASE,
                maker: makerAddress,
            },
        ];
        const signPartialOrder = (order: Partial<LimitOrderFields>) => getRandomSignedLimitOrderAsync(provider, order);
        const signedOrders: SignedLimitOrder[] = await Promise.all(limitOrders.map(signPartialOrder));
        await mockOrderWatcher.postOrdersAsync(signedOrders);

        // start the 0x-api app
        dependencies = await getDefaultAppDependenciesAsync(provider, {
            ...config.defaultHttpServiceConfig,
            ethereumRpcUrl: ETHEREUM_RPC_URL,
        });
        ({ app, server } = await getAppAsync(
            { ...dependencies },
            { ...config.defaultHttpServiceConfig, ethereumRpcUrl: ETHEREUM_RPC_URL },
        ));
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
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

    describe('v1 /price', async () => {
        it('should respond with 200 OK even if the the takerAddress cannot complete a trade', async () => {
            // The taker does not have an allowance
            const swapResponse = await requestSwap(app, 'price', 'v1', {
                takerAddress: invalidTakerAddress,
                sellToken: 'WETH',
                buyToken: 'ZRX',
                sellAmount: '10000',
                integratorId: INTEGRATOR_ID,
            });
            expect(swapResponse.statusCode).eq(HttpStatus.StatusCodes.OK);
        });
    });

    describe('v1 /quote', async () => {
        it('should handle valid request body permutations', async () => {
            const WETH_BUY_AMOUNT = MAKER_WETH_AMOUNT.div(10).toString();
            const ZRX_BUY_AMOUNT = ONE_THOUSAND_IN_BASE.div(10).toString();
            const bodyPermutations = [
                {
                    buyToken: 'ZRX',
                    sellToken: 'WETH',
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                },
                {
                    buyToken: 'WETH',
                    sellToken: 'ZRX',
                    buyAmount: WETH_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                },
                {
                    buyToken: ZRX_TOKEN_ADDRESS,
                    sellToken: 'WETH',
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                },
                {
                    buyToken: ZRX_TOKEN_ADDRESS,
                    sellToken: WETH_TOKEN_ADDRESS,
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                },
            ];

            for (const body of bodyPermutations) {
                const response = await requestSwap(app, 'quote', 'v1', body);
                expectCorrectQuoteResponse(response, {
                    buyAmount: new BigNumber(body.buyAmount),
                    sellTokenAddress: body.sellToken.startsWith('0x')
                        ? body.sellToken
                        : SYMBOL_TO_ADDRESS[body.sellToken],
                    buyTokenAddress: body.buyToken.startsWith('0x') ? body.buyToken : SYMBOL_TO_ADDRESS[body.buyToken],
                    allowanceTarget: isNativeSymbolOrAddress(body.sellToken, CHAIN_ID)
                        ? NULL_ADDRESS
                        : CONTRACT_ADDRESSES.exchangeProxy,
                    sources: [ZERO_EX_SOURCE],
                });
            }
        });

        it("should respond with INSUFFICIENT_ASSET_LIQUIDITY when there's no liquidity", async () => {
            const response = await requestSwap(app, 'quote', 'v1', {
                buyToken: ZRX_TOKEN_ADDRESS,
                sellToken: WETH_TOKEN_ADDRESS,
                buyAmount: '10000000000000000000000000000000',
                integratorId: INTEGRATOR_ID,
                takerAddress: TAKER_ADDRESS,
            });
            expectSwapError(response, {
                validationErrors: [
                    {
                        code: ValidationErrorCodes.ValueOutOfRange,
                        field: 'buyAmount',
                        reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
                    },
                ],
            });
        });

        it('should respect buyAmount', async () => {
            const response = await requestSwap(app, 'quote', 'v1', {
                buyToken: 'ZRX',
                sellToken: 'WETH',
                buyAmount: '1234',
                integratorId: INTEGRATOR_ID,
                takerAddress: TAKER_ADDRESS,
            });
            expectCorrectQuoteResponse(response, { buyAmount: new BigNumber(1234) });
        });

        it('should respect sellAmount', async () => {
            const response = await requestSwap(app, 'quote', 'v1', {
                buyToken: 'ZRX',
                sellToken: 'WETH',
                sellAmount: '1234',
                integratorId: INTEGRATOR_ID,
                takerAddress: TAKER_ADDRESS,
            });
            expectCorrectQuoteResponse(response, { sellAmount: new BigNumber(1234) });
        });

        describe('with rfqt', () => {
            const WETH_SELL_AMOUNT = MAKER_WETH_AMOUNT.div(10).toString();
            const ZRX_BUY_AMOUNT = ONE_THOUSAND_IN_BASE.div(10).toString();
            const fiveMinutesLaterMs = new BigNumber(Math.round(Date.now() / ONE_SECOND_MS) + 300);

            before(async () => {
                const order = new OtcOrder({
                    txOrigin,
                    makerToken: ZRX_TOKEN_ADDRESS,
                    makerAmount: new BigNumber(ZRX_BUY_AMOUNT),
                    takerToken: WETH_TOKEN_ADDRESS,
                    takerAmount: new BigNumber(WETH_SELL_AMOUNT),
                    expiryAndNonce: OtcOrder.encodeExpiryAndNonce(
                        fiveMinutesLaterMs,
                        new BigNumber(1),
                        new BigNumber(1),
                    ),
                    maker: makerAddress,
                    taker: NULL_ADDRESS,
                    chainId: 1337,
                    verifyingContract: CONTRACT_ADDRESSES.exchangeProxy,
                });
                const signature = await order.getSignatureWithProviderAsync(provider);
                const responseData = {
                    quotes: [
                        {
                            fillableMakerAmount: new BigNumber(ZRX_BUY_AMOUNT),
                            fillableTakerAmount: new BigNumber(WETH_SELL_AMOUNT),
                            fillableTakerFeeAmount: new BigNumber(0),
                            makerId: 'maker1',
                            makerUri: 'https://maker-uri',
                            order,
                            signature,
                        },
                    ],
                };
                mockAxios
                    .onPost(`${RFQ_API_URL}/internal/rfqt/v2/quotes`)
                    .replyOnce(HttpStatus.StatusCodes.OK, responseData);
            });

            it('should handle rfqt requests', async () => {
                const response = await requestSwap(
                    app,
                    'quote',
                    'v1',
                    {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: WETH_SELL_AMOUNT,
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        txOrigin,
                        includedSources: 'RFQT',
                    },
                    {
                        '0x-api-key': 'test-api-key-1',
                    },
                );
                expectCorrectQuoteResponse(response, { sellAmount: new BigNumber(WETH_SELL_AMOUNT) });
            });

            it('should throw if txOrigin is empty', async () => {
                const response = await requestSwap(
                    app,
                    'quote',
                    'v1',
                    {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: WETH_SELL_AMOUNT,
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        includedSources: 'RFQT',
                    },
                    {
                        '0x-api-key': 'test-api-key-1',
                    },
                );
                expectSwapError(response, {
                    validationErrors: [
                        {
                            code: ValidationErrorCodes.RequiredField,
                            field: 'txOrigin',
                            reason: ValidationErrorReasons.InvalidTxOrigin,
                        },
                    ],
                });
            });

            it('should throw if api key is empty', async () => {
                const response = await requestSwap(app, 'quote', 'v1', {
                    buyToken: 'ZRX',
                    sellToken: 'WETH',
                    sellAmount: WETH_SELL_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    txOrigin,
                    includedSources: 'RFQT',
                });
                expectSwapError(response, {
                    validationErrors: [
                        {
                            code: ValidationErrorCodes.RequiredField,
                            field: '0x-api-key',
                            reason: ValidationErrorReasons.InvalidApiKey,
                        },
                    ],
                });
            });
        });
    });

    describe('v2 /price', async () => {
        it('should respond with 200 OK even if the the takerAddress cannot complete a trade', async () => {
            // The taker does not have an allowance
            const swapResponse = await requestSwap(app, 'price', 'v2', {
                takerAddress: invalidTakerAddress,
                sellToken: 'WETH',
                buyToken: 'ZRX',
                sellAmount: '10000',
                integratorId: INTEGRATOR_ID,
            });
            expect(swapResponse.statusCode).eq(HttpStatus.StatusCodes.OK);
        });
    });

    describe('v2 /quote', async () => {
        it('should handle valid request body permutations', async () => {
            const WETH_BUY_AMOUNT = MAKER_WETH_AMOUNT.div(10).toString();
            const ZRX_BUY_AMOUNT = ONE_THOUSAND_IN_BASE.div(10).toString();
            const bodyPermutations = [
                {
                    buyToken: 'ZRX',
                    sellToken: 'WETH',
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                },
                {
                    buyToken: 'ZRX',
                    sellToken: 'WETH',
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: {
                        integrator: { type: 'volume', volumePercentage: '0.1' },
                        zeroex: {
                            type: 'integrator_share',
                            integratorSharePercentage: '0.2',
                            feeRecipient: TAKER_ADDRESS,
                        },
                        gas: { type: 'gas' },
                    },
                },
                {
                    buyToken: 'WETH',
                    sellToken: 'ZRX',
                    buyAmount: WETH_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: {
                        integratorFee: { type: 'volume', volumePercentage: '0.1', feeRecipient: TAKER_ADDRESS },
                        zeroexFee: {
                            type: 'integrator_share',
                            integratorSharePercentage: '0.2',
                            feeRecipient: TAKER_ADDRESS,
                        },
                    },
                },
                {
                    buyToken: ZRX_TOKEN_ADDRESS,
                    sellToken: 'WETH',
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: {
                        integratorFee: { type: 'volume', volumePercentage: '0.1' },
                        gasFee: { type: 'gas', feeRecipient: TAKER_ADDRESS },
                    },
                },
                {
                    buyToken: ZRX_TOKEN_ADDRESS,
                    sellToken: WETH_TOKEN_ADDRESS,
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: { integratorFee: { type: 'volume', volumePercentage: '0.1' } },
                },
                {
                    buyToken: ZRX_TOKEN_ADDRESS,
                    sellToken: WETH_TOKEN_ADDRESS,
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: { gasFee: { type: 'gas', feeRecipient: TAKER_ADDRESS } },
                },
            ];

            for (const body of bodyPermutations) {
                const response = await requestSwap(app, 'quote', 'v2', body);
                expectCorrectQuoteResponse(response, {
                    buyAmount: new BigNumber(body.buyAmount),
                    sellTokenAddress: body.sellToken.startsWith('0x')
                        ? body.sellToken
                        : SYMBOL_TO_ADDRESS[body.sellToken],
                    buyTokenAddress: body.buyToken.startsWith('0x') ? body.buyToken : SYMBOL_TO_ADDRESS[body.buyToken],
                    allowanceTarget: isNativeSymbolOrAddress(body.sellToken, CHAIN_ID)
                        ? NULL_ADDRESS
                        : CONTRACT_ADDRESSES.exchangeProxy,
                    sources: [ZERO_EX_SOURCE],
                });
            }
        });

        it("should respond with INSUFFICIENT_ASSET_LIQUIDITY when there's no liquidity", async () => {
            const response = await requestSwap(app, 'quote', 'v2', {
                buyToken: ZRX_TOKEN_ADDRESS,
                sellToken: WETH_TOKEN_ADDRESS,
                buyAmount: '10000000000000000000000000000000',
                integratorId: INTEGRATOR_ID,
                takerAddress: TAKER_ADDRESS,
                feeConfigs: { integratorFee: { type: 'volume', volumePercentage: '0.1' } },
            });
            expectSwapError(response, {
                validationErrors: [
                    {
                        code: ValidationErrorCodes.ValueOutOfRange,
                        field: 'buyAmount',
                        reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
                    },
                ],
            });
        });

        it('should respect buyAmount', async () => {
            const response = await requestSwap(app, 'quote', 'v2', {
                buyToken: 'ZRX',
                sellToken: 'WETH',
                buyAmount: '1234',
                integratorId: INTEGRATOR_ID,
                takerAddress: TAKER_ADDRESS,
                feeConfigs: {
                    integratorFee: { type: 'volume', volumePercentage: '0.1' },
                    zeroexFee: {
                        type: 'integrator_share',
                        integratorSharePercentage: '0.2',
                        feeRecipient: TAKER_ADDRESS,
                    },
                    gasFee: { type: 'gas' },
                },
            });
            expectCorrectQuoteResponse(response, { buyAmount: new BigNumber(1234) });
        });

        it('should respect sellAmount', async () => {
            const response = await requestSwap(app, 'quote', 'v2', {
                buyToken: 'ZRX',
                sellToken: 'WETH',
                sellAmount: '1234',
                integratorId: INTEGRATOR_ID,
                takerAddress: TAKER_ADDRESS,
                feeConfigs: {
                    integratorFee: { type: 'volume', volumePercentage: '0.1' },
                    zeroexFee: {
                        type: 'integrator_share',
                        integratorSharePercentage: '0.2',
                        feeRecipient: TAKER_ADDRESS,
                    },
                    gasFee: { type: 'gas' },
                },
            });
            expectCorrectQuoteResponse(response, { sellAmount: new BigNumber(1234) });
        });

        describe('fee configs', async () => {
            describe('integrator', async () => {
                it('should throw error if kind is invalid', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        feeConfigs: {
                            integratorFee: { type: 'random', volumePercentage: '0.1' },
                        },
                    });

                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: ValidationErrorCodes.IncorrectFormat,
                                reason: ValidationErrorReasons.InvalidGaslessFeeType,
                            },
                        ],
                    });
                });

                it('should throw error if volumePercentage is out of range', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        feeConfigs: {
                            integratorFee: { type: 'volume', volumePercentage: '1000' },
                        },
                    });

                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: ValidationErrorCodes.ValueOutOfRange,
                                reason: ValidationErrorReasons.PercentageOutOfRange,
                            },
                        ],
                    });
                });
            });

            describe('0x', async () => {
                it('should throw error if kind is invalid', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        feeConfigs: {
                            zeroexFee: { type: 'random', volumePercentage: '0.1' },
                        },
                    });

                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: ValidationErrorCodes.IncorrectFormat,
                                reason: ValidationErrorReasons.InvalidGaslessFeeType,
                            },
                        ],
                    });
                });

                it('should throw error if volumePercentage is out of range', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        feeConfigs: {
                            zeroexFee: { type: 'volume', volumePercentage: '1000' },
                        },
                    });

                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: ValidationErrorCodes.ValueOutOfRange,
                                reason: ValidationErrorReasons.PercentageOutOfRange,
                            },
                        ],
                    });
                });

                it('should throw error if integrator fee config is empty and 0x fee kind is integrator_share', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        feeConfigs: {
                            zeroexFee: { type: 'integrator_share', integratorSharePercentage: '1000' },
                        },
                    });

                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: ValidationErrorCodes.IncorrectFormat,
                                reason: ValidationErrorReasons.InvalidGaslessFeeType,
                            },
                        ],
                    });

                    it('should throw error if integratorSharePercentage is out of range', async () => {
                        const response = await requestSwap(app, 'quote', 'v2', {
                            buyToken: 'ZRX',
                            sellToken: 'WETH',
                            sellAmount: '1234',
                            integratorId: INTEGRATOR_ID,
                            takerAddress: TAKER_ADDRESS,
                            feeConfigs: {
                                integratorFee: { type: 'volume', volumePercentage: '0.1' },
                                zeroexFee: { type: 'integrator_share', integratorSharePercentage: '1000' },
                            },
                        });

                        expectSwapError(response, {
                            validationErrors: [
                                {
                                    field: 'feeConfigs',
                                    code: ValidationErrorCodes.ValueOutOfRange,
                                    reason: ValidationErrorReasons.PercentageOutOfRange,
                                },
                            ],
                        });
                    });
                });
            });

            describe('gas', async () => {
                it('should throw error if kind is invalid', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        feeConfigs: {
                            gasFee: { type: 'random' },
                        },
                    });

                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: ValidationErrorCodes.IncorrectFormat,
                                reason: ValidationErrorReasons.InvalidGaslessFeeType,
                            },
                        ],
                    });
                });
            });
        });
    });
});

interface SwapErrors {
    validationErrors?: ValidationErrorItem[];
    revertErrorReason?: string;
    generalUserError?: boolean;
}

async function requestSwap(
    app: Express.Application,
    endpoint: 'price' | 'quote',
    version: 'v1' | 'v2',
    body: {
        buyToken: string;
        buyAmount?: string;
        sellToken: string;
        sellAmount?: string;
        takerAddress: string;
        txOrigin?: string;
        includedSources?: string;
        slippagePercentage?: string;
        integratorId: string;
        quoteUniqueId?: string;
        feeConfigs?: {
            integratorFee?: {
                type: string;
                volumePercentage: string;
                feeRecipient?: string;
            };
            zeroexFee?:
                | {
                      type: string;
                      volumePercentage: string;
                      feeRecipient?: string;
                  }
                | {
                      type: string;
                      integratorSharePercentage: string;
                      feeRecipient?: string;
                  };
            gasFee?: {
                type: string;
                feeRecipient?: string;
            };
        };
    },
    headers?: {
        '0x-api-key': string;
    },
): Promise<supertest.Response> {
    if (version === 'v1') {
        const filteredParams = _.pickBy(body);
        delete filteredParams.feeConfigs;
        const route = constructRoute({
            baseRoute: `${META_TRANSACTION_V1_PATH}/${endpoint}`,
            queryParams: filteredParams as { [param: string]: string | undefined },
        });
        return await httpGetAsync({ app, route, headers });
    } else {
        const route = `${META_TRANSACTION_V2_PATH}/${endpoint}`;
        return await httpPostAsync({ app, route, body });
    }
}

async function expectSwapError(swapResponse: supertest.Response, swapErrors: SwapErrors) {
    expect(swapResponse.type).to.be.eq('application/json');
    expect(swapResponse.statusCode).not.eq(HttpStatus.StatusCodes.OK);

    if (swapErrors.revertErrorReason) {
        expect(swapResponse.status).to.be.eq(HttpStatus.StatusCodes.BAD_REQUEST);
        expect(swapResponse.body.code).to.eq(105);
        expect(swapResponse.body.reason).to.be.eql(swapErrors.revertErrorReason);
        return swapResponse;
    }
    if (swapErrors.validationErrors) {
        expect(swapResponse.status).to.be.eq(HttpStatus.StatusCodes.BAD_REQUEST);
        expect(swapResponse.body.code).to.eq(100);
        expect(swapResponse.body.validationErrors).to.be.eql(swapErrors.validationErrors);
        return swapResponse;
    }
    if (swapErrors.generalUserError) {
        expect(swapResponse.status).to.be.eq(HttpStatus.StatusCodes.BAD_REQUEST);
        return swapResponse;
    }
}

const PRECISION = 2;
function expectCorrectQuoteResponse(
    response: supertest.Response,
    expectedResponse: Partial<GetSwapQuoteResponse>,
): void {
    expect(response.type).to.be.eq('application/json');
    expect(response.statusCode).eq(HttpStatus.StatusCodes.OK);
    const quoteResponse = response.body as GetSwapQuoteResponse;

    for (const prop of Object.keys(expectedResponse)) {
        const property = prop as keyof GetSwapQuoteResponse;
        if (BigNumber.isBigNumber(expectedResponse[property])) {
            assertRoughlyEquals(quoteResponse[property], expectedResponse[property], PRECISION);
            continue;
        }

        if (prop === 'sources' && expectedResponse.sources !== undefined) {
            const expectedSources = expectedResponse.sources.map((source) => ({
                ...source,
                proportion: source.proportion.toString(),
            }));
            expect(quoteResponse.sources).to.deep.include.members(expectedSources);
            continue;
        }

        expect(quoteResponse[property], property).to.eql(expectedResponse[property]);
    }
}
