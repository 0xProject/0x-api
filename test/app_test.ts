// import { ContractAddresses } from '@0x/contract-addresses';
import { BlockchainLifecycle, web3Factory } from '@0x/dev-utils';
import { runMigrationsOnceAsync } from '@0x/migrations';
import { Web3ProviderEngine } from '@0x/subproviders';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as HttpStatus from 'http-status-codes';
import 'mocha';
import * as request from 'supertest';

import { getAppAsync  } from '../src/app';
import * as config from '../src/config';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '../src/constants';

import { expect } from './utils/expect';

const testConfig = {
    ...config,
    ETHEREUM_RPC_URL: 'http://localhost:8545',
    CHAIN_ID: 1337,
};

let app: Express.Application;

let web3Wrapper: Web3Wrapper;
let provider: Web3ProviderEngine;
let accounts: string[];
let blockchainLifecycle: BlockchainLifecycle;

describe('app test', () => {
    before(async () => {
        // start ganache and run contract migrations
        const ganacheConfigs = {
            shouldUseInProcessGanache: true,
            shouldAllowUnlimitedContractSize: true,
        };
        provider = web3Factory.getRpcProvider(ganacheConfigs);
        web3Wrapper = new Web3Wrapper(provider);
        blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
        await blockchainLifecycle.startAsync();
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        const owner = accounts[0];
        await runMigrationsOnceAsync(provider, { from: owner });

        // start the 0x-api app
        app = await getAppAsync({provider}, testConfig); // tslint:disable-line:no-object-literal-type-assertion

    });
    it('should not be undefined', () => {
        expect(app).to.not.be.undefined();
    });
    it('should respond to GET /sra/orders', async () => {
        await request(app)
            .get('/sra/orders')
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
