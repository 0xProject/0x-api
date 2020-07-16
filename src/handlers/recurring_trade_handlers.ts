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
    public async getAllRecurringTradesAsync(_req: express.Request, res: express.Response): Promise<void> {
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
    const traderAddress = (req.body.traderAddress as string).toLowerCase();
    const bridgeAddress = (req.body.bridgeAddress as string).toLowerCase();
    const fromTokenAddress = (req.body.fromTokenAddress as string).toLowerCase();
    const toTokenAddress = (req.body.toTokenAddress as string).toLowerCase();
    const fromTokenAmount = new BigNumber(req.body.fromTokenAmount as string);
    const interval = new BigNumber(req.body.interval as string);
    const minBuyAmount = new BigNumber(req.body.minBuyAmount as string);
    const maxSlippageBps = new BigNumber(req.body.minBuyAmount as string);
    // tslint:disable-next-line: boolean-naming
    const unwrapWeth = (req.body.minBuyAmount as boolean);

    return { traderAddress, bridgeAddress, fromTokenAddress, toTokenAddress, fromTokenAmount, interval, minBuyAmount, maxSlippageBps, unwrapWeth };
};
