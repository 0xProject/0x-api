import { RitualBridgeContract } from '@0x/contracts-asset-proxy';
import { SupportedProvider } from '@0x/order-utils';
import { logUtils } from '@0x/utils';
import * as cron from 'node-cron';
import { Connection, Repository } from 'typeorm';

import { CHAIN_ID } from '../config';
import { RITUAL_BRIDGE_ADDRESSES } from '../constants';
import { RecurringTradeEntity } from '../entities';
import { RecurringTradeEntityOpts } from '../entities/types';

export class RecurringTradeService {
    private readonly _connection: Connection;
    private readonly _recurringTradeEntityRepository: Repository<RecurringTradeEntity>;
    private readonly _ritualBridgeWrapper: RitualBridgeContract;

    constructor(dbConnection: Connection, provider: SupportedProvider) {
        this._connection = dbConnection;
        this._recurringTradeEntityRepository = this._connection.getRepository(RecurringTradeEntity);
        this._ritualBridgeWrapper = new RitualBridgeContract(RITUAL_BRIDGE_ADDRESSES[CHAIN_ID], provider);
    }

    public async runCronJobAsync(): Promise<void> {
        // run job every minute
        cron.schedule(`0 * * * * *`, async () => {
            await this.checkForUpdatesAsync();
            await this.tradeIfTradableAsync();
            logUtils.log(`it's running`);
        });
    }

    public async checkForUpdatesAsync(): Promise<void> {
        const activePendingRecurringTrades = await this._recurringTradeEntityRepository.find({
            where: [
              { status: 'pending' },
              { status: 'active' },
            ],
        });
        const idsToCheck = activePendingRecurringTrades.map(x => x.id);

        logUtils.log(idsToCheck);

        idsToCheck.map(id => {
            const onChainInfo = this._ritualBridgeWrapper.recurringBuys(id);
            logUtils.log(onChainInfo);
        });

        // re-save entities for which we have contract data
    }

    public async tradeIfTradableAsync(): Promise<void> {
        const activeRecurringTrades = await this._recurringTradeEntityRepository.find({
            where: [
              { status: 'active' },
            ],
        });
        const idsToCheck = activeRecurringTrades.map(x => x.id);

        logUtils.log(idsToCheck);
    }

    public async getAllRecurringTradesAsync(): Promise<RecurringTradeEntity[]> {
        const result = await this._recurringTradeEntityRepository.find();
        return result;
    }

    public async getRecurringTradesByTraderAsync(trader: string): Promise<RecurringTradeEntity[]> {
        const result = await this._recurringTradeEntityRepository.find({
            where: [
              { trader },
            ],
        });
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
