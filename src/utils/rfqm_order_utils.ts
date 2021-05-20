import { BigNumber } from '@0x/asset-swapper';
import { RfqOrder } from '@0x/protocol-utils';

export enum RfqmOrderTypes {
    V4Rfq = 'v4Rfq',
}

export interface V4StringRfqOrderFields {
    txOrigin: string;
    maker: string;
    taker: string;
    makerToken: string;
    takerToken: string;
    makerAmount: string;
    takerAmount: string;
    pool: string;
    expiry: string;
    salt: string;
    chainId: string;
    verifyingContract: string;
}

export interface StoredOrder {
    type: RfqmOrderTypes;
    order: RfqmOrderStringFields;
}

export type RfqmOrderStringFields = V4StringRfqOrderFields;
export type RfqmOrder = RfqOrder;

export const storedOrderToRfqmOrder = (storedOrder: StoredOrder): RfqmOrder => {
    if (storedOrder.type === RfqmOrderTypes.V4Rfq) {
        return new RfqOrder({
            txOrigin: storedOrder.order.txOrigin,
            maker: storedOrder.order.maker,
            taker: storedOrder.order.taker,
            makerToken: storedOrder.order.makerToken,
            takerToken: storedOrder.order.takerToken,
            makerAmount: new BigNumber(storedOrder.order.makerAmount),
            takerAmount: new BigNumber(storedOrder.order.takerAmount),
            salt: new BigNumber(storedOrder.order.salt),
            expiry: new BigNumber(storedOrder.order.takerAmount),
            verifyingContract: storedOrder.order.verifyingContract,
            chainId: Number(storedOrder.order.chainId),
        });
    } else {
        throw new Error(`Unknown order type`);
    }
};

export const v4RfqOrderToStoredOrder = (order: RfqOrder): StoredOrder => {
    return {
        type: RfqmOrderTypes.V4Rfq,
        order: {
            makerAmount: order.makerAmount.toString(),
            takerAmount: order.takerAmount.toString(),
            expiry: order.expiry.toString(),
            salt: order.salt.toString(),
            txOrigin: order.txOrigin,
            maker: order.maker,
            taker: order.taker,
            makerToken: order.makerToken,
            takerToken: order.takerToken,
            pool: order.pool,
            verifyingContract: order.verifyingContract,
            chainId: String(order.chainId),
        },
    };
};
