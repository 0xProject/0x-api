import { MeshGraphQLClient, OrderWithMetadata } from '@0x/mesh-graphql-client';
// import { orderHashUtils } from '@0x/order-utils';
import * as _ from 'lodash';

// import { MESH_ORDERS_BATCH_HTTP_BYTE_LENGTH, MESH_ORDERS_BATCH_SIZE } from '../constants';
// import { logger } from '../logger';

// import { retryableAxios } from './axios_utils';
// import { utils } from './utils';

export class MeshClient extends MeshGraphQLClient {
    public async getOrdersAsync(_perPage: number = 200): Promise<{ ordersInfos: OrderWithMetadata[] }> {
        // TODO: implement
        return null;
    }

    constructor(public readonly _webSocketUrl: string, public readonly _httpUrl?: string) {
        super({
            httpUrl: 'http://localhost:60557/graphql',
            webSocketUrl: 'ws://localhost:60557/graphql',
        });
    }
}
