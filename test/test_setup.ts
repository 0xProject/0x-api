import * as MeshGraphQLClientModule from '@0x/mesh-graphql-client';
import { ImportMock } from 'ts-mock-imports';

import * as MeshClientModule from '../src/utils/mesh_client';

import { MeshClient as MeshClientMock } from './utils/mesh_client_mock';

// Mock Mesh to use a dummy client rather than connecting to an actual Mesh instance
const _meshClientMock = new MeshClientMock();

const graphqlClientMockManager = ImportMock.mockClass(MeshGraphQLClientModule, 'MeshGraphQLClient');
const meshClientMockManager = ImportMock.mockClass(MeshClientModule, 'MeshClient');
meshClientMockManager.mock('getStatsAsync').callsFake(_meshClientMock.getStatsAsync.bind(_meshClientMock));
meshClientMockManager.mock('getOrdersAsync').callsFake(_meshClientMock.getOrdersAsync.bind(_meshClientMock));
meshClientMockManager.mock('addOrdersAsync').callsFake(_meshClientMock.addOrdersAsync.bind(_meshClientMock));
meshClientMockManager.mock('onOrderEvents').callsFake(_meshClientMock.onOrderEvents.bind(_meshClientMock));

beforeEach(() => {
    _meshClientMock._resetClient();
});

after(() => {
    graphqlClientMockManager.restore();
    meshClientMockManager.restore();
});
