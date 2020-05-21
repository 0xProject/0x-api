import { Connection, Repository } from 'typeorm';

import { TransactionEntity } from '../../entities';

import { MetaTransactionRateLimiter } from './base_limiter';

export class MetaTransactionDailyLimiter extends MetaTransactionRateLimiter {
    private readonly _transactionRepository: Repository<TransactionEntity>;
    private readonly _dailyLimit: number;

    constructor(dbConnection: Connection, dailyLimit: number) {
        super();
        this._transactionRepository = dbConnection.getRepository(TransactionEntity);
        this._dailyLimit = dailyLimit;
    }

    public async isAllowedAsync(apiKey: string): Promise<boolean> {
        const { count } = await this._transactionRepository
            .createQueryBuilder('tx')
            .select('COUNT(*)', 'count')
            .where('tx.api_key = :apiKey', { apiKey })
            .andWhere('DATE(tx.created_at) = CURRENT_DATE')
            .getRawOne();

        return parseInt(count, 10) < this._dailyLimit;
    }
    public info(): string {
        return `daily limit of ${this._dailyLimit} meta transactions`;
    }
}
