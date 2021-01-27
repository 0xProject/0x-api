import { APIOrder, Orderbook, OrderbookOrder } from '@0x/asset-swapper';

import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '../constants';
import { OrderBookService } from '../services/orderbook_service';

export class AssetSwapperOrderbook extends Orderbook {
    constructor(public readonly orderbookService: OrderBookService) {
        super();
    }

    // TODO: change to token address instead of asset data
    public async getOrdersAsync(
        makerAssetData: string,
        takerAssetData: string,
        pruneFn?: (o: OrderbookOrder) => boolean,
    ): Promise<OrderbookOrder[]> {
        const apiOrders = await this.orderbookService.getOrdersAsync(DEFAULT_PAGE, DEFAULT_PER_PAGE, {
            makerAssetData,
            takerAssetData,
        });
        const orders = apiOrders.records.map(apiOrderToOrderbookOrder);
        const result = pruneFn ? orders.filter(pruneFn) : orders;
        return result;
    }
    public async getBatchOrdersAsync(
        makerTokens: string[],
        takerToken: string,
        pruneFn?: (o: OrderbookOrder) => boolean,
    ): Promise<OrderbookOrder[][]> {
        const apiOrders = await this.orderbookService.getBatchOrdersAsync(DEFAULT_PAGE, DEFAULT_PER_PAGE, makerTokens, [
            takerToken,
        ]);
        const orders = apiOrders.records.map(apiOrderToOrderbookOrder);
        const pruned = pruneFn ? orders.filter(pruneFn) : orders;
        const groupedByMakerToken: OrderbookOrder[][] = makerTokens.map(token =>
            pruned.filter(o => o.makerToken === token),
        );
        return groupedByMakerToken;
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async destroyAsync(): Promise<void> {
        return;
    }
}

// TODO
function apiOrderToOrderbookOrder(apiOrder: APIOrder): OrderbookOrder {
    return (apiOrder as any) as OrderbookOrder;
}
