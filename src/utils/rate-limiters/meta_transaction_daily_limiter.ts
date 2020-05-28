import { Connection, Repository } from 'typeorm';

import { TransactionEntity } from '../../entities';
import { MetaTransactionDailyLimiterConfig, MetaTransactionRateLimiterResponse } from '../../types';

import { MetaTransactionRateLimiter } from './base_limiter';
import { DatabaseKeysUsedForRateLimiter } from './types';

export class MetaTransactionDailyLimiter extends MetaTransactionRateLimiter {
    private readonly _transactionRepository: Repository<TransactionEntity>;
    private readonly _dailyLimit: number;
    private readonly _field: string;

    constructor(
        field: DatabaseKeysUsedForRateLimiter,
        dbConnection: Connection,
        config: MetaTransactionDailyLimiterConfig,
    ) {
        super();
        this._transactionRepository = dbConnection.getRepository(TransactionEntity);
        this._dailyLimit = config.allowedDailyLimit;
        this._field = field;
    }

    public async isAllowedAsync(apiKey: string, takerAddress: string): Promise<MetaTransactionRateLimiterResponse> {
        let key: string;
        switch (this._field) {
            case DatabaseKeysUsedForRateLimiter.ApiKey:
                key = apiKey;
                break;
            case DatabaseKeysUsedForRateLimiter.TakerAddress:
                key = takerAddress;
                break;
            default:
                throw new Error(`unsupported field configured for meta transaction rate limit: ${this._field}`);
        }
        const { count } = await this._transactionRepository
            .createQueryBuilder('tx')
            .select('COUNT(*)', 'count')
            .where(`tx.${this._field} = :key`, { key })
            .andWhere('DATE(tx.created_at) = CURRENT_DATE')
            .getRawOne();

        const isAllowed = parseInt(count, 10) < this._dailyLimit;
        return {
            isAllowed,
            reason: `daily limit of ${this._dailyLimit} meta transactions reached for given ${this._field}`,
        };
    }
}
