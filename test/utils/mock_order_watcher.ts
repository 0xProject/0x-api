import { Connection } from 'typeorm';

// import { LimitOrder } from '@0x/asset-swapper';
import { LimitOrder, LimitOrderFields } from '@0x/protocol-utils';

import { OrderWatcherInterface } from '../../src/utils/order_watcher';
import { SignedLimitOrder } from '../../src/types';
import { OrderWatcherSignedOrderEntity } from '../../src/entities';
import { orderUtils } from '../../src/utils/order_utils';

export class MockOrderWatcher implements OrderWatcherInterface {
    private _connection: Connection;

    constructor(connection: Connection) {
        this._connection = connection;
    }

    public async postOrders(orders: SignedLimitOrder[]) {
        await this._connection.getRepository(OrderWatcherSignedOrderEntity).save(
            orders.map((order) => {
                const limitOrder = new LimitOrder(order as LimitOrderFields);
                return orderUtils.serializeOrder({
                    order,
                    metaData: {
                        orderHash: limitOrder.getHash(),
                        remainingFillableTakerAmount: order.takerAmount,
                    },
                });
            }),
        );
    }

    // public async deleteOrders()
}
