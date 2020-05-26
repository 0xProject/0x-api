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

    public async isAllowedAsync(apiKey: string): Promise<MetaTransactionRateLimiterResponse> {
        let isUltimatelyAllowed = true;
        let ultimateReason = '';
        for (const rateLimiter of this._rateLimiters) {
            const { isAllowed, reason } = await rateLimiter.isAllowedAsync(apiKey);
            if (!isAllowed) {
                isUltimatelyAllowed = false;
                ultimateReason = ultimateReason.length === 0 ? reason : `${ultimateReason} & ${reason}`;
            }
        }

        return { isAllowed: isUltimatelyAllowed, reason: ultimateReason };
    }
}
