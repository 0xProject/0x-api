import { SignedOrder, ValidationResults, WSClient, WSOpts } from '@0x/mesh-rpc-client';
import Axios from 'axios';
import * as _ from 'lodash';

import { MESH_ORDERS_BATCH_SIZE } from '../constants';

import { utils } from './utils';

export class MeshClient extends WSClient {
    public async addOrdersViaHttpAsync(orders: SignedOrder[], pinned: boolean = false): Promise<ValidationResults> {
        if (_.isEmpty(this.httpURI)) {
            return super.addOrdersAsync(orders, pinned);
        } else {
            const validationResults: ValidationResults = { accepted: [], rejected: [] };
            const chunks = _.chunk(orders, MESH_ORDERS_BATCH_SIZE);
            chunks.forEach(async chunk => {
                // format request payload
                const data = {
                    jsonrpc: '2.0',
                    id: +new Date(),
                    method: 'mesh_addOrders',
                    params: [chunk, { pinned }],
                };

                // send the request
                const response = await Axios({
                    method: 'post',
                    url: this.httpURI,
                    data,
                });

                // validate the response
                utils.isValidJsonRpcResponseOrThrow(response.data, data);
                const results = response.data.results;

                // concatenate results
                validationResults.accepted = [...validationResults.accepted, ...results.accepted];
                validationResults.rejected = [...validationResults.rejected, ...results.rejected];
            });
            return validationResults;
        }
    }

    constructor(public readonly websocketURI: string, public readonly httpURI?: string, websocketOpts?: WSOpts) {
        super(websocketURI, websocketOpts);
    }
}
