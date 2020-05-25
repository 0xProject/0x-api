import { expect } from '@0x/contracts-test-utils';
import { hexUtils } from '@0x/utils';
import 'mocha';
import { Connection, Repository } from 'typeorm';

import { getDBConnectionAsync } from '../src/db_connection';
import { TransactionEntity } from '../src/entities';
import { TransactionStates } from '../src/types';
import {
    MetaTransactionDailyLimiter,
    MetaTransactionRateLimiter,
    MetaTransactionRollingLimiter,
} from '../src/utils/rate-limiters';

import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';

const SUITE_NAME = 'rate limiter tests';
const TEST_API_KEY = 'test-key';
const DAILY_LIMIT = 10;

let connection: Connection;
let transactionRepository: Repository<TransactionEntity>;
let dailyLimiter: MetaTransactionRateLimiter;
let rollingLimiter: MetaTransactionRollingLimiter;

function* intGenerator(): Iterator<number> {
    let i = 0;
    while (true) {
        yield i++;
    }
}

const intGen = intGenerator();

const newTx = (apiKey: string): TransactionEntity => {
    const tx = TransactionEntity.make({
        to: '',
        refHash: hexUtils.hash(intGen.next().value),
        apiKey,
        status: TransactionStates.Submitted,
        expectedMinedInSec: 123,
    });
    return tx;
};

const generateNewTransactionsForKey = (apiKey: string, numberOfTransactions: number): TransactionEntity[] => {
    const txes: TransactionEntity[] = [];
    for (let i = 0; i < numberOfTransactions; i++) {
        const tx = newTx(apiKey);
        txes.push(tx);
    }

    return txes;
};

// NOTE: Because TypeORM does not allow us to override entities createdAt
// directly, we resort to a raw query.
const backdateTransactions = async (txes: TransactionEntity[], num: number, unit: string): Promise<void> => {
    const txesString = txes.map(tx => `'${tx.refHash}'`).join(',');
    await transactionRepository.query(
        `UPDATE transactions SET created_at = now() - interval '${num} ${unit}' WHERE transactions.ref_hash IN (${txesString});`,
    );
};

const cleanTransactions = async (): Promise<void> => {
    await transactionRepository.query('DELETE FROM transactions;');
};

describe(SUITE_NAME, () => {
    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);

        connection = await getDBConnectionAsync();
        transactionRepository = connection.getRepository(TransactionEntity);
        dailyLimiter = new MetaTransactionDailyLimiter(connection, DAILY_LIMIT);
        rollingLimiter = new MetaTransactionRollingLimiter(connection, 10, 1, 'hours');
    });
    after(async () => {
        await teardownDependenciesAsync(SUITE_NAME);
    });
    describe('api key daily rate limiter', async () => {
        it('should not trigger within limit', async () => {
            const firstCheck = await dailyLimiter.isAllowedAsync(TEST_API_KEY);
            expect(firstCheck.isAllowed).to.be.true();
            await transactionRepository.save(generateNewTransactionsForKey(TEST_API_KEY, DAILY_LIMIT - 1));
            const secondCheck = await dailyLimiter.isAllowedAsync(TEST_API_KEY);
            expect(secondCheck.isAllowed).to.be.true();
        });
        it('should not trigger for other api keys', async () => {
            await transactionRepository.save(generateNewTransactionsForKey('0ther-key', DAILY_LIMIT));
            const { isAllowed } = await dailyLimiter.isAllowedAsync(TEST_API_KEY);
            expect(isAllowed).to.be.true();
        });
        it('should not trigger because of keys from a day before', async () => {
            const txes = generateNewTransactionsForKey(TEST_API_KEY, DAILY_LIMIT);
            await transactionRepository.save(txes);
            // tslint:disable-next-line:custom-no-magic-numbers
            await backdateTransactions(txes, 24, 'hours');
            const { isAllowed } = await dailyLimiter.isAllowedAsync(TEST_API_KEY);
            expect(isAllowed).to.be.true();
        });
        it('should trigger after limit', async () => {
            await transactionRepository.save(generateNewTransactionsForKey(TEST_API_KEY, 1));
            const { isAllowed } = await dailyLimiter.isAllowedAsync(TEST_API_KEY);
            expect(isAllowed).to.be.false();
        });
    });
    describe('api rolling rate limiter', async () => {
        before(async () => {
            await cleanTransactions();
        });
        it('shoult not trigger within limit', async () => {
            const firstCheck = await rollingLimiter.isAllowedAsync(TEST_API_KEY);
            expect(firstCheck.isAllowed).to.be.true();
            await transactionRepository.save(generateNewTransactionsForKey(TEST_API_KEY, DAILY_LIMIT - 1));
            const secondCheck = await rollingLimiter.isAllowedAsync(TEST_API_KEY);
            expect(secondCheck.isAllowed).to.be.true();
        });
        it('should not trigger because of keys from an interval before', async () => {
            const txes = generateNewTransactionsForKey(TEST_API_KEY, DAILY_LIMIT);
            await transactionRepository.save(txes);
            // tslint:disable-next-line:custom-no-magic-numbers
            await backdateTransactions(txes, 61, 'minutes');
            const { isAllowed } = await rollingLimiter.isAllowedAsync(TEST_API_KEY);
            expect(isAllowed).to.be.true();
        });
        it('should trigger after limit', async () => {
            const txes = generateNewTransactionsForKey(TEST_API_KEY, 1);
            await transactionRepository.save(txes);
            // tslint:disable-next-line:custom-no-magic-numbers
            await backdateTransactions(txes, 15, 'minutes');
            const { isAllowed } = await rollingLimiter.isAllowedAsync(TEST_API_KEY);
            expect(isAllowed).to.be.false();
        });
    });
});
