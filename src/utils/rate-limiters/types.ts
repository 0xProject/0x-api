export enum AvailableRateLimiter {
    Daily = 'daily',
    Rolling = 'rolling',
    RollingValue = 'rollingValue',
}

export enum RollingLimiterIntervalUnit {
    Hours = 'hours',
    Minutes = 'minutes',
}

export enum DatabaseKeysUsedForRateLimiter {
    ApiKey = 'api_key',
    TakerAddress = 'taker_address',
}

export interface MetaTransactionRateLimiterContext {
    apiKey: string;
    takerAddress: string;
}
