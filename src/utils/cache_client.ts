import { RedisClient } from 'redis';

const OTC_ORDER_NONCE_BUCKET_COUNTER_KEY = 'otcorder.nonce.bucket.counter';

export class CacheClient {
    constructor(private readonly _redisClient: RedisClient) {}

    public async getNextOtcOrderBucketAsync(): Promise<number> {
        return new Promise((resolve, reject) => {
            this._redisClient.incr(OTC_ORDER_NONCE_BUCKET_COUNTER_KEY, (err, valueAfterIncr) => {
                if (err) {
                    reject(err);
                }
                resolve(valueAfterIncr);
            });
        });
    }
}
