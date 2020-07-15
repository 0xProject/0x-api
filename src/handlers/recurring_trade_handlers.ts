import { BigNumber } from '@0x/utils';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';

import { RecurringTradeEntityOpts } from '../entities/types';
import { RecurringTradeService } from '../services/recurring_trade_service';

export class RecurringTradeHandlers {
    private readonly _recurringTradeService: RecurringTradeService;

    public static rootAsync(_req: express.Request, res: express.Response): void {
        const message = `This is the root of the Recurring Trades API.`;
        res.status(HttpStatus.OK).send({ message });
    }
    constructor(recurringTradeService: RecurringTradeService) {
        this._recurringTradeService = recurringTradeService;
    }
    public async getAllRecurringTradesAsync(res: express.Response): Promise<void> {
        const recurringTrades = await this._recurringTradeService.getAllRecurringTradesAsync();
        res.status(HttpStatus.OK).send(recurringTrades);
    }
    public async createRecurringTradeAsync(req: express.Request, res: express.Response): Promise<void> {
        const recurringTradeEntityOpts = parseRecurringTradeEntityOpts(req);
        const recurringTrade = await this._recurringTradeService.createRecurringTradeAsync(recurringTradeEntityOpts);
        res.status(HttpStatus.OK).send(recurringTrade);
    }
}

const parseRecurringTradeEntityOpts = (req: express.Request): RecurringTradeEntityOpts => {
    const traderAddress = req.query.traderAddress as string;
    const fromTokenAddress = req.query.fromTokenAddress as string;
    const toTokenAddress = req.query.toTokenAddress as string;
    const fromTokenAmount = new BigNumber(req.query.fromTokenAmount as string);
    const scheduleType = req.query.scheduleType as string;
    const status = req.query.status as string;

    return { traderAddress, fromTokenAddress, toTokenAddress, fromTokenAmount, scheduleType, status };
};
