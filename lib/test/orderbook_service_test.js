"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const dev_utils_1 = require("@0x/dev-utils");
const utils_1 = require("@0x/utils");
const Mocha = require("mocha");
// Helps with printing test case results
const { color, symbols } = Mocha.reporters.Base;
const constants_1 = require("../src/constants");
const db_connection_1 = require("../src/db_connection");
const entities_1 = require("../src/entities");
const orderbook_service_1 = require("../src/services/orderbook_service");
const types_1 = require("../src/types");
const order_utils_1 = require("../src/utils/order_utils");
const constants_2 = require("./constants");
const deployment_1 = require("./utils/deployment");
const mock_order_watcher_1 = require("./utils/mock_order_watcher");
const orders_1 = require("./utils/orders");
const SUITE_NAME = 'OrderbookService';
const EMPTY_PAGINATED_RESPONSE = {
    perPage: constants_1.DEFAULT_PER_PAGE,
    page: constants_1.DEFAULT_PAGE,
    total: 0,
    records: [],
};
const TOMORROW = new utils_1.BigNumber(Date.now() + 24 * 3600);
async function saveSignedOrdersAsync(connection, orders) {
    await connection.getRepository(entities_1.OrderWatcherSignedOrderEntity).save(orders.map(order_utils_1.orderUtils.serializeOrder));
}
async function savePersistentOrdersAsync(connection, orders) {
    await connection.getRepository(entities_1.PersistentSignedOrderV4Entity).save(orders.map(order_utils_1.orderUtils.serializePersistentOrder));
}
async function deleteSignedOrdersAsync(connection, orderHashes) {
    try {
        await connection.manager.delete(entities_1.OrderWatcherSignedOrderEntity, orderHashes);
    }
    catch (e) {
        return;
    }
}
async function deletePersistentOrdersAsync(connection, orderHashes) {
    try {
        await connection.manager.delete(entities_1.PersistentSignedOrderV4Entity, orderHashes);
    }
    catch (e) {
        return;
    }
}
async function newSRAOrderAsync(privateKey, params, metadata) {
    const limitOrder = (0, orders_1.getRandomLimitOrder)({
        expiry: TOMORROW,
        chainId: constants_2.CHAIN_ID,
        ...params,
    });
    const apiOrder = {
        order: {
            ...limitOrder,
            signature: limitOrder.getSignatureWithKey(privateKey),
        },
        metaData: {
            orderHash: limitOrder.getHash(),
            remainingFillableTakerAmount: limitOrder.takerAmount,
            state: undefined,
            ...metadata,
        },
    };
    return apiOrder;
}
describe(SUITE_NAME, () => {
    let makerAddress;
    let blockchainLifecycle;
    let provider;
    let orderBookService;
    let privateKey;
    let connection;
    before(async () => {
        await (0, deployment_1.setupDependenciesAsync)(SUITE_NAME);
        connection = await (0, db_connection_1.getDBConnectionOrThrow)();
        await connection.runMigrations();
        orderBookService = new orderbook_service_1.OrderBookService(connection, new mock_order_watcher_1.MockOrderWatcher(connection));
        provider = (0, constants_2.getProvider)();
        const web3Wrapper = new dev_utils_1.Web3Wrapper(provider);
        blockchainLifecycle = new dev_utils_1.BlockchainLifecycle(web3Wrapper);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [makerAddress] = accounts;
        const privateKeyBuf = contracts_test_utils_1.constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        privateKey = `0x${privateKeyBuf.toString('hex')}`;
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await (0, deployment_1.teardownDependenciesAsync)(SUITE_NAME);
    });
    describe('getOrdersAsync', () => {
        it.skip(`ran getOrdersAsync test cases`, async () => {
            /** Define All Test Cases Here */
            const testCases = await Promise.all([
                [[], [], {}, [], `should return empty response when no orders`],
                await (async () => {
                    const description = `should return orders in the cache when no filters`;
                    const apiOrder = await newSRAOrderAsync(privateKey, {});
                    const expected = {
                        records: [apiOrder],
                    };
                    return [[apiOrder], [], expected, [], description];
                })(),
                await (async () => {
                    const description = `should de-duplicate signed orders and persistent orders`;
                    const apiOrder = await newSRAOrderAsync(privateKey, {});
                    const expected = {
                        records: [apiOrder],
                    };
                    return [[apiOrder], [apiOrder], expected, [], description];
                })(),
                await (async () => {
                    const description = `should return persistent orders that are NOT in the signed orders cache`;
                    const apiOrder = await newSRAOrderAsync(privateKey, {}, { state: types_1.OrderEventEndState.Cancelled });
                    const expected = {
                        records: [apiOrder],
                    };
                    const params = [
                        constants_1.DEFAULT_PAGE,
                        constants_1.DEFAULT_PER_PAGE,
                        { maker: apiOrder.order.maker },
                        { isUnfillable: true },
                    ];
                    return [[], [apiOrder], expected, params, description];
                })(),
            ]);
            /** End Test Cases */
            // Generic test runner
            function runTestCaseForGetOrdersFilters(orders, persistentOrders, expectedResponse, description) {
                const indent = '     ';
                return async (args) => {
                    try {
                        // setup
                        await Promise.all([
                            saveSignedOrdersAsync(connection, orders),
                            savePersistentOrdersAsync(connection, persistentOrders),
                        ]);
                        const results = await orderBookService.getOrdersAsync(...args);
                        // clean non-deterministic field
                        expectedResponse.records.forEach((o, i) => {
                            o.metaData.createdAt = results.records[i].metaData.createdAt;
                        });
                        // assertion
                        (0, contracts_test_utils_1.expect)(expectedResponse).deep.equal(results);
                        // cleanup
                        const deletePromise = async (_orders, isPersistent) => {
                            const deleteFn = isPersistent ? deletePersistentOrdersAsync : deleteSignedOrdersAsync;
                            return _orders.length > 0
                                ? deleteFn(connection, _orders.map((o) => o.metaData.orderHash))
                                : Promise.resolve();
                        };
                        await Promise.all([deletePromise(orders, false), deletePromise(persistentOrders, true)]);
                        // If anything went wrong, the test failed
                    }
                    catch (e) {
                        console.log(indent, color('bright fail', `${symbols.err}`), color('fail', description));
                        throw e;
                    }
                    // Otherwise, succeeded
                    console.log(indent, color('checkmark', `${symbols.ok}`), color('pass', description));
                };
            }
            // Run the tests synchronously; fill in default values
            for (const [i, _test] of testCases.entries()) {
                const test = fillInDefaultTestCaseValues(_test, i);
                await runTestCaseForGetOrdersFilters(test[0], test[1], test[2], test[4])(test[3]);
            }
            function fillInDefaultTestCaseValues(test, i) {
                // expected orderbook response
                test[2] = { ...EMPTY_PAGINATED_RESPONSE, ...test[2] };
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
                test[2] = { ...test[2], total: test[2].records.length };
                // test description
                test[4] = test[4] || `Test Case #${i}`;
                // params for getOrdersAsync
                test[3][0] = test[3][0] || constants_1.DEFAULT_PAGE;
                test[3][1] = test[3][1] || constants_1.DEFAULT_PER_PAGE;
                test[3][2] = test[3][2] || {};
                test[3][3] = test[3][3] || {};
                return test;
            }
        });
    });
    describe('addOrdersAsync, addPersistentOrdersAsync', () => {
        before(async () => {
            // await connection.runMigrations();
        });
        beforeEach(async () => {
            await blockchainLifecycle.startAsync();
        });
        afterEach(async () => {
            await blockchainLifecycle.revertAsync();
        });
        it('should post orders to order watcher', async () => {
            const apiOrder = await newSRAOrderAsync(privateKey, {});
            await orderBookService.addOrdersAsync([apiOrder.order]);
            // should not save to persistent orders table
            const result = await connection.manager.find(entities_1.PersistentSignedOrderV4Entity, {
                hash: apiOrder.metaData.orderHash,
            });
            (0, contracts_test_utils_1.expect)(result).to.deep.equal([]);
            await deleteSignedOrdersAsync(connection, [apiOrder.metaData.orderHash]);
        });
        it('should find persistent orders after posting them', async () => {
            const apiOrder = await newSRAOrderAsync(privateKey, {});
            await orderBookService.addPersistentOrdersAsync([apiOrder.order]);
            const result = await connection.manager.find(entities_1.PersistentSignedOrderV4Entity, {
                hash: apiOrder.metaData.orderHash,
            });
            const expected = order_utils_1.orderUtils.serializePersistentOrder(apiOrder);
            expected.createdAt = result[0].createdAt; // createdAt is saved in the PersistentOrders table directly
            (0, contracts_test_utils_1.expect)(result).to.deep.equal([expected]);
            await deletePersistentOrdersAsync(connection, [apiOrder.metaData.orderHash]);
        });
    });
});
//# sourceMappingURL=orderbook_service_test.js.map