import { BigNumber } from '@0x/utils';
import { Counter } from 'prom-client';

import {
    SLIPPAGE_MODEL_MINIMUM_APPLICABLE_VOLUME_USD,
    SLIPPAGE_MODEL_REFRESH_INTERVAL_MS,
    SLIPPAGE_MODEL_S3_BUCKET_NAME,
    SLIPPAGE_MODEL_S3_FILE_NAME,
    SLIPPAGE_MODEL_S3_FILE_VALID_INTERVAL_MS,
} from '../config';
import { ONE_IN_BASE_POINTS } from '../constants';
import { logger } from '../logger';
import { schemas } from '../schemas';
import { GetSwapQuoteResponseLiquiditySource } from '../types';

import { pairUtils } from './pair_utils';
import { S3Client } from './s3_client';
import { schemaUtils } from './schema_utils';

const SLIPPAGE_MODEL_FILE_STALE = new Counter({
    name: 'slippage_model_file_stale',
    help: 'Slippage model file in S3 goes stale',
    labelNames: ['bucket', 'fileName'],
});

export interface SlippageModel {
    token0: string;
    token1: string;
    source: string;
    slippageCoefficient: number;
    volumeCoefficient: number;
    intercept: number;
    token0PriceInUsd: number;
}

type SlippageModelCacheForPair = Map<string, SlippageModel>;
type SlippageModelCache = Map<string, SlippageModelCacheForPair>;

/**
 * Create an in-memory cache for all slippage models loaded from file.
 */
const createSlippageModelCache = (slippageModelFileContent: string, logLabels: {}): SlippageModelCache => {
    const slippageModelList: SlippageModel[] = JSON.parse(slippageModelFileContent);
    schemaUtils.validateSchema(slippageModelList, schemas.slippageModelFileSchema);
    const cache: SlippageModelCache = new Map();
    slippageModelList.forEach((slippageModel) => {
        const pairKey = pairUtils.toKey(slippageModel.token0, slippageModel.token1);
        if (!pairKey.startsWith(slippageModel.token0.toLowerCase())) {
            logger.warn(
                {
                    ...logLabels,
                    token0: slippageModel.token0,
                    token1: slippageModel.token1,
                    source: slippageModel.source,
                },
                'Invalid slippage model.',
            );
            return;
        }

        if (!cache.has(pairKey)) {
            cache.set(pairKey, new Map());
        }
        cache.get(pairKey)!.set(slippageModel.source, {
            token0: slippageModel.token0.toLowerCase(),
            token1: slippageModel.token1.toLowerCase(),
            source: slippageModel.source,
            slippageCoefficient: slippageModel.slippageCoefficient,
            volumeCoefficient: slippageModel.volumeCoefficient,
            intercept: slippageModel.intercept,
            token0PriceInUsd: slippageModel.token0PriceInUsd,
        });
    });
    return cache;
};

/**
 * Calculate `expectedSlippage` of an order based on slippage model
 */
const calculateExpectedSlippageForModel = (
    token0Amount: BigNumber,
    maxSlippageRate: BigNumber,
    slippageModel: SlippageModel,
): BigNumber | null => {
    const volumeUsd = token0Amount.times(slippageModel.token0PriceInUsd);

    // Volume is too small for a reasonable prediction
    if (volumeUsd.lte(SLIPPAGE_MODEL_MINIMUM_APPLICABLE_VOLUME_USD)) {
        return null;
    }

    const volumeTerm = volumeUsd.times(slippageModel.volumeCoefficient);
    const slippageTerm = maxSlippageRate.times(ONE_IN_BASE_POINTS).times(slippageModel.slippageCoefficient);
    const expectedSlippage = slippageTerm.plus(volumeTerm).plus(slippageModel.intercept);
    const expectedSlippageCap = maxSlippageRate.times(-1); // `maxSlippageRate` is specified with a postive number while `expectedSlippage` is normally negative.
    return expectedSlippage.lt(expectedSlippageCap) ? expectedSlippageCap : expectedSlippage;
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
     * Calculate the weighted average of `expectedSlippage` over all sources.
     */
    public calculateExpectedSlippage(
        buyToken: string,
        sellToken: string,
        buyAmount: BigNumber,
        sellAmount: BigNumber,
        sources: GetSwapQuoteResponseLiquiditySource[],
        maxSlippageRate: number,
    ): BigNumber | null {
        const slippageModelCacheForPair = this._cachedSlippageModel.get(pairUtils.toKey(buyToken, sellToken)) || null;

        // Slippage models for given pair is not available
        if (slippageModelCacheForPair === null) {
            return null;
        }

        let expectedSlippage: BigNumber = new BigNumber(0);
        for (let source of sources) {
            if (source.proportion.isGreaterThan(0)) {
                const slippageModel = slippageModelCacheForPair.get(source.name) || null;
                if (slippageModel === null) {
                    // Slippage model for given source is not available
                    return null;
                } else {
                    const token0Amount = source.proportion.times(
                        slippageModel.token0 === buyToken.toLowerCase() ? buyAmount : sellAmount,
                    );

                    const expectedSlippageOfSource = calculateExpectedSlippageForModel(
                        token0Amount.times(source.proportion),
                        new BigNumber(maxSlippageRate),
                        slippageModel,
                    );

                    // Volume for given source is too small for a reasonable prediction
                    if (expectedSlippageOfSource === null) {
                        return null;
                    }

                    expectedSlippage = expectedSlippage.plus(source.proportion.times(expectedSlippageOfSource));
                }
            }
        }
        return expectedSlippage;
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

            // If the file does not exist, reset the in-memory cache
            if (!doesFileExist) {
                this._resetCache();
                return;
            }

            // If the file exists but is stale which indicate the data exporting job failed to run on time,
            // reset the in-memory cache while log the warning msg, and increase the `slippage_model_file_stale`
            // counter to potentially trigger an alert.
            if (lastModified! < new Date(refreshTime.getTime() - SLIPPAGE_MODEL_S3_FILE_VALID_INTERVAL_MS)) {
                logger.warn({ bucket, fileName, refreshTime }, `Slippage model file is stale.`);
                SLIPPAGE_MODEL_FILE_STALE.labels(bucket, fileName).inc();
                this._resetCache();
                return;
            }

            // If the file has been loaded, do nothing
            if (lastModified! <= this._lastRefreshed) {
                return;
            }

            // If the file is new, load the content to refresh the in-memory cache
            logger.info({ bucket, fileName, refreshTime }, `Start refreshing slippage models.`);

            const { content, lastModified: lastRefreshed } = await this._s3Client.getFileContentAsync(bucket, fileName);
            this._cachedSlippageModel = createSlippageModelCache(content, { bucket, fileName, refreshTime });
            this._lastRefreshed = lastRefreshed;

            logger.info({ bucket, fileName, refreshTime }, `Successfully refreshed slippage models.`);
        } catch (error) {
            logger.error(
                { bucket, fileName, refreshTime, errorMessage: error.message, errorCode: error.code },
                `Failed to refresh slippage models.`,
            );
        }
    }
}
