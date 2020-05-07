// tslint:disable:max-file-line-count
import { rfqtMocker } from '@0x/asset-swapper';
import { ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ERC20TokenContract, WETH9Contract } from '@0x/contract-wrappers';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { BlockchainLifecycle, web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as HttpStatus from 'http-status-codes';
import 'mocha';
import * as request from 'supertest';

import { AppDependencies, getAppAsync, getDefaultAppDependenciesAsync } from '../src/app';
import * as config from '../src/config';
import {
    DEFAULT_PAGE,
    DEFAULT_PER_PAGE,
    META_TRANSACTION_PATH,
    ONE_MINUTE_MS,
    ONE_SECOND_MS,
    SRA_PATH,
    SWAP_PATH,
} from '../src/constants';
import { ErrorBody, GeneralErrorCodes, generalErrorCodeToReason, ValidationErrorCodes } from '../src/errors';
import { orderUtils } from '../src/utils/order_utils';

import * as orderFixture from './fixtures/order.json';
import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';
import { expect } from './utils/expect';
import { ganacheZrxWethOrder1, rfqtIndicativeQuoteResponse } from './utils/mocks';
import { addresses, DAI_ASSET_DATA, WETH_ASSET_DATA, withOrdersInDatabaseAsync } from './utils/orders';

let app: Express.Application;

let web3Wrapper: Web3Wrapper;
let provider: Web3ProviderEngine;
let accounts: string[];
let blockchainLifecycle: BlockchainLifecycle;
let makerAddress: string;

let dependencies: AppDependencies;
// tslint:disable-next-line:custom-no-magic-numbers
const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);
const SUITE_NAME = 'app_test';

