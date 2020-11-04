// tslint:disable:custom-no-magic-numbers
// tslint:disable:no-console
import { orderHashUtils } from '@0x/contracts-test-utils';
import {
    AddOrdersResults,
    OrderEvent,
    OrderEventEndState,
    OrderWithMetadata,
    SignedOrder,
    Stats,
} from '@0x/mesh-graphql-client';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as Observable from 'zen-observable';

export interface AddOrdersOpts {
    keepCancelled?: boolean;
    keepExpired?: boolean;
    keepFullyFilled?: boolean;
    keepUnfunded?: boolean;
}

const toOrderWithMetadata = (order: SignedOrder): OrderWithMetadata => ({
    ...order,
    fillableTakerAssetAmount: new BigNumber(order.takerAssetAmount),
    hash: orderHashUtils.getOrderHashHex(order),
});

export class MeshClient {
    private _orders: OrderWithMetadata[] = [];
    private _nextOrderEventsCB!: (orders: OrderEvent[]) => void;
    private readonly _ordersObservable: Observable<OrderEvent[]> = new Observable<OrderEvent[]>(observer => {
        this._nextOrderEventsCB = observer.next.bind(observer);
    });

    constructor(public readonly webSocketUrl: string, public readonly httpUrl?: string) {}

    // NOTE: Mock only method
    public resetClient(): void {
        console.log('RESETTING');
        this._orders = [];
    }
    // NOTE: Mock only method
    public getOrderState(): OrderWithMetadata[] {
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
            numOrdersIncludingRemoved: 1234567,
            numPinnedOrders: 123,
            maxExpirationTime: new BigNumber(new Date().getTime() + 1000 * 1000),
            startOfCurrentUTCDay: new Date(),
            ethRPCRequestsSentInCurrentUTCDay: 12,
            ethRPCRateLimitExpiredRequests: 13,
        };
    }

    public async getOrdersAsync(_perPage: number = 200): Promise<{ ordersInfos: OrderWithMetadata[] }> {
        console.log('-----GETTING ORDERS----');
        console.log(this._orders);
        return {
            ordersInfos: this._orders,
        };
    }

    public async addOrdersAsync(
        orders: SignedOrder[],
        _pinned: boolean = true,
        _opts?: AddOrdersOpts,
    ): Promise<AddOrdersResults> {
        console.log('-----ADDING ORDERS------');
        const ordersWithMetadata: OrderWithMetadata[] = orders.map(toOrderWithMetadata);
        console.log(ordersWithMetadata);
        this._orders = [...this._orders, ...ordersWithMetadata];

        const addedOrdersResult = {
            accepted: ordersWithMetadata.map(order => ({
                order,
                isNew: true,
            })),
            rejected: [],
        };

        const orderEvents = ordersWithMetadata.map<OrderEvent>(order => ({
            timestampMs: new Date().getTime(),
            order,
            endState: OrderEventEndState.Added,
            contractEvents: [],
        }));

        this._nextOrderEventsCB(orderEvents);

        return addedOrdersResult;
    }

    public onOrderEvents(): Observable<OrderEvent[]> {
        return this._ordersObservable;
    }
}
