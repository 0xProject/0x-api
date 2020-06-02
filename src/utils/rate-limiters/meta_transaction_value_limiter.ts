import { Connection, Repository } from 'typeorm';

import { TransactionEntity } from '../../entities';
import { MetaTransactionRateLimiterResponse, MetaTransactionRollingValueLimiterConfig } from '../../types';

import { MetaTransactionRateLimiter } from './base_limiter';
import { DatabaseKeysUsedForRateLimiter } from './types';

export class MetaTransactionRollingValueLimiter extends MetaTransactionRateLimiter {
    private readonly _transactionRepository: Repository<TransactionEntity>;
    private readonly _ethLimit: number;
    private readonly _intervalNumber: number;
    private readonly _intervalUnit: string;
    private readonly _field: string;

    constructor(
        field: DatabaseKeysUsedForRateLimiter,
        dbConnection: Connection,
        config: MetaTransactionRollingValueLimiterConfig,
    ) {
        super();
        this._transactionRepository = dbConnection.getRepository(TransactionEntity);
        this._ethLimit = config.allowedLimitEth;
        this._intervalNumber = config.intervalNumber;
        this._intervalUnit = config.intervalUnit;
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
        const { sum } = await this._transactionRepository
            .createQueryBuilder('tx')
            .select('SUM( (tx.gas_price * tx.gas_used / 10^18) + ( tx.value / 10^18 ) )', 'sum')
            .where(`tx.${this._field} = :key`, { key })
            .andWhere('AGE(NOW(), tx.created_at) < :interval', {
                interval: `'${this._intervalNumber} ${this._intervalUnit}'`,
            })
            .getRawOne();

        const isAllowed = parseFloat(sum) < this._ethLimit;
        return {
            isAllowed,
            reason: `limit of ${this._ethLimit} ETH spent in the last ${this._intervalNumber} ${this._intervalUnit}`,
        };
    }
}
