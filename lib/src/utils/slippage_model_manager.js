"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlippageModelManager = void 0;
const token_metadata_1 = require("@0x/token-metadata");
const utils_1 = require("@0x/utils");
const prom_client_1 = require("prom-client");
const asset_swapper_1 = require("../asset-swapper");
const config_1 = require("../config");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const schemas_1 = require("../schemas");
const pair_utils_1 = require("./pair_utils");
const schema_utils_1 = require("./schema_utils");
const SLIPPAGE_MODEL_FILE_STALE = new prom_client_1.Counter({
    name: 'slippage_model_file_stale',
    help: 'Slippage model file in S3 goes stale',
    labelNames: ['bucket', 'fileName'],
});
/**
 * Create an in-memory cache for all slippage models loaded from file.
 */
const createSlippageModelCache = (slippageModelFileContent, logLabels) => {
    const slippageModelList = JSON.parse(slippageModelFileContent);
    schema_utils_1.schemaUtils.validateSchema(slippageModelList, schemas_1.schemas.slippageModelFileSchema);
    const cache = new Map();
    slippageModelList.forEach((slippageModel) => {
        const pairKey = pair_utils_1.pairUtils.toKey(slippageModel.token0, slippageModel.token1);
        if (!pairKey.startsWith(slippageModel.token0.toLowerCase())) {
            logger_1.logger.warn({
                ...logLabels,
                token0: slippageModel.token0,
                token1: slippageModel.token1,
                source: slippageModel.source,
            }, 'Invalid slippage model.');
            return;
        }
        if (!cache.has(pairKey)) {
            cache.set(pairKey, new Map());
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        cache.get(pairKey).set(slippageModel.source, {
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
 * If the token is represented as 0xeeee.. than convert to the wrapped token
 * representation (e.g WETH)
 */
const normalizeTokenAddress = (token) => {
    const isNativeAsset = (0, token_metadata_1.isNativeSymbolOrAddress)(token, config_1.CHAIN_ID);
    return isNativeAsset ? asset_swapper_1.NATIVE_FEE_TOKEN_BY_CHAIN_ID[config_1.CHAIN_ID].toLowerCase() : token.toLowerCase();
};
/**
 * Calculate `expectedSlippage` of an order based on slippage model
 */
const calculateExpectedSlippageForModel = (token0Amount, maxSlippageRate, slippageModel) => {
    const volumeUsd = token0Amount.times(slippageModel.token0PriceInUsd);
    const volumeTerm = volumeUsd.times(slippageModel.volumeCoefficient);
    const slippageTerm = maxSlippageRate.times(constants_1.ONE_IN_BASE_POINTS).times(slippageModel.slippageCoefficient);
    const expectedSlippage = utils_1.BigNumber.sum(slippageTerm, volumeTerm, slippageModel.intercept);
    const expectedSlippageCap = maxSlippageRate.times(-1); // `maxSlippageRate` is specified with a positive number while `expectedSlippage` is normally negative.
    // Return 0 if the expected slippage is positive since the model shouldn't predict a positive slippage.
    return utils_1.BigNumber.min(new utils_1.BigNumber(0), utils_1.BigNumber.max(expectedSlippage, expectedSlippageCap));
};
/**
 * SlippageModelManager caches slippage model data in memory and keep in sync with the file in S3 bucket
 */
class SlippageModelManager {
    constructor(_s3Client) {
        this._s3Client = _s3Client;
        this._resetCache();
    }
    /**
     * Initialize and set up periodical refreshing
     */
    async initializeAsync() {
        if (config_1.SLIPPAGE_MODEL_S3_BUCKET_NAME === undefined) {
            return;
        }
        await this._refreshAsync();
        setInterval(async () => {
            await this._refreshAsync();
        }, config_1.SLIPPAGE_MODEL_REFRESH_INTERVAL_MS);
    }
    /**
     * Calculate the weighted average of `expectedSlippage` over all sources.
     */
    calculateExpectedSlippage(buyToken, sellToken, buyAmount, sellAmount, sources, maxSlippageRate) {
        const normalizedBuyToken = normalizeTokenAddress(buyToken);
        const normalizedSellToken = normalizeTokenAddress(sellToken);
        let expectedSlippage = new utils_1.BigNumber(0);
        for (const source of sources) {
            if (source.proportion.isEqualTo(0)) {
                continue;
            }
            const singleSourceSlippage = this._calculateSingleSourceExpectedSlippage(normalizedBuyToken, normalizedSellToken, buyAmount, sellAmount, source, maxSlippageRate);
            if (singleSourceSlippage === null) {
                return null;
            }
            expectedSlippage = expectedSlippage.plus(singleSourceSlippage);
        }
        return expectedSlippage;
    }
    _calculateSingleSourceExpectedSlippage(buyToken, sellToken, buyAmount, sellAmount, source, maxSlippageRate) {
        // For 0x native source, the source name should be '0x' instead of 'Native', but check both to be future proof.
        if (source.name === '0x' || source.name === asset_swapper_1.ERC20BridgeSource.Native) {
            return new utils_1.BigNumber(0);
        }
        const slippageModelCacheForPair = this._cachedSlippageModel.get(pair_utils_1.pairUtils.toKey(buyToken, sellToken));
        // Slippage models for given pair is not available
        if (slippageModelCacheForPair === undefined) {
            return null;
        }
        const slippageModel = slippageModelCacheForPair.get(source.name);
        if (slippageModel === undefined) {
            return null;
        }
        const token0Amount = source.proportion.times(slippageModel.token0 === buyToken.toLowerCase() ? buyAmount : sellAmount);
        const expectedSlippageOfSource = calculateExpectedSlippageForModel(token0Amount, new utils_1.BigNumber(maxSlippageRate), slippageModel);
        // Volume for given source is too small for a reasonable prediction
        if (expectedSlippageOfSource === null) {
            return null;
        }
        return source.proportion.times(expectedSlippageOfSource);
    }
    /**
     * Reset the cache and its timestamp
     */
    _resetCache() {
        this._cachedSlippageModel = new Map();
        this._lastRefreshed = new Date(0);
    }
    /**
     * Refresh the cached data by reloading the slippage model data file from S3
     * if the file has been updated since `this._lastRefreshed`.
     */
    async _refreshAsync() {
        const bucket = config_1.SLIPPAGE_MODEL_S3_BUCKET_NAME;
        if (bucket === undefined) {
            return;
        }
        const fileName = config_1.SLIPPAGE_MODEL_S3_FILE_NAME;
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
            if (lastModified < new Date(refreshTime.getTime() - config_1.SLIPPAGE_MODEL_S3_FILE_VALID_INTERVAL_MS)) {
                logger_1.logger.warn({ bucket, fileName, refreshTime }, `Slippage model file is stale.`);
                SLIPPAGE_MODEL_FILE_STALE.labels(bucket, fileName).inc();
                this._resetCache();
                return;
            }
            // If the file has been loaded, do nothing
            if (lastModified <= this._lastRefreshed) {
                return;
            }
            // If the file is new, load the content to refresh the in-memory cache
            logger_1.logger.info({ bucket, fileName, refreshTime }, `Start refreshing slippage models.`);
            const { content, lastModified: lastRefreshed } = await this._s3Client.getFileContentAsync(bucket, fileName);
            this._cachedSlippageModel = createSlippageModelCache(content, { bucket, fileName, refreshTime });
            this._lastRefreshed = lastRefreshed;
            logger_1.logger.info({ bucket, fileName, refreshTime }, `Successfully refreshed slippage models.`);
        }
        catch (error) {
            logger_1.logger.error({ bucket, fileName, refreshTime, errorMessage: error.message, errorCode: error.code }, `Failed to refresh slippage models.`);
        }
    }
}
exports.SlippageModelManager = SlippageModelManager;
//# sourceMappingURL=slippage_model_manager.js.map