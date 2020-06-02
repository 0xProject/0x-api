import { expect } from '@0x/contracts-test-utils';
import { BigNumber, hexUtils } from '@0x/utils';
import 'mocha';
import { Connection, Repository } from 'typeorm';

import { getDBConnectionAsync } from '../src/db_connection';
import { TransactionEntity } from '../src/entities';
import { TransactionStates } from '../src/types';
import {
    DatabaseKeysUsedForRateLimiter,
    MetaTransactionDailyLimiter,
    MetaTransactionRateLimiter,
    MetaTransactionRollingLimiter,
    RollingLimiterIntervalUnit,
} from '../src/utils/rate-limiters';
import { MetaTransactionComposableLimiter } from '../src/utils/rate-limiters/meta_transaction_composable_rate_limiter';
import { MetaTransactionRollingValueLimiter } from '../src/utils/rate-limiters/meta_transaction_value_limiter';

import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';

const SUITE_NAME = 'rate limiter tests';
const TEST_API_KEY = 'test-key';
const TEST_FIRST_TAKER_ADDRESS = 'one';
const TEST_SECOND_TAKER_ADDRESS = 'two';
const DAILY_LIMIT = 10;

let connection: Connection;
let transactionRepository: Repository<TransactionEntity>;
let dailyLimiter: MetaTransactionRateLimiter;
let rollingLimiter: MetaTransactionRollingLimiter;
let composedLimiter: MetaTransactionComposableLimiter;
let rollingLimiterForTakerAddress: MetaTransactionRollingLimiter;
let rollingValueLimiter: MetaTransactionRollingValueLimiter;

function* intGenerator(): Iterator<number> {
    let i = 0;
    while (true) {
        yield i++;
    }
}

const intGen = intGenerator();

const newTx = (
    apiKey: string,
    takerAddress?: string,
    values?: { value: number; gasPrice: number; gasUsed: number },
): TransactionEntity => {
    const tx = TransactionEntity.make({
        to: '',
        refHash: hexUtils.hash(intGen.next().value),
        takerAddress: takerAddress === undefined ? TEST_FIRST_TAKER_ADDRESS : takerAddress,
        apiKey,
        status: TransactionStates.Submitted,
        expectedMinedInSec: 123,
    });
    if (values !== undefined) {
        const { value, gasPrice, gasUsed } = values;
        tx.gasPrice = new BigNumber(gasPrice);
        tx.gasUsed = gasUsed;
        tx.value = new BigNumber(value);
    }
    return tx;
};

