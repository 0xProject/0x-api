"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairsManager = void 0;
const EventEmitter = require("events");
const prom_client_1 = require("prom-client");
const config_1 = require("../config");
const logger_1 = require("../logger");
const RFQ_MAKER_PAIRS_REFRESH_FAILED = new prom_client_1.Counter({
    name: 'rfq_maker_pairs_refresh_failed',
    help: 'A pair refreshing job failed.',
    labelNames: ['chainId', 'workflow'],
});
const RFQ_MAKER_PAIRS_REFRESH_SUCCEEDED = new prom_client_1.Counter({
    name: 'rfq_maker_pairs_refresh_succeeded',
    help: 'A pair refreshing job succeeded.',
    labelNames: ['chainId', 'workflow'],
});
const RFQ_MAKER_PAIRS_REFRESH_LATENCY = new prom_client_1.Summary({
    name: 'rfq_maker_pairs_refresh_latency',
    help: 'Latency for the maker pair refreshing job.',
    labelNames: ['chainId', 'workflow'],
});
const RfqMakerUrlField = `${config_1.RFQ_WORKFLOW}MakerUri`;
/**
 * Returns Asset Offerings from an RfqMakerConfig map and a list of RfqMakerPairs
 */
const generateAssetOfferings = (makerConfigMap, makerPairsList) => {
    return makerPairsList.reduce((offering, pairs) => {
        if (makerConfigMap.has(pairs.makerId)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            const makerConfig = makerConfigMap.get(pairs.makerId);
            offering[makerConfig[RfqMakerUrlField]] = pairs.pairs;
        }
        return offering;
    }, {});
};
/**
 * PairsManager abstracts away all operations for handling maker pairs
 */
class PairsManager extends EventEmitter {
    constructor(_configManager, _dbUtils) {
        super();
        this._configManager = _configManager;
        this._dbUtils = _dbUtils;
        this._rfqtMakerOfferingsForRfqOrder = {};
        this._rfqtMakerConfigMapForRfqOrder = this._configManager.getRfqtMakerConfigMapForRfqOrder();
        this._rfqMakerPairsListUpdateTimeHash = null;
    }
    /**
     * Initialize pairs data and set up periodical refreshing
     */
    async initializeAsync() {
        await this._refreshAsync();
        setInterval(async () => {
            await this._refreshAsync();
        }, config_1.RFQ_PAIR_REFRESH_INTERVAL_MS);
    }
    /**
     * Get the RfqMakerAssetOfferings for RfqOrder
     */
    getRfqtMakerOfferingsForRfqOrder() {
        return this._rfqtMakerOfferingsForRfqOrder;
    }
    /**
     * Refresh the pairs information for each maker by querying database.
     * Emit an 'refreshed' event for subscribers to refresh if the operation is successful.
     */
    async _refreshAsync() {
        const chainId = this._configManager.getChainId();
        const refreshTime = new Date();
        const timerStopFunction = RFQ_MAKER_PAIRS_REFRESH_LATENCY.labels(chainId.toString(), config_1.RFQ_WORKFLOW).startTimer();
        try {
            logger_1.logger.info({ chainId, refreshTime }, `Check if refreshing is necessary.`);
            const rfqMakerPairsListUpdateTimeHash = await this._dbUtils.getPairsArrayUpdateTimeHashAsync(chainId);
            if (rfqMakerPairsListUpdateTimeHash === this._rfqMakerPairsListUpdateTimeHash) {
                logger_1.logger.info({ chainId, refreshTime }, `Pairs are up to date.`);
                return;
            }
            logger_1.logger.info({ chainId, refreshTime }, `Start refreshing pairs.`);
            this._rfqMakerPairsListUpdateTimeHash = rfqMakerPairsListUpdateTimeHash;
            const rfqMakerPairs = await this._dbUtils.getPairsArrayAsync(chainId);
            this._rfqtMakerOfferingsForRfqOrder = generateAssetOfferings(this._rfqtMakerConfigMapForRfqOrder, rfqMakerPairs);
            this.emit(PairsManager.REFRESHED_EVENT);
            logger_1.logger.info({ chainId, refreshTime }, `Successfully refreshed pairs.`);
            RFQ_MAKER_PAIRS_REFRESH_SUCCEEDED.labels(chainId.toString(), config_1.RFQ_WORKFLOW).inc();
        }
        catch (error) {
            logger_1.logger.error({ chainId, refreshTime, errorMessage: error.message }, `Failed to refresh pairs.`);
            RFQ_MAKER_PAIRS_REFRESH_FAILED.labels(chainId.toString(), config_1.RFQ_WORKFLOW).inc();
        }
        finally {
            timerStopFunction();
        }
    }
}
exports.PairsManager = PairsManager;
PairsManager.REFRESHED_EVENT = 'refreshed';
//# sourceMappingURL=pairs_manager.js.map