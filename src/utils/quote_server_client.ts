import { SchemaValidator } from '@0x/json-schemas';
import { schemas, SubmitRequest } from '@0x/quote-server';
import { Fee } from '@0x/quote-server/lib/src/types';
import { BigNumber } from '@0x/utils';
import { AxiosInstance } from 'axios';
import { Summary } from 'prom-client';

import { RFQT_REQUEST_MAX_RESPONSE_MS } from '../config';
import { logger } from '../logger';

const MARKET_MAKER_LAST_LOOK_LATENCY = new Summary({
    name: 'market_maker_last_look_latency',
    help: 'Latency for Last Look request to Market Makers',
    labelNames: ['makerUri'],
});

export class QuoteServerClient {
    private readonly _schemaValidator: SchemaValidator;

    private static _areFeesEqual(fee1: Fee, fee2: Fee): boolean {
        return fee1.amount.eq(fee2.amount) && fee1.token === fee2.token && fee1.type === fee2.type;
    }

    constructor(private readonly _axiosInstance: AxiosInstance) {
        this._schemaValidator = new SchemaValidator();
        this._schemaValidator.addSchema(schemas.feeSchema);
        this._schemaValidator.addSchema(schemas.submitRequestSchema);
        this._schemaValidator.addSchema(schemas.submitReceiptSchema);
    }

    public async confirmLastLookAsync(makerUri: string, payload: SubmitRequest): Promise<boolean> {
        const timerStopFn = MARKET_MAKER_LAST_LOOK_LATENCY.labels(makerUri).startTimer();
        try {
            const response = await this._axiosInstance.post(`${makerUri}/submit`, {
                params: payload,
                timeout: RFQT_REQUEST_MAX_RESPONSE_MS,
            });
            this._schemaValidator.validate(response.data, schemas.submitReceiptSchema);
            const responseFee: Fee = {
                amount: new BigNumber(response.data.fee.amount),
                token: response.data.fee.token,
                type: response.data.fee.type,
            };

            if (!QuoteServerClient._areFeesEqual(responseFee, payload.fee)) {
                throw new Error('Fee in response is not equal to fee in request');
            }

            return response.data.proceedWithFill;
        } catch (error) {
            logger.warn({ error, makerUri }, 'Encountered an error when confirming last look with market maker');
            return false;
        } finally {
            timerStopFn();
        }
    }
}
