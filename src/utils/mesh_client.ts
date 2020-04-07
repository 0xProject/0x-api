import { SignedOrder, ValidationResults, WSClient, WSOpts } from '@0x/mesh-rpc-client';
import Axios from 'axios';
import * as _ from 'lodash';
import * as rax from 'retry-axios';

import { MESH_ORDERS_BATCH_SIZE } from '../constants';
import { logger } from '../logger';

import { utils } from './utils';

// Attach retry-axios to the global instance
rax.attach();

export class MeshClient extends WSClient {
    public async addOrdersAsync(orders: SignedOrder[], pinned: boolean = false): Promise<ValidationResults> {
        const validationResults: ValidationResults = { accepted: [], rejected: [] };
        if (_.isEmpty(this.httpURI) || orders.length <= MESH_ORDERS_BATCH_SIZE) {
            const chunks = _.chunk(orders, MESH_ORDERS_BATCH_SIZE);
            // send via websocket
            // break into chunks because mesh websocket fails when the msg is too big
            for (const chunk of chunks) {
                const results = await super.addOrdersAsync(chunk, pinned);
                validationResults.accepted = [...validationResults.accepted, ...results.accepted];
                validationResults.rejected = [...validationResults.rejected, ...results.rejected];
            }
        } else {
            // TODO chunk by byte length of the payload rather than order length
            // tslint:disable-next-line:custom-no-magic-numbers
            const chunks = _.chunk(orders, 500);
            for (const [i, chunk] of chunks.entries()) {
                logger.info(`Mesh HTTP sync ${i + 1}/${chunks.length}`);
                // send via http
                // format JSON-RPC request payload
                const data = {
                    jsonrpc: '2.0',
                    id: +new Date(),
                    method: 'mesh_addOrders',
                    params: [chunk, { pinned }],
                };

                try {
                    const startTime = Date.now();
                    // send the request
                    const response = await Axios({
                        method: 'post',
                        url: this.httpURI,
                        data,
                        // retry config
                        raxConfig: {
                            // Retry 3 times
                            retry: 3,
                            // ETIMEDOUT etc
                            noResponseRetries: 2,
                            onRetryAttempt: _err =>
                                logger.warn(`Mesh HTTP sync retry ${i + 1}/${chunks.length} #${_err.message}`),
                        },
                    });
                    const endTime = Date.now();

                    // validate the response
                    utils.isValidJsonRpcResponseOrThrow(response.data, data);
                    const results = response.data.result;
                    validationResults.accepted = [...validationResults.accepted, ...results.accepted];
                    validationResults.rejected = [...validationResults.rejected, ...results.rejected];
                    logger.info(`Mesh HTTP sync ${i + 1}/${chunks.length} complete ${endTime - startTime}ms`);
                } catch (err) {
                    logger.error(`Mesh HTTP sync ${i + 1}/${chunks.length} failed ${err.message}`);
                    // TODO if we can't validate orders, and have exhausted retries, then we need to reject
                }
            }
        }
        return validationResults;
    }

    constructor(public readonly websocketURI: string, public readonly httpURI?: string, websocketOpts?: WSOpts) {
        super(websocketURI, websocketOpts);
    }
}
