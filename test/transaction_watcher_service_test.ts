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
import { utils } from '../src/utils/utils';

import { TEST_RINKEBY_PRIVATE_KEY, TEST_RINKEBY_PUBLIC_ADDRESS, TEST_RINKEBY_RPC_URL } from './config';
import { TestSigner } from './utils/test_signer';

const { expect } = chai;
const NUMBER_OF_RETRIES = 20;

let providerEngine: Web3ProviderEngine;
let signer: TestSigner;
let transactionEntityRepository: Repository<TransactionEntity>;
let txWatcher: TransactionWatcherService;
let connection: Connection;

const LOW_GAS_PRICE = 1337;
const MID_GAS_PRICE = 4000000000;
const HIGH_GAS_PRICE = 9000000000;
const WAIT_DELAY_IN_MS = 5000;
const SHORT_EXPECTED_MINE_TIME_SEC = 15;

async function waitUntilStatusAsync(
    txHash: string,
    status: TransactionStates,
    repository: Repository<TransactionEntity>,
): Promise<void> {
    for (let i = 0; i < NUMBER_OF_RETRIES; i++) {
        const tx = await repository.findOne(txHash);
        if (tx !== undefined && tx.status === status) {
            return;
        }
        await utils.delay(WAIT_DELAY_IN_MS);
    }

    throw new Error(`failed to grab transaction: ${txHash} in a ${status} state`);
}

describe('transaction watcher service', () => {
    before(async () => {
        providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(new RPCSubprovider(TEST_RINKEBY_RPC_URL));
        providerUtils.startProviderEngine(providerEngine);
        connection = await getDBConnectionAsync();
        transactionEntityRepository = connection.getRepository(TransactionEntity);
        signer = new TestSigner(
            connection,
            TEST_RINKEBY_PRIVATE_KEY,
            TEST_RINKEBY_PUBLIC_ADDRESS,
            TEST_RINKEBY_RPC_URL,
        );
        txWatcher = new TransactionWatcherService(connection, providerEngine);
        await txWatcher.syncTransactionStatusAsync();
    });
    it('monitors the transaction lifecycle correctly', async () => {
        // send tx with 1 gwei gas price
        const txHash = await signer.sendTransactionToItselfAsync(new BigNumber(MID_GAS_PRICE));
        await waitUntilStatusAsync(txHash, TransactionStates.Confirmed, transactionEntityRepository);
        const storedTx = await transactionEntityRepository.findOne(txHash);
        expect(storedTx).to.not.be.undefined();
        expect(storedTx).to.include({ hash: txHash });
        expect(storedTx).to.not.include({ blockNumber: null });
    });
    it('unstucks a transaction correctly', async () => {
        // send a transaction with a very low gas price
        const txHash = await signer.sendTransactionToItselfAsync(
            new BigNumber(LOW_GAS_PRICE),
            SHORT_EXPECTED_MINE_TIME_SEC,
        );
        await waitUntilStatusAsync(txHash, TransactionStates.Stuck, transactionEntityRepository);
        const storedTx = await transactionEntityRepository.findOne(txHash);
        if (storedTx === undefined) {
            throw new Error('stored tx is undefined');
        }
        const unstickTxHash = await signer.sendUnstickingTransactionAsync(
            new BigNumber(HIGH_GAS_PRICE),
            web3WrapperUtils.encodeAmountAsHexString(storedTx.nonce),
        );
        await waitUntilStatusAsync(unstickTxHash, TransactionStates.Confirmed, transactionEntityRepository);
    });
});
