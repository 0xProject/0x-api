import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { constants, expect } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, web3Factory, Web3ProviderEngine } from '@0x/dev-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as HttpStatus from 'http-status-codes';
import 'mocha';

import * as config from '../src/config';
import { META_TRANSACTION_PATH } from '../src/constants';
import { GeneralErrorCodes, generalErrorCodeToReason, ValidationErrorCodes } from '../src/errors';

import { LogType, setupApiAsync, setupMeshAsync, teardownApiAsync, teardownMeshAsync } from './utils/deployment';
import { constructRoute, httpGetAsync, httpPostAsync } from './utils/http_utils';
import { MeshTestUtils } from './utils/mesh_test_utils';

const SUITE_NAME = 'meta transactions tests';

describe.only(SUITE_NAME, () => {
    let takerAddress: string;
    let buyTokenAddress: string;
    let sellTokenAddress: string;
    const buyAmount = constants.STATIC_ORDER_PARAMS.makerAssetAmount.toString();

    let blockchainLifecycle: BlockchainLifecycle;
    let provider: Web3ProviderEngine;

    const DEFAULT_QUERY_PARAMS = {
        buyToken: 'ZRX',
        sellToken: 'WETH',
        buyAmount,
        excludedSources: 'Uniswap,Eth2Dai,Kyber,LiquidityProvider',
    };

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

        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [, takerAddress] = accounts;

        const chainId = await web3Wrapper.getChainIdAsync();
        const contractAddresses = getContractAddressesForChainOrThrow(chainId);
        buyTokenAddress = contractAddresses.zrxToken;
        sellTokenAddress = contractAddresses.etherToken;
    });

    after(async () => {
        await teardownApiAsync(SUITE_NAME);
    });

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
                await setupMeshAsync(SUITE_NAME, LogType.Console);
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
                console.log(await meshUtils.addOrdersAsync([1])); // tslint:disable-line:no-console
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

    describe('/quote tests', () => {
        context('failure tests', () => {
            for (const testCase of testCases) {
                it(`${testCase.description}`, async () => {
                    await assertFailureAsync(`${META_TRANSACTION_PATH}/price`, testCase);
                });
            }
        });

        context('success tests', () => {
            before(async () => {
                await teardownMeshAsync(SUITE_NAME);
            });

            beforeEach(async () => {
                await blockchainLifecycle.startAsync();
                await setupMeshAsync(SUITE_NAME);
            });

            afterEach(async () => {
                await blockchainLifecycle.revertAsync();
                await teardownMeshAsync(SUITE_NAME);
            });

            after(async () => {
                await setupMeshAsync(SUITE_NAME);
            });

            // FIXME(jalextowle): Add the tests
            // it('should return a quote of the only order in Mesh', async () => {});

            // FIXME(jalextowle): Add test
            // it('should return a quote of the cheaper order in Mesh', async () => {});

            // FIXME(jalextowle): Add test
            // it('should return a quote of the combination of the two orders in Mesh', async () => {});
        });
    });

    describe('/submit tests', () => {
        const requestBase = `${META_TRANSACTION_PATH}/submit`;

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
});
