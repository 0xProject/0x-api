import { RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber, providerUtils } from '@0x/utils';
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';
import * as chai from 'chai';
import 'mocha';
import { Connection, Repository } from 'typeorm';

import { getDBConnectionAsync } from '../src/db_connection';
import { TransactionEntity } from '../src/entities';
import { TransactionWatcherService } from '../src/services/transaction_watcher_service';
import { TransactionStates } from '../src/types';

import { TEST_RINKEBY_PRIVATE_KEY, TEST_RINKEBY_PUBLIC_ADDRESS, TEST_RINKEBY_RPC_URL } from './config';
import { DummySigner } from './utils/dummy_signer';

const { expect } = chai;
const NUMBER_OF_RETRIES = 20;

const delay = (ms: number): Promise<{}> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

let providerEngine: Web3ProviderEngine;
let signer: DummySigner;
let transactionEntityRepository: Repository<TransactionEntity>;
let txWatcher: TransactionWatcherService;

async function waitUntilStatus(
    txHash: string,
    status: TransactionStates,
    repository: Repository<TransactionEntity>,
): Promise<void> {
    for (let i = 0; i < NUMBER_OF_RETRIES; i++) {
        const tx = await repository.findOne(txHash);
        if (tx !== undefined && tx.status === status) {
            return;
        }
        await delay(5 * 1000);
    }

    throw new Error(`failed to grab transaction: ${txHash} in a ${status} state`);
}

describe('transaction watcher service', () => {
    let connection: Connection;

    before(async () => {
        providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(new RPCSubprovider(TEST_RINKEBY_RPC_URL));
        providerUtils.startProviderEngine(providerEngine);

        // connection = await getInMemorySQLiteConnectionAsync('transation_watcher_svc_test_db');
        connection = await getDBConnectionAsync();
        transactionEntityRepository = connection.getRepository(TransactionEntity);
        signer = new DummySigner(
            connection,
            TEST_RINKEBY_PRIVATE_KEY,
            TEST_RINKEBY_PUBLIC_ADDRESS,
            TEST_RINKEBY_RPC_URL,
        );
        txWatcher = new TransactionWatcherService(connection, providerEngine);
        txWatcher.startAsync();
    });

    it('monitors the transaction lifecycle correctly', async () => {
        // send tx with 1 gwei gas price
        const txHash = await signer.sendTransactionToItself(new BigNumber(4000000000));
        console.log(`sent tx with hash ${txHash}`);
        await waitUntilStatus(txHash, TransactionStates.Confirmed, transactionEntityRepository);

        const storedTx = await transactionEntityRepository.findOne(txHash);

        expect(storedTx).to.not.be.undefined();
        expect(storedTx).to.include({ hash: txHash });
        expect(storedTx).to.include({ status: TransactionStates.Confirmed });
    });

    it('unstucks a transaction correctly', async () => {
        // send a transaction with a very low gas price
        const txHash = await signer.sendTransactionToItself(new BigNumber(1337), 30);
        console.log(`stuck hash: ${txHash}`);
        await waitUntilStatus(txHash, TransactionStates.Stuck, transactionEntityRepository);
        console.log('detected stuck transaction');
        const storedTx = await transactionEntityRepository.findOne(txHash);
        if (storedTx === undefined) {
            throw new Error('stored tx is undefined');
        }

        const nonce = web3WrapperUtils.convertHexToNumber(storedTx.nonce);
        console.log(`transaction ${txHash} is currently being attempted to be unstuck with nonce ${nonce}`);
        const unstickTxHash = await signer.sendUnstickingTransaction(new BigNumber(9000000000), storedTx.nonce);
        console.log(`unsticking txHash: ${unstickTxHash}`);
        await waitUntilStatus(unstickTxHash, TransactionStates.Confirmed, transactionEntityRepository);
    });
});
