import { ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { constants, expect, signingUtils, transactionHashUtils } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, web3Factory, Web3ProviderEngine } from '@0x/dev-utils';
import { ValidationResults } from '@0x/mesh-rpc-client';
import { SignatureType, SignedOrder, ZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as HttpStatus from 'http-status-codes';
import 'mocha';

import * as config from '../src/config';
import { META_TRANSACTION_PATH, ONE_SECOND_MS, TEN_MINUTES_MS } from '../src/constants';
import { GeneralErrorCodes, generalErrorCodeToReason, ValidationErrorCodes } from '../src/errors';
import { GetMetaTransactionQuoteResponse } from '../src/types';

import { setupApiAsync, setupMeshAsync, teardownApiAsync, teardownMeshAsync } from './utils/deployment';
import { constructRoute, httpGetAsync, httpPostAsync } from './utils/http_utils';
import { MeshTestUtils } from './utils/mesh_test_utils';

const SUITE_NAME = 'meta transactions tests';

describe(SUITE_NAME, () => {
    let accounts: string[];
    let chainId: number;
    let contractAddresses: ContractAddresses;
    let takerAddress: string;
    let buyTokenAddress: string;
    let sellTokenAddress: string;
    const buyAmount = constants.STATIC_ORDER_PARAMS.makerAssetAmount.toString();

    let blockchainLifecycle: BlockchainLifecycle;
    let provider: Web3ProviderEngine;

    before(async () => {
        await setupApiAsync(SUITE_NAME);

        // connect to ganache and run contract migrations
        const ganacheConfigs = {
            shouldUseInProcessGanache: false,
            shouldAllowUnlimitedContractSize: true,
            rpcUrl: config.ETHEREUM_RPC_URL,
        };
        provider = web3Factory.getRpcProvider(ganacheConfigs);

        const web3Wrapper = new Web3Wrapper(provider);
        blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

        accounts = await web3Wrapper.getAvailableAddressesAsync();
        [, takerAddress] = accounts;

        chainId = await web3Wrapper.getChainIdAsync();
        contractAddresses = getContractAddressesForChainOrThrow(chainId);
        buyTokenAddress = contractAddresses.zrxToken;
        sellTokenAddress = contractAddresses.etherToken;
    });

    after(async () => {
        await teardownApiAsync(SUITE_NAME);
    });

    const DEFAULT_QUERY_PARAMS = {
        buyToken: 'ZRX',
        sellToken: 'WETH',
        buyAmount,
        excludedSources: 'Uniswap,Eth2Dai,Kyber,LiquidityProvider',
    };

    async function assertFailureAsync(baseRoute: string, testCase: TestCase): Promise<void> {
        const route = constructRoute({
            baseRoute,
            queryParams: testCase.takerAddress ? { ...testCase.queryParams, takerAddress } : testCase.queryParams,
        });
        const response = await httpGetAsync({ route });
        expect(response.type).to.be.eq('application/json');
        expect(response.status).to.be.eq(HttpStatus.BAD_REQUEST);
        expect(response.body).to.be.deep.eq(testCase.body);
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
                        reason: 'is not exactly one from <sellAmount>,<buyAmount>',
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
                        reason: 'is not exactly one from <sellAmount>,<buyAmount>',
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
            let meshUtils: MeshTestUtils;

            beforeEach(async () => {
                await blockchainLifecycle.startAsync();
                await setupMeshAsync(SUITE_NAME);
                meshUtils = new MeshTestUtils(provider);
                await meshUtils.setupUtilsAsync();
            });

            afterEach(async () => {
                await blockchainLifecycle.revertAsync();
                await teardownMeshAsync(SUITE_NAME);
            });

            // NOTE(jalextowle): Spin up a new Mesh instance so that it will
            // be available for future test suites.
            after(async () => {
                await setupMeshAsync(SUITE_NAME);
            });

            it('should show the price of the only order in Mesh', async () => {
                await meshUtils.addOrdersAsync([1]);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/price`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                expect(response.body).to.be.deep.eq({
                    price: '1',
                    buyAmount,
                    sellTokenAddress,
                    buyTokenAddress,
                });
            });

            it('should show the price of the cheaper order in Mesh', async () => {
                await meshUtils.addOrdersAsync([1, 2]);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/price`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                expect(response.body).to.be.deep.eq({
                    price: '1',
                    buyAmount,
                    sellTokenAddress,
                    buyTokenAddress,
                });
            });

            it('should show the price of the combination of the two orders in Mesh', async () => {
                await meshUtils.addOrdersAsync([1, 2]);
                const largeBuyAmount = constants.STATIC_ORDER_PARAMS.makerAssetAmount.times(2).toString();
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/price`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        buyAmount: largeBuyAmount,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                expect(response.body).to.be.deep.eq({
                    price: '1.5',
                    buyAmount: largeBuyAmount,
                    sellTokenAddress,
                    buyTokenAddress,
                });
            });
        });
    });

    interface StringifiedOrder {
        chainId: number;
        exchangeAddress: string;
        makerAddress: string;
        takerAddress: string;
        feeRecipientAddress: string;
        senderAddress: string;
        makerAssetAmount: string;
        takerAssetAmount: string;
        makerFee: string;
        takerFee: string;
        expirationTimeSeconds: string;
        salt: string;
        makerAssetData: string;
        takerAssetData: string;
        makerFeeAssetData: string;
        takerFeeAssetData: string;
        signature: string;
    }

    function stringifyOrderBigNumbers(order: SignedOrder): StringifiedOrder {
        return {
            ...order,
            makerAssetAmount: order.makerAssetAmount.toString(),
            makerFee: order.makerFee.toString(),
            takerAssetAmount: order.takerAssetAmount.toString(),
            takerFee: order.takerFee.toString(),
            salt: order.salt.toString(),
            expirationTimeSeconds: order.expirationTimeSeconds.toString(),
        };
    }

    interface QuoteTestCase {
        quote: GetMetaTransactionQuoteResponse;
        expectedBuyAmount: string;
        expectedOrders: SignedOrder[];
        expectedPrice: string;
    }

    function assertCorrectQuote(testCase: QuoteTestCase): void {
        const quote = { ...testCase.quote };

        expect(quote.zeroExTransactionHash.length).to.be.eq(66); // tslint:disable-line:custom-no-magic-numbers
        const threeSecondsMS = ONE_SECOND_MS * 3; // tslint:disable-line:custom-no-magic-numbers
        const lowerBound = new BigNumber(Date.now() + TEN_MINUTES_MS - threeSecondsMS)
            .div(ONE_SECOND_MS)
            .integerValue(BigNumber.ROUND_CEIL);
        const upperBound = new BigNumber(Date.now() + TEN_MINUTES_MS)
            .div(ONE_SECOND_MS)
            .integerValue(BigNumber.ROUND_CEIL);
        expect(quote.zeroExTransaction.expirationTimeSeconds).to.be.bignumber.gte(lowerBound);
        expect(quote.zeroExTransaction.expirationTimeSeconds).to.be.bignumber.lte(upperBound);
        // HACK(jalextowle): We currently don't assert much of anything about
        // several fields in the quote response, and instead simply delete
        // the field. Over time, methods of asserting more should be found.
        quote.zeroExTransactionHash = undefined;
        quote.zeroExTransaction.data = undefined;
        quote.zeroExTransaction.salt = undefined;
        quote.zeroExTransaction.gasPrice = undefined;
        quote.zeroExTransaction.expirationTimeSeconds = undefined;
        expect(quote).to.be.eql({
            price: testCase.expectedPrice,
            zeroExTransaction: {
                signerAddress: takerAddress,
                domain: { chainId, verifyingContract: contractAddresses.exchange },
            },
            orders: testCase.expectedOrders.map(order => stringifyOrderBigNumbers(order)),
            buyAmount: testCase.expectedBuyAmount,
            sellAmount: (parseInt(testCase.expectedBuyAmount, 10) * parseFloat(testCase.expectedPrice)).toString(),
            // NOTE(jalextowle): 0x is the only source that is currently being tested.
            sources: [
                { name: '0x', proportion: '1' },
                { name: 'Uniswap', proportion: '0' },
                { name: 'Eth2Dai', proportion: '0' },
                { name: 'Kyber', proportion: '0' },
                { name: 'Curve_USDC_DAI', proportion: '0' },
                { name: 'Curve_USDC_DAI_USDT', proportion: '0' },
                { name: 'Curve_USDC_DAI_USDT_TUSD', proportion: '0' },
                { name: 'Curve_USDC_DAI_USDT_BUSD', proportion: '0' },
                { name: 'Curve_USDC_DAI_USDT_SUSD', proportion: '0' },
                { name: 'LiquidityProvider', proportion: '0' },
            ],
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
            let meshUtils: MeshTestUtils;

            beforeEach(async () => {
                await blockchainLifecycle.startAsync();
                await setupMeshAsync(SUITE_NAME);
                meshUtils = new MeshTestUtils(provider);
                await meshUtils.setupUtilsAsync();
            });

            afterEach(async () => {
                await blockchainLifecycle.revertAsync();
                await teardownMeshAsync(SUITE_NAME);
            });

            // NOTE(jalextowle): Spin up a new Mesh instance so that it will
            // be available for future test suites.
            after(async () => {
                await setupMeshAsync(SUITE_NAME);
            });

            it('should return a quote of the only order in Mesh', async () => {
                const validationResults = await meshUtils.addOrdersAsync([1]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/quote`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                assertCorrectQuote({
                    quote: response.body,
                    expectedBuyAmount: buyAmount,
                    expectedOrders: [validationResults.accepted[0].signedOrder],
                    expectedPrice: '1',
                });
            });

            it('should return a quote of the cheaper order in Mesh', async () => {
                const validationResults = await meshUtils.addOrdersAsync([1, 2]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/quote`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        buyAmount,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                assertCorrectQuote({
                    quote: response.body,
                    expectedBuyAmount: buyAmount,
                    expectedOrders: [validationResults.accepted[0].signedOrder],
                    expectedPrice: '1',
                });
            });

            it('should return a quote of the combination of the two orders in Mesh', async () => {
                const validationResults = await meshUtils.addOrdersAsync([1, 2]);
                expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                const largeBuyAmount = constants.STATIC_ORDER_PARAMS.makerAssetAmount.times(2).toString();
                const route = constructRoute({
                    baseRoute: `${META_TRANSACTION_PATH}/quote`,
                    queryParams: {
                        ...DEFAULT_QUERY_PARAMS,
                        buyAmount: largeBuyAmount,
                        takerAddress,
                    },
                });
                const response = await httpGetAsync({ route });
                expect(response.type).to.be.eq('application/json');
                expect(response.status).to.be.eq(HttpStatus.OK);
                assertCorrectQuote({
                    quote: response.body,
                    expectedBuyAmount: largeBuyAmount,
                    expectedOrders: validationResults.accepted.map(accepted => accepted.signedOrder),
                    expectedPrice: '1.5',
                });
            });
        });
    });

    describe('/submit tests', () => {
        const requestBase = `${META_TRANSACTION_PATH}/submit`;

        context('failure tests', () => {
            it('should return InvalidAPIKey error if invalid UUID supplied as API Key', async () => {
                const response = await httpPostAsync({ route: requestBase, headers: { '0x-api-key': 'foobar' } });
                expect(response.status).to.be.eq(HttpStatus.BAD_REQUEST);
                expect(response.type).to.be.eq('application/json');
                expect(response.body).to.be.deep.eq({
                    code: GeneralErrorCodes.InvalidAPIKey,
                    reason: generalErrorCodeToReason[GeneralErrorCodes.InvalidAPIKey],
                });
            });
        });

        context.skip('success tests', () => {
            let meshUtils: MeshTestUtils;

            function signZeroExTransaction(transaction: ZeroExTransaction, signingAddress: string): string {
                const transactionHashBuffer = transactionHashUtils.getTransactionHashBuffer(transaction);
                const pkIdx = accounts.indexOf(signingAddress);
                expect(pkIdx, 'signing address is invalid').to.be.gte(0);
                const privateKey = constants.TESTRPC_PRIVATE_KEYS[pkIdx];
                return signingUtils.signMessage(transactionHashBuffer, privateKey, SignatureType.EthSign).toString();
            }

            describe('single order submission', () => {
                let validationResults: ValidationResults;

                // NOTE(jalextowle): This must be a `before` hook because `beforeEach`
                // hooks execute after all of the `before` hooks (even if they are nested).
                before(async () => {
                    await blockchainLifecycle.startAsync();
                    await setupMeshAsync(SUITE_NAME);
                    meshUtils = new MeshTestUtils(provider);
                    await meshUtils.setupUtilsAsync();
                });

                after(async () => {
                    await blockchainLifecycle.revertAsync();
                    await teardownMeshAsync(SUITE_NAME);
                    // NOTE(jalextowle): Spin up a new Mesh instance so that it will
                    // be available for future test suites.
                    await setupMeshAsync(SUITE_NAME);
                });

                before(async () => {
                    validationResults = await meshUtils.addOrdersAsync([1]);
                    expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);
                });

                it('price checking yields the correct market price', async () => {
                    const route = constructRoute({
                        baseRoute: `${META_TRANSACTION_PATH}/price`,
                        queryParams: {
                            ...DEFAULT_QUERY_PARAMS,
                            takerAddress,
                        },
                    });
                    const response = await httpGetAsync({ route });
                    expect(response.type).to.be.eq('application/json');
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    expect(response.body).to.be.deep.eq({
                        price: '1',
                        buyAmount,
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
                    const response = await httpGetAsync({ route });
                    expect(response.type).to.be.eq('application/json');
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    assertCorrectQuote({
                        quote: response.body,
                        expectedBuyAmount: buyAmount,
                        expectedOrders: [validationResults.accepted[0].signedOrder],
                        expectedPrice: '1',
                    });
                    transaction = response.body.zeroExTransaction;
                });

                it('submitting the quote is successful and money changes hands correctly', async () => {
                    const signature = signZeroExTransaction(transaction, takerAddress);
                    const route = constructRoute({
                        baseRoute: `${META_TRANSACTION_PATH}/submit`,
                        queryParams: {
                            zeroExTransaction: JSON.stringify(transaction),
                            signature,
                        },
                    });
                    const response = await httpPostAsync({
                        route,
                    });
                    expect(response.status).to.be.eq(HttpStatus.OK);
                    expect(response.type).to.be.eq('application/json');
                    console.log(response);
                });
            });
        });
    });
});
// tslint:disable-line:max-file-line-count
