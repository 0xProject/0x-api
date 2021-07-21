import { SRAOrder } from '../types';
import { BigNumber } from '@0x/utils';
import { OrderEventEndState } from '@0x/mesh-graphql-client';

export interface OrderWatcherEvent {
    signed_order: {
        takerTokenFeeAmount: string; //BigNumber;
        sender: string;
        feeRecipient: string;
        makerToken: string;
        takerToken: string;
        makerAmount: string; //BigNumber;
        takerAmount: string; //BigNumber;
        maker: string;
        taker: string;
        pool: string;
        expiry: string; //BigNumber;
        salt: string; //BigNumber;
        chainId: number;
        verifyingContract: string;
        signature: {
            signatureType: number;
            v: number;
            r: string;
            s: string;
        };
    };
    metadata: {
        hash: string;
        remaining_fillable_taker_amount: string;
        status: string;
        created_at: string;
    };
}

export const orderWatcherEventToSRAOrder = (event: OrderWatcherEvent): SRAOrder => {
    return {
        order: {
            ...event.signed_order,
            takerTokenFeeAmount: new BigNumber(event.signed_order.takerTokenFeeAmount),
            makerAmount: new BigNumber(event.signed_order.makerAmount),
            takerAmount: new BigNumber(event.signed_order.takerAmount),
            expiry: new BigNumber(event.signed_order.expiry),
            salt: new BigNumber(event.signed_order.salt),
        },
        metaData: {
            orderHash: event.metadata.hash,
            remainingFillableTakerAmount: new BigNumber(event.metadata.remaining_fillable_taker_amount),
            state: event.metadata.status.toUpperCase() as OrderEventEndState,
        },
    };
};
