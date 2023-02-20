"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasPriceUtils = void 0;
const heartbeats = require("heartbeats");
const constants_1 = require("../constants");
const types_1 = require("../types");
const MAX_ERROR_COUNT = 5;
class GasPriceUtils {
    constructor(gasPricePollingIntervalInMs, zeroExGasApiUrl) {
        this._errorCount = 0;
        this._gasPriceHeart = heartbeats.createHeart(gasPricePollingIntervalInMs);
        this._zeroExGasApiUrl = zeroExGasApiUrl;
        this._initializeHeartBeat();
    }
    static getInstance(gasPricePollingIntervalInMs, zeroExGasApiUrl = constants_1.constants.ZERO_EX_GAS_API_URL) {
        if (!GasPriceUtils._instances.has(zeroExGasApiUrl)) {
            GasPriceUtils._instances.set(zeroExGasApiUrl, new GasPriceUtils(gasPricePollingIntervalInMs, zeroExGasApiUrl));
        }
        const instance = GasPriceUtils._instances.get(zeroExGasApiUrl);
        if (instance === undefined) {
            // should not be reachable
            throw new Error(`Singleton for ${zeroExGasApiUrl} was not initialized`);
        }
        return instance;
    }
    async getGasPriceEstimationOrDefault(defaultGasPrices) {
        if (this._gasPriceEstimation === undefined) {
            return defaultGasPrices;
        }
        return {
            ...defaultGasPrices,
            ...this._gasPriceEstimation,
        };
    }
    /** @returns gas price (in wei) */
    async getGasPriceEstimationOrThrowAsync() {
        if (this._gasPriceEstimation === undefined) {
            await this._updateGasPriceFromOracleOrThrow();
        }
        // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
        return this._gasPriceEstimation;
    }
    /**
     * Destroys any subscriptions or connections.
     */
    async destroyAsync() {
        this._gasPriceHeart.kill();
    }
    async _updateGasPriceFromOracleOrThrow() {
        try {
            const res = await fetch(this._zeroExGasApiUrl);
            const gasInfo = await res.json();
            // Reset the error count to 0 once we have a successful response
            this._errorCount = 0;
            this._gasPriceEstimation = gasInfo.result;
        }
        catch (e) {
            this._errorCount++;
            // If we've reached our max error count then throw
            if (this._errorCount > MAX_ERROR_COUNT || this._gasPriceEstimation === undefined) {
                this._errorCount = 0;
                throw new Error(types_1.SwapQuoterError.NoGasPriceProvidedOrEstimated);
            }
        }
    }
    _initializeHeartBeat() {
        this._gasPriceHeart.createEvent(1, async () => {
            await this._updateGasPriceFromOracleOrThrow();
        });
    }
}
exports.GasPriceUtils = GasPriceUtils;
GasPriceUtils._instances = new Map();
//# sourceMappingURL=gas_price_utils.js.map