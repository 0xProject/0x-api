import { MeshGraphQLClient, OrderWithMetadata } from '@0x/mesh-graphql-client';
// import { orderHashUtils } from '@0x/order-utils';
import * as _ from 'lodash';

// import { MESH_ORDERS_BATCH_HTTP_BYTE_LENGTH, MESH_ORDERS_BATCH_SIZE } from '../constants';
// import { logger } from '../logger';

// import { retryableAxios } from './axios_utils';
// import { utils } from './utils';

export class MeshClient extends MeshGraphQLClient {
    public async getOrdersAsync(_perPage: number = 200): Promise<{ ordersInfos: OrderWithMetadata[] }> {
        return null;
    }

    constructor(public readonly webSocketUrl: string, public readonly httpUrl?: string) {
        super({ webSocketUrl, httpUrl });
    }
}
