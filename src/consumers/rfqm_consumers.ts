import { logger } from '../logger';

export class RfqmConsumers {
    /**
     * processJobAsync takes in a raw message from SQS and processes it as an RfqmJob
     */
    // TODO: remove tslint:disables once implemented
    // tslint:disable: no-empty
    // tslint:disable: prefer-function-over-method
    public async processJobAsync(orderHash: string): Promise<void> {
        logger.info(`DONE  ${orderHash}`);
        return Promise.reject('failing');
    }
}
