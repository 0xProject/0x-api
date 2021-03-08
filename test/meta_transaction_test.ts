import { ErrorUtils } from '@0x/api-utils';
import { ERC20BridgeSource } from '@0x/asset-swapper';
import { ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { constants, expect, signingUtils, transactionHashUtils } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, Web3ProviderEngine, Web3Wrapper } from '@0x/dev-utils';
import { SignatureType, ZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Server } from 'http';
import * as HttpStatus from 'http-status-codes';
import 'mocha';

// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../src/app')];
import { AppDependencies, getAppAsync, getDefaultAppDependenciesAsync } from '../src/app';
import * as config from '../src/config';
import { META_TRANSACTION_PATH, ONE_SECOND_MS, TEN_MINUTES_MS } from '../src/constants';
import { GeneralErrorCodes, InvalidAPIKeyError, ValidationErrorCodes } from '../src/errors';
import { GetMetaTransactionQuoteResponse, SignedLimitOrder } from '../src/types';
import { AddOrdersResultsV4 } from '../src/utils/mesh_client';
import { meshUtils } from '../src/utils/mesh_utils';

import {
    ETHEREUM_RPC_URL,
    ETH_TOKEN_ADDRESS,
    getProvider,
    MATCHA_AFFILIATE_ADDRESS,
    MATCHA_AFFILIATE_ENCODED_PARTIAL_ORDER_DATA,
    WETH_TOKEN_ADDRESS,
    ZRX_TOKEN_ADDRESS,
} from './constants';
import { resetState } from './test_setup';
import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';
import { constructRoute, httpGetAsync, httpPostAsync } from './utils/http_utils';
import { DEFAULT_MAKER_ASSET_AMOUNT, MAKER_WETH_AMOUNT, MeshTestUtils } from './utils/mesh_test_utils';
import { liquiditySources0xOnly } from './utils/mocks';

const SUITE_NAME = 'meta transactions tests';
const ONE_THOUSAND_IN_BASE = new BigNumber('1000000000000000000000');

