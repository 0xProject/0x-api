import { constants, expect } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, Web3ProviderEngine } from '@0x/dev-utils';
import { OrderEventEndState } from '@0x/mesh-graphql-client';
import { LimitOrderFields } from '@0x/protocol-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import 'mocha';

import * as config from '../src/config';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '../src/constants';
import { getDBConnectionAsync } from '../src/db_connection';
import { SignedOrderEntity } from '../src/entities';
import { PersistentSignedOrderEntity } from '../src/entities/PersistentSignedOrderEntity';
import { OrderBookService } from '../src/services/orderbook_service';
import { APIOrderWithMetaData } from '../src/types';
import { MeshClient } from '../src/utils/mesh_client';
import { orderUtils } from '../src/utils/order_utils';

import { getProvider } from './constants';
import { resetState } from './test_setup';
import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';
import { getRandomLimitOrder, MeshTestUtils } from './utils/mesh_test_utils';

const SUITE_NAME = 'OrderbookService';

const EMPTY_PAGINATED_RESPONSE = {
    perPage: DEFAULT_PER_PAGE,
    page: DEFAULT_PAGE,
    total: 0,
    records: [],
};

const TOMORROW = new BigNumber(Date.now() + 24 * 3600); // tslint:disable-line:custom-no-magic-numbers

async function saveSignedOrderAsync(apiOrder: APIOrderWithMetaData): Promise<void> {
    await (await getDBConnectionAsync()).manager.save(orderUtils.serializeOrder(apiOrder));
}

async function savePersistentOrderAsync(apiOrder: APIOrderWithMetaData): Promise<void> {
    await (await getDBConnectionAsync()).manager.save(orderUtils.serializePersistentOrder(apiOrder));
}

async function deleteSignedOrderAsync(orderHash: string): Promise<void> {
    await (await getDBConnectionAsync()).manager.delete(SignedOrderEntity, orderHash);
}

async function deletePersistentOrderAsync(orderHash: string): Promise<void> {
    await (await getDBConnectionAsync()).manager.delete(PersistentSignedOrderEntity, orderHash);
}

async function newAPIOrderAsync(
    privateKey: Buffer,
    params: Partial<LimitOrderFields>,
    remainingFillableAssetAmount?: BigNumber,
): Promise<APIOrderWithMetaData> {
    const limitOrder = getRandomLimitOrder({
        expiry: TOMORROW,
        ...params,
    });

    const signature = limitOrder.getSignatureWithKey(privateKey.toString('utf-8'));

    const apiOrder: APIOrderWithMetaData = {
        order: {
            ...limitOrder,
            signature,
        },
        metaData: {
            orderHash: limitOrder.getHash(),
            remainingFillableTakerAssetAmount: remainingFillableAssetAmount || limitOrder.takerAmount,
        },
    };
    return apiOrder;
}

