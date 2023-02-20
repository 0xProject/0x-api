"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolFeeUtils = void 0;
const utils_1 = require("@0x/utils");
const heartbeats = require("heartbeats");
const constants_1 = require("../constants");
const types_1 = require("../types");
const MAX_ERROR_COUNT = 5;
class ProtocolFeeUtils {
    constructor(gasPricePollingIntervalInMs, zeroExGasApiUrl) {
        this._gasPriceEstimation = constants_1.constants.ZERO_AMOUNT;
        this._errorCount = 0;
        this._gasPriceHeart = heartbeats.createHeart(gasPricePollingIntervalInMs);
        this._zeroExGasApiUrl = zeroExGasApiUrl;
        this._initializeHeartBeat();
    }
    static getInstance(gasPricePollingIntervalInMs, zeroExGasApiUrl = constants_1.constants.ZERO_EX_GAS_API_URL) {
        if (!ProtocolFeeUtils._instances.has(zeroExGasApiUrl)) {
            ProtocolFeeUtils._instances.set(zeroExGasApiUrl, new ProtocolFeeUtils(gasPricePollingIntervalInMs, zeroExGasApiUrl));
        }
        const instance = ProtocolFeeUtils._instances.get(zeroExGasApiUrl);
        if (instance === undefined) {
            // should not be reachable
            throw new Error(`Singleton for ${zeroExGasApiUrl} was not initialized`);
        }
        return instance;
    }
    /** @returns gas price (in wei) */
    async getGasPriceEstimationOrThrowAsync(shouldHardRefresh) {
        if (this._gasPriceEstimation.eq(constants_1.constants.ZERO_AMOUNT)) {
            return this._getGasPriceFromGasStationOrThrowAsync();
        }
        if (shouldHardRefresh) {
            return this._getGasPriceFromGasStationOrThrowAsync();
        }
        else {
            return this._gasPriceEstimation;
        }
    }
    /**
     * Destroys any subscriptions or connections.
     */
    async destroyAsync() {
        this._gasPriceHeart.kill();
    }
    async _getGasPriceFromGasStationOrThrowAsync() {
        try {
            const res = await fetch(this._zeroExGasApiUrl);
            const gasInfo = await res.json();
            const gasPriceWei = new utils_1.BigNumber(gasInfo.result.fast);
            // Reset the error count to 0 once we have a successful response
            this._errorCount = 0;
            return gasPriceWei;
        }
        catch (e) {
            this._errorCount++;
            // If we've reached our max error count then throw
            if (this._errorCount > MAX_ERROR_COUNT || this._gasPriceEstimation.isZero()) {
                this._errorCount = 0;
                throw new Error(types_1.SwapQuoterError.NoGasPriceProvidedOrEstimated);
            }
            return this._gasPriceEstimation;
        }
    }
    _initializeHeartBeat() {
        this._gasPriceHeart.createEvent(1, async () => {
            this._gasPriceEstimation = await this._getGasPriceFromGasStationOrThrowAsync();
        });
    }
}
exports.ProtocolFeeUtils = ProtocolFeeUtils;
ProtocolFeeUtils._instances = new Map();
//# sourceMappingURL=protocol_fee_utils.js.map