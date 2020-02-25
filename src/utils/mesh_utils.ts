import { SignedOrder } from '@0x/asset-swapper';
import {
    AcceptedOrderInfo,
    OrderEvent,
    OrderEventEndState,
    OrderInfo,
    RejectedCode,
    RejectedOrderInfo,
    ValidationResults,
    WSClient,
} from '@0x/mesh-rpc-client';
import axios from 'axios';
import * as _ from 'lodash';

import {
    MESH_HTTP_DEFAULT_ORDER_BATCH_SIZE,
    MESH_WEBSOCKET_DEFAULT_ORDER_BATCH_SIZE,
    MESH_WEBSOCKET_ORDER_BATCH_LIMIT,
    ZERO,
} from '../constants';
import { ValidationErrorCodes } from '../errors';
import { logger } from '../logger';
import { AddedRemovedUpdate, APIOrderWithMetaData } from '../types';

import { utils } from './utils';

export const meshUtils = {
    addOrdersToMeshAsync: async (
        meshHttpEndpoint: string,
        meshClient: WSClient,
        orders: SignedOrder[],
    ): Promise<ValidationResults> => {
        // Mesh rpc client can't handle a large amount of orders over websocket. This results in a fragmented
        // send which Mesh cannot accept. We check how many orders are being added, and use HTTP if there are
        // too many.
        const shouldSendViaHttp = orders.length > MESH_WEBSOCKET_ORDER_BATCH_LIMIT;
        const batchSize = shouldSendViaHttp
            ? MESH_HTTP_DEFAULT_ORDER_BATCH_SIZE
            : MESH_WEBSOCKET_DEFAULT_ORDER_BATCH_SIZE;
        const validationResults: ValidationResults = { accepted: [], rejected: [] };
        const chunks = _.chunk(orders, batchSize);
        for (const chunk of chunks) {
            const results = shouldSendViaHttp
                ? await meshUtils.addOrdersViaHttp(meshHttpEndpoint, chunk)
                : await meshClient.addOrdersAsync(chunk);
            validationResults.accepted = [...validationResults.accepted, ...results.accepted];
            validationResults.rejected = [...validationResults.rejected, ...results.rejected];
        }
        return validationResults;
    },
    // this logic mirrors the mesh RPC client and WebsocketProvider implementations
    addOrdersViaHttp: async (
        meshHttpEndpoint: string,
        orders: SignedOrder[],
        pinned: boolean = true,
    ): Promise<ValidationResults> => {
        // format the JSON-RPC payload
        const data = {
            jsonrpc: '2.0',
            id: +new Date(),
            method: 'mesh_addOrders',
            params: [orders, { pinned }],
        };

        // send the request
        const response = await axios({
            method: 'post',
            url: meshHttpEndpoint,
            data,
        });

        // validate the response
        utils.isValidJsonRpcResponseOrThrow(response.data, data as any);

        return response.data.result;
    },
    orderInfosToApiOrders: (
        orderEvent: Array<OrderEvent | AcceptedOrderInfo | RejectedOrderInfo | OrderInfo>,
    ): APIOrderWithMetaData[] => {
        return orderEvent.map(e => meshUtils.orderInfoToAPIOrder(e));
    },
    orderInfoToAPIOrder: (
        orderEvent: OrderEvent | AcceptedOrderInfo | RejectedOrderInfo | OrderInfo,
    ): APIOrderWithMetaData => {
        const remainingFillableTakerAssetAmount = (orderEvent as OrderEvent).fillableTakerAssetAmount
            ? (orderEvent as OrderEvent).fillableTakerAssetAmount
            : ZERO;
        return {
            // TODO remove the any when packages are all published and updated with latest types
            // tslint:disable-next-line:no-unnecessary-type-assertion
            order: orderEvent.signedOrder as any,
            metaData: {
                orderHash: orderEvent.orderHash,
                remainingFillableTakerAssetAmount,
            },
        };
    },
    rejectedCodeToSRACode: (code: RejectedCode): ValidationErrorCodes => {
        switch (code) {
            case RejectedCode.OrderCancelled:
            case RejectedCode.OrderExpired:
            case RejectedCode.OrderUnfunded:
            case RejectedCode.OrderHasInvalidMakerAssetAmount:
            case RejectedCode.OrderHasInvalidMakerAssetData:
            case RejectedCode.OrderHasInvalidTakerAssetAmount:
            case RejectedCode.OrderHasInvalidTakerAssetData:
            case RejectedCode.OrderFullyFilled: {
                return ValidationErrorCodes.InvalidOrder;
            }
            case RejectedCode.OrderHasInvalidSignature: {
                return ValidationErrorCodes.InvalidSignatureOrHash;
            }
            case RejectedCode.OrderForIncorrectChain: {
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
            const apiOrder = meshUtils.orderInfoToAPIOrder(event);
            switch (event.endState) {
                case OrderEventEndState.Added: {
                    added.push(apiOrder);
                    break;
                }
                case OrderEventEndState.Cancelled:
                case OrderEventEndState.Expired:
                case OrderEventEndState.FullyFilled:
                case OrderEventEndState.Unfunded: {
                    removed.push(apiOrder);
                    break;
                }
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