describe.skip(SUITE_NAME, () => {
    let makerAddress: string;

    let blockchainLifecycle: BlockchainLifecycle;
    let provider: Web3ProviderEngine;

    let meshClient: MeshClient;
    let orderBookService: OrderBookService;
    let privateKey: Buffer;

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        meshClient = new MeshClient(config.MESH_WEBSOCKET_URI, config.MESH_HTTP_URI);
        orderBookService = new OrderBookService(await getDBConnectionAsync(), meshClient);
        provider = getProvider();
        const web3Wrapper = new Web3Wrapper(provider);
        blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [makerAddress] = accounts;

        privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await resetState();
        await teardownDependenciesAsync(SUITE_NAME);
    });

    describe('getOrdersAsync', () => {
        it('should return empty response when no orders', async () => {
            const response = await orderBookService.getOrdersAsync(DEFAULT_PAGE, DEFAULT_PER_PAGE, {});
            expect(response).to.deep.equal(EMPTY_PAGINATED_RESPONSE);
        });
        it('should return orders in the SignedOrders cache', async () => {
            const apiOrder = await newAPIOrderAsync(privateKey, {});
            await saveSignedOrderAsync(apiOrder);

            const response = await orderBookService.getOrdersAsync(DEFAULT_PAGE, DEFAULT_PER_PAGE, {});
            apiOrder.metaData.state = undefined; // state is not saved in SignedOrders table
            apiOrder.metaData.createdAt = response.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly
            expect(response).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [apiOrder],
            });
            await deleteSignedOrderAsync(apiOrder.metaData.orderHash);
        });
        it('should de-duplicate orders present in both the SignedOrders and PersistentOrders cache', async () => {
            const apiOrder = await newAPIOrderAsync(privateKey, {});
            await saveSignedOrderAsync(apiOrder);
            await savePersistentOrderAsync(apiOrder);
            const response = await orderBookService.getOrdersAsync(DEFAULT_PAGE, DEFAULT_PER_PAGE, {});
            apiOrder.metaData.state = undefined; // state is not saved in SignedOrders table
            apiOrder.metaData.createdAt = response.records[0].metaData.createdAt; // createdAt is saved in the SignedOrders table directly
            expect(response).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [apiOrder],
            });
            await deleteSignedOrderAsync(apiOrder.metaData.orderHash);
            await deletePersistentOrderAsync(apiOrder.metaData.orderHash);
        });
        it('should return persistent orders not in the SignedOrders cache', async () => {
            const apiOrder = await newAPIOrderAsync(privateKey, {});
            apiOrder.metaData.state = OrderEventEndState.Cancelled; // only unfillable orders are removed from SignedOrders but remain in PersistentOrders
            await savePersistentOrderAsync(apiOrder);
            const response = await orderBookService.getOrdersAsync(DEFAULT_PAGE, DEFAULT_PER_PAGE, {
                isUnfillable: true,
                maker: apiOrder.order.maker,
            });
            apiOrder.metaData.createdAt = response.records[0].metaData.createdAt; // createdAt is saved in the PersistentOrders table directly
            expect(response).to.deep.eq({
                ...EMPTY_PAGINATED_RESPONSE,
                total: 1,
                records: [apiOrder],
            });
            await deletePersistentOrderAsync(apiOrder.metaData.orderHash);
        });
    });
    describe('addOrdersAsync, addPersistentOrdersAsync', () => {
        let meshUtils: MeshTestUtils;
        before(async () => {
            await resetState();
            meshUtils = new MeshTestUtils(provider);
            await meshUtils.setupUtilsAsync();
        });
        beforeEach(async () => {
            await blockchainLifecycle.startAsync();
        });
        afterEach(async () => {
            await blockchainLifecycle.revertAsync();
        });
        it('should post orders to Mesh', async () => {
            const apiOrder = await newAPIOrderAsync(privateKey, {});
            await orderBookService.addOrdersAsync([apiOrder.order], false);

            const meshOrders = await meshUtils.getOrdersAsync();
            expect(meshOrders.ordersInfos.find(i => i.hash === apiOrder.metaData.orderHash)).to.not.be.undefined();

            // should not save to persistent orders table
            const result = await (await getDBConnectionAsync()).manager.find(PersistentSignedOrderEntity, {
                hash: apiOrder.metaData.orderHash,
            });
            expect(result).to.deep.equal([]);
        });
        it('should post persistent orders', async () => {
            const apiOrder = await newAPIOrderAsync(privateKey, {});
            await orderBookService.addPersistentOrdersAsync([apiOrder.order], false);

            const meshOrders = await meshUtils.getOrdersAsync();
            expect(meshOrders.ordersInfos.find(i => i.hash === apiOrder.metaData.orderHash)).to.not.be.undefined();

            const result = await (await getDBConnectionAsync()).manager.find(PersistentSignedOrderEntity, {
                hash: apiOrder.metaData.orderHash,
            });
            const expected = orderUtils.serializePersistentOrder(apiOrder);
            expected.createdAt = result[0].createdAt; // createdAt is saved in the PersistentOrders table directly
            expect(result).to.deep.equal([expected]);
            await deletePersistentOrderAsync(apiOrder.metaData.orderHash);
        });
    });
});
