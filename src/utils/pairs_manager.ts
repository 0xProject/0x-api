import { RfqMakerAssetOfferings } from '@0x/asset-swapper';
import * as EventEmitter from 'events';
import { Counter, Summary } from 'prom-client';

import { RfqMakerConfig } from '../config';
import { RFQ_MAKER_URL_FIELD, RFQ_PAIR_REFRESH_INTERVAL_MS, RFQ_WORKFLOW } from '../constants';
import { RfqMakerPairs } from '../entities';
import { logger } from '../logger';

import { ConfigManager } from './config_manager';
import { RfqMakerDbUtils } from './rfq_maker_db_utils';

const RFQ_MAKER_PAIRS_REFRESH_FAILED = new Counter({
    name: 'rfq_maker_pairs_refresh_failed',
    help: 'A pair refreshing job failed.',
    labelNames: ['chainId', 'workflow'],
});
const RFQ_MAKER_PAIRS_REFRESH_SUCCEEDED = new Counter({
    name: 'rfq_maker_pairs_refresh_succeeded',
    help: 'A pair refreshing job succeeded.',
    labelNames: ['chainId', 'workflow'],
});
const RFQ_MAKER_PAIRS_REFRESH_LATENCY = new Summary({
    name: 'rfq_maker_pairs_refresh_latency',
    help: 'Latency for the maker pair refreshing job.',
    labelNames: ['chainId', 'workflow'],
});

/**
 * Get a function to reduce an array of RfqMakerPairs obtained from database to RfqMakerAssetOfferings
 * for given makers and URI field name which depends on the workflow type.
 */
const getReduceToOfferingFunction = (makers: Map<string, RfqMakerConfig>) => {
    return (offering: RfqMakerAssetOfferings, pairs: RfqMakerPairs): RfqMakerAssetOfferings => {
        if (makers.has(pairs.makerId)) {
            const makerConfig: RfqMakerConfig = makers.get(pairs.makerId)!;
            offering[makerConfig[RFQ_MAKER_URL_FIELD]] = pairs.pairs;
        }
        return offering;
    };
};

/**
 * PairsManager abstracts away all operations for handling maker pairs
 */
export class PairsManager extends EventEmitter {
    public static REFRESHED_EVENT = 'refreshed';

    private readonly _rfqtMakerConfigMapForRfqOrder: Map<string, RfqMakerConfig>;
    private _rfqtMakerOfferingsForRfqOrder: RfqMakerAssetOfferings;

    constructor(private readonly _configManager: ConfigManager, private readonly _dbUtils: RfqMakerDbUtils) {
        super();

        this._rfqtMakerOfferingsForRfqOrder = {};
        this._rfqtMakerConfigMapForRfqOrder = this._configManager.getRfqtMakerConfigMapForRfqOrder();
    }

    /**
     * Initialize pairs data and set up periodical refreshing
     */
    public async initializeAsync(): Promise<void> {
        await this._refreshAsync();

        setInterval(async () => {
            await this._refreshAsync();
        }, RFQ_PAIR_REFRESH_INTERVAL_MS);
    }

    /**
     * Get the RfqMakerAssetOfferings for RfqOrder
     */
    public getRfqtMakerOfferingsForRfqOrder(): RfqMakerAssetOfferings {
        return this._rfqtMakerOfferingsForRfqOrder;
    }

    /**
     * Refresh the pairs information for each maker by querying database.
     * Emit an 'refreshed' event for subscribers to refresh if the operation is successful.
     */
    private async _refreshAsync(): Promise<void> {
        const chainId = this._configManager.getChainId();
        const refreshTime = new Date();
        const timerStopFunction = RFQ_MAKER_PAIRS_REFRESH_LATENCY.labels(chainId.toString(), RFQ_WORKFLOW).startTimer();

        try {
            logger.info({ chainId, refreshTime }, `Start refreshing pairs.`);

            const rfqMakerPairs = await this._dbUtils.getPairsArrayAsync(chainId);

            this._rfqtMakerOfferingsForRfqOrder = {};
            rfqMakerPairs.reduce(
                getReduceToOfferingFunction(this._rfqtMakerConfigMapForRfqOrder),
                this._rfqtMakerOfferingsForRfqOrder,
            );

            this.emit(PairsManager.REFRESHED_EVENT);

            logger.info({ chainId, refreshTime }, `Successfully refreshed pairs.`);
            RFQ_MAKER_PAIRS_REFRESH_SUCCEEDED.labels(chainId.toString(), RFQ_WORKFLOW).inc();
        } catch (error) {
            logger.error({ chainId, refreshTime, errorMessage: error.message }, `Failed to refresh pairs.`);
            RFQ_MAKER_PAIRS_REFRESH_FAILED.labels(chainId.toString(), RFQ_WORKFLOW).inc();
        } finally {
            timerStopFunction();
        }
    }
}
