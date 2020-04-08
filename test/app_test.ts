import { web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import * as HttpStatus from 'http-status-codes';
import 'mocha';
import * as request from 'supertest';

import { getAppAsync, getDefaultAppDependenciesAsync } from '../src/app';
import * as config from '../src/config';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE, SRA_PATH } from '../src/constants';

import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';
import { expect } from './utils/expect';

let app: Express.Application;

let provider: Web3ProviderEngine;

describe('app test', () => {
    before(async () => {
        const ganacheConfigs = {
            shouldUseInProcessGanache: false,
            shouldAllowUnlimitedContractSize: true,
            rpcUrl: config.ETHEREUM_RPC_URL,
        };
        provider = web3Factory.getRpcProvider(ganacheConfigs);
        await setupDependenciesAsync();
        const dependencies = await getDefaultAppDependenciesAsync(provider, config);
        // start the 0x-api app
        app = await getAppAsync({ ...dependencies }, config);
    });
    after(async () => {
        await teardownDependenciesAsync();
    });
    it('should not be undefined', () => {
        expect(app).to.not.be.undefined();
    });
    it('should respond to GET /sra/orders', async () => {
        await request(app)
            .get(`${SRA_PATH}/orders`)
            .expect('Content-Type', /json/)
            .expect(HttpStatus.OK)
            .then(response => {
                expect(response.body.perPage).to.equal(DEFAULT_PER_PAGE);
                expect(response.body.page).to.equal(DEFAULT_PAGE);
                expect(response.body.total).to.equal(0);
                expect(response.body.records).to.deep.equal([]);
            });
    });
});
