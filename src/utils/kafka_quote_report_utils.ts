import { BigNumber, QuoteReport, QuoteReportEntry } from '@0x/asset-swapper';
import { Producer } from 'kafkajs';
import _ = require('lodash');

import { KAFKA_TOPIC_QUOTE_REPORT } from '../config';
import { logger } from '../logger';

interface QuoteReportLogOptionsBase {
    quoteId?: string;
    sellAmount?: BigNumber;
    buyAmount?: BigNumber;
    buyTokenAddress: string;
    sellTokenAddress: string;
    apiKey?: string;
}
interface QuoteReportForTakerTxn extends QuoteReportLogOptionsBase {
    quoteReport: QuoteReport;
    submissionBy: 'taker';
    decodedUniqueId: string;
}
interface QuoteReportForMetaTxn extends QuoteReportLogOptionsBase {
    quoteReport: QuoteReport;
    submissionBy: 'metaTxn';
    zeroExTransactionHash: string;
}
type QuoteReportLogOptions = QuoteReportForTakerTxn | QuoteReportForMetaTxn;

/**
 * In order to avoid the logger to output unnecessary data that break the Quote Report ETL
 * proess, we intentionally exclude fields that can contain huge output data.
 * @param source the quote report source
 */
const omitFillData = (source: QuoteReportEntry) => {
    return {
        ...source,
        fillData: undefined,
    };
};

export const quoteReportUtils = {
    logQuoteReport(logOpts: QuoteReportLogOptions, kafkaProducer?: Producer): void {
        // NOTE: Removes bridge report fillData which we do not want to log to Kibana
        const qr: QuoteReport = {
            ...logOpts.quoteReport,
            sourcesConsidered: logOpts.quoteReport.sourcesConsidered.map(
                (source) => _.omit(source, ['fillData']) as QuoteReportEntry,
            ),
        };

        let logBase: { [key: string]: string | boolean | undefined } = {
            quoteId: logOpts.quoteId,
            firmQuoteReport: true,
            submissionBy: logOpts.submissionBy,
            buyAmount: logOpts.buyAmount ? logOpts.buyAmount.toString() : undefined,
            sellAmount: logOpts.sellAmount ? logOpts.sellAmount.toString() : undefined,
            buyTokenAddress: logOpts.buyTokenAddress,
            sellTokenAddress: logOpts.sellTokenAddress,
            apiKey: logOpts.apiKey,
        };
        if (logOpts.submissionBy === 'metaTxn') {
            logBase = { ...logBase, zeroExTransactionHash: logOpts.zeroExTransactionHash };
        } else if (logOpts.submissionBy === 'taker') {
            logBase = { ...logBase, decodedUniqueId: logOpts.decodedUniqueId };
        }

        if (kafkaProducer) {
            kafkaProducer.send({
                topic: KAFKA_TOPIC_QUOTE_REPORT,
                messages: [
                    {
                        value: JSON.stringify({
                            ...logBase,
                            sourcesConsidered: qr.sourcesConsidered.map(omitFillData),
                            sourcesDelivered: qr.sourcesDelivered.map(omitFillData),
                        }),
                    },
                ],
            });
        } else {
            logger.info({
                ...logBase,
                sourcesConsidered: qr.sourcesConsidered.map(omitFillData),
                sourcesDelivered: qr.sourcesDelivered.map(omitFillData),
            });
        }
    },
};