describe(SUITE_NAME, () => {
    before(async () => {
        // start the 0x-api app
        await setupDependenciesAsync(SUITE_NAME);

        // connect to ganache and run contract migrations
        const ganacheConfigs = {
            shouldUseInProcessGanache: false,
            shouldAllowUnlimitedContractSize: true,
            rpcUrl: config.ETHEREUM_RPC_URL,
        };
        provider = web3Factory.getRpcProvider(ganacheConfigs);
        web3Wrapper = new Web3Wrapper(provider);
        blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
        await blockchainLifecycle.startAsync();
        accounts = await web3Wrapper.getAvailableAddressesAsync();

        dependencies = await getDefaultAppDependenciesAsync(provider, config);
        makerAddress = accounts[0];
        try {
            // const fakeDAI = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            //     artifacts.DummyERC20Token,
            //     provider,
            //     {},
            //     artifacts,
            //     'DAI',
            //     'DAI',
            //     new BigNumber(18),
            //     new BigNumber(100000000000000000000),
            // );
            const makerToken = new DummyERC20TokenContract('0x34d402f14d58e001d8efbe6585051bf9706aa064', provider);
            const amount = new BigNumber('1000000000000000000000');
            await makerToken.setBalance(makerAddress, amount);
            await makerToken.approve(addresses.erc20Proxy, amount).awaitTransactionSuccessAsync({ from: makerAddress });
            // await dummyERC20TokenWrapper.mint(amount).awaitTransactionSuccessAsync({ from: accounts[0] });
        } catch (e) {
            console.log(e);
        }

        // start the 0x-api app
        app = await getAppAsync({ ...dependencies }, config);
    });
    after(async () => {
        await teardownDependenciesAsync(SUITE_NAME);
    });
    describe('/swap', () => {
        describe('/quote', () => {
            // it("with INSUFFICIENT_ASSET_LIQUIDITY when there's no liquidity (empty orderbook, sampling excluded, no RFQ)", async () => {
            //     await request(app)
            //         .get(
            //             `${SWAP_PATH}/quote?buyToken=DAI&sellToken=WETH&buyAmount=100000000000000000&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`,
            //         )
            //         .expect(HttpStatus.BAD_REQUEST)
            //         .expect('Content-Type', /json/)
            //         .then(response => {
            //             const responseJson = JSON.parse(response.text);
            //             expect(responseJson.reason).to.equal('Validation Failed');
            //             expect(responseJson.validationErrors.length).to.equal(1);
            //             expect(responseJson.validationErrors[0].field).to.equal('buyAmount');
            //             expect(responseJson.validationErrors[0].reason).to.equal('INSUFFICIENT_ASSET_LIQUIDITY');
            //         });
            // });

            it('should return valid quotes for accepted parameters', async () => {
                const parameterPermutations = [
                    `?sellAmount=10000&buyToken=DAI&sellToken=WETH`,
                    // { sellAmount: 10000, buyToken: 'WETH', sellToken: 'DAI' },
                    // { buyAmount: 10000, buyToken: 'WETH', sellToken: 'DAI' },
                    // { sellAmount: 10000, buyToken: 'DAI', sellToken: 'WETH' },
                    // { buyAmount: 10000, buyToken: 'DAI', sellToken: 'WETH' },
                    // { sellAmount: 10000, buyToken: '0x6b175474e89094c44da98b954eedeac495271d0f', sellToken: 'WETH' },
                    // { sellAmount: 10000, buyToken: '0x6b175474e89094c44da98b954eedeac495271d0f', sellToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
                ];
                return withOrdersInDatabaseAsync(dependencies.connection, web3Wrapper, [
                    {
                        takerAssetData: DAI_ASSET_DATA,
                        makerAssetData: WETH_ASSET_DATA,
                    },
                    {
                        makerAssetData: WETH_ASSET_DATA,
                        takerAssetData: DAI_ASSET_DATA,
                    },
                ], async () => {
                    for (const parameters of parameterPermutations) {
                        await request(app)
                            .get(`${SWAP_PATH}/quote${parameters}&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`)
                            .expect('Content-Type', /json/)
                            .expect(HttpStatus.OK)
                            // .then(response => {
                                
                            // })
                    } 
                });
                // sellAmount / buyAmount
                // ETH / WETH / DAI / ZRX / Addresses <-> Addresses / mixed
            });
            it('should respect buyAmount and sellAmount', () => {

            });
            it('should respect gasPrice', () => {

            });
            it('should respect slippagePercentage', () => {

            });
            it('should respect exludedSources', () => {

            })
            it('should return a Forwarder transaction for sellToken=ETH', () => {

            })
            it('should throw a validation error if takerAddress cannot complete the quote', () => {

            });

            // pricing
            // will not include an expired order
        });
        describe('/prices', () => {

        });
    });
    describe('SRA endpoints', () => {
        describe('/fee_recipients', () => {
            it('should return the list of fee recipients', async () => {
                await request(app)
                    .get(`${SRA_PATH}/fee_recipients`)
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.OK)
                    .then(response => {
                        expect(response.body.perPage).to.equal(DEFAULT_PER_PAGE);
                        expect(response.body.page).to.equal(DEFAULT_PAGE);
                        expect(response.body.total).to.be.an('number');
                        expect(response.body.records[0]).to.equal(NULL_ADDRESS);
                    });
            });
        });
        describe('/orders', () => {
            it('should return empty response when no orders', async () => {
                await request(app)
                    .get(`${SRA_PATH}/orders`)
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.OK)
                    .then(response => {
                        expect(response.body.perPage).to.equal(DEFAULT_PER_PAGE);
                        expect(response.body.page).to.equal(DEFAULT_PAGE);
                        expect(response.body.total).to.be.an('number');
                        expect(response.body.records).to.deep.equal([]);
                    });
            });
            it('should return orders in the local cache', async () => {
                return withOrdersInDatabaseAsync(dependencies.connection, web3Wrapper, [{}], async ([orderEntity]) => {
                    await request(app)
                        .get(`${SRA_PATH}/orders`)
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .then(response => {
                            expect(response.body.perPage).to.equal(DEFAULT_PER_PAGE);
                            expect(response.body.page).to.equal(DEFAULT_PAGE);
                            expect(response.body.total).to.be.an('number');
                            expect(orderUtils.serializeOrder(response.body.records[0])).to.deep.equal(orderEntity);
                        });
                });
            });
            it('should return orders filtered by query params', async () => {
                return withOrdersInDatabaseAsync(dependencies.connection, web3Wrapper, [{}], async ([orderEntity]) => {
                    await request(app)
                        .get(`${SRA_PATH}/orders?makerAddress=${orderEntity.makerAddress}`)
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .then(response => {
                            expect(response.body.perPage).to.equal(DEFAULT_PER_PAGE);
                            expect(response.body.page).to.equal(DEFAULT_PAGE);
                            expect(response.body.total).to.be.an('number');
                            expect(orderUtils.serializeOrder(response.body.records[0])).to.deep.equal(orderEntity);
                        });
                });
            });
            it('should return empty response when filtered by query params', async () => {
                return withOrdersInDatabaseAsync(dependencies.connection, web3Wrapper, [{}], async () => {
                    await request(app)
                        .get(`${SRA_PATH}/orders?makerAddress=${NULL_ADDRESS}`)
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .then(response => {
                            expect(response.body.perPage).to.equal(DEFAULT_PER_PAGE);
                            expect(response.body.page).to.equal(DEFAULT_PAGE);
                            expect(response.body.total).to.be.an('number');
                            expect(response.body.records).to.deep.equal([]);
                        });
                });
            });
            it('should normalize addresses to lowercase', async () => {
                return withOrdersInDatabaseAsync(dependencies.connection, web3Wrapper, [{}], async ([orderEntity]) => {
                    await request(app)
                        .get(`${SRA_PATH}/orders?makerAddress=${accounts[0].toUpperCase()}`)
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .then(response => {
                            expect(response.body.perPage).to.equal(DEFAULT_PER_PAGE);
                            expect(response.body.page).to.equal(DEFAULT_PAGE);
                            expect(response.body.total).to.equal(1);
                            expect(orderUtils.serializeOrder(response.body.records[0])).to.deep.equal(orderEntity);
                        });
                });
            });
        });
        describe('GET /order', () => {
            it('should return order by order hash', async () => {
                return withOrdersInDatabaseAsync(dependencies.connection, web3Wrapper, [{}], async ([orderEntity]) => {
                    await request(app)
                        .get(`${SRA_PATH}/order/${orderEntity.hash}`)
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .then(response => {
                            expect(orderUtils.serializeOrder(response.body)).to.deep.equal(orderEntity);
                        });
                });
            });
            it('should return 404 if order is not found', async () => {
                await request(app)
                    .get(`${SRA_PATH}/order/abc`)
                    .expect(HttpStatus.NOT_FOUND);
            });
        });
        describe('POST /order', () => {
            it('should return 201 on success', async () => {
                await request(app)
                    .post(`${SRA_PATH}/order`)
                    .send({
                        chainId: config.CHAIN_ID,
                        expirationTimeSeconds: Math.floor((Date.now() + ONE_MINUTE_MS) / ONE_SECOND_MS).toString(),
                        ...orderFixture,
                    })
                    .then(response => {
                        expect(response.body).to.not.be.undefined();
                    });
            });
            it('should return an informative error message');
        });
        describe('GET /asset_pairs', () => {
            it('should respond to GET request', async () => {
                await request(app)
                    .get(`${SRA_PATH}/asset_pairs`)
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.OK)
                    .then(response => {
                        expect(response.body.perPage).to.equal(DEFAULT_PER_PAGE);
                        expect(response.body.page).to.equal(DEFAULT_PAGE);
                        expect(response.body.total).to.be.an('number');
                        expect(response.body.records).to.be.an('array');
                    });
            });
        });
        describe('GET /orderbook', () => {
            it('should return orderbook for a given pair');
        });
        describe('POST /order_config', () => {
            it('should return 200 on success', async () => {
                const requestBody = {
                    exchangeAddress: orderFixture.exchangeAddress,
                    makerAddress: orderFixture.makerAddress,
                    takerAddress: orderFixture.takerAddress,
                    makerAssetAmount: orderFixture.makerAssetAmount,
                    makerAssetData: orderFixture.makerAssetData,
                    takerAssetAmount: orderFixture.takerAssetAmount,
                    takerAssetData: orderFixture.takerAssetData,
                    expirationTimeSeconds: Math.floor((Date.now() + ONE_MINUTE_MS) / ONE_SECOND_MS),
                };
                const expectedResponse = {
                    senderAddress: NULL_ADDRESS,
                    feeRecipientAddress: NULL_ADDRESS,
                    makerFee: '0',
                    takerFee: '0',
                    makerFeeAssetData: '0x',
                    takerFeeAssetData: '0x',
                };
                await request(app)
                    .post(`${SRA_PATH}/order_config`)
                    .send(requestBody)
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.OK)
                    .expect(expectedResponse);
            });
            it('should return informative error when missing fields', async () => {
                const requestBody = {
                    exchangeAddress: orderFixture.exchangeAddress,
                    makerAddress: orderFixture.makerAddress,
                    makerAssetAmount: orderFixture.makerAssetAmount,
                    makerAssetData: orderFixture.makerAssetData,
                    takerAssetAmount: orderFixture.takerAssetAmount,
                    takerAssetData: orderFixture.takerAssetData,
                };
                const validationError: ErrorBody = {
                    code: GeneralErrorCodes.ValidationError,
                    reason: generalErrorCodeToReason[GeneralErrorCodes.ValidationError],
                    validationErrors: [
                        {
                            field: 'takerAddress',
                            code: ValidationErrorCodes.RequiredField,
                            reason: 'requires property "takerAddress"',
                        },
                        {
                            field: 'expirationTimeSeconds',
                            code: ValidationErrorCodes.RequiredField,
                            reason: 'requires property "expirationTimeSeconds"',
                        },
                    ],
                };
                await request(app)
                    .post(`${SRA_PATH}/order_config`)
                    .send(requestBody)
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.BAD_REQUEST)
                    .expect(validationError);
            });
        });
    });
    it('should return InvalidAPIKey error if invalid UUID supplied as API Key', async () => {
        await request(app)
            .post(`${META_TRANSACTION_PATH}/submit`)
            .set('0x-api-key', 'foobar')
            .expect('Content-Type', /json/)
            .expect(HttpStatus.BAD_REQUEST)
            .then(response => {
                expect(response.body.code).to.equal(GeneralErrorCodes.InvalidAPIKey);
                expect(response.body.reason).to.equal(generalErrorCodeToReason[GeneralErrorCodes.InvalidAPIKey]);
            });
    });
    describe('should hit RFQ-T when apropriate', async () => {
        let contractAddresses: ContractAddresses;
        let makerAddress: string;
        let takerAddress: string;

        beforeEach(async () => {
            contractAddresses = getContractAddressesForChainOrThrow(
                process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : await web3Wrapper.getChainIdAsync(),
            );
            [makerAddress, takerAddress] = accounts;
        });

        context('with maker allowances set', async () => {
            beforeEach(async () => {
                const zrxToken = new ERC20TokenContract(contractAddresses.zrxToken, provider);
                await zrxToken
                    .approve(contractAddresses.erc20Proxy, MAX_UINT256)
                    .sendTransactionAsync({ from: makerAddress });
            });

            context('getting a quote from an RFQ-T provider', async () => {
                it('should succeed when taker has balances and amounts', async () => {
                    const sellAmount = new BigNumber(100000000000000000);

                    const wethContract = new WETH9Contract(contractAddresses.etherToken, provider);
                    await wethContract.deposit().sendTransactionAsync({ value: sellAmount, from: takerAddress });
                    await wethContract
                        .approve(contractAddresses.erc20Proxy, sellAmount)
                        .sendTransactionAsync({ from: takerAddress });

                    const mockedApiParams = {
                        sellToken: contractAddresses.etherToken,
                        buyToken: contractAddresses.zrxToken,
                        sellAmount: sellAmount.toString(),
                        buyAmount: undefined,
                        takerAddress,
                    };
                    return rfqtMocker.withMockedRfqtFirmQuotes(
                        [
                            {
                                endpoint: 'https://mock-rfqt1.club',
                                responseData: ganacheZrxWethOrder1,
                                responseCode: 200,
                                requestApiKey: 'koolApiKey1',
                                requestParams: mockedApiParams,
                            },
                        ],
                        async () => {
                            const appResponse = await request(app)
                                .get(
                                    `${SWAP_PATH}/quote?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&takerAddress=${takerAddress}&intentOnFilling=true&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`,
                                )
                                .set('0x-api-key', 'koolApiKey1')
                                .expect(HttpStatus.OK)
                                .expect('Content-Type', /json/);

                            const responseJson = JSON.parse(appResponse.text);
                            expect(responseJson.orders.length).to.equal(1);
                            expect(responseJson.orders[0]).to.eql(ganacheZrxWethOrder1);
                        },
                    );
                });
                it('should not include an RFQ-T order when intentOnFilling === false', async () => {
                    const sellAmount = new BigNumber(100000000000000000);

                    const wethContract = new WETH9Contract(contractAddresses.etherToken, provider);
                    await wethContract.deposit().sendTransactionAsync({ value: sellAmount, from: takerAddress });
                    await wethContract
                        .approve(contractAddresses.erc20Proxy, sellAmount)
                        .sendTransactionAsync({ from: takerAddress });

                    const mockedApiParams = {
                        sellToken: contractAddresses.etherToken,
                        buyToken: contractAddresses.zrxToken,
                        sellAmount: sellAmount.toString(),
                        buyAmount: undefined,
                        takerAddress,
                    };
                    return rfqtMocker.withMockedRfqtIndicativeQuotes(
                        [
                            {
                                endpoint: 'https://mock-rfqt1.club',
                                responseData: rfqtIndicativeQuoteResponse,
                                responseCode: 200,
                                requestApiKey: 'koolApiKey1',
                                requestParams: mockedApiParams,
                            },
                        ],
                        async () => {
                            const appResponse = await request(app)
                                .get(
                                    `${SWAP_PATH}/quote?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&takerAddress=${takerAddress}&intentOnFilling=false&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider&skipValidation=true`,
                                )
                                .set('0x-api-key', 'koolApiKey1')
                                .expect(HttpStatus.BAD_REQUEST)
                                .expect('Content-Type', /json/);

                            const validationErrors = appResponse.body.validationErrors;
                            expect(validationErrors.length).to.eql(1);
                            expect(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                        },
                    );
                });
                it('should not include an RFQ-T order when intentOnFilling is omitted', async () => {
                    const sellAmount = new BigNumber(100000000000000000);

                    const wethContract = new WETH9Contract(contractAddresses.etherToken, provider);
                    await wethContract.deposit().sendTransactionAsync({ value: sellAmount, from: takerAddress });
                    await wethContract
                        .approve(contractAddresses.erc20Proxy, sellAmount)
                        .sendTransactionAsync({ from: takerAddress });

                    const mockedApiParams = {
                        sellToken: contractAddresses.etherToken,
                        buyToken: contractAddresses.zrxToken,
                        sellAmount: sellAmount.toString(),
                        buyAmount: undefined,
                        takerAddress,
                    };
                    return rfqtMocker.withMockedRfqtIndicativeQuotes(
                        [
                            {
                                endpoint: 'https://mock-rfqt1.club',
                                responseData: rfqtIndicativeQuoteResponse,
                                responseCode: 200,
                                requestApiKey: 'koolApiKey1',
                                requestParams: mockedApiParams,
                            },
                        ],
                        async () => {
                            const appResponse = await request(app)
                                .get(
                                    `${SWAP_PATH}/quote?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&takerAddress=${takerAddress}&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider&skipValidation=true`,
                                )
                                .set('0x-api-key', 'koolApiKey1')
                                .expect(HttpStatus.BAD_REQUEST)
                                .expect('Content-Type', /json/);

                            const validationErrors = appResponse.body.validationErrors;
                            expect(validationErrors.length).to.eql(1);
                            expect(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                        },
                    );
                });
                it('should fail when taker address is not supplied', async () => {
                    const sellAmount = new BigNumber(100000000000000000);

                    const appResponse = await request(app)
                        .get(
                            `${SWAP_PATH}/quote?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&intentOnFilling=true&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`,
                        )
                        .set('0x-api-key', 'koolApiKey1')
                        .expect(HttpStatus.BAD_REQUEST)
                        .expect('Content-Type', /json/);

                    const validationErrors = appResponse.body.validationErrors;
                    expect(validationErrors.length).to.eql(1);
                    expect(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                });
                it('should succeed when taker can not actually fill but we skip validation', async () => {
                    const sellAmount = new BigNumber(100000000000000000);

                    const wethContract = new WETH9Contract(contractAddresses.etherToken, provider);
                    await wethContract
                        .approve(contractAddresses.erc20Proxy, new BigNumber(0))
                        .sendTransactionAsync({ from: takerAddress });

                    const mockedApiParams = {
                        sellToken: contractAddresses.etherToken,
                        buyToken: contractAddresses.zrxToken,
                        sellAmount: sellAmount.toString(),
                        buyAmount: undefined,
                        takerAddress,
                    };
                    return rfqtMocker.withMockedRfqtFirmQuotes(
                        [
                            {
                                endpoint: 'https://mock-rfqt1.club',
                                responseData: ganacheZrxWethOrder1,
                                responseCode: 200,
                                requestApiKey: 'koolApiKey1',
                                requestParams: mockedApiParams,
                            },
                        ],
                        async () => {
                            const appResponse = await request(app)
                                .get(
                                    `${SWAP_PATH}/quote?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&takerAddress=${takerAddress}&intentOnFilling=true&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider&skipValidation=true`,
                                )
                                .set('0x-api-key', 'koolApiKey1')
                                .expect(HttpStatus.OK)
                                .expect('Content-Type', /json/);
                            const responseJson = JSON.parse(appResponse.text);
                            expect(responseJson.orders.length).to.equal(1);
                            expect(responseJson.orders[0]).to.eql(ganacheZrxWethOrder1);
                        },
                    );
                });
                it('should fail when bad api key used', async () => {
                    const sellAmount = new BigNumber(100000000000000000);

                    const wethContract = new WETH9Contract(contractAddresses.etherToken, provider);
                    await wethContract.deposit().sendTransactionAsync({ value: sellAmount, from: takerAddress });
                    await wethContract
                        .approve(contractAddresses.erc20Proxy, new BigNumber(0))
                        .sendTransactionAsync({ from: takerAddress });

                    // this RFQ-T mock should never actually get hit b/c of the bad api key
                    // but in the case in which the bad api key was _not_ blocked
                    // this would cause the API to respond with RFQ-T liquidity
                    const mockedApiParams = {
                        sellToken: contractAddresses.etherToken,
                        buyToken: contractAddresses.zrxToken,
                        sellAmount: sellAmount.toString(),
                        buyAmount: undefined,
                        takerAddress,
                    };
                    return rfqtMocker.withMockedRfqtFirmQuotes(
                        [
                            {
                                endpoint: 'https://mock-rfqt1.club',
                                responseData: ganacheZrxWethOrder1,
                                responseCode: 200,
                                requestApiKey: 'badApiKey',
                                requestParams: mockedApiParams,
                            },
                        ],
                        async () => {
                            const appResponse = await request(app)
                                .get(
                                    `${SWAP_PATH}/quote?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&takerAddress=${takerAddress}&intentOnFilling=true&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider&skipValidation=true`,
                                )
                                .set('0x-api-key', 'badApiKey')
                                .expect(HttpStatus.BAD_REQUEST)
                                .expect('Content-Type', /json/);
                            const validationErrors = appResponse.body.validationErrors;
                            expect(validationErrors.length).to.eql(1);
                            expect(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                        },
                    );
                });
                it('should fail validation when taker can not actually fill', async () => {
                    const sellAmount = new BigNumber(100000000000000000);

                    const wethContract = new WETH9Contract(contractAddresses.etherToken, provider);
                    await wethContract
                        .approve(contractAddresses.erc20Proxy, new BigNumber(0))
                        .sendTransactionAsync({ from: takerAddress });

                    const mockedApiParams = {
                        sellToken: contractAddresses.etherToken,
                        buyToken: contractAddresses.zrxToken,
                        sellAmount: sellAmount.toString(),
                        buyAmount: undefined,
                        takerAddress,
                    };
                    return rfqtMocker.withMockedRfqtFirmQuotes(
                        [
                            {
                                endpoint: 'https://mock-rfqt1.club',
                                responseData: ganacheZrxWethOrder1,
                                responseCode: 200,
                                requestApiKey: 'koolApiKey1',
                                requestParams: mockedApiParams,
                            },
                        ],
                        async () => {
                            await request(app)
                                .get(
                                    `${SWAP_PATH}/quote?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&takerAddress=${takerAddress}&intentOnFilling=true&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`,
                                )
                                .set('0x-api-key', 'koolApiKey1')
                                .expect(HttpStatus.BAD_REQUEST)
                                .expect('Content-Type', /json/);
                        },
                    );
                });
                it('should get an indicative quote from an RFQ-T provider', async () => {
                    const sellAmount = new BigNumber(100000000000000000);

                    const mockedApiParams = {
                        sellToken: contractAddresses.etherToken,
                        buyToken: contractAddresses.zrxToken,
                        sellAmount: sellAmount.toString(),
                        buyAmount: undefined,
                        takerAddress,
                    };
                    return rfqtMocker.withMockedRfqtIndicativeQuotes(
                        [
                            {
                                endpoint: 'https://mock-rfqt1.club',
                                responseData: rfqtIndicativeQuoteResponse,
                                responseCode: 200,
                                requestApiKey: 'koolApiKey1',
                                requestParams: mockedApiParams,
                            },
                        ],
                        async () => {
                            const appResponse = await request(app)
                                .get(
                                    `${SWAP_PATH}/price?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&takerAddress=${takerAddress}&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`,
                                )
                                .set('0x-api-key', 'koolApiKey1')
                                .expect(HttpStatus.OK)
                                .expect('Content-Type', /json/);

                            const responseJson = JSON.parse(appResponse.text);
                            delete responseJson.gas;
                            delete responseJson.gasPrice;
                            delete responseJson.protocolFee;
                            delete responseJson.value;
                            expect(responseJson).to.eql({
                                buyAmount: '100000000000000000',
                                price: '1',
                                sellAmount: '100000000000000000',
                                sources: [
                                    {
                                        name: '0x',
                                        proportion: '1',
                                    },
                                    {
                                        name: 'Uniswap',
                                        proportion: '0',
                                    },
                                    {
                                        name: 'Eth2Dai',
                                        proportion: '0',
                                    },
                                    {
                                        name: 'Kyber',
                                        proportion: '0',
                                    },
                                    {
                                        name: 'Curve_USDC_DAI',
                                        proportion: '0',
                                    },
                                    {
                                        name: 'Curve_USDC_DAI_USDT',
                                        proportion: '0',
                                    },
                                    {
                                        name: 'Curve_USDC_DAI_USDT_TUSD',
                                        proportion: '0',
                                    },
                                    {
                                        name: 'Curve_USDC_DAI_USDT_BUSD',
                                        proportion: '0',
                                    },
                                    {
                                        name: 'Curve_USDC_DAI_USDT_SUSD',
                                        proportion: '0',
                                    },
                                    {
                                        name: 'LiquidityProvider',
                                        proportion: '0',
                                    },
                                ],
                            });
                        },
                    );
                });
                it('should fail silently when RFQ-T provider gives an error response', async () => {
                    const sellAmount = new BigNumber(100000000000000000);

                    const mockedApiParams = {
                        sellToken: contractAddresses.etherToken,
                        buyToken: contractAddresses.zrxToken,
                        sellAmount: sellAmount.toString(),
                        buyAmount: undefined,
                        takerAddress,
                    };
                    return rfqtMocker.withMockedRfqtIndicativeQuotes(
                        [
                            {
                                endpoint: 'https://mock-rfqt1.club',
                                responseData: {},
                                responseCode: 500,
                                requestApiKey: 'koolApiKey1',
                                requestParams: mockedApiParams,
                            },
                        ],
                        async () => {
                            const appResponse = await request(app)
                                .get(
                                    `${SWAP_PATH}/price?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&takerAddress=${takerAddress}&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`,
                                )
                                .set('0x-api-key', 'koolApiKey1')
                                .expect(HttpStatus.BAD_REQUEST)
                                .expect('Content-Type', /json/);

                            const validationErrors = appResponse.body.validationErrors;
                            expect(validationErrors.length).to.eql(1);
                            expect(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                        },
                    );
                });
            });
        });

        context('without maker allowances set', async () => {
            beforeEach(async () => {
                const zrxToken = new ERC20TokenContract(contractAddresses.zrxToken, provider);
                await zrxToken
                    .approve(contractAddresses.erc20Proxy, new BigNumber(0))
                    .sendTransactionAsync({ from: makerAddress });
            });

            it('should not return order if maker allowances are not set', async () => {
                const sellAmount = new BigNumber(100000000000000000);

                const wethContract = new WETH9Contract(contractAddresses.etherToken, provider);
                await wethContract
                    .approve(contractAddresses.erc20Proxy, new BigNumber(0))
                    .sendTransactionAsync({ from: takerAddress });

                const mockedApiParams = {
                    sellToken: contractAddresses.etherToken,
                    buyToken: contractAddresses.zrxToken,
                    sellAmount: sellAmount.toString(),
                    buyAmount: undefined,
                    takerAddress,
                };
                return rfqtMocker.withMockedRfqtFirmQuotes(
                    [
                        {
                            endpoint: 'https://mock-rfqt1.club',
                            responseData: ganacheZrxWethOrder1,
                            responseCode: 200,
                            requestApiKey: 'koolApiKey1',
                            requestParams: mockedApiParams,
                        },
                    ],
                    async () => {
                        const appResponse = await request(app)
                            .get(
                                `${SWAP_PATH}/quote?buyToken=ZRX&sellToken=WETH&sellAmount=${sellAmount.toString()}&takerAddress=${takerAddress}&intentOnFilling=true&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider&skipValidation=true`,
                            )
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.BAD_REQUEST)
                            .expect('Content-Type', /json/);

                        const validationErrors = appResponse.body.validationErrors;
                        expect(validationErrors.length).to.eql(1);
                        expect(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                    },
                );
            });
        });
    });
});
