import { constants, expect } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, Web3ProviderEngine } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Server } from 'http';
import * as HttpStatus from 'http-status-codes';
import * as _ from 'lodash';
import 'mocha';

// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../src/app')];

import { AppDependencies, getAppAsync, getDefaultAppDependenciesAsync } from '../src/app';
import * as config from '../src/config';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE, NULL_ADDRESS, ONE_SECOND_MS, SRA_PATH } from '../src/constants';
import { getDBConnectionAsync } from '../src/db_connection';
import { ErrorBody, GeneralErrorCodes, generalErrorCodeToReason, ValidationErrorCodes } from '../src/errors';
import { SignedLimitOrder, SRAOrder } from '../src/types';
import { orderUtils } from '../src/utils/order_utils';

import {
    CHAIN_ID,
    ETHEREUM_RPC_URL,
    getProvider,
    MAX_MINT_AMOUNT,
    WETH_TOKEN_ADDRESS,
    ZRX_TOKEN_ADDRESS,
} from './constants';
import { meshClientMockManager, resetState } from './test_setup';
import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';
import { constructRoute, httpGetAsync, httpPostAsync } from './utils/http_utils';
import { getRandomLimitOrder, MeshTestUtils } from './utils/mesh_test_utils';

const SUITE_NAME = 'Standard Relayer API (SRA) integration tests';

const EMPTY_PAGINATED_RESPONSE = {
    perPage: DEFAULT_PER_PAGE,
    page: DEFAULT_PAGE,
    total: 0,
    records: [],
};

const ONE_THOUSAND_IN_BASE = new BigNumber('1000000000000000000000');

const NOW = Math.floor(Date.now() / ONE_SECOND_MS);
const TOMORROW = new BigNumber(NOW + 24 * 3600); // tslint:disable-line:custom-no-magic-numbers

