import { BlockchainLifecycle, web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as HttpStatus from 'http-status-codes';
import 'mocha';
import * as request from 'supertest';

import { getAppAsync, getDefaultAppDependenciesAsync } from '../src/app';
import * as config from '../src/config';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE, SRA_PATH, SWAP_PATH } from '../src/constants';

import { expect } from './utils/expect';

let app: Express.Application;

let web3Wrapper: Web3Wrapper;
let provider: Web3ProviderEngine;
let accounts: string[];
let blockchainLifecycle: BlockchainLifecycle;

describe('app test', () => {
    before(async () => {
        // start ganache and run contract migrations
        const ganacheConfigs = {
            shouldUseInProcessGanache: false,
            shouldAllowUnlimitedContractSize: true,
            rpcUrl: config.ETHEREUM_RPC_URL,
        };
        provider = web3Factory.getRpcProvider(ganacheConfigs);
        web3Wrapper = new Web3Wrapper(provider);
        blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
        await blockchainLifecycle.startAsync();
        accounts = await web3Wrapper.getAvailableAddressesAsync();

        const dependencies = await getDefaultAppDependenciesAsync(provider, config);

        // start the 0x-api app
        app = await getAppAsync({ ...dependencies }, config);
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
    describe('should respond to GET /swap/quote', () => {
        it("with INSUFFICIENT_ASSET_LIQUIDITY when there's no liquidity (empty orderbook, sampling excluded, no RFQ)", async () => {
            await request(app)
                .get(
                    `${SWAP_PATH}/quote?buyToken=DAI&sellToken=WETH&buyAmount=100000000000000000&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`,
                )
                .expect(HttpStatus.BAD_REQUEST)
                .expect('Content-Type', /json/)
                .then(response => {
                    const responseJson = JSON.parse(response.text);
                    expect(responseJson.reason).to.equal('Validation Failed');
                    expect(responseJson.validationErrors.length).to.equal(1);
                    expect(responseJson.validationErrors[0].field).to.equal('buyAmount');
                    expect(responseJson.validationErrors[0].reason).to.equal('INSUFFICIENT_ASSET_LIQUIDITY');
                });
        });
    });
});
