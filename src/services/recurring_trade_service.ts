import { Connection, Repository } from 'typeorm';

import { RecurringTradeEntity } from '../entities';
import { RecurringTradeEntityOpts } from '../entities/types';

export class RecurringTradeService {
    private readonly _connection: Connection;
    private readonly _recurringTradeEntityRepository: Repository<RecurringTradeEntity>;

    constructor(dbConnection: Connection) {
        this._connection = dbConnection;
        this._recurringTradeEntityRepository = this._connection.getRepository(RecurringTradeEntity);
    }

    public async getAllRecurringTradesAsync(): Promise<RecurringTradeEntity[]> {
        const result = await this._recurringTradeEntityRepository.find();
        return result;
    }

    public async createRecurringTradeAsync(
        recurringTradeEntityOpts: RecurringTradeEntityOpts,
    ): Promise<RecurringTradeEntity> {
        const recurringTradeEntity = RecurringTradeEntity.make(recurringTradeEntityOpts);
        await this._recurringTradeEntityRepository.save(recurringTradeEntity);
        return recurringTradeEntity;
    }
}
