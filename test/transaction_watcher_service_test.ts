import { Web3ProviderEngine } from '@0x/dev-utils';
import { RPCSubprovider, SupportedProvider } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';
import * as request from 'supertest';
import { Connection, Repository } from 'typeorm';

import {
    createMetaTxnServiceFromOrderBookService,
    createSwapServiceFromOrderBookService,
    getAppAsync,
} from '../src/app';
import * as config from '../src/config';
import { META_TRANSACTION_PATH, SRA_PATH } from '../src/constants';
import { getDBConnectionAsync } from '../src/db_connection';
import { TransactionEntity } from '../src/entities';
import { GeneralErrorCodes } from '../src/errors';
import { OrderBookService } from '../src/services/orderbook_service';
import { StakingDataService } from '../src/services/staking_data_service';
import { TransactionWatcherSignerService } from '../src/services/transaction_watcher_signer_service';
import { TransactionStates } from '../src/types';
import { MeshClient } from '../src/utils/mesh_client';
import { utils } from '../src/utils/utils';

import { TestMetaTxnUser } from './utils/test_signer';

const { expect } = chai;
const NUMBER_OF_RETRIES = 20;

let app: Express.Application;
let transactionEntityRepository: Repository<TransactionEntity>;
let txWatcher: TransactionWatcherSignerService;
let connection: Connection;
let metaTxnUser: TestMetaTxnUser;
let provider: SupportedProvider;
const WAIT_DELAY_IN_MS = 5000;

async function _waitUntilStatusAsync(
    txHash: string,
    status: TransactionStates,
    repository: Repository<TransactionEntity>,
): Promise<void> {
    for (let i = 0; i < NUMBER_OF_RETRIES; i++) {
        const tx = await repository.findOne({ txHash });
        if (tx !== undefined && tx.status === status) {
            return;
        }
        await utils.delayAsync(WAIT_DELAY_IN_MS);
    }

    throw new Error(`failed to grab transaction: ${txHash} in a ${status} state`);
}

describe('transaction watcher service', () => {
    before(async () => {
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(new RPCSubprovider(config.ETHEREUM_RPC_URL));
        providerUtils.startProviderEngine(providerEngine);
        provider = providerEngine;

        connection = await getDBConnectionAsync();

        transactionEntityRepository = connection.getRepository(TransactionEntity);
        txWatcher = new TransactionWatcherSignerService(connection);
        await txWatcher.syncTransactionStatusAsync();
        const orderBookService = new OrderBookService(connection);
        const metaTransactionService = createMetaTxnServiceFromOrderBookService(orderBookService, provider, connection);
        const stakingDataService = new StakingDataService(connection);
        const websocketOpts = { path: SRA_PATH };
        const swapService = createSwapServiceFromOrderBookService(orderBookService, provider);

        const meshClient = new MeshClient(config.MESH_WEBSOCKET_URI, config.MESH_HTTP_URI);

        metaTxnUser = new TestMetaTxnUser('https://kovan.api.0x.org');

        app = await getAppAsync(
            {
                orderBookService,
                metaTransactionService,
                stakingDataService,
                connection,
                provider,
                swapService,
                meshClient,
                websocketOpts,
            },
            config,
        );
    });
    it('sends a signed zeroex transaction correctly', async () => {
        const { zeroExTransactionHash, zeroExTransaction } = await metaTxnUser.getQuoteAsync(
            'DAI',
            'WETH',
            '500000000',
        );
        const signature = await metaTxnUser.signAsync(zeroExTransactionHash);
        let txHashToRequest = '';
        await request(app)
            .post(`${META_TRANSACTION_PATH}/submit`)
            .set('0x-api-key', 'e20bd887-e195-4580-bca0-322607ec2a49')
            .send({ signature, zeroExTransaction })
            .expect('Content-Type', /json/)
            .then(async response => {
                expect(response.body.code).to.not.equal(GeneralErrorCodes.InvalidAPIKey);
                const { ethereumTransactionHash } = response.body;
                txHashToRequest = ethereumTransactionHash;

                await _waitUntilStatusAsync(
                    ethereumTransactionHash,
                    TransactionStates.Included,
                    transactionEntityRepository,
                );
            });

        await request(app)
            .get(`${META_TRANSACTION_PATH}/status/${txHashToRequest}`)
            .then(response => {
                expect(response.body.hash).to.equal(txHashToRequest);
                expect(response.body.status).to.equal('included');
            });
    });
});
