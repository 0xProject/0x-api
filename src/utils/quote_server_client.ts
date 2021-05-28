import { SubmitReceipt, SubmitRequest } from '@0x/quote-server';
import { AxiosInstance } from 'axios';
import { Summary } from 'prom-client';

import { RFQT_REQUEST_MAX_RESPONSE_MS } from '../config';

const MARKET_MAKER_LAST_LOOK_LATENCY = new Summary({
    name: 'market_maker_last_look_latency',
    help: 'Latency for Last Look request to Market Makers',
    labelNames: ['makerUri'],
});

export class QuoteServerClient {
    private static _verifyResponse(response: any, payload: SubmitRequest): boolean {
        const { data } = response;
        if (data === undefined) {
            return false;
        }

        if (data.proceedWithFill !== undefined) {
            // data as SubmitReceipt;
            // validate the fee is expected
            const { fee } = data;
            if (
                fee.token === payload.fee.token &&
                fee.amount === payload.fee.amount.toString() &&
                fee.type === payload.fee.type
            ) {
                return data.proceedWithFill;
            }

            return data.proceedWithFill;
        }
        return true;
    }
    constructor(private readonly _axiosInstance: AxiosInstance) {}

    public async confirmLastLookAsync(makerUri: string, payload: SubmitRequest): Promise<boolean> {
        const timerStopFn = MARKET_MAKER_LAST_LOOK_LATENCY.labels(makerUri).startTimer();
        try {
            const response = await this._axiosInstance.post(`${makerUri}/submit`, {
                params: payload,
                timeout: RFQT_REQUEST_MAX_RESPONSE_MS,
            });
            return QuoteServerClient._verifyResponse(response, payload);
        } catch (err) {
        } finally {
            timerStopFn();
        }
        return true;
    }
}
