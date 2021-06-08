import { BigNumber } from '@0x/asset-swapper';
import { expect } from '@0x/contracts-test-utils';
import { RfqOrder } from '@0x/protocol-utils';
import { Fee } from '@0x/quote-server/lib/src/types';
import 'mocha';
import { Connection } from 'typeorm';

import { getDBConnectionAsync } from '../src/db_connection';
import {
    RfqmJobEntity,
    RfqmQuoteEntity,
    RfqmTransactionSubmissionEntity,
} from '../src/entities';
import {
    feeToStoredFee,
    RfqmDbUtils,
    RfqmJobOpts,
    RfqmJobStatus,
    RfqmTranasctionSubmissionStatus,
    v4RfqOrderToStoredOrder,
} from '../src/utils/rfqm_db_utils';

import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';

// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../src/app')];

const SUITE_NAME = 'rfqm db test';

describe(SUITE_NAME, () => {
    let connection: Connection;
    let dbUtils: RfqmDbUtils;

    const createdAt = new Date();
    // it's expired if it's over 9000
    const expiry = new BigNumber(9000);
    const chainId = 1;
    const makerUri = 'https://marketmaking.over9000.io';
    const integratorId = 'an integrator';

    const metaTransactionHash = '0x5678';
    const calldata = '0xfillinganorder';
    const fee: Fee = {
        token: '0xatoken',
        amount: new BigNumber(5),
        type: 'fixed',
    };

    const order = new RfqOrder({
        txOrigin: '0x0000000000000000000000000000000000000000',
        taker: '0x1111111111111111111111111111111111111111',
        maker: '0x2222222222222222222222222222222222222222',
        makerToken: '0x3333333333333333333333333333333333333333',
        takerToken: '0x4444444444444444444444444444444444444444',
        expiry,
        salt: new BigNumber(1),
        chainId,
        verifyingContract: '0x0000000000000000000000000000000000000000',
        pool: '0x1',
    });

    const orderHash = order.getHash();

    // tx properties
    const transactionHash = '0x5678';
    const from = '0xanRfqmWorker';
    const to = '0xexchangeProxyAddress';
    const gasPrice = new BigNumber('100');
    const gasUsed = null;
    const blockMined = null;
    const nonce = 12;

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
        dbUtils = new RfqmDbUtils(connection);
    });

    after(async () => {
        // reset DB
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
        await teardownDependenciesAsync(SUITE_NAME);
    });

    beforeEach(async () => {
        // reset DB
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
        dbUtils = new RfqmDbUtils(connection);
    });

    describe('rfqm db tests', () => {
        it('should be able to save and read an rfqm quote entity w/ no change in information', async () => {
            const testRfqmQuoteEntity = new RfqmQuoteEntity({
                orderHash,
                metaTransactionHash,
                createdAt,
                integratorId,
                chainId,
                makerUri,
                fee: feeToStoredFee(fee),
                order: v4RfqOrderToStoredOrder(order),
            });

            const quoteRepository = connection.getRepository(RfqmQuoteEntity);
            await quoteRepository.save(testRfqmQuoteEntity);
            const dbEntity = await quoteRepository.findOne();

            // the saved + read entity should match the original entity in information
            expect(dbEntity).to.deep.eq(testRfqmQuoteEntity);
        });
        it('should be able to save and read an rfqm job entity w/ no change in information', async () => {
            const rfqmJobOpts: RfqmJobOpts = {
                orderHash,
                metaTransactionHash,
                createdAt,
                expiry,
                chainId,
                integratorId,
                makerUri,
                status: RfqmJobStatus.InQueue,
                statusReason: null,
                calldata,
                fee: feeToStoredFee(fee),
                order: v4RfqOrderToStoredOrder(order),
            };

            const testRfqmJobEntity = new RfqmJobEntity(rfqmJobOpts);
            await dbUtils.writeRfqmJobToDbAsync(rfqmJobOpts);

            const dbEntity = await dbUtils.findJobByOrderHashAsync(orderHash);

            // the saved + read entity should match the original entity in information
            expect(dbEntity).to.deep.eq(testRfqmJobEntity);
        });

        it('should be able to update an rfqm job entity', async () => {
            const rfqmJobOpts: RfqmJobOpts = {
                orderHash,
                metaTransactionHash,
                createdAt,
                expiry,
                chainId,
                integratorId,
                makerUri,
                status: RfqmJobStatus.InQueue,
                statusReason: null,
                calldata,
                fee: feeToStoredFee(fee),
                order: v4RfqOrderToStoredOrder(order),
            };
            await dbUtils.writeRfqmJobToDbAsync(rfqmJobOpts);

            const dbEntityFirstSnapshot = await dbUtils.findJobByOrderHashAsync(orderHash);
            await dbUtils.updateRfqmJobAsync(orderHash, { status: RfqmJobStatus.Processing });

            const dbEntitySecondSnapshot = await dbUtils.findJobByOrderHashAsync(orderHash);

            // expect status to be updated
            expect(dbEntityFirstSnapshot?.status).to.eq(RfqmJobStatus.InQueue);
            expect(dbEntitySecondSnapshot?.status).to.eq(RfqmJobStatus.Processing);

            // spot check that other values have not changed
            expect(dbEntityFirstSnapshot?.calldata).to.eq(dbEntitySecondSnapshot?.calldata);
            expect(dbEntityFirstSnapshot?.expiry).to.deep.eq(dbEntitySecondSnapshot?.expiry);
        });
        it('should be able to save and read an rfqm tx submission entity w/ no change in information', async () => {
            // need a pre-existing job entity bc of foreign key
            const rfqmJobOpts: RfqmJobOpts = {
                orderHash,
                metaTransactionHash,
                createdAt,
                expiry,
                chainId,
                integratorId,
                makerUri,
                status: RfqmJobStatus.InQueue,
                statusReason: null,
                calldata,
                fee: feeToStoredFee(fee),
                order: v4RfqOrderToStoredOrder(order),
            };
            await dbUtils.writeRfqmJobToDbAsync(rfqmJobOpts);

            const rfqmTransactionSubmissionEntityOpts: RfqmTransactionSubmissionEntityOpts = {
                transactionHash,
                orderHash,
                createdAt,
                from,
                to,
                gasPrice,
                gasUsed,
                blockMined,
                nonce,
                status: RfqmTranasctionSubmissionStatus.Submitted,
                statusReason: null,
            };
            const testEntity = new RfqmTransactionSubmissionEntity(rfqmTransactionSubmissionEntityOpts);
            await dbUtils.writeRfqmTransactionSubmissionToDbAsync(rfqmTransactionSubmissionEntityOpts);

            const dbEntity = await dbUtils.findRfqmTransactionSubmissionByTransactionHashAsync(transactionHash);

            // the saved + read entity should match the original entity in information
            expect(dbEntity).to.deep.eq(testEntity);
        });
        it('should be able to update a transaction submission entity', async () => {
            // need a pre-existing job entity bc of foreign key
            const rfqmJobOpts: RfqmJobOpts = {
                orderHash,
                metaTransactionHash,
                createdAt,
                expiry,
                chainId,
                integratorId,
                makerUri,
                status: RfqmJobStatus.InQueue,
                statusReason: null,
                calldata,
                fee: feeToStoredFee(fee),
                order: v4RfqOrderToStoredOrder(order),
            };
            await dbUtils.writeRfqmJobToDbAsync(rfqmJobOpts);

            const rfqmTransactionSubmissionEntityOpts: Partial<RfqmTransactionSubmissionEntity> = {
                transactionHash,
                orderHash,
                createdAt,
                from,
                to,
                gasPrice,
                gasUsed,
                blockMined,
                nonce,
                status: RfqmTranasctionSubmissionStatus.Submitted,
                statusReason: null,
            };

            await dbUtils.writeRfqmTransactionSubmissionToDbAsync(rfqmTransactionSubmissionEntityOpts);

            const initialEntity = await dbUtils.findRfqmTransactionSubmissionByTransactionHashAsync(transactionHash);

            const updatedAt = new Date();
            const newBlockMined = new BigNumber(5);
            const newGasUsed = new BigNumber('165000');
            const newStatus = RfqmTranasctionSubmissionStatus.Successful;

            initialEntity!.updatedAt = updatedAt;
            initialEntity!.blockMined = newBlockMined;
            initialEntity!.gasUsed = newGasUsed;
            initialEntity!.status = newStatus;

            await dbUtils.updateRfqmTransactionSubmissionsAsync([initialEntity!]);

            const updatedEntity = await dbUtils.findRfqmTransactionSubmissionByTransactionHashAsync(transactionHash);

            // the saved + read entity should match the original entity in information
            expect(updatedEntity?.updatedAt).to.deep.eq(updatedAt);
            expect(updatedEntity?.blockMined).to.deep.eq(newBlockMined);
            expect(updatedEntity?.gasUsed).to.deep.eq(newGasUsed);
            expect(updatedEntity?.status).to.deep.eq(newStatus);
            expect(updatedEntity?.createdAt).to.deep.eq(createdAt);
        });
    });
});
// tslint:disable-line:max-file-line-count
