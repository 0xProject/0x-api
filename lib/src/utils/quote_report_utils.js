"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishQuoteReport = void 0;
const asset_swapper_1 = require("../asset-swapper");
const config_1 = require("../config");
const logger_1 = require("../logger");
const BIPS_IN_INT = 10000;
/**
 * Extracts timestamp from decoded unique identifier for taker transactions.
 * @param decodedUniqueId unique identifier for an affiliate
 * @returns timestamp used when the unique identifier is generated
 */
const getTimestampFromUniqueId = (decodedUniqueId) => {
    return parseInt(decodedUniqueId.slice(decodedUniqueId.indexOf('-') + 1), 10);
};
/**
 * Publishes a quote report to kafka. As of fall 2022, this eventually
 * makes its way to the Hashalytics database.
 *
 * This fuction is a no-op if KAFKA_TOPIC_QUOTE_REPORT is not defined.
 */
function publishQuoteReport(logOpts, isFirmQuote, kafkaProducer) {
    var _a, _b, _c;
    if (kafkaProducer && config_1.KAFKA_TOPIC_QUOTE_REPORT) {
        const extendedQuoteReport = {
            quoteId: logOpts.quoteId,
            taker: logOpts.taker,
            timestamp: logOpts.submissionBy === 'taker' ? getTimestampFromUniqueId(logOpts.decodedUniqueId) : Date.now(),
            firmQuoteReport: isFirmQuote,
            submissionBy: logOpts.submissionBy,
            buyAmount: logOpts.buyAmount ? logOpts.buyAmount.toString() : undefined,
            sellAmount: logOpts.sellAmount ? logOpts.sellAmount.toString() : undefined,
            buyTokenAddress: logOpts.buyTokenAddress,
            sellTokenAddress: logOpts.sellTokenAddress,
            integratorId: logOpts.integratorId,
            slippageBips: logOpts.slippage ? logOpts.slippage * BIPS_IN_INT : undefined,
            decodedUniqueId: logOpts.submissionBy === 'taker' || logOpts.submissionBy === 'gaslessSwapAmm'
                ? logOpts.decodedUniqueId
                : undefined,
            sourcesConsidered: logOpts.quoteReportSources.sourcesConsidered.map(asset_swapper_1.jsonifyFillData),
            sourcesDelivered: (_a = logOpts.quoteReportSources.sourcesDelivered) === null || _a === void 0 ? void 0 : _a.map(asset_swapper_1.jsonifyFillData),
            blockNumber: logOpts.blockNumber,
            estimatedGas: logOpts.estimatedGas.toString(),
            enableSlippageProtection: logOpts.enableSlippageProtection,
            expectedSlippage: (_b = logOpts.expectedSlippage) === null || _b === void 0 ? void 0 : _b.toString(),
            estimatedPriceImpact: (_c = logOpts.estimatedPriceImpact) === null || _c === void 0 ? void 0 : _c.toString(),
            priceImpactProtectionPercentage: logOpts.priceImpactProtectionPercentage * 100,
        };
        kafkaProducer
            .send({
            topic: config_1.KAFKA_TOPIC_QUOTE_REPORT,
            messages: [
                {
                    value: JSON.stringify(extendedQuoteReport),
                },
            ],
        })
            .catch((err) => {
            logger_1.logger.error(`Error publishing quote report to Kafka: ${err}`);
        });
    }
}
exports.publishQuoteReport = publishQuoteReport;
//# sourceMappingURL=quote_report_utils.js.map