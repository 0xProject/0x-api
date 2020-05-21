import { Connection, Repository } from 'typeorm';

import { TransactionEntity } from '../../entities';

import { MetaTransactionRateLimiter } from './base_limiter';

export class MetaTransactionRollingLimiter extends MetaTransactionRateLimiter {
    private readonly _transactionRepository: Repository<TransactionEntity>;
    private readonly _limit: number;
    private readonly _intervalNumber: number;
    private readonly _intervalUnit: string;

    constructor(dbConnection: Connection, limit: number, intervalNumber: number, intervalUnit: 'hours' | 'minutes') {
        super();
        this._transactionRepository = dbConnection.getRepository(TransactionEntity);
        this._limit = limit;
        this._intervalNumber = intervalNumber;
        this._intervalUnit = intervalUnit;
    }

    public async isAllowedAsync(apiKey: string): Promise<boolean> {
        const { count } = await this._transactionRepository
            .createQueryBuilder('tx')
            .select('COUNT(*)', 'count')
            .where('tx.api_key = :apiKey', { apiKey })
            .andWhere('AGE(NOW(), tx.created_at) < :interval', {
                interval: `'${this._intervalNumber} ${this._intervalUnit}'`,
            })
            .getRawOne();

        return parseInt(count, 10) < this._limit;
    }
    public info(): string {
        return `limit of ${this._limit} meta transactions in the last ${this._intervalNumber} ${this._intervalUnit}`;
    }
}
