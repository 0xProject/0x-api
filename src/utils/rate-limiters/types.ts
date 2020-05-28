export enum AvailableRateLimiter {
    Daily = 'daily',
    Rolling = 'rolling',
}

export enum RollingLimiterIntervalUnit {
    Hours = 'hours',
    Minutes = 'minutes',
}

export enum DatabaseKeysUsedForRateLimiter {
    ApiKey = 'api_key',
    TakerAddress = 'taker_address',
}
