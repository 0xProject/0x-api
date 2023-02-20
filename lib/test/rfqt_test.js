"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint @typescript-eslint/no-explicit-any: 0 */
const contract_wrappers_1 = require("@0x/contract-wrappers");
const contracts_erc20_1 = require("@0x/contracts-erc20");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const dev_utils_1 = require("@0x/dev-utils");
const utils_1 = require("@0x/utils");
const axios_1 = require("axios");
const http_1 = require("http");
const HttpStatus = require("http-status-codes");
const https_1 = require("https");
const _ = require("lodash");
require("mocha");
const request = require("supertest");
const app_1 = require("../src/app");
const asset_swapper_1 = require("../src/asset-swapper");
const config_1 = require("../src/config");
const constants_1 = require("../src/constants");
const constants_2 = require("./constants");
const deployment_1 = require("./utils/deployment");
const mocks_1 = require("./utils/mocks");
// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../src/app')];
const KEEP_ALIVE_TTL = 5 * 60 * 1000;
const quoteRequestorHttpClient = axios_1.default.create({
    httpAgent: new http_1.Agent({ keepAlive: true, timeout: KEEP_ALIVE_TTL }),
    httpsAgent: new https_1.Agent({ keepAlive: true, timeout: KEEP_ALIVE_TTL }),
});
let app;
let server;
let web3Wrapper;
let provider;
let accounts;
let blockchainLifecycle;
let dependencies;
const MAX_UINT256 = new utils_1.BigNumber(2).pow(256).minus(1);
const SUITE_NAME = 'rfqt tests';
const EXCLUDED_SOURCES = Object.values(asset_swapper_1.ERC20BridgeSource).filter((s) => s !== asset_swapper_1.ERC20BridgeSource.Native);
const DEFAULT_SELL_AMOUNT = new utils_1.BigNumber(100000000000000000);
const DEFAULT_QUERY = `buyToken=ZRX&sellToken=WETH&excludedSources=${EXCLUDED_SOURCES.join(',')}&gasPrice=1`;
describe.skip(SUITE_NAME, () => {
    const contractAddresses = constants_2.CONTRACT_ADDRESSES;
    let makerAddress;
    let takerAddress;
    let wethContract;
    let zrxToken;
    before(async () => {
        // start the 0x-api app
        await (0, deployment_1.setupDependenciesAsync)(SUITE_NAME);
        provider = (0, constants_2.getProvider)();
        web3Wrapper = new dev_utils_1.Web3Wrapper(provider);
        blockchainLifecycle = new dev_utils_1.BlockchainLifecycle(web3Wrapper);
        await blockchainLifecycle.startAsync();
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        [makerAddress, takerAddress] = accounts;
        wethContract = new contract_wrappers_1.WETH9Contract(contractAddresses.etherToken, provider);
        zrxToken = new contracts_erc20_1.DummyERC20TokenContract(contractAddresses.zrxToken, provider);
        // start the 0x-api app
        dependencies = await (0, app_1.getDefaultAppDependenciesAsync)(provider, {
            ...config_1.defaultHttpServiceConfig,
            ethereumRpcUrl: constants_2.ETHEREUM_RPC_URL,
        });
        ({ app, server } = await (0, app_1.getAppAsync)({ ...dependencies }, { ...config_1.defaultHttpServiceConfig, ethereumRpcUrl: constants_2.ETHEREUM_RPC_URL }));
    });
    after(async () => {
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        await (0, deployment_1.teardownDependenciesAsync)(SUITE_NAME);
    });
    describe('v1', async () => {
        const SWAP_PATH = `${constants_1.SWAP_PATH}`;
        let DEFAULT_RFQT_RESPONSE_DATA;
        let signedOrder;
        before(async () => {
            DEFAULT_RFQT_RESPONSE_DATA = {
                endpoint: 'https://mock-rfqt1.club',
                responseCode: 200,
                requestApiKey: 'koolApiKey1',
                requestParams: {
                    txOrigin: takerAddress,
                    takerAddress: constants_2.NULL_ADDRESS,
                    buyTokenAddress: contractAddresses.zrxToken,
                    sellTokenAddress: contractAddresses.etherToken,
                    protocolVersion: '4',
                    sellAmountBaseUnits: DEFAULT_SELL_AMOUNT.toString(),
                    comparisonPrice: undefined,
                },
            };
            const order = new asset_swapper_1.RfqOrder({ ...mocks_1.ganacheZrxWethRfqOrderExchangeProxy, txOrigin: takerAddress });
            const signature = await order.getSignatureWithProviderAsync(provider);
            signedOrder = { ...order, signature };
            signedOrder = JSON.parse(JSON.stringify(signedOrder));
        });
        context('with maker allowances set', async () => {
            beforeEach(async () => {
                await zrxToken
                    .approve(contractAddresses.exchangeProxy, MAX_UINT256)
                    .sendTransactionAsync({ from: makerAddress });
            });
            context('getting a quote from an RFQ-T provider', async () => {
                // TODO try again after updating ganache snapshot
                it.skip('should succeed when taker has balances and amounts', async () => {
                    await wethContract
                        .deposit()
                        .sendTransactionAsync({ value: DEFAULT_SELL_AMOUNT, from: takerAddress });
                    await wethContract
                        .approve(contractAddresses.exchangeProxy, DEFAULT_SELL_AMOUNT)
                        .sendTransactionAsync({ from: takerAddress });
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([
                        {
                            ...DEFAULT_RFQT_RESPONSE_DATA,
                            responseData: { signedOrder },
                        },
                    ], asset_swapper_1.RfqtQuoteEndpoint.Firm, async () => {
                        const appResponse = await request(app)
                            .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}&intentOnFilling=true`)
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.OK)
                            .expect('Content-Type', /json/);
                        const responseJson = JSON.parse(appResponse.text);
                        (0, contracts_test_utils_1.expect)(responseJson.orders.length).to.equal(1);
                        (0, contracts_test_utils_1.expect)(responseJson.orders[0].fillData.order).to.eql(_.omit(signedOrder, 'signature'));
                        (0, contracts_test_utils_1.expect)(responseJson.orders[0].fillData.signature).to.eql(signedOrder.signature);
                    }, quoteRequestorHttpClient);
                });
                // TODO try again after updating ganache snapshot
                it.skip('should pad protocol fee for firm quotes with RFQT orders', async () => {
                    await wethContract
                        .deposit()
                        .sendTransactionAsync({ value: DEFAULT_SELL_AMOUNT, from: takerAddress });
                    await wethContract
                        .approve(contractAddresses.exchangeProxy, DEFAULT_SELL_AMOUNT)
                        .sendTransactionAsync({ from: takerAddress });
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([
                        {
                            ...DEFAULT_RFQT_RESPONSE_DATA,
                            responseData: { signedOrder },
                        },
                    ], asset_swapper_1.RfqtQuoteEndpoint.Firm, async () => {
                        const appResponse = await request(app)
                            .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}&intentOnFilling=true`)
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.OK)
                            .expect('Content-Type', /json/);
                        const responseJson = appResponse.body;
                        (0, contracts_test_utils_1.expect)(responseJson.orders.length).to.equal(1);
                        (0, contracts_test_utils_1.expect)(responseJson.gasPrice).to.equal('1');
                        (0, contracts_test_utils_1.expect)(responseJson.protocolFee).to.equal(config_1.PROTOCOL_FEE_MULTIPLIER.times(config_1.RFQT_PROTOCOL_FEE_GAS_PRICE_MAX_PADDING_MULTIPLIER).toString());
                        (0, contracts_test_utils_1.expect)(responseJson.value).to.equal(config_1.PROTOCOL_FEE_MULTIPLIER.times(config_1.RFQT_PROTOCOL_FEE_GAS_PRICE_MAX_PADDING_MULTIPLIER).toString());
                    }, quoteRequestorHttpClient);
                });
                it('should not include an RFQ-T order when intentOnFilling === false', async () => {
                    await wethContract
                        .deposit()
                        .sendTransactionAsync({ value: DEFAULT_SELL_AMOUNT, from: takerAddress });
                    await wethContract
                        .approve(contractAddresses.exchangeProxy, DEFAULT_SELL_AMOUNT)
                        .sendTransactionAsync({ from: takerAddress });
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([
                        {
                            ...DEFAULT_RFQT_RESPONSE_DATA,
                            responseData: mocks_1.rfqtIndicativeQuoteResponse,
                        },
                    ], asset_swapper_1.RfqtQuoteEndpoint.Indicative, async () => {
                        const appResponse = await request(app)
                            .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}&intentOnFilling=false&skipValidation=true`)
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.BAD_REQUEST)
                            .expect('Content-Type', /json/);
                        const validationErrors = appResponse.body.validationErrors;
                        (0, contracts_test_utils_1.expect)(validationErrors.length).to.eql(1);
                        (0, contracts_test_utils_1.expect)(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                    }, quoteRequestorHttpClient);
                });
                it('should not include an RFQ-T order when intentOnFilling is omitted', async () => {
                    await wethContract
                        .deposit()
                        .sendTransactionAsync({ value: DEFAULT_SELL_AMOUNT, from: takerAddress });
                    await wethContract
                        .approve(contractAddresses.exchangeProxy, DEFAULT_SELL_AMOUNT)
                        .sendTransactionAsync({ from: takerAddress });
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([
                        {
                            ...DEFAULT_RFQT_RESPONSE_DATA,
                            responseData: mocks_1.rfqtIndicativeQuoteResponse,
                        },
                    ], asset_swapper_1.RfqtQuoteEndpoint.Indicative, async () => {
                        const appResponse = await request(app)
                            .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}&skipValidation=true`)
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.BAD_REQUEST)
                            .expect('Content-Type', /json/);
                        const validationErrors = appResponse.body.validationErrors;
                        (0, contracts_test_utils_1.expect)(validationErrors.length).to.eql(1);
                        (0, contracts_test_utils_1.expect)(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                    });
                });
                it('should fail when taker address is not supplied for a firm quote', async () => {
                    const appResponse = await request(app)
                        .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&intentOnFilling=true`)
                        .set('0x-api-key', 'koolApiKey1')
                        .expect(HttpStatus.BAD_REQUEST)
                        .expect('Content-Type', /json/);
                    const validationErrors = appResponse.body.validationErrors;
                    (0, contracts_test_utils_1.expect)(validationErrors.length).to.eql(1);
                    (0, contracts_test_utils_1.expect)(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                });
                it("should fail when it's a buy order and those are disabled (which is the default)", async () => {
                    const buyAmount = new utils_1.BigNumber(100000000000000000);
                    await wethContract
                        .approve(contractAddresses.exchangeProxy, new utils_1.BigNumber(0))
                        .sendTransactionAsync({ from: takerAddress });
                    const appResponse = await request(app)
                        .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&buyAmount=${buyAmount.toString()}&takerAddress=${takerAddress}&intentOnFilling=true&skipValidation=true`)
                        .set('0x-api-key', 'koolApiKey1')
                        .expect(HttpStatus.BAD_REQUEST)
                        .expect('Content-Type', /json/);
                    const validationErrors = appResponse.body.validationErrors;
                    (0, contracts_test_utils_1.expect)(validationErrors.length).to.eql(1);
                    (0, contracts_test_utils_1.expect)(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                });
                it('should succeed when taker can not actually fill but we skip validation', async () => {
                    await wethContract
                        .approve(contractAddresses.exchangeProxy, new utils_1.BigNumber(0))
                        .sendTransactionAsync({ from: takerAddress });
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([
                        {
                            ...DEFAULT_RFQT_RESPONSE_DATA,
                            responseData: { signedOrder },
                        },
                    ], asset_swapper_1.RfqtQuoteEndpoint.Firm, async () => {
                        const appResponse = await request(app)
                            .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}&intentOnFilling=true&skipValidation=true`)
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.OK)
                            .expect('Content-Type', /json/);
                        const responseJson = JSON.parse(appResponse.text);
                        (0, contracts_test_utils_1.expect)(responseJson.orders.length).to.equal(1);
                        (0, contracts_test_utils_1.expect)(responseJson.orders[0].fillData.order).to.eql(_.omit(signedOrder, 'signature'));
                        (0, contracts_test_utils_1.expect)(responseJson.orders[0].fillData.signature).to.eql(signedOrder.signature);
                    }, quoteRequestorHttpClient);
                });
                it('should fail when bad api key used', async () => {
                    await wethContract
                        .deposit()
                        .sendTransactionAsync({ value: DEFAULT_SELL_AMOUNT, from: takerAddress });
                    await wethContract
                        .approve(contractAddresses.exchangeProxy, new utils_1.BigNumber(0))
                        .sendTransactionAsync({ from: takerAddress });
                    // this RFQ-T mock should never actually get hit b/c of the bad api key
                    // but in the case in which the bad api key was _not_ blocked
                    // this would cause the API to respond with RFQ-T liquidity
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([
                        {
                            ...DEFAULT_RFQT_RESPONSE_DATA,
                            responseData: signedOrder,
                            requestApiKey: 'badApiKey',
                        },
                    ], asset_swapper_1.RfqtQuoteEndpoint.Firm, async () => {
                        const appResponse = await request(app)
                            .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}&intentOnFilling=true&skipValidation=true`)
                            .set('0x-api-key', 'badApiKey')
                            .expect(HttpStatus.BAD_REQUEST)
                            .expect('Content-Type', /json/);
                        const validationErrors = appResponse.body.validationErrors;
                        (0, contracts_test_utils_1.expect)(validationErrors.length).to.eql(1);
                        (0, contracts_test_utils_1.expect)(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                    });
                });
                it('should fail validation when taker can not actually fill', async () => {
                    await wethContract
                        .approve(contractAddresses.exchangeProxy, new utils_1.BigNumber(0))
                        .sendTransactionAsync({ from: takerAddress });
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([
                        {
                            ...DEFAULT_RFQT_RESPONSE_DATA,
                            responseData: signedOrder,
                        },
                    ], asset_swapper_1.RfqtQuoteEndpoint.Firm, async () => {
                        await request(app)
                            .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}&intentOnFilling=true`)
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.BAD_REQUEST)
                            .expect('Content-Type', /json/);
                    });
                });
                it('should get an indicative quote from an RFQ-T provider', async () => {
                    const mock = {
                        ...DEFAULT_RFQT_RESPONSE_DATA,
                        responseData: mocks_1.rfqtIndicativeQuoteResponse,
                    };
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([mock], asset_swapper_1.RfqtQuoteEndpoint.Indicative, async () => {
                        const appResponse = await request(app)
                            .get(`${SWAP_PATH}/price?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}`)
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.OK)
                            .expect('Content-Type', /json/);
                        const responseJson = JSON.parse(appResponse.text);
                        (0, contracts_test_utils_1.expect)(responseJson.buyAmount).to.equal('100000000000000000');
                        (0, contracts_test_utils_1.expect)(responseJson.price).to.equal('1');
                        (0, contracts_test_utils_1.expect)(responseJson.sellAmount).to.equal('100000000000000000');
                        (0, contracts_test_utils_1.expect)(responseJson.sources).to.deep.include.members([{ name: '0x', proportion: '1' }]);
                    }, quoteRequestorHttpClient);
                });
                it('should succeed when taker address is not supplied for an indicative quote', async () => {
                    const mock = {
                        ...DEFAULT_RFQT_RESPONSE_DATA,
                        responseData: mocks_1.rfqtIndicativeQuoteResponse,
                    };
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    mock.requestParams.txOrigin = constants_2.NULL_ADDRESS;
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([mock], asset_swapper_1.RfqtQuoteEndpoint.Indicative, async () => {
                        const appResponse = await request(app)
                            .get(`${SWAP_PATH}/price?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&skipValidation=true`)
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.OK)
                            .expect('Content-Type', /json/);
                        const responseJson = JSON.parse(appResponse.text);
                        (0, contracts_test_utils_1.expect)(responseJson.buyAmount).to.equal('100000000000000000');
                        (0, contracts_test_utils_1.expect)(responseJson.price).to.equal('1');
                        (0, contracts_test_utils_1.expect)(responseJson.sellAmount).to.equal('100000000000000000');
                        (0, contracts_test_utils_1.expect)(responseJson.sources).to.deep.include.members([{ name: '0x', proportion: '1' }]);
                    }, quoteRequestorHttpClient);
                });
                it('should fail silently when RFQ-T provider gives an error response', async () => {
                    const mock = {
                        ...DEFAULT_RFQT_RESPONSE_DATA,
                        responseData: {},
                        responseCode: 500,
                    };
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    mock.requestParams.txOrigin = constants_2.NULL_ADDRESS;
                    return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([mock], asset_swapper_1.RfqtQuoteEndpoint.Indicative, async () => {
                        const appResponse = await request(app)
                            .get(`${SWAP_PATH}/price?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}`)
                            .set('0x-api-key', 'koolApiKey1')
                            .expect(HttpStatus.BAD_REQUEST)
                            .expect('Content-Type', /json/);
                        const validationErrors = appResponse.body.validationErrors;
                        (0, contracts_test_utils_1.expect)(validationErrors.length).to.eql(1);
                        (0, contracts_test_utils_1.expect)(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                    }, quoteRequestorHttpClient);
                });
            });
        });
        context('without maker allowances set', async () => {
            beforeEach(async () => {
                await zrxToken
                    .approve(contractAddresses.exchangeProxy, new utils_1.BigNumber(0))
                    .sendTransactionAsync({ from: makerAddress });
            });
            it('should not return order if maker allowances are not set', async () => {
                await wethContract
                    .approve(contractAddresses.exchangeProxy, new utils_1.BigNumber(0))
                    .sendTransactionAsync({ from: takerAddress });
                return asset_swapper_1.rfqtMocker.withMockedRfqtQuotes([
                    {
                        ...DEFAULT_RFQT_RESPONSE_DATA,
                        responseData: signedOrder,
                    },
                ], asset_swapper_1.RfqtQuoteEndpoint.Firm, async () => {
                    const appResponse = await request(app)
                        .get(`${SWAP_PATH}/quote?${DEFAULT_QUERY}&sellAmount=${DEFAULT_SELL_AMOUNT.toString()}&takerAddress=${takerAddress}&intentOnFilling=true&skipValidation=true`)
                        .set('0x-api-key', 'koolApiKey1')
                        .expect(HttpStatus.BAD_REQUEST)
                        .expect('Content-Type', /json/);
                    const validationErrors = appResponse.body.validationErrors;
                    (0, contracts_test_utils_1.expect)(validationErrors.length).to.eql(1);
                    (0, contracts_test_utils_1.expect)(validationErrors[0].reason).to.eql('INSUFFICIENT_ASSET_LIQUIDITY');
                }, quoteRequestorHttpClient);
            });
        });
    });
});
//# sourceMappingURL=rfqt_test.js.map