import {
    SLIPPAGE_MODEL_REFRESH_INTERVAL_MS,
    SLIPPAGE_MODEL_S3_BUCKET_NAME,
    SLIPPAGE_MODEL_S3_FILE_NAME,
} from '../config';
import { logger } from '../logger';
import { schemas } from '../schemas';

import { pairUtils } from './pair_utils';
import { S3Client } from './s3_client';
import { schemaUtils } from './schema_utils';

export interface SlippageModelPayload {
    slippageCoefficient: number;
    volumeCoefficient: number;
    intercept: number;
}

export interface SlippageModel extends SlippageModelPayload {
    token0: string;
    token1: string;
    source: string;
}

export type SlippageModelCacheForPair = Map<string, SlippageModelPayload>;
export type SlippageModelCache = Map<string, SlippageModelCacheForPair>;

const createSlippageModelCache = (slippageModelFileContent: string): SlippageModelCache => {
    const slippageModelList: SlippageModel[] = JSON.parse(slippageModelFileContent);
    schemaUtils.validateSchema(slippageModelList, schemas.slippageModelFileSchema);
    const cache: SlippageModelCache = new Map();
    slippageModelList.forEach((slippageModel) => {
        const pairKey = pairUtils.toKey(slippageModel.token0, slippageModel.token1);
        if (!cache.has(pairKey)) {
            cache.set(pairKey, new Map());
        }
        cache.get(pairKey)!.set(slippageModel.source, {
            slippageCoefficient: slippageModel.slippageCoefficient,
            volumeCoefficient: slippageModel.volumeCoefficient,
            intercept: slippageModel.intercept,
        });
    });
    return cache;
};

/**
 * SlippageModelManager caches slippage model data in memory and keep in sync with the file in S3 bucket
 */
export class SlippageModelManager {
    private _lastRefreshed!: Date;
    private _cachedSlippageModel!: SlippageModelCache;

    constructor(private readonly _s3Client: S3Client) {
        this._resetCache();
    }

    /**
     * Initialize and set up periodical refreshing
     */
    public async initializeAsync(): Promise<void> {
        if (SLIPPAGE_MODEL_S3_BUCKET_NAME === undefined) {
            return;
        }

        await this._refreshAsync();

        setInterval(async () => {
            await this._refreshAsync();
        }, SLIPPAGE_MODEL_REFRESH_INTERVAL_MS);
    }

    /**
     * Get the cached slippage model data for a specific pair and source
     * @param tokenA Address of one token
     * @param tokenB Address of another token
     * @returns Slippage model data cache for that pair of tokens
     */
    public getCacheForPair(tokenA: string, tokenB: string): SlippageModelCacheForPair | undefined {
        const pairKey = pairUtils.toKey(tokenA, tokenB);
        return this._cachedSlippageModel.get(pairKey);
    }

    /**
     * Reset the cache and its timestamp
     */
    private _resetCache(): void {
        this._cachedSlippageModel = new Map();
        this._lastRefreshed = new Date(0);
    }

    /**
     * Refresh the cached data by reloading the slippage model data file from S3
     * if the file has been updated since `this._lastRefreshed`.
     */
    private async _refreshAsync(): Promise<void> {
        const bucket: string = SLIPPAGE_MODEL_S3_BUCKET_NAME!;
        const fileName: string = SLIPPAGE_MODEL_S3_FILE_NAME;
        const refreshTime = new Date();

        try {
            const { exists: doesFileExist, lastModified } = await this._s3Client.hasFileAsync(bucket, fileName);
            if (!doesFileExist) {
                this._resetCache();
                return;
            }

            if (lastModified! <= this._lastRefreshed) {
                return;
            }

            logger.info({ bucket, fileName, refreshTime }, `Start refreshing slippage models.`);

            const { content, lastModified: lastRefreshed } = await this._s3Client.getFileContentAsync(bucket, fileName);
            this._cachedSlippageModel = createSlippageModelCache(content);
            this._lastRefreshed = lastRefreshed;

            logger.info({ bucket, fileName, refreshTime }, `Successfully refreshed slippage models.`);
        } catch (error) {
            logger.error(
                { bucket, fileName, refreshTime, errorMessage: error.message },
                `Failed to refresh slippage models.`,
            );
        }
    }
}
