import { Connection, Repository } from 'typeorm';

import { TransactionEntity } from '../../entities';
import { MetaTransactionDailyLimiterConfig, MetaTransactionRateLimiterResponse } from '../../types';

import { MetaTransactionRateLimiter } from './base_limiter';

export class MetaTransactionDailyLimiter extends MetaTransactionRateLimiter {
    private readonly _transactionRepository: Repository<TransactionEntity>;
    private readonly _dailyLimit: number;

    constructor(dbConnection: Connection, config: MetaTransactionDailyLimiterConfig) {
        super();
        this._transactionRepository = dbConnection.getRepository(TransactionEntity);
        this._dailyLimit = config.allowedDailyLimit;
    }

    public async isAllowedAsync(apiKey: string): Promise<MetaTransactionRateLimiterResponse> {
        const { count } = await this._transactionRepository
            .createQueryBuilder('tx')
            .select('COUNT(*)', 'count')
            .where('tx.api_key = :apiKey', { apiKey })
            .andWhere('DATE(tx.created_at) = CURRENT_DATE')
            .getRawOne();

        const isAllowed = parseInt(count, 10) < this._dailyLimit;
        return { isAllowed, reason: `daily limit of ${this._dailyLimit} meta transactions` };
    }
}