// Include this test when SRA v4 is working. Currently we cannot access v4 Mesh liquidity.
describe.skip(SUITE_NAME, () => {
    let app: Express.Application;
    let server: Server;
    let dependencies: AppDependencies;

    let accounts: string[];
    let chainId: number;
    let contractAddresses: ContractAddresses;
    let takerAddress: string;
    let buyTokenAddress: string;
    let sellTokenAddress: string;
    const buyAmount = DEFAULT_MAKER_ASSET_AMOUNT.toString();

    let blockchainLifecycle: BlockchainLifecycle;
    let provider: Web3ProviderEngine;

    let weth: WETH9Contract;
    let zrx: DummyERC20TokenContract;

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        provider = getProvider();
        // start the 0x-api app
        dependencies = await getDefaultAppDependenciesAsync(provider, {
            ...config.defaultHttpServiceConfig,
            ethereumRpcUrl: ETHEREUM_RPC_URL,
        });
        ({ app, server } = await getAppAsync(
            { ...dependencies },
            { ...config.defaultHttpServiceConfig, ethereumRpcUrl: ETHEREUM_RPC_URL },
        ));

        const web3Wrapper = new Web3Wrapper(provider);
        blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

        accounts = await web3Wrapper.getAvailableAddressesAsync();
        [, takerAddress] = accounts;

        chainId = await web3Wrapper.getChainIdAsync();
        contractAddresses = getContractAddressesForChainOrThrow(chainId);

        buyTokenAddress = contractAddresses.zrxToken;
        sellTokenAddress = contractAddresses.etherToken;

        weth = new WETH9Contract(contractAddresses.etherToken, provider);
        zrx = new DummyERC20TokenContract(contractAddresses.zrxToken, provider);
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
        await resetState();
        await teardownDependenciesAsync(SUITE_NAME);
    });

    beforeEach(async () => {
        await resetState();
    });

    const EXCLUDED_SOURCES = Object.values(ERC20BridgeSource).filter(s => s !== ERC20BridgeSource.Native);
    const DEFAULT_QUERY_PARAMS = {
        buyToken: 'ZRX',
        sellToken: 'WETH',
        buyAmount,
        excludedSources: EXCLUDED_SOURCES.join(','),
    };

    async function assertFailureAsync(baseRoute: string, testCase: TestCase): Promise<void> {
        const route = constructRoute({
            baseRoute,
            queryParams: testCase.takerAddress ? { ...testCase.queryParams, takerAddress } : testCase.queryParams,
        });
        const response = await httpGetAsync({ app, route });
        expect(response.type).to.be.eq('application/json');
        expect(response.body).to.be.deep.eq(testCase.body);
        expect(response.status).to.be.eq(HttpStatus.BAD_REQUEST);
    }

    interface TestCase {
        description: string;
        queryParams: {
            [param: string]: string;
        };
        body: any;
        takerAddress: boolean;
    }

    const testCases: TestCase[] = [
        {
            description: 'missing query params',
            queryParams: {},
            body: {
                code: GeneralErrorCodes.ValidationError,
                reason: 'Validation Failed',
                validationErrors: [
                    {
                        field: 'sellToken',
                        code: ValidationErrorCodes.RequiredField,
                        reason: 'requires property "sellToken"',
                    },
                    {
                        field: 'buyToken',
                        code: ValidationErrorCodes.RequiredField,
                        reason: 'requires property "buyToken"',
                    },
                    {
                        field: 'takerAddress',
                        code: ValidationErrorCodes.RequiredField,
                        reason: 'requires property "takerAddress"',
                    },
                    {
                        field: 'instance',
                        code: ValidationErrorCodes.IncorrectFormat,
                        reason: 'is not exactly one from sellAmount,buyAmount',
                    },
                ],
            },
            takerAddress: false,
        },
        {
            description: 'both `sellAmount` and `buyAmount`',
            queryParams: {
                ...DEFAULT_QUERY_PARAMS,
                sellAmount: constants.STATIC_ORDER_PARAMS.takerAssetAmount.toString(),
            },
            body: {
                code: GeneralErrorCodes.ValidationError,
                reason: 'Validation Failed',
                validationErrors: [
                    {
                        field: 'instance',
                        code: ValidationErrorCodes.IncorrectFormat,
                        reason: 'is not exactly one from sellAmount,buyAmount',
                    },
                ],
            },
            takerAddress: true,
        },
        {
            description: 'Invalid `buyToken`',
            queryParams: {
                ...DEFAULT_QUERY_PARAMS,
                buyToken: 'INVALID',
            },
            body: {
                code: GeneralErrorCodes.ValidationError,
                reason: 'Validation Failed',
                validationErrors: [
                    {
                        field: 'buyToken',
                        // TODO(jalextowle): This seems like the wrong error message.
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: 'Could not find token `INVALID`',
                    },
                ],
            },
            takerAddress: true,
        },
        {
            description: 'Invalid `sellToken`',
            queryParams: {
                ...DEFAULT_QUERY_PARAMS,
                sellToken: 'INVALID',
            },
            body: {
                code: GeneralErrorCodes.ValidationError,
                reason: 'Validation Failed',
                validationErrors: [
                    {
                        field: 'sellToken',
                        // TODO(jalextowle): This seems like the wrong error message.
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: 'Could not find token `INVALID`',
                    },
                ],
            },
            takerAddress: true,
        },
        {
            description: 'Insufficient Liquidity',
            queryParams: DEFAULT_QUERY_PARAMS,
            body: {
                code: GeneralErrorCodes.ValidationError,
                reason: 'Validation Failed',
                validationErrors: [
                    {
                        code: ValidationErrorCodes.ValueOutOfRange,
                        field: 'buyAmount',
                        reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
                    },
                ],
            },
            takerAddress: true,
        },
    ];

    describe('/price tests', () => {
        context('failure tests', () => {
            for (const testCase of testCases) {
                it(`${testCase.description}`, async () => {
                    await assertFailureAsync(`${META_TRANSACTION_PATH}/price`, testCase);
                });
            }
        });

        context('success tests', () => {
            let meshTestUtils: MeshTestUtils;
            const price = '1';
            const sellAmount = calculateSellAmount(buyAmount, price);

            beforeEach(async () => {
                await blockchainLifecycle.startAsync();
                meshTestUtils = new MeshTestUtils(provider);
                await meshTestUtils.setupUtilsAsync();
            });

            afterEach(async () => {
                await blockchainLifecycle.revertAsync();
            });

            it('should show the price of the only order in Mesh', async () => {
                const validationResults = await meshTestUtils.addOrdersWithPricesAsync([1]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/price`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ app, route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                expect(response.body.sources).to.be.deep.eq(liquiditySources0xOnly);
                expect(response.body).to.include({
                    price,
                    buyAmount,
                    sellAmount,
                    sellTokenAddress,
                    buyTokenAddress,
                });
            });

            it('should show the price of the cheaper order in Mesh', async () => {
                const validationResults = await meshTestUtils.addOrdersWithPricesAsync([1, 2]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/price`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ app, route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                expect(response.body.sources).to.be.deep.eq(liquiditySources0xOnly);
                expect(response.body).to.include({
                    price,
                    buyAmount,
                    sellAmount,
                    sellTokenAddress,
                    buyTokenAddress,
                });
            });

            it('should show the price of the combination of the two orders in Mesh', async () => {
                const validationResults = await meshTestUtils.addOrdersWithPricesAsync([1, 2]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const largeOrderPrice = '1.5';
                const largeBuyAmount = DEFAULT_MAKER_ASSET_AMOUNT.times(2).toString();
                const largeSellAmount = calculateSellAmount(largeBuyAmount, largeOrderPrice);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/price`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        buyAmount: largeBuyAmount,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ app, route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                expect(response.body.sources).to.be.deep.eq(liquiditySources0xOnly);
                expect(response.body).to.include({
                    price: largeOrderPrice,
                    buyAmount: largeBuyAmount,
                    sellAmount: largeSellAmount,
                    sellTokenAddress,
                    buyTokenAddress,
                });
            });
        });
    });

    interface QuoteTestCase {
        quote: GetMetaTransactionQuoteResponse;
        expectedBuyAmount: string;
        expectedOrders: SignedLimitOrder[];
        expectedPrice: string;
    }

    function assertCorrectMetaQuote(testCase: QuoteTestCase): void {
        expect(testCase.quote.mtxHash.length).to.be.eq(66); // tslint:disable-line:custom-no-magic-numbers
        const threeSecondsMS = ONE_SECOND_MS * 3; // tslint:disable-line:custom-no-magic-numbers
        const lowerBound = new BigNumber(Date.now() + TEN_MINUTES_MS - threeSecondsMS)
            .div(ONE_SECOND_MS)
            .integerValue(BigNumber.ROUND_CEIL);
        const upperBound = new BigNumber(Date.now() + TEN_MINUTES_MS)
            .div(ONE_SECOND_MS)
            .integerValue(BigNumber.ROUND_CEIL);
        expect(testCase.quote.mtx.expirationTimeSeconds).to.be.bignumber.gte(lowerBound);
        expect(testCase.quote.mtx.expirationTimeSeconds).to.be.bignumber.lte(upperBound);

        // NOTE(jalextowle): We pick only the elements that should be tested
        // against. This avoids altering the original object and running into
        // an edge-case in `expect` around values defined as `undefined`.
        expect({
            price: testCase.quote.price,
            mtx: {
                signer: testCase.quote.mtx.signer,
                domain: testCase.quote.mtx.domain,
            },
            orders: testCase.quote.orders,
            buyAmount: testCase.quote.buyAmount,
            sellAmount: testCase.quote.sellAmount,
            sources: testCase.quote.sources,
        }).to.be.eql({
            price: testCase.expectedPrice,
            mtx: {
                signer: takerAddress,
                domain: { chainId, verifyingContract: contractAddresses.exchangeProxy },
            },
            // TODO(kimpers) [V4] is stringify fine here?
            orders: testCase.expectedOrders.map(order => JSON.stringify(order)),
            buyAmount: testCase.expectedBuyAmount,
            sellAmount: calculateSellAmount(testCase.expectedBuyAmount, testCase.expectedPrice),
            // NOTE(jalextowle): 0x is the only source that is currently being tested.
            sources: liquiditySources0xOnly,
        });
    }

    describe('/quote tests', () => {
        context('failure tests', () => {
            for (const testCase of testCases) {
                it(`${testCase.description}`, async () => {
                    await assertFailureAsync(`${META_TRANSACTION_PATH}/quote`, testCase);
                });
            }
        });

        context('success tests', () => {
            let meshTestUtils: MeshTestUtils;

            beforeEach(async () => {
                await blockchainLifecycle.startAsync();
                meshTestUtils = new MeshTestUtils(provider);
                await meshTestUtils.setupUtilsAsync();
            });

            afterEach(async () => {
                await blockchainLifecycle.revertAsync();
            });

            it('should return a quote of the only order in Mesh', async () => {
                const validationResults = await meshTestUtils.addOrdersWithPricesAsync([1]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/quote`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ app, route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                assertCorrectMetaQuote({
                    quote: response.body,
                    expectedBuyAmount: buyAmount,
                    expectedOrders: [meshUtils.orderWithMetadataToSignedOrder(validationResults.accepted[0].order)],
                    expectedPrice: '1',
                });
            });

            it('should support buying ETH by symbol and 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', async () => {
                for (const buyToken of ['ETH', ETH_TOKEN_ADDRESS]) {
                    await meshTestUtils.addPartialOrdersAsync([
                        {
                            makerToken: ZRX_TOKEN_ADDRESS,
                            takerToken: WETH_TOKEN_ADDRESS,
                            makerAmount: ONE_THOUSAND_IN_BASE,
                            takerAmount: ONE_THOUSAND_IN_BASE,
                        },
                        {
                            makerToken: WETH_TOKEN_ADDRESS,
                            takerToken: ZRX_TOKEN_ADDRESS,
                            makerAmount: MAKER_WETH_AMOUNT,
                            takerAmount: ONE_THOUSAND_IN_BASE,
                        },
                    ]);
                    const args = {
                        baseRoute: `${META_TRANSACTION_PATH}/quote`,
                        queryParams: {
                            buyToken,
                            sellToken: 'ZRX',
                            buyAmount: '1000',
                            excludedSources: EXCLUDED_SOURCES.join(','),
                            takerAddress,
                        },
                    };
                    const route = constructRoute(args);
                    const response = await httpGetAsync({ app, route });
                    expect(response.type).to.be.eq('application/json');
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    expect(response.body).to.include({
                        buyAmount: '1000',
                        buyTokenAddress: ETH_TOKEN_ADDRESS,
                        sellTokenAddress: ZRX_TOKEN_ADDRESS,
                    });
                }
            });

            it('should return a quote of the cheaper order in Mesh', async () => {
                const validationResults = await meshTestUtils.addOrdersWithPricesAsync([1, 2]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/quote`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        buyAmount,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ app, route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                assertCorrectMetaQuote({
                    quote: response.body,
                    expectedBuyAmount: buyAmount,
                    expectedOrders: [meshUtils.orderWithMetadataToSignedOrder(validationResults.accepted[0].order)],
                    expectedPrice: '1',
                });
            });

            it('should return a quote of the combination of the two orders in Mesh', async () => {
                const validationResults = await meshTestUtils.addOrdersWithPricesAsync([1, 2]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const largeBuyAmount = DEFAULT_MAKER_ASSET_AMOUNT.times(2).toString();
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/quote`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        buyAmount: largeBuyAmount,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ app, route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                assertCorrectMetaQuote({
                    quote: response.body,
                    expectedBuyAmount: largeBuyAmount,
                    expectedOrders: validationResults.accepted.map(accepted =>
                        meshUtils.orderWithMetadataToSignedOrder(accepted.order),
                    ),
                    expectedPrice: '1.5',
                });
            });

            it('encodes affiliate address into mtx call data', async () => {
                const validationResults = await meshTestUtils.addOrdersWithPricesAsync([1]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/quote`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        takerAddress,
                        affiliateAddress: MATCHA_AFFILIATE_ADDRESS,
                    },
                });
                const response = await httpGetAsync({ route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                expect(response.body.mtx.callData).to.include(MATCHA_AFFILIATE_ENCODED_PARTIAL_ORDER_DATA);
            });
        });
    });

    describe('/submit tests', () => {
        const requestBase = `${META_TRANSACTION_PATH}/submit`;

        context('failure tests', () => {
            it('should return InvalidAPIKey error if invalid UUID supplied as API Key', async () => {
                const response = await httpPostAsync({ app, route: requestBase, headers: { '0x-api-key': 'foobar' } });
                const expected = ErrorUtils.generateError(new InvalidAPIKeyError());
                expect(response.status).to.be.eq(HttpStatus.BAD_REQUEST);
                expect(response.type).to.be.eq('application/json');
                expect(response.body).to.be.deep.eq(expected);
            });
        });

        context('success tests', () => {
            let meshTestUtils: MeshTestUtils;

            function signZeroExTransaction(transaction: ZeroExTransaction, signingAddress: string): string {
                const transactionHashBuffer = transactionHashUtils.getTransactionHashBuffer(transaction);
                const pkIdx = accounts.indexOf(signingAddress);
                expect(pkIdx, 'signing address is invalid').to.be.gte(0);
                const privateKey = constants.TESTRPC_PRIVATE_KEYS[pkIdx];
                return `0x${signingUtils
                    .signMessage(transactionHashBuffer, privateKey, SignatureType.EthSign)
                    .toString('hex')}`;
            }

            describe('single order submission', () => {
                let validationResults: AddOrdersResultsV4;
                const price = '1';
                const sellAmount = calculateSellAmount(buyAmount, price);

                beforeEach(async () => {
                    await blockchainLifecycle.startAsync();
                    meshTestUtils = new MeshTestUtils(provider);
                    await meshTestUtils.setupUtilsAsync();

                    validationResults = await meshTestUtils.addOrdersWithPricesAsync([1]);
                    expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                });

                afterEach(async () => {
                    await blockchainLifecycle.revertAsync();
                });

                it('price checking yields the correct market price', async () => {
                    const route = constructRoute({
                        baseRoute: `${META_TRANSACTION_PATH}/price`,
                        queryParams: {
                            ...DEFAULT_QUERY_PARAMS,
                            takerAddress,
                        },
                    });
                    const response = await httpGetAsync({ app, route });
                    expect(response.type).to.be.eq('application/json');
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    expect(response.body.sources).to.be.deep.eq(liquiditySources0xOnly);
                    expect(response.body).to.include({
                        price,
                        buyAmount,
                        sellAmount,
                        sellTokenAddress,
                        buyTokenAddress,
                    });
                });

                let transaction: ZeroExTransaction;

                it('the quote matches the price check', async () => {
                    const route = constructRoute({
                        baseRoute: `${META_TRANSACTION_PATH}/quote`,
                        queryParams: {
                            ...DEFAULT_QUERY_PARAMS,
                            takerAddress,
                        },
                    });
                    const response = await httpGetAsync({ app, route });
                    expect(response.type).to.be.eq('application/json');
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    assertCorrectMetaQuote({
                        quote: response.body,
                        expectedBuyAmount: buyAmount,
                        expectedOrders: [meshUtils.orderWithMetadataToSignedOrder(validationResults.accepted[0].order)],
                        expectedPrice: price,
                    });
                    transaction = response.body.mtx;
                });

                it.skip('submitting the quote is successful and money changes hands correctly', async () => {
                    const makerAddress = validationResults.accepted[0].order.maker;
                    await weth.deposit().awaitTransactionSuccessAsync({ from: takerAddress, value: buyAmount });
                    await weth
                        .approve(contractAddresses.exchangeProxy, new BigNumber(buyAmount))
                        .awaitTransactionSuccessAsync({ from: takerAddress });

                    const startMakerWethBalance = await weth.balanceOf(makerAddress).callAsync();
                    const startMakerZrxBalance = await zrx.balanceOf(makerAddress).callAsync();
                    const startTakerWethBalance = await weth.balanceOf(takerAddress).callAsync();
                    const startTakerZrxBalance = await zrx.balanceOf(takerAddress).callAsync();

                    const signature = signZeroExTransaction(transaction, takerAddress);
                    const route = constructRoute({
                        baseRoute: `${META_TRANSACTION_PATH}/submit`,
                    });
                    const response = await httpPostAsync({
                        app,
                        route,
                        body: {
                            mtx: transaction,
                            signature,
                        },
                        headers: {
                            '0x-api-key': config.META_TXN_SUBMIT_WHITELISTED_API_KEYS[0],
                        },
                    });
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    expect(response.type).to.be.eq('application/json');

                    const endMakerWethBalance = await weth.balanceOf(makerAddress).callAsync();
                    const endMakerZrxBalance = await zrx.balanceOf(makerAddress).callAsync();
                    const endTakerWethBalance = await weth.balanceOf(takerAddress).callAsync();
                    const endTakerZrxBalance = await zrx.balanceOf(takerAddress).callAsync();
                    expect(endMakerWethBalance).to.be.bignumber.eq(startMakerWethBalance.plus(sellAmount));
                    expect(endMakerZrxBalance).to.be.bignumber.eq(startMakerZrxBalance.minus(buyAmount));
                    expect(endTakerWethBalance).to.be.bignumber.eq(startTakerWethBalance.minus(sellAmount));
                    expect(endTakerZrxBalance).to.be.bignumber.eq(startTakerZrxBalance.plus(buyAmount));
                });
            });

            // TODO: There is a problem with this test case. It is currently throwing an `IncompleteFillError`
            describe.skip('two order submission', () => {
                let validationResults: AddOrdersResultsV4;
                const largeBuyAmount = DEFAULT_MAKER_ASSET_AMOUNT.times(2).toString();
                const price = '1.5';
                const sellAmount = calculateSellAmount(largeBuyAmount, price);

                beforeEach(async () => {
                    await blockchainLifecycle.startAsync();
                    meshTestUtils = new MeshTestUtils(provider);
                    await meshTestUtils.setupUtilsAsync();
                });

                afterEach(async () => {
                    await blockchainLifecycle.revertAsync();
                });

                beforeEach(async () => {
                    validationResults = await meshTestUtils.addOrdersWithPricesAsync([1, 2]);
                    expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                });

                it('price checking yields the correct market price', async () => {
                    const route = constructRoute({
                        baseRoute: `${META_TRANSACTION_PATH}/price`,
                        queryParams: {
                            ...DEFAULT_QUERY_PARAMS,
                            buyAmount: largeBuyAmount,
                            takerAddress,
                        },
                    });
                    const response = await httpGetAsync({ app, route });
                    expect(response.type).to.be.eq('application/json');
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    expect(response.body.sources).to.be.deep.eq(liquiditySources0xOnly);
                    expect(response.body).to.include({
                        price,
                        buyAmount: largeBuyAmount,
                        sellTokenAddress,
                        buyTokenAddress,
                    });
                });

                let transaction: ZeroExTransaction;

                it('the quote matches the price check', async () => {
                    const route = constructRoute({
                        baseRoute: `${META_TRANSACTION_PATH}/quote`,
                        queryParams: {
                            ...DEFAULT_QUERY_PARAMS,
                            buyAmount: largeBuyAmount,
                            takerAddress,
                        },
                    });
                    const response = await httpGetAsync({ app, route });
                    expect(response.type).to.be.eq('application/json');
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    assertCorrectMetaQuote({
                        quote: response.body,
                        expectedBuyAmount: largeBuyAmount,
                        expectedOrders: validationResults.accepted.map(accepted => accepted.order),
                        expectedPrice: price,
                    });
                    transaction = response.body.mtx;
                });

                it('submitting the quote is successful and money changes hands correctly', async () => {
                    const makerAddress = validationResults.accepted[0].order.maker;
                    await weth.deposit().awaitTransactionSuccessAsync({ from: takerAddress, value: largeBuyAmount });
                    await weth
                        .approve(contractAddresses.exchangeProxy, new BigNumber(largeBuyAmount))
                        .awaitTransactionSuccessAsync({ from: takerAddress });

                    const startMakerWethBalance = await weth.balanceOf(makerAddress).callAsync();
                    const startMakerZrxBalance = await zrx.balanceOf(makerAddress).callAsync();
                    const startTakerWethBalance = await weth.balanceOf(takerAddress).callAsync();
                    const startTakerZrxBalance = await zrx.balanceOf(takerAddress).callAsync();

                    const signature = signZeroExTransaction(transaction, takerAddress);
                    const route = constructRoute({
                        baseRoute: `${META_TRANSACTION_PATH}/submit`,
                    });
                    const response = await httpPostAsync({
                        app,
                        route,
                        body: {
                            mtx: transaction,
                            signature,
                        },
                        headers: {
                            '0x-api-key': config.META_TXN_SUBMIT_WHITELISTED_API_KEYS[0],
                        },
                    });
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    expect(response.type).to.be.eq('application/json');

                    const endMakerWethBalance = await weth.balanceOf(makerAddress).callAsync();
                    const endMakerZrxBalance = await zrx.balanceOf(makerAddress).callAsync();
                    const endTakerWethBalance = await weth.balanceOf(takerAddress).callAsync();
                    const endTakerZrxBalance = await zrx.balanceOf(takerAddress).callAsync();
                    expect(endMakerWethBalance).to.be.bignumber.eq(startMakerWethBalance.plus(sellAmount));
                    expect(endMakerZrxBalance).to.be.bignumber.eq(startMakerZrxBalance.minus(largeBuyAmount));
                    expect(endTakerWethBalance).to.be.bignumber.eq(startTakerWethBalance.minus(sellAmount));
                    expect(endTakerZrxBalance).to.be.bignumber.eq(startTakerZrxBalance.plus(largeBuyAmount));
                });
            });
        });
    });
});

function calculateSellAmount(buyAmount: string, price: string): string {
    return (parseInt(buyAmount, 10) * parseFloat(price)).toString();
}
// tslint:disable-line:max-file-line-count
