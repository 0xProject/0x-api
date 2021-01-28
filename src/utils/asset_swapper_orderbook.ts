import { LimitOrderFields, Orderbook, SignedOrder } from '@0x/asset-swapper';
// import { APIOrder } from '@0x/types';
// import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '../constants';

import { OrderBookService } from '../services/orderbook_service';

type SignedLimitOrder = SignedOrder<LimitOrderFields>;
// tslint:disable
export class AssetSwapperOrderbook extends Orderbook {
    constructor(public readonly orderbookService: OrderBookService) {
        super();
    }

    // TODO: change to token address instead of asset data
    public async getOrdersAsync(
        makerAssetData: string,
        takerAssetData: string,
        pruneFn?: (o: SignedLimitOrder) => boolean,
    ): Promise<SignedLimitOrder[]> {
        return [];
        // const apiOrders = await this.orderbookService.getOrdersAsync(DEFAULT_PAGE, DEFAULT_PER_PAGE, {
        //     makerAssetData,
        //     takerAssetData,
        // });
        // const orders = apiOrders.records.map(apiOrderToSignedLimitOrder);
        // const result = pruneFn ? orders.filter(pruneFn) : orders;
        // return result;
    }
    public async getBatchOrdersAsync(
        makerTokens: string[],
        takerToken: string,
        pruneFn?: (o: SignedLimitOrder) => boolean,
    ): Promise<SignedLimitOrder[][]> {
        return [[]];
        // const apiOrders = await this.orderbookService.getBatchOrdersAsync(DEFAULT_PAGE, DEFAULT_PER_PAGE, makerTokens, [
        //     takerToken,
        // ]);
        // const orders = apiOrders.records.map(apiOrderToSignedLimitOrder);
        // const pruned = pruneFn ? orders.filter(pruneFn) : orders;
        // const groupedByMakerToken: SignedLimitOrder[][] = makerTokens.map(token =>
        //     pruned.filter(o => o.makerToken === token),
        // );
        // return groupedByMakerToken;
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async destroyAsync(): Promise<void> {
        return;
    }
}

// // TODO (xianny): update types in @0x/types
// function apiOrderToSignedLimitOrder(apiOrder: APIOrder): SignedLimitOrder {
//     return apiOrder.order as any as SignedLimitOrder;
// }
// tslint:enable
