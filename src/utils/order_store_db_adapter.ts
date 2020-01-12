import { AddedRemovedOrders, APIOrder, OrderSet, OrderStore } from '@0x/asset-swapper';

import { FIRST_PAGE } from '../constants';
import { OrderBookService } from '../services/orderbook_service';

const MAX_QUERY_SIZE = 1000;
export class OrderStoreDbAdapter extends OrderStore {
    private readonly _orderbookService: OrderBookService;
    constructor(orderbookService: OrderBookService) {
        super();
        this._orderbookService = orderbookService;
    }
    public async getOrderSetForAssetsAsync(makerAssetData: string, takerAssetData: string): Promise<OrderSet> {
        const assetPairKey = OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData);
        return this.getOrderSetForAssetPairAsync(assetPairKey);
    }
    public async getOrderSetForAssetPairAsync(assetPairKey: string): Promise<OrderSet> {
        const [assetA, assetB] = OrderStore.assetPairKeyToAssets(assetPairKey);
        const { bids, asks } = await this._orderbookService.getOrderBookAsync(
            FIRST_PAGE,
            MAX_QUERY_SIZE,
            assetA,
            assetB,
        );
        const orderSet = new OrderSet();
        await orderSet.addManyAsync([...bids.records, ...asks.records]);
        return orderSet;
    }
    public async updateAsync(addedRemoved: AddedRemovedOrders): Promise<void> {
        const { added } = addedRemoved;
        for (const order of added) {
            await this._orderbookService.addOrderAsync(order.order);
        }
        // Currently not handling deletes as this is handled by Mesh
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async hasAsync(_assetPairKey: string): Promise<boolean> {
        return true;
        // const [assetA, assetB] = OrderStore.assetPairKeyToAssets(assetPairKey);
        // const { bids, asks } = await this._orderbookService.getOrderBookAsync(
        //     FIRST_PAGE,
        //     MAX_QUERY_SIZE,
        //     assetA,
        //     assetB,
        // );
        // return bids.total !== 0 || asks.total !== 0;
        // const [assetA, assetB] = OrderStore.assetPairKeyToAssets(assetPairKey);
        // const pairs = await this._orderbookService.getAssetPairsAsync(FIRST_PAGE, MAX_QUERY_SIZE, assetA, assetB);
        // return pairs.total !== 0;
    }
    public async valuesAsync(assetPairKey: string): Promise<APIOrder[]> {
        return Array.from((await this.getOrderSetForAssetPairAsync(assetPairKey)).values());
    }
    public async keysAsync(): Promise<IterableIterator<string>> {
        const pairs = await this._orderbookService.getAssetPairsAsync(FIRST_PAGE, MAX_QUERY_SIZE);
        const keys = pairs.records.map(r =>
            OrderStore.getKeyForAssetPair(r.assetDataA.assetData, r.assetDataB.assetData),
        );
        return keys.values();
    }
}
