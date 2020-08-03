import { QuoteReport } from '@0x/asset-swapper';
import _ = require('lodash');

import { NUMBER_SOURCES_PER_LOG_LINE } from '../constants';
import { logger } from '../logger';

interface QuoteReportSubmissionByTaker {
    quoteReport: QuoteReport;
    submissionBy: 'taker';
    uniqueIdString: string;
}
interface QuoteReportSubmissionByMetaTxn {
    quoteReport: QuoteReport;
    submissionBy: 'metaTxn';
    zeroExTransactionHash: string;
}
type LogQuoteReportOptions = QuoteReportSubmissionByTaker | QuoteReportSubmissionByMetaTxn;

export const quoteReportUtils = {
    logQuoteReport(logOpts: LogQuoteReportOptions): void {
        const qr = logOpts.quoteReport;

        let logBase: { [key: string]: string | boolean } = {
            firmQuoteReport: true,
            submissionBy: logOpts.submissionBy,
        };
        if (logOpts.submissionBy === 'metaTxn') {
            logBase = { ...logBase, zeroExTransactionHash: logOpts.zeroExTransactionHash };
        } else if (logOpts.submissionBy === 'taker') {
            logBase = { ...logBase, uniqueIdString: logOpts.uniqueIdString };
        }

        // Deliver in chunks since Kibana can't handle logs large requests
        const sourcesConsideredChunks = _.chunk(qr.sourcesConsidered, NUMBER_SOURCES_PER_LOG_LINE);
        sourcesConsideredChunks.forEach((chunk, i) => {
            logger.info({
                ...logBase,
                sourcesConsidered: chunk,
                sourcesConsideredChunkIndex: i,
                sourcesConsideredChunkLength: sourcesConsideredChunks.length,
            });
        });
        const sourcesDeliveredChunks = _.chunk(qr.sourcesDelivered, NUMBER_SOURCES_PER_LOG_LINE);
        sourcesDeliveredChunks.forEach((chunk, i) => {
            logger.info({
                ...logBase,
                sourcesDelivered: chunk,
                sourcesDeliveredChunkIndex: i,
                sourcesDeliveredChunkLength: sourcesDeliveredChunks.length,
            });
        });
    },
};