const generateNewTransactionsForKey = (
    apiKey: string,
    numberOfTransactions: number,
    takerAddress?: string,
    values?: { value: number; gasPrice: number; gasUsed: number },
): TransactionEntity[] => {
    const txes: TransactionEntity[] = [];
    for (let i = 0; i < numberOfTransactions; i++) {
        const tx = newTx(apiKey, takerAddress, values);
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
        dailyLimiter = new MetaTransactionDailyLimiter(DatabaseKeysUsedForRateLimiter.ApiKey, connection, {
            allowedDailyLimit: DAILY_LIMIT,
        });
        rollingLimiter = new MetaTransactionRollingLimiter(DatabaseKeysUsedForRateLimiter.ApiKey, connection, {
            allowedLimit: 10,
            intervalNumber: 1,
            intervalUnit: RollingLimiterIntervalUnit.Hours,
        });
        rollingLimiterForTakerAddress = new MetaTransactionRollingLimiter(
            DatabaseKeysUsedForRateLimiter.TakerAddress,
            connection,
            {
                allowedLimit: 2,
                intervalNumber: 1,
                intervalUnit: RollingLimiterIntervalUnit.Minutes,
            },
        );
        rollingValueLimiter = new MetaTransactionRollingValueLimiter(
            DatabaseKeysUsedForRateLimiter.TakerAddress,
            connection,
            {
                allowedLimitEth: 1,
                intervalNumber: 1,
                intervalUnit: RollingLimiterIntervalUnit.Hours,
            },
        );
        composedLimiter = new MetaTransactionComposableLimiter([
            dailyLimiter,
            rollingLimiter,
            rollingLimiterForTakerAddress,
        ]);
    });
    after(async () => {
        await teardownDependenciesAsync(SUITE_NAME);
    });
    describe('api key daily rate limiter', async () => {
        it('should not trigger within limit', async () => {
            const firstCheck = await dailyLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(firstCheck.isAllowed).to.be.true();
            await transactionRepository.save(generateNewTransactionsForKey(TEST_API_KEY, DAILY_LIMIT - 1));
            const secondCheck = await dailyLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(secondCheck.isAllowed).to.be.true();
        });
        it('should not trigger for other api keys', async () => {
            await transactionRepository.save(generateNewTransactionsForKey('0ther-key', DAILY_LIMIT));
            const { isAllowed } = await dailyLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(isAllowed).to.be.true();
        });
        it('should not trigger because of keys from a day before', async () => {
            const txes = generateNewTransactionsForKey(TEST_API_KEY, DAILY_LIMIT);
            await transactionRepository.save(txes);
            // tslint:disable-next-line:custom-no-magic-numbers
            await backdateTransactions(txes, 24, 'hours');
            const { isAllowed } = await dailyLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(isAllowed).to.be.true();
        });
        it('should trigger after limit', async () => {
            await transactionRepository.save(generateNewTransactionsForKey(TEST_API_KEY, 1));
            const { isAllowed } = await dailyLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(isAllowed).to.be.false();
        });
    });
    describe('api rolling rate limiter', async () => {
        before(async () => {
            await cleanTransactions();
        });
        it('shoult not trigger within limit', async () => {
            const firstCheck = await rollingLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(firstCheck.isAllowed).to.be.true();
            await transactionRepository.save(generateNewTransactionsForKey(TEST_API_KEY, DAILY_LIMIT - 1));
            const secondCheck = await rollingLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(secondCheck.isAllowed).to.be.true();
        });
        it('should not trigger because of keys from an interval before', async () => {
            const txes = generateNewTransactionsForKey(TEST_API_KEY, DAILY_LIMIT);
            await transactionRepository.save(txes);
            // tslint:disable-next-line:custom-no-magic-numbers
            await backdateTransactions(txes, 61, 'minutes');
            const { isAllowed } = await rollingLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(isAllowed).to.be.true();
        });
        it('should trigger after limit', async () => {
            const txes = generateNewTransactionsForKey(TEST_API_KEY, 1);
            await transactionRepository.save(txes);
            // tslint:disable-next-line:custom-no-magic-numbers
            await backdateTransactions(txes, 15, 'minutes');
            const { isAllowed } = await rollingLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(isAllowed).to.be.false();
        });
    });
    describe('api composable rate limiter', () => {
        before(async () => {
            await cleanTransactions();
        });

        it('should not trigger within limits', async () => {
            const firstCheck = await composedLimiter.isAllowedAsync(TEST_API_KEY, TEST_SECOND_TAKER_ADDRESS);
            expect(firstCheck.isAllowed).to.be.true();
        });

        it('should trigger for the first taker address, but not the second', async () => {
            // tslint:disable-next-line:custom-no-magic-numbers
            const txes = generateNewTransactionsForKey(TEST_API_KEY, 2, TEST_FIRST_TAKER_ADDRESS);
            await transactionRepository.save(txes);
            const firstTakerCheck = await composedLimiter.isAllowedAsync(TEST_API_KEY, TEST_FIRST_TAKER_ADDRESS);
            expect(firstTakerCheck.isAllowed).to.be.false();
            const secondTakerCheck = await composedLimiter.isAllowedAsync(TEST_API_KEY, TEST_SECOND_TAKER_ADDRESS);
            expect(secondTakerCheck.isAllowed).to.be.true();
        });
        it('should trigger all rate limiters', async () => {
            // tslint:disable-next-line:custom-no-magic-numbers
            const txes = generateNewTransactionsForKey(TEST_API_KEY, 20, TEST_SECOND_TAKER_ADDRESS);
            await transactionRepository.save(txes);
            const check = await composedLimiter.isAllowedAsync(TEST_API_KEY, TEST_SECOND_TAKER_ADDRESS);
            expect(check.isAllowed).to.be.false();
        });
    });
    describe('value rate limiter', () => {
        before(async () => {
            await cleanTransactions();
        });
        // tslint:disable:custom-no-magic-numbers
        it('should not trigger when under value limit', async () => {
            const txes = generateNewTransactionsForKey(TEST_API_KEY, 5, TEST_SECOND_TAKER_ADDRESS, {
                value: 10 ** 17,
                gasPrice: 10 ** 9,
                gasUsed: 400000,
            });
            await transactionRepository.save(txes);
            const check = await rollingValueLimiter.isAllowedAsync(TEST_API_KEY, TEST_SECOND_TAKER_ADDRESS);
            expect(check.isAllowed).to.be.true();
        });
        it('should trigger when over value limit', async () => {
            const txes = generateNewTransactionsForKey(TEST_API_KEY, 10, TEST_SECOND_TAKER_ADDRESS, {
                value: 10 ** 18,
                gasPrice: 10 ** 9,
                gasUsed: 400000,
            });
            await transactionRepository.save(txes);
            const check = await rollingValueLimiter.isAllowedAsync(TEST_API_KEY, TEST_SECOND_TAKER_ADDRESS);
            expect(check.isAllowed).to.be.false();
        });
        // tslint:enable:custom-no-magic-numbers
    });
});
