// tslint:disable:custom-no-magic-numbers
// tslint:disable:no-console
// tslint:disable:max-classes-per-file
import { OrderEvent, OrderEventEndState, OrderWithMetadataV4, Stats } from '@0x/mesh-graphql-client';
import { LimitOrder } from '@0x/protocol-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import { ImportMock, MockManager } from 'ts-mock-imports';
import * as Observable from 'zen-observable';

import { SignedLimitOrder } from '../../src/types';
import * as MeshClientModule from '../../src/utils/mesh_client';

import { getTestDBConnectionAsync } from './db_connection';

interface MeshHandlers {
    getStatsAsync?: () => any;
    getOrdersAsync?: () => any;
    addOrdersV4Async?: () => any;
    onOrderEvents?: () => any;
}
export class MeshClientMock {
    public mockManager?: MockManager<MeshClientModule.MeshClient>;
    public mockMeshClient: MockClient;

    constructor() {
        this.mockMeshClient = new MockClient();
    }

    public setupMock(handlers: MeshHandlers = {}): void {
        const mockManager = ImportMock.mockClass(MeshClientModule, 'MeshClient');
        mockManager
            .mock('getStatsAsync')
            .callsFake(handlers.getStatsAsync || this.mockMeshClient.getStatsAsync.bind(this.mockMeshClient));
        mockManager
            .mock('getOrdersV4Async')
            .callsFake(handlers.getOrdersAsync || this.mockMeshClient.getOrdersAsync.bind(this.mockMeshClient));
        mockManager
            .mock('addOrdersV4Async')
            .callsFake(handlers.addOrdersV4Async || this.mockMeshClient.addOrdersV4Async.bind(this.mockMeshClient));
        mockManager
            .mock('onOrderEvents')
            .callsFake(handlers.onOrderEvents || this.mockMeshClient.onOrderEvents.bind(this.mockMeshClient));
        this.mockManager = mockManager;
    }

    public resetHandlers(handlers: MeshHandlers = {}): void {
        this.teardownMock();
        this.setupMock(handlers);
    }

    public async resetStateAsync(): Promise<void> {
        this.mockMeshClient._resetClient();
        await getTestDBConnectionAsync();
    }

    public teardownMock(): void {
        this.mockManager?.restore();
    }
}

export interface AddOrdersOpts {
    keepCancelled?: boolean;
    keepExpired?: boolean;
    keepFullyFilled?: boolean;
    keepUnfunded?: boolean;
}

const toOrderWithMetadata = (order: SignedLimitOrder): OrderWithMetadataV4 => {
    const limitOrder = new LimitOrder(order);
    return {
        ...order,
        fillableTakerAssetAmount: new BigNumber(order.takerAmount),
        hash: limitOrder.getHash(),
    };
};

export class MockClient {
    private _orders: OrderWithMetadataV4[] = [];

    private readonly _ordersObservable: Observable<OrderEvent[]> = new Observable<OrderEvent[]>(observer => {
        this._nextOrderEventsCB = observer.next.bind(observer);
    });

    // NOTE: Mock only method
    public _resetClient(): void {
        this._orders = [];
    }
    // NOTE: Mock only method
    public _getOrderState(): OrderWithMetadataV4[] {
        return this._orders;
    }

    // tslint:disable:prefer-function-over-method
    public async getStatsAsync(): Promise<Stats> {
        return {
            version: '1',
            pubSubTopic: '1',
            rendezvous: '1',
            secondaryRendezvous: ['1'],
            peerID: '1234',
            ethereumChainID: 1337,
            latestBlock: {
                number: new BigNumber('12345'),
                hash: '0x10b7b17523a7441daaa0ca801fc51f6e8c1da169eb163017022e9c831b5d0b1a',
            },
            numPeers: 123,
            numOrders: 12356,
            numOrdersV4: 23456,
            numOrdersIncludingRemoved: 1234567,
            numOrdersIncludingRemovedV4: 34567,
            numPinnedOrders: 123,
            numPinnedOrdersV4: 234,
            maxExpirationTime: new BigNumber(new Date().getTime() + 1000 * 1000),
            startOfCurrentUTCDay: new Date(),
            ethRPCRequestsSentInCurrentUTCDay: 12,
            ethRPCRateLimitExpiredRequests: 13,
        };
    }

    public async getOrdersAsync(_perPage: number = 200): Promise<{ ordersInfos: OrderWithMetadataV4[] }> {
        return {
            ordersInfos: this._orders,
        };
    }

    public async addOrdersV4Async(
        orders: SignedLimitOrder[],
        _pinned: boolean = true,
        _opts?: AddOrdersOpts,
    ): Promise<MeshClientModule.AddOrdersResultsV4> {
        const ordersWithMetadata: OrderWithMetadataV4[] = orders.map(toOrderWithMetadata);
        this._orders = [...this._orders, ...ordersWithMetadata];

        const addedOrdersResult = {
            accepted: ordersWithMetadata.map(order => ({
                order,
                isNew: true,
            })),
            rejected: [],
        };

        const orderEvents = ordersWithMetadata.map<OrderEvent>(orderv4 => ({
            timestampMs: new Date().getTime(),
            orderv4,
            endState: OrderEventEndState.Added,
            contractEvents: [],
        }));

        this._nextOrderEventsCB(orderEvents);

        return addedOrdersResult;
    }

    public onOrderEvents(): Observable<OrderEvent[]> {
        return this._ordersObservable;
    }
    // tslint:disable-next-line:no-empty
    private _nextOrderEventsCB: (orders: OrderEvent[]) => void = (_orders: OrderEvent[]) => {};
}