describe(SUITE_NAME, () => {
    let app: Express.Application;
    let server: Server;
    let dependencies: AppDependencies;
    let makerAddress: string;
    let otherAddress: string;

    let blockchainLifecycle: BlockchainLifecycle;
    let provider: Web3ProviderEngine;

    let meshUtils: MeshTestUtils;

    async function addNewOrderAsync(
        params: Partial<SignedLimitOrder> & { maker: string },
        remainingFillableAmount?: BigNumber,
    ): Promise<SRAOrder> {
        const validationResults = await meshUtils.addPartialOrdersAsync([
            {
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
                expiry: TOMORROW,
                ...params,
            },
        ]);

        expect(validationResults.rejected.length, 'mesh should not reject any orders').to.be.eq(0);

        const order = validationResults.accepted[0].order;
        const apiOrder: SRAOrder = {
            order: _.omit(order, ['fillableTakerAssetAmount', 'hash']) as SignedLimitOrder,
            metaData: {
                orderHash: order.hash,
                remainingFillableTakerAmount: remainingFillableAmount || order.takerAmount,
            },
        };

        return apiOrder;
    }

    let privateKey: string;

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

        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [makerAddress, otherAddress] = accounts;

        const privateKeyBuf = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        privateKey = `0x${privateKeyBuf.toString('hex')}`;
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
        await blockchainLifecycle.startAsync();
        meshUtils = new MeshTestUtils(provider);
        await meshUtils.setupUtilsAsync();
    });

    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('/fee_recipients', () => {
        it('should return the list of fee recipients', async () => {
            const response = await httpGetAsync({ app, route: `${SRA_PATH}/fee_recipients` });

            expect(response.status).to.eq(HttpStatus.OK);
            expect(response.type).to.eq('application/json');
            expect(response.body).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [NULL_ADDRESS],
            });
        });
    });
    describe('GET /orders', () => {
        it('should return empty response when no orders', async () => {
            const response = await httpGetAsync({ app, route: `${SRA_PATH}/orders` });

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);
            expect(response.body).to.deep.eq(EMPTY_PAGINATED_RESPONSE);
        });
        it('should return orders in the local cache', async () => {
            const apiOrder = await addNewOrderAsync({
                maker: makerAddress,
            });
            const response = await httpGetAsync({ app, route: `${SRA_PATH}/orders` });
            apiOrder.metaData.createdAt = response.body.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);
            expect(response.body).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [JSON.parse(JSON.stringify(apiOrder))],
            });

            await (await getDBConnectionAsync()).manager.remove(orderUtils.serializeOrder(apiOrder));
        });
        it('should return orders filtered by query params', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const response = await httpGetAsync({
                app,
                route: `${SRA_PATH}/orders?maker=${apiOrder.order.maker}`,
            });
            apiOrder.metaData.createdAt = response.body.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);
            expect(response.body).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [JSON.parse(JSON.stringify(apiOrder))],
            });

            await (await getDBConnectionAsync()).manager.remove(orderUtils.serializeOrder(apiOrder));
        });
        it('should filter by order parameters AND trader', async () => {
            const matchingOrders = await Promise.all([
                addNewOrderAsync({
                    makerToken: ZRX_TOKEN_ADDRESS,
                    takerToken: WETH_TOKEN_ADDRESS,
                    maker: makerAddress,
                }),
                addNewOrderAsync({
                    makerToken: ZRX_TOKEN_ADDRESS,
                    takerToken: WETH_TOKEN_ADDRESS,
                    taker: makerAddress,
                    maker: otherAddress,
                }),
            ]);

            // Should not match trader
            await addNewOrderAsync({
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
                maker: otherAddress,
            });
            const response = await httpGetAsync({
                app,
                route: `${SRA_PATH}/orders?makerToken=${ZRX_TOKEN_ADDRESS}&trader=${makerAddress}`,
            });
            const sortByHash = (arr: any[]) => _.sortBy(arr, 'metaData.orderHash');
            const { body } = response;
            // Remove createdAt from response for easier comparison
            const cleanRecords = body.records.map((r: any) => _.omit(r, 'metaData.createdAt'));

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);
            expect(body.total).to.eq(2);
            expect(sortByHash(cleanRecords)).to.deep.eq(sortByHash(JSON.parse(JSON.stringify(matchingOrders))));
        });
        it('should return empty response when filtered by query params', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const response = await httpGetAsync({ app, route: `${SRA_PATH}/orders?maker=${NULL_ADDRESS}` });

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);
            expect(response.body).to.deep.eq(EMPTY_PAGINATED_RESPONSE);

            await (await getDBConnectionAsync()).manager.remove(orderUtils.serializeOrder(apiOrder));
        });
        it('should normalize addresses to lowercase', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });

            const makerUpperCase = `0x${apiOrder.order.maker.replace('0x', '').toUpperCase()}`;
            const response = await httpGetAsync({
                app,
                route: `${SRA_PATH}/orders?maker=${makerUpperCase}`,
            });
            apiOrder.metaData.createdAt = response.body.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);
            expect(response.body).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [JSON.parse(JSON.stringify(apiOrder))],
            });

            await (await getDBConnectionAsync()).manager.remove(orderUtils.serializeOrder(apiOrder));
        });
    });
    describe('GET /order', () => {
        it('should return order by order hash', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const response = await httpGetAsync({ app, route: `${SRA_PATH}/order/${apiOrder.metaData.orderHash}` });
            apiOrder.metaData.createdAt = response.body.metaData.createdAt; // createdAt is saved in the SignedOrders table directly

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);
            expect(response.body).to.deep.eq(JSON.parse(JSON.stringify(apiOrder)));

            await (await getDBConnectionAsync()).manager.remove(orderUtils.serializeOrder(apiOrder));
        });
        it('should return 404 if order is not found', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            await (await getDBConnectionAsync()).manager.remove(orderUtils.serializeOrder(apiOrder));
            const response = await httpGetAsync({ app, route: `${SRA_PATH}/order/${apiOrder.metaData.orderHash}` });
            expect(response.status).to.deep.eq(HttpStatus.NOT_FOUND);
        });
    });

    describe('GET /orderbook', () => {
        it('should return orderbook for a given pair', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const response = await httpGetAsync({
                app,
                route: constructRoute({
                    baseRoute: `${SRA_PATH}/orderbook`,
                    queryParams: {
                        baseToken: apiOrder.order.makerToken,
                        quoteToken: apiOrder.order.takerToken,
                    },
                }),
            });
            apiOrder.metaData.createdAt = response.body.asks.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);

            const expectedResponse = {
                bids: EMPTY_PAGINATED_RESPONSE,
                asks: {
                    ...EMPTY_PAGINATED_RESPONSE,
                    total: 1,
                    records: [JSON.parse(JSON.stringify(apiOrder))],
                },
            };
            expect(response.body).to.deep.eq(expectedResponse);
        });
        it('should return empty response if no matching orders', async () => {
            const apiOrder = await addNewOrderAsync({ maker: makerAddress });
            const response = await httpGetAsync({
                app,
                route: constructRoute({
                    baseRoute: `${SRA_PATH}/orderbook`,
                    queryParams: { baseToken: apiOrder.order.makerToken, quoteToken: NULL_ADDRESS },
                }),
            });

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);
            expect(response.body).to.deep.eq({
                bids: EMPTY_PAGINATED_RESPONSE,
                asks: EMPTY_PAGINATED_RESPONSE,
            });
        });
        it('should return validation error if query params are missing', async () => {
            const response = await httpGetAsync({ app, route: `${SRA_PATH}/orderbook?quoteToken=WETH` });
            const validationErrors = {
                code: 100,
                reason: 'Validation Failed',
                validationErrors: [
                    {
                        field: 'instance.quoteToken', // FIXME (xianny): bug in jsonschemas module
                        code: 1001,
                        reason: 'does not match pattern "^0x[0-9a-fA-F]{40}$"',
                    },
                    {
                        field: 'baseToken',
                        code: 1000,
                        reason: 'requires property "baseToken"',
                    },
                ],
            };

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.BAD_REQUEST);
            expect(response.body).to.deep.eq(validationErrors);
        });
    });
    describe('POST /order_config', () => {
        it('should return 200 on success', async () => {
            const order = await meshUtils.getRandomSignedLimitOrderAsync({
                maker: makerAddress,
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
            });
            const expectedResponse = {
                sender: NULL_ADDRESS,
                feeRecipient: NULL_ADDRESS,
                takerTokenFeeAmount: '0',
            };

            const response = await httpPostAsync({
                app,
                route: `${SRA_PATH}/order_config`,
                body: {
                    ...order,
                    expiry: TOMORROW,
                },
            });

            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.OK);
            expect(response.body).to.deep.eq(expectedResponse);
        });
        it('should return informative error when missing fields', async () => {
            const order = await meshUtils.getRandomSignedLimitOrderAsync({
                maker: makerAddress,
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
            });
            const validationError: ErrorBody = {
                code: GeneralErrorCodes.ValidationError,
                reason: generalErrorCodeToReason[GeneralErrorCodes.ValidationError],
                validationErrors: [
                    {
                        field: 'taker',
                        code: ValidationErrorCodes.RequiredField,
                        reason: 'requires property "taker"',
                    },
                    {
                        field: 'expiry',
                        code: ValidationErrorCodes.RequiredField,
                        reason: 'requires property "expiry"',
                    },
                ],
            };
            const response = await httpPostAsync({
                app,
                route: `${SRA_PATH}/order_config`,
                body: {
                    ...order,
                    taker: undefined,
                    expiry: undefined,
                },
            });
            expect(response.type).to.eq(`application/json`);
            expect(response.status).to.eq(HttpStatus.BAD_REQUEST);
            expect(response.body).to.deep.eq(validationError);
        });
    });
    describe('POST /order', () => {
        it('should return HTTP OK on success', async () => {
            const limitOrder = getRandomLimitOrder({
                maker: makerAddress,
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
                makerAmount: MAX_MINT_AMOUNT,
                // tslint:disable:custom-no-magic-numbers
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(3),
                chainId: CHAIN_ID,
                expiry: TOMORROW,
            });

            const signature = limitOrder.getSignatureWithKey(privateKey);

            const orderHash = limitOrder.getHash();

            const order = {
                ...limitOrder,
                signature,
            };

            const response = await httpPostAsync({
                app,
                route: `${SRA_PATH}/order`,
                body: {
                    ...order,
                },
            });
            expect(response.status).to.eq(HttpStatus.OK);
            const meshOrders = await meshUtils.getOrdersAsync();
            expect(meshOrders.ordersInfos.find(info => info.hash === orderHash)).to.not.be.undefined();
        });
        it('should skip mesh validation when ?skipValidation=true', async () => {
            const limitOrder = getRandomLimitOrder({
                maker: makerAddress,
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
                makerAmount: MAX_MINT_AMOUNT,
                // tslint:disable:custom-no-magic-numbers
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(3),
                chainId: CHAIN_ID,
                expiry: TOMORROW,
            });

            const signature = limitOrder.getSignatureWithKey(privateKey);
            const order = {
                ...limitOrder,
                signature,
            };

            meshClientMockManager.mock('addOrdersV4Async').callsFake(orders => {
                return { rejected: orders, accepted: [] };
            });
            const response = await httpPostAsync({
                app,
                route: `${SRA_PATH}/order?skipValidation=true`,
                body: {
                    ...order,
                },
            });
            // Hack: reset mocked method
            meshClientMockManager
                .mock('addOrdersV4Async')
                .callsFake(
                    meshClientMockManager
                        .getMockInstance()
                        .addOrdersV4Async.bind(meshClientMockManager.getMockInstance()),
                );
            expect(response.status).to.eq(HttpStatus.OK);
        });
        it('should not skip mesh validation normally', async () => {
            const limitOrder = getRandomLimitOrder({
                maker: makerAddress,
                makerToken: ZRX_TOKEN_ADDRESS,
                takerToken: WETH_TOKEN_ADDRESS,
                makerAmount: MAX_MINT_AMOUNT,
                // tslint:disable:custom-no-magic-numbers
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(3),
                chainId: CHAIN_ID,
                expiry: TOMORROW,
            });

            const signature = limitOrder.getSignatureWithKey(privateKey);
            const order = {
                ...limitOrder,
                signature,
            };

            meshClientMockManager.mock('addOrdersV4Async').callsFake(orders => {
                return { rejected: orders, accepted: [] };
            });
            const response = await httpPostAsync({
                app,
                route: `${SRA_PATH}/order`,
                body: {
                    ...order,
                },
            });
            // Hack: reset mocked method
            meshClientMockManager
                .mock('addOrdersV4Async')
                .callsFake(
                    meshClientMockManager
                        .getMockInstance()
                        .addOrdersV4Async.bind(meshClientMockManager.getMockInstance()),
                );
            expect(response.status).to.eq(HttpStatus.BAD_REQUEST);
        });
    });
});
// tslint:disable:max-file-line-count
