import { BigNumber } from '@0x/asset-swapper';
import { expect } from '@0x/contracts-test-utils';
import { RfqOrder } from '@0x/protocol-utils';
import { Fee } from '@0x/quote-server/lib/src/types';
import 'mocha';
import { Connection } from 'typeorm';

import { getDBConnectionAsync } from '../src/db_connection';
import { RfqmJobEntity, RfqmQuoteEntity } from '../src/entities';
import { RfqmJobOpts, RfqmJobStatus } from '../src/services/rfqm_service';

import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';

// Force reload of the app avoid variables being polluted between test suites
delete require.cache[require.resolve('../src/app')];

const SUITE_NAME = 'rfqm db test';

describe(SUITE_NAME, () => {
    let connection: Connection;

    const createdAt = new Date();
    // it's expired if it's over 9000
    const expiry = new BigNumber(9000);
    const chainId = 1;
    const makerUri = 'https://marketmaking.over9000.io';

    const metaTransactionHash = '0x5678';
    const calldata = '0xfillinganorder';
    const fee: Fee = {
        token: '0xatoken',
        amount: new BigNumber(5),
        type: 'fixed',
    };

    const order = new RfqOrder({
        txOrigin: '0xsomeone',
        taker: '0xataker',
        maker: '0xamaker',
        makerToken: '0xamakertoken',
        takerToken: '0xatakertoken',
        expiry,
        salt: new BigNumber(1),
        chainId,
        verifyingContract: '0xacontract',
        pool: '0x1',
    });

    const orderHash = order.getHash();

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        connection = await getDBConnectionAsync();
        await connection.synchronize(true);
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
    });

    describe('rfqm db tests', () => {
        it('should be able to save and read an rfqm job entity w/ no change', async () => {
            const testRfqmQuoteEntity = new RfqmQuoteEntity({
                orderHash,
                metaTransactionHash,
                createdAt,
                chainId,
                makerUri,
                fee,
                order,
            });

            const quoteRepository = connection.getRepository(RfqmQuoteEntity);
            await quoteRepository.save(testRfqmQuoteEntity);
            const dbEntity = await quoteRepository.findOne();

            // the saved + read entity should match the original entity in information
            expect(dbEntity!.chainId).to.deep.eq(testRfqmQuoteEntity.chainId);
            expect(dbEntity!.makerUri).to.deep.eq(testRfqmQuoteEntity.makerUri);
            expect(dbEntity!.createdAt).to.deep.eq(testRfqmQuoteEntity.createdAt);
            expect(dbEntity!.orderHash).to.deep.eq(testRfqmQuoteEntity.orderHash);
            expect(dbEntity!.metaTransactionHash).to.deep.eq(testRfqmQuoteEntity.metaTransactionHash);
            expect(dbEntity!.integratorId).to.deep.eq(null);
            expect(new RfqOrder(dbEntity!.order!).getHash()).to.deep.eq(orderHash);
        });
        it('should be able to save and read an rfqm job entity w/ no change', async () => {
            const rfqmJobOpts: RfqmJobOpts = {
                orderHash,
                metaTransactionHash,
                createdAt,
                expiry,
                chainId,
                integratorId: null,
                makerUri,
                status: RfqmJobStatus.InQueue,
                statusReason: null,
                calldata,
                fee,
                order,
            };
            const testRfqmJobEntity = new RfqmJobEntity(rfqmJobOpts);

            const jobRepository = connection.getRepository(RfqmJobEntity);
            await jobRepository.save(testRfqmJobEntity);
            const dbEntity = await jobRepository.findOne();

            // the saved + read entity should match the original entity in information
            expect(dbEntity!.orderHash).to.deep.eq(testRfqmJobEntity.orderHash);
            expect(dbEntity!.metaTransactionHash).to.deep.eq(testRfqmJobEntity.metaTransactionHash);
            expect(dbEntity!.createdAt).to.deep.eq(testRfqmJobEntity.createdAt);
            expect(dbEntity!.chainId).to.deep.eq(testRfqmJobEntity.chainId);
            expect(dbEntity!.makerUri).to.deep.eq(testRfqmJobEntity.makerUri);
            expect(dbEntity!.expiry).to.deep.eq(testRfqmJobEntity.expiry);
            expect(dbEntity!.integratorId).to.deep.eq(null);
            expect(dbEntity!.status).to.deep.eq(testRfqmJobEntity.status);
            expect(dbEntity!.statusReason).to.deep.eq(null);
            expect(dbEntity!.calldata).to.deep.eq(testRfqmJobEntity.calldata);
            expect(new RfqOrder(dbEntity!.order!).getHash()).to.deep.eq(orderHash);
        });
    });
});

// tslint:disable-line:max-file-line-count
