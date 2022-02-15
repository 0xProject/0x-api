import {
    SLIPPAGE_MODEL_DATA_REFRESH_INTERVAL_MS,
    SLIPPAGE_MODEL_DATA_S3_BUCKET_NAME,
    SLIPPAGE_MODEL_DATA_S3_FILE_NAME,
} from '../config';
import { logger } from '../logger';
import { schemas } from '../schemas';

import { pairUtils } from './pair_utils';
import { S3Client } from './s3_client';
import { schemaUtils } from './schema_utils';

export interface SlippageModelDataPayload {
    slippageCoefficient: number;
    volumeCoefficient: number;
    intercept: number;
}

interface SlippageModelData extends SlippageModelDataPayload {
    token0: string;
    token1: string;
    source: string;
}

type SlippageModelDataCache = Map<string, Map<string, SlippageModelDataPayload>>;

const createSlippageModelDataCache = function (slippageModelDataFileContent: string): SlippageModelDataCache {
    const slippageModelDataList: SlippageModelData[] = JSON.parse(slippageModelDataFileContent);
    schemaUtils.validateSchema(slippageModelDataList, schemas.slippageModelDataFileSchema);
    const cache: SlippageModelDataCache = new Map();
    slippageModelDataList.forEach((slippageModelData) => {
        const pairKey = pairUtils.toKey(slippageModelData.token0, slippageModelData.token1);
        if (!cache.has(pairKey)) {
            cache.set(pairKey, new Map());
        }
        cache.get(pairKey)!.set(slippageModelData.source, {
            slippageCoefficient: slippageModelData.slippageCoefficient,
            volumeCoefficient: slippageModelData.volumeCoefficient,
            intercept: slippageModelData.intercept,
        });
    });
    return cache;
};

/**
 * PairsManager abstracts away all operations for handling maker pairs
 */
export class SlippageModelDataManager {
    private _lastRefreshed: Date;
    private _cachedSlippageModelData: SlippageModelDataCache;

    constructor(private readonly _s3Client: S3Client) {
        this._lastRefreshed = new Date(0);
        this._cachedSlippageModelData = new Map();
    }

    /**
     * Initialize pairs data and set up periodical refreshing
     */
    public async initializeAsync(): Promise<void> {
        if (SLIPPAGE_MODEL_DATA_S3_BUCKET_NAME === undefined) {
            return;
        }

        await this._refreshAsync();

        setInterval(async () => {
            await this._refreshAsync();
        }, SLIPPAGE_MODEL_DATA_REFRESH_INTERVAL_MS);
    }

    public get(token0: string, token1: string, source: string): SlippageModelDataPayload | null {
        const pairKey = pairUtils.toKey(token0, token1);
        if (!this._cachedSlippageModelData.has(pairKey)) {
            return null;
        }
        const cachedSlippageModelDataForPair = this._cachedSlippageModelData.get(pairKey);
        if (!cachedSlippageModelDataForPair!.has(source)) {
            return null;
        }
        return cachedSlippageModelDataForPair!.get(source)!;
    }

    /**
     * Refresh the pairs information for each maker by querying database.
     * Emit an 'refreshed' event for subscribers to refresh if the operation is successful.
     */
    private async _refreshAsync(): Promise<void> {
        const bucket: string = SLIPPAGE_MODEL_DATA_S3_BUCKET_NAME!;
        const key: string = SLIPPAGE_MODEL_DATA_S3_FILE_NAME;
        const refreshTime = new Date();

        try {
            const { exists, lastModified } = await this._s3Client.hasFileAsync(bucket, key);
            if (!exists || lastModified === undefined || lastModified <= this._lastRefreshed) {
                return;
            }

            logger.info({ bucket, key, refreshTime }, `Start refreshing slippage model data.`);

            const { content, lastModified: lastRefreshed } = await this._s3Client.getFileContentAsync(bucket, key);

            if (content !== null && lastRefreshed !== undefined) {
                this._lastRefreshed = lastRefreshed;
                this._cachedSlippageModelData = createSlippageModelDataCache(content);
            }

            logger.info({ bucket, key, refreshTime }, `Successfully refreshed slippage model data.`);
        } catch (error) {
            logger.error(error);
        } finally {
        }
    }
}
