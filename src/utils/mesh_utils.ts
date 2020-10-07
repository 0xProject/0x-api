import { OrderEvent, OrderEventEndState, OrderWithMetadata, RejectedOrderCode } from '@0x/mesh-graphql-client';

import { ValidationErrorCodes } from '../errors';
import { logger } from '../logger';
import { AddedRemovedUpdate, APIOrderWithMetaData } from '../types';

export const meshUtils = {
    orderInfosToApiOrders: (orders: OrderWithMetadata[]): APIOrderWithMetaData[] => {
        return orders.map(e => meshUtils.orderInfoToAPIOrder(e));
    },
    orderInfoToAPIOrder: (order: OrderWithMetadata): APIOrderWithMetaData => {
        const remainingFillableTakerAssetAmount = order.fillableTakerAssetAmount;
        return {
            order,
            metaData: {
                orderHash: order.hash,
                remainingFillableTakerAssetAmount,
            },
        };
    },
    rejectedCodeToSRACode: (code: RejectedOrderCode): ValidationErrorCodes => {
        switch (code) {
            case RejectedOrderCode.OrderCancelled:
            case RejectedOrderCode.OrderExpired:
            case RejectedOrderCode.OrderUnfunded:
            case RejectedOrderCode.OrderHasInvalidMakerAssetAmount:
            case RejectedOrderCode.OrderHasInvalidMakerAssetData:
            case RejectedOrderCode.OrderHasInvalidTakerAssetAmount:
            case RejectedOrderCode.OrderHasInvalidTakerAssetData:
            case RejectedOrderCode.OrderFullyFilled: {
                return ValidationErrorCodes.InvalidOrder;
            }
            case RejectedOrderCode.OrderHasInvalidSignature: {
                return ValidationErrorCodes.InvalidSignatureOrHash;
            }
            case RejectedOrderCode.OrderForIncorrectChain: {
                return ValidationErrorCodes.InvalidAddress;
            }
            default:
                return ValidationErrorCodes.InternalError;
        }
    },
    calculateAddedRemovedUpdated: (orderEvents: OrderEvent[]): AddedRemovedUpdate => {
        const added: APIOrderWithMetaData[] = [];
        const removed: APIOrderWithMetaData[] = [];
        const updated: APIOrderWithMetaData[] = [];
        for (const event of orderEvents) {
            const apiOrder = meshUtils.orderInfoToAPIOrder(event.order);
            switch (event.endState) {
                case OrderEventEndState.Added: {
                    added.push(apiOrder);
                    break;
                }
                // case OrderEventEndState.Invalid: TODO(kimpers): Invalid state is no longer available, is this an issue?
                case OrderEventEndState.Cancelled:
                case OrderEventEndState.Expired:
                case OrderEventEndState.FullyFilled:
                case OrderEventEndState.StoppedWatching:
                case OrderEventEndState.Unfunded: {
                    removed.push(apiOrder);
                    break;
                }
                case OrderEventEndState.Unexpired:
                case OrderEventEndState.FillabilityIncreased:
                case OrderEventEndState.Filled: {
                    updated.push(apiOrder);
                    break;
                }
                default:
                    logger.error('Unknown Mesh Event', event.endState, event);
                    break;
            }
        }
        return { added, removed, updated };
    },
};
