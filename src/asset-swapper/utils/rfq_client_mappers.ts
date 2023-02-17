import { FillQuoteTransformerOrderType } from '@0x/protocol-utils';
import { BigNumber } from '@0x/utils';

import { RfqtV2Quote } from '../../types';
import {
    SignedNativeOrder,
    RfqClientV1Quote,
    NativeOrderWithFillableAmounts,
    MultihopNativeOrderFillableAmountFields,
} from '../types';

/**
 * Converts a RfqClientRfqOrderFirmQuote to a SignedNativeOrder
 */
export const toSignedNativeOrder = (quote: RfqClientV1Quote): SignedNativeOrder => {
    return {
        type: FillQuoteTransformerOrderType.Rfq,
        order: quote.order,
        signature: quote.signature,
    };
};

/**
 * Converts a RfqtV2Quote to a NativeOrderWithFillableAmounts
 */
export const toSignedNativeOrderWithFillableAmounts = (quote: RfqtV2Quote): NativeOrderWithFillableAmounts => {
    return {
        type: FillQuoteTransformerOrderType.Otc,
        order: quote.order,
        signature: quote.signature,
        fillableTakerAmount: quote.fillableTakerAmount,
        fillableMakerAmount: quote.fillableMakerAmount,
        fillableTakerFeeAmount: quote.fillableTakerFeeAmount,
    };
};

/**
 * Converts a RfqtV2Quote to a NativeOrderWithFillableAmounts
 */
export const toMultiHopRfqtWithFillableAmounts = (quote: RfqtV2Quote[]): MultihopNativeOrderFillableAmountFields => {
    return {
        type: FillQuoteTransformerOrderType.Otc,
        multiHopOrderSignatures: [quote[0].signature, quote[1].signature],
        multiHopOrders: [quote[0].order, quote[1].order],
        fillableTakerAmount: quote[0].fillableTakerAmount,
        fillableMakerAmount: quote[1].fillableMakerAmount,
        fillableTakerFeeAmount: new BigNumber(0),
    };
};
