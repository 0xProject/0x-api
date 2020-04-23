import { RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';
import { Connection } from 'typeorm';
import * as WebSocket from 'ws'; // only neccessary in server environments

import * as config from '../src/config';
import { getDBConnectionAsync } from '../src/db_connection';
import { TransactionWatcherService } from '../src/services/transaction_watcher_service';

import { DummySigner } from './utils/dummy_signer';
import { TEST_RINKEBY_PUBLIC_ADDRESS, TEST_RINKEBY_PRIVATE_KEY, TEST_RINKEBY_RPC_URL } from './config';

const { expect } = chai;
let providerEngine: Web3ProviderEngine;
let signer: DummySigner;
let txWatcher: TransactionWatcherService;

const delay = (ms: number): Promise<{}> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

describe('dummy signer', () => {
    let connection: Connection;

    before(async () => {
        providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(new RPCSubprovider(TEST_RINKEBY_RPC_URL));
        providerUtils.startProviderEngine(providerEngine);

        connection = await getDBConnectionAsync();
        signer = new DummySigner(
            connection,
            TEST_RINKEBY_PRIVATE_KEY,
            TEST_RINKEBY_PUBLIC_ADDRESS,
            TEST_RINKEBY_RPC_URL,
        );
        txWatcher = new TransactionWatcherService(
            connection,
            providerEngine,
            {
                dappId: config.BLOCK_NATIVE_API_KEY,
                networkId: 4,
                ws: WebSocket, // only neccessary in server environments
            },
            [TEST_RINKEBY_PUBLIC_ADDRESS],
        );
        txWatcher.startAsync();
    });

    it('unstucks all transactions', async () => {
        const txes = await signer.unstickAll();
        console.table(txes);
        await delay(120 * 1000);

        expect(true).to.be.true();
    });

    // it('checks nonce', async () => {
    //     console.log(await signer.getTransactionCountAsync(RINKEBY_PUBLIC_ADDRESS));

    //     expect(true).to.be.true();
    // });
});
