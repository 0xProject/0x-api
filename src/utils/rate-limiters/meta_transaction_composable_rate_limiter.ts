import { MetaTransactionRateLimiterResponse } from '../../types';

import { MetaTransactionRateLimiter } from './base_limiter';

export class MetaTransactionComposableLimiter extends MetaTransactionRateLimiter {
    private readonly _rateLimiters: MetaTransactionRateLimiter[];

    constructor(rateLimiters: MetaTransactionRateLimiter[]) {
        super();
        if (rateLimiters.length === 0) {
            throw new Error('no rate limiters added to MetaTransactionComposableLimiter');
        }
        this._rateLimiters = rateLimiters;
    }

    public async isAllowedAsync(apiKey: string, takerAddress: string): Promise<MetaTransactionRateLimiterResponse> {
        for (const rateLimiter of this._rateLimiters) {
            const { isAllowed, reason } = await rateLimiter.isAllowedAsync(apiKey, takerAddress);
            if (!isAllowed) {
                return { isAllowed, reason };
            }
        }

        return { isAllowed: true, reason: '' };
    }
}
