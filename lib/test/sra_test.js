"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_utils_1 = require("@0x/api-utils");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const dev_utils_1 = require("@0x/dev-utils");
const utils_1 = require("@0x/utils");
const axios_1 = require("axios");
const axios_mock_adapter_1 = require("axios-mock-adapter");
const HttpStatus = require("http-status-codes");
const _ = require("lodash");
require("mocha");
const app_1 = require("../src/app");
const utils_2 = require("../src/runners/utils");
const asset_swapper_1 = require("../src/asset-swapper");
const config = require("../src/config");
const constants_1 = require("../src/constants");
const entities_1 = require("../src/entities");
const order_utils_1 = require("../src/utils/order_utils");
const constants_2 = require("./constants");
const deployment_1 = require("./utils/deployment");
const http_utils_1 = require("./utils/http_utils");
const orders_1 = require("./utils/orders");
// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../src/app')];
delete require.cache[require.resolve('../src/runners/utils')];
const SUITE_NAME = 'Standard Relayer API (SRA) integration tests';
const EMPTY_PAGINATED_RESPONSE = {
    perPage: constants_1.DEFAULT_PER_PAGE,
    page: constants_1.DEFAULT_PAGE,
    total: 0,
    records: [],
};
const ONE_THOUSAND_IN_BASE = new utils_1.BigNumber('1000000000000000000000');
const NOW = Math.floor(Date.now() / constants_1.ONE_SECOND_MS);
const TOMORROW = new utils_1.BigNumber(NOW + 24 * 3600);
describe(SUITE_NAME, () => {
    let app;
    let server;
    let dependencies;
    let makerAddress;
    let otherAddress;
    let blockchainLifecycle;
    let provider;
    async function addNewOrderAsync(params, remainingFillableAmount) {
        var _a;
        const limitOrder = await (0, orders_1.getRandomSignedLimitOrderAsync)(provider, params);
        const apiOrder = {
            order: limitOrder,
            metaData: {
                orderHash: new asset_swapper_1.LimitOrder(limitOrder).getHash(),
                remainingFillableTakerAmount: remainingFillableAmount || limitOrder.takerAmount,
            },
        };
        const orderEntity = order_utils_1.orderUtils.serializeOrder(apiOrder);
        await ((_a = dependencies.connection) === null || _a === void 0 ? void 0 : _a.getRepository(entities_1.OrderWatcherSignedOrderEntity).save(orderEntity));
        return apiOrder;
    }
    before(async () => {
        await (0, deployment_1.setupDependenciesAsync)(SUITE_NAME);
        provider = (0, constants_2.getProvider)();
        // start the 0x-api app
        dependencies = await (0, utils_2.getDefaultAppDependenciesAsync)(provider, {
            ...config.defaultHttpServiceConfig,
            ethereumRpcUrl: constants_2.ETHEREUM_RPC_URL,
        });
        ({ app, server } = await (0, app_1.getAppAsync)({ ...dependencies }, { ...config.defaultHttpServiceConfig, ethereumRpcUrl: constants_2.ETHEREUM_RPC_URL }));
        const web3Wrapper = new dev_utils_1.Web3Wrapper(provider);
        blockchainLifecycle = new dev_utils_1.BlockchainLifecycle(web3Wrapper);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [makerAddress, otherAddress] = accounts;
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
    beforeEach(async () => {
        var _a;
        await ((_a = dependencies.connection) === null || _a === void 0 ? void 0 : _a.runMigrations());
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        var _a;
        await blockchainLifecycle.revertAsync();
        await ((_a = dependencies.connection) === null || _a === void 0 ? void 0 : _a.createQueryBuilder().delete().from(entities_1.OrderWatcherSignedOrderEntity).where('true').execute());
    });
    describe('/fee_recipients', () => {
        it('should return the list of fee recipients', async () => {
            const response = await (0, http_utils_1.httpGetAsync)({ app, route: `${constants_1.SRA_PATH}/fee_recipients` });
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(response.type).to.eq('application/json');
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [constants_1.NULL_ADDRESS],
            });
        });
    });
    describe('GET /orders', () => {
        it('should return empty response when no orders', async () => {
            const response = await (0, http_utils_1.httpGetAsync)({ app, route: `${constants_1.SRA_PATH}/orders` });
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq(EMPTY_PAGINATED_RESPONSE);
        });
        it('should return orders in the local cache', async () => {
            const apiOrder = await addNewOrderAsync({
                maker: makerAddress,
            });
            const response = await (0, http_utils_1.httpGetAsync)({ app, route: `${constants_1.SRA_PATH}/orders` });
            apiOrder.metaData.createdAt = response.body.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [JSON.parse(JSON.stringify(apiOrder))],
            });
        });
        it('should return orders filtered by query params', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const response = await (0, http_utils_1.httpGetAsync)({
                app,
                route: `${constants_1.SRA_PATH}/orders?maker=${apiOrder.order.maker}`,
            });
            apiOrder.metaData.createdAt = response.body.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [JSON.parse(JSON.stringify(apiOrder))],
            });
        });
        it('should filter by order parameters AND trader', async () => {
            const matchingOrders = await Promise.all([
                addNewOrderAsync({
                    makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                    takerToken: constants_2.WETH_TOKEN_ADDRESS,
                    maker: makerAddress,
                }),
                addNewOrderAsync({
                    makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                    takerToken: constants_2.WETH_TOKEN_ADDRESS,
                    taker: makerAddress,
                    maker: otherAddress,
                }),
            ]);
            // Add anotther order that should not appear in the response.
            await addNewOrderAsync({
                makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                takerToken: constants_2.WETH_TOKEN_ADDRESS,
                maker: otherAddress,
            });
            const response = await (0, http_utils_1.httpGetAsync)({
                app,
                route: `${constants_1.SRA_PATH}/orders?makerToken=${constants_2.ZRX_TOKEN_ADDRESS}&trader=${makerAddress}`,
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
            const sortByHash = (arr) => _.sortBy(arr, 'metaData.orderHash');
            const { body } = response;
            // Remove createdAt from response for easier comparison
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
            const cleanRecords = body.records.map((r) => _.omit(r, 'metaData.createdAt'));
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(body.total).to.eq(2);
            (0, contracts_test_utils_1.expect)(sortByHash(cleanRecords)).to.deep.eq(sortByHash(JSON.parse(JSON.stringify(matchingOrders))));
        });
        it('should return empty response when filtered by query params', async () => {
            await addNewOrderAsync({ maker: makerAddress });
            const response = await (0, http_utils_1.httpGetAsync)({ app, route: `${constants_1.SRA_PATH}/orders?maker=${constants_1.NULL_ADDRESS}` });
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq(EMPTY_PAGINATED_RESPONSE);
        });
        it('should normalize addresses to lowercase', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const makerUpperCase = `0x${apiOrder.order.maker.replace('0x', '').toUpperCase()}`;
            const response = await (0, http_utils_1.httpGetAsync)({
                app,
                route: `${constants_1.SRA_PATH}/orders?maker=${makerUpperCase}`,
            });
            apiOrder.metaData.createdAt = response.body.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [JSON.parse(JSON.stringify(apiOrder))],
            });
        });
    });
    describe('GET /order', () => {
        it('should return order by order hash', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const response = await (0, http_utils_1.httpGetAsync)({ app, route: `${constants_1.SRA_PATH}/order/${apiOrder.metaData.orderHash}` });
            apiOrder.metaData.createdAt = response.body.metaData.createdAt; // createdAt is saved in the SignedOrders table directly
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq(JSON.parse(JSON.stringify(apiOrder)));
        });
        it('should return 404 if order is not found', async () => {
            var _a;
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            await ((_a = dependencies.connection) === null || _a === void 0 ? void 0 : _a.manager.delete(entities_1.OrderWatcherSignedOrderEntity, apiOrder.metaData.orderHash));
            const response = await (0, http_utils_1.httpGetAsync)({ app, route: `${constants_1.SRA_PATH}/order/${apiOrder.metaData.orderHash}` });
            (0, contracts_test_utils_1.expect)(response.status).to.deep.eq(HttpStatus.NOT_FOUND);
        });
    });
    describe('GET /orderbook', () => {
        it('should return orderbook for a given pair', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const response = await (0, http_utils_1.httpGetAsync)({
                app,
                route: (0, http_utils_1.constructRoute)({
                    baseRoute: `${constants_1.SRA_PATH}/orderbook`,
                    queryParams: {
                        baseToken: apiOrder.order.makerToken,
                        quoteToken: apiOrder.order.takerToken,
                    },
                }),
            });
            apiOrder.metaData.createdAt = response.body.asks.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            const expectedResponse = {
                bids: EMPTY_PAGINATED_RESPONSE,
                asks: {
                    ...EMPTY_PAGINATED_RESPONSE,
                    total: 1,
                    records: [JSON.parse(JSON.stringify(apiOrder))],
                },
            };
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq(expectedResponse);
        });
        it('should return empty response if no matching orders', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const response = await (0, http_utils_1.httpGetAsync)({
                app,
                route: (0, http_utils_1.constructRoute)({
                    baseRoute: `${constants_1.SRA_PATH}/orderbook`,
                    queryParams: { baseToken: apiOrder.order.makerToken, quoteToken: constants_1.NULL_ADDRESS },
                }),
            });
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq({
                bids: EMPTY_PAGINATED_RESPONSE,
                asks: EMPTY_PAGINATED_RESPONSE,
            });
        });
        it('should return validation error if query params are missing', async () => {
            const response = await (0, http_utils_1.httpGetAsync)({ app, route: `${constants_1.SRA_PATH}/orderbook?quoteToken=WETH` });
            const validationErrors = {
                code: 100,
                reason: 'Validation Failed',
                validationErrors: [
                    {
                        code: 1000,
                        field: 'baseToken',
                        reason: "should have required property 'baseToken'",
                    },
                    {
                        code: 1001,
                        field: 'quoteToken',
                        reason: 'should match pattern "^0x[0-9a-fA-F]{40}$"',
                    },
                ],
            };
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.BAD_REQUEST);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq(validationErrors);
        });
    });
    describe('POST /order_config', () => {
        it('should return 200 on success', async () => {
            const order = await (0, orders_1.getRandomSignedLimitOrderAsync)(provider, {
                maker: makerAddress,
                makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                takerToken: constants_2.WETH_TOKEN_ADDRESS,
            });
            const expectedResponse = {
                sender: constants_1.NULL_ADDRESS,
                feeRecipient: constants_1.NULL_ADDRESS,
                takerTokenFeeAmount: '0',
            };
            const response = await (0, http_utils_1.httpPostAsync)({
                app,
                route: `${constants_1.SRA_PATH}/order_config`,
                body: {
                    ...order,
                    expiry: TOMORROW,
                },
            });
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq(expectedResponse);
        });
        it('should return informative error when missing fields', async () => {
            const order = await (0, orders_1.getRandomSignedLimitOrderAsync)(provider, {
                maker: makerAddress,
                makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                takerToken: constants_2.WETH_TOKEN_ADDRESS,
            });
            const validationError = {
                code: api_utils_1.GeneralErrorCodes.ValidationError,
                reason: api_utils_1.generalErrorCodeToReason[api_utils_1.GeneralErrorCodes.ValidationError],
                validationErrors: [
                    {
                        field: 'taker',
                        code: api_utils_1.ValidationErrorCodes.RequiredField,
                        reason: "should have required property 'taker'",
                    },
                    {
                        field: 'expiry',
                        code: api_utils_1.ValidationErrorCodes.RequiredField,
                        reason: "should have required property 'expiry'",
                    },
                ],
            };
            const response = await (0, http_utils_1.httpPostAsync)({
                app,
                route: `${constants_1.SRA_PATH}/order_config`,
                body: {
                    ...order,
                    taker: undefined,
                    expiry: undefined,
                },
            });
            (0, contracts_test_utils_1.expect)(response.type).to.eq(`application/json`);
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.BAD_REQUEST);
            (0, contracts_test_utils_1.expect)(response.body).to.deep.eq(validationError);
        });
    });
    describe('POST /orders', () => {
        it('should return HTTP OK on success', async () => {
            const mockAxios = new axios_mock_adapter_1.default(axios_1.default);
            mockAxios.onPost(`${config.ORDER_WATCHER_URL}/orders`).reply(HttpStatus.OK);
            const order = await (0, orders_1.getRandomSignedLimitOrderAsync)(provider, {
                maker: makerAddress,
                makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                takerToken: constants_2.WETH_TOKEN_ADDRESS,
                makerAmount: constants_2.MAX_MINT_AMOUNT,
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(3),
                chainId: constants_2.CHAIN_ID,
                expiry: TOMORROW,
            });
            const response = await (0, http_utils_1.httpPostAsync)({
                app,
                route: `${constants_1.SRA_PATH}/order`,
                body: {
                    ...order,
                },
            });
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
        });
        it('should respond before order watcher confirmation when ?skipConfirmation=true', async () => {
            const mockAxios = new axios_mock_adapter_1.default(axios_1.default);
            mockAxios.onPost(`${config.ORDER_WATCHER_URL}/orders`).reply(HttpStatus.BAD_REQUEST);
            const order = await (0, orders_1.getRandomSignedLimitOrderAsync)(provider, {
                maker: makerAddress,
                makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                takerToken: constants_2.WETH_TOKEN_ADDRESS,
                makerAmount: constants_2.MAX_MINT_AMOUNT,
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(3),
                chainId: constants_2.CHAIN_ID,
                expiry: TOMORROW,
            });
            const response = await (0, http_utils_1.httpPostAsync)({
                app,
                route: `${constants_1.SRA_PATH}/order?skipConfirmation=true`,
                body: {
                    ...order,
                },
            });
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.OK);
        });
        it('should not skip confirmation normally', async () => {
            const mockAxios = new axios_mock_adapter_1.default(axios_1.default);
            mockAxios.onPost().reply(HttpStatus.BAD_REQUEST);
            const order = await (0, orders_1.getRandomSignedLimitOrderAsync)(provider, {
                maker: makerAddress,
                makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                takerToken: constants_2.WETH_TOKEN_ADDRESS,
                makerAmount: constants_2.MAX_MINT_AMOUNT,
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(3),
                chainId: constants_2.CHAIN_ID,
                expiry: TOMORROW,
            });
            const response = await (0, http_utils_1.httpPostAsync)({
                app,
                route: `${constants_1.SRA_PATH}/order`,
                body: {
                    ...order,
                },
            });
            (0, contracts_test_utils_1.expect)(response.status).to.eq(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
});
//# sourceMappingURL=sra_test.js.map