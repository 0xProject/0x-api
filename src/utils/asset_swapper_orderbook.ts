import { APIOrder, LimitOrderFields, Orderbook } from '@0x/asset-swapper';
import { SignedOrder } from '@0x/asset-swapper/lib/src/utils/market_operation_utils/types';

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
        pruneFn?: (o: SignedOrder<LimitOrderFields>) => boolean,
    ): Promise<Array<SignedOrder<LimitOrderFields>>> {
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
        pruneFn?: (o: SignedOrder<LimitOrderFields>) => boolean,
    ): Promise<SignedOrder<LimitOrderFields>[][]> {
        const apiOrders = await this.orderbookService.getBatchOrdersAsync(DEFAULT_PAGE, DEFAULT_PER_PAGE, makerTokens, [
            takerToken,
        ]);
        const orders = apiOrders.records.map(apiOrderToOrderbookOrder);
        const pruned = pruneFn ? orders.filter(pruneFn) : orders;
        const groupedByMakerToken: SignedOrder<LimitOrderFields>[][] = makerTokens.map(token =>
            pruned.filter(o => o.order.makerToken === token),
        );
        return groupedByMakerToken;
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async destroyAsync(): Promise<void> {
        return;
    }
}

// TODO
function apiOrderToOrderbookOrder(apiOrder: APIOrder): SignedOrder<LimitOrderFields> {
    return (apiOrder as any) as SignedOrder<LimitOrderFields>;
}
