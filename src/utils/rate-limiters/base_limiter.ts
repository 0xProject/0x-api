export abstract class MetaTransactionRateLimiter {
    public abstract async isAllowedAsync(apiKey: string): Promise<boolean>;
    public abstract info(): string;
}
