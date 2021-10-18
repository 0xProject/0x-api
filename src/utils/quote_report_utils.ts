import type { PinoLogger } from '@0x/api-utils';
import {
    BigNumber,
    ERC20BridgeSource,
    ExtendedQuoteReport,
    ExtendedQuoteReportEntry,
    QuoteReport,
    QuoteReportEntry,
    SignedNativeOrder,
    V4RFQIndicativeQuoteMM,
} from '@0x/asset-swapper';
import { Producer } from 'kafkajs';
import _ = require('lodash');

import { KAFKA_TOPIC_QUOTE_REPORT } from '../config';
import { NUMBER_SOURCES_PER_LOG_LINE } from '../constants';
import { logger } from '../logger';
import { numberUtils } from '../utils/number_utils';

interface QuoteReportLogOptionsBase {
    quoteId?: string;
    sellAmount?: BigNumber;
    buyAmount?: BigNumber;
    buyTokenAddress: string;
    sellTokenAddress: string;
    integratorId?: string;
    taker?: string;
    slippage: number | undefined;
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
interface ExtendedQuoteReportForTakerTxn extends QuoteReportLogOptionsBase {
    quoteReport: ExtendedQuoteReport;
    submissionBy: 'taker';
    decodedUniqueId: string;
}
interface ExtendedQuoteReportForMetaTxn extends QuoteReportLogOptionsBase {
    quoteReport: ExtendedQuoteReport;
    submissionBy: 'metaTxn';
    zeroExTransactionHash: string;
}

export interface WrappedSignedNativeOrderMM {
    order: SignedNativeOrder;
    makerUri: string;
}

interface ExtendedQuoteReportForRFQMIndicativeLogOptions extends Omit<QuoteReportLogOptionsBase, 'quoteId'> {
    allQuotes: V4RFQIndicativeQuoteMM[];
    bestQuote: V4RFQIndicativeQuoteMM | null;
}

interface ExtendedQuoteReportForRFQMFirmLogOptions extends Omit<QuoteReportLogOptionsBase, 'quoteId'> {
    allQuotes: WrappedSignedNativeOrderMM[];
    bestQuote: WrappedSignedNativeOrderMM | null;
    comparisonPrice?: number;
}

type QuoteReportLogOptions = QuoteReportForTakerTxn | QuoteReportForMetaTxn;
type ExtendedQuoteReportLogOptions = ExtendedQuoteReportForTakerTxn | ExtendedQuoteReportForMetaTxn;

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

/**
 * For the extended quote report, we outout the filldata as JSON
 */
const jsonifyFillData = (source: ExtendedQuoteReportEntry) => {
    return {
        ...source,
        fillData: JSON.stringify(source.fillData, function (key, value) {
            if (key == '_samplerContract') {
                return {};
            } else {
                return value;
            }
        }),
    };
};

export const quoteReportUtils = {
    logQuoteReport(logOpts: QuoteReportLogOptions, contextLogger?: PinoLogger): void {
        const _logger = contextLogger ? contextLogger : logger;
        // NOTE: Removes bridge report fillData which we do not want to log to Kibana
        const qr: QuoteReport = {
            ...logOpts.quoteReport,
            sourcesConsidered: logOpts.quoteReport.sourcesConsidered.map(
                (source) => _.omit(source, ['fillData']) as QuoteReportEntry,
            ),
        };

        let logBase: { [key: string]: string | boolean | undefined } = {
            firmQuoteReport: true,
            submissionBy: logOpts.submissionBy,
            buyAmount: logOpts.buyAmount ? logOpts.buyAmount.toString() : undefined,
            sellAmount: logOpts.sellAmount ? logOpts.sellAmount.toString() : undefined,
            buyTokenAddress: logOpts.buyTokenAddress,
            sellTokenAddress: logOpts.sellTokenAddress,
            integratorId: logOpts.integratorId,
        };
        if (logOpts.submissionBy === 'metaTxn') {
            logBase = { ...logBase, zeroExTransactionHash: logOpts.zeroExTransactionHash };
        } else if (logOpts.submissionBy === 'taker') {
            logBase = { ...logBase, decodedUniqueId: logOpts.decodedUniqueId };
        }

        // Deliver in chunks since Kibana can't handle logs large requests
        const sourcesConsideredChunks = _.chunk(qr.sourcesConsidered.map(omitFillData), NUMBER_SOURCES_PER_LOG_LINE);
        sourcesConsideredChunks.forEach((chunk, i) => {
            _logger.info({
                ...logBase,
                sourcesConsidered: chunk,
                sourcesConsideredChunkIndex: i,
                sourcesConsideredChunkLength: sourcesConsideredChunks.length,
            });
        });
        const sourcesDeliveredChunks = _.chunk(qr.sourcesDelivered.map(omitFillData), NUMBER_SOURCES_PER_LOG_LINE);
        sourcesDeliveredChunks.forEach((chunk, i) => {
            _logger.info({
                ...logBase,
                sourcesDelivered: chunk,
                sourcesDeliveredChunkIndex: i,
                sourcesDeliveredChunkLength: sourcesDeliveredChunks.length,
            });
        });
    },
    publishQuoteReport(logOpts: ExtendedQuoteReportLogOptions, isFirmQuote: boolean, kafkaProducer: Producer): void {
        const qr: ExtendedQuoteReport = logOpts.quoteReport;
        let logBase: { [key: string]: string | boolean | number | undefined } = {
            quoteId: logOpts.quoteId,
            taker: logOpts.taker,
            timestamp: Date.now(),
            firmQuoteReport: isFirmQuote,
            submissionBy: logOpts.submissionBy,
            buyAmount: logOpts.buyAmount ? logOpts.buyAmount.toString() : undefined,
            sellAmount: logOpts.sellAmount ? logOpts.sellAmount.toString() : undefined,
            buyTokenAddress: logOpts.buyTokenAddress,
            sellTokenAddress: logOpts.sellTokenAddress,
            integratorId: logOpts.integratorId,
            slippageBips: logOpts.slippage ? logOpts.slippage * 10000 : undefined,
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
                            sourcesConsidered: qr.sourcesConsidered.map(jsonifyFillData),
                            sourcesDelivered: qr.sourcesDelivered.map(jsonifyFillData),
                        }),
                    },
                ],
            });
        }
    },
    publishRFQMIndicativeQuoteReport(
        logOpts: ExtendedQuoteReportForRFQMIndicativeLogOptions,
        kafkaProducer: Producer,
    ): void {
        const quoteId = numberUtils.randomHexNumberOfLength(10);
        let logBase: { [key: string]: string | boolean | number | undefined } = {
            quoteId: quoteId,
            taker: logOpts.taker,
            timestamp: Date.now(),
            firmQuoteReport: false,
            submissionBy: 'rfqm',
            buyAmount: logOpts.buyAmount ? logOpts.buyAmount.toString() : undefined,
            sellAmount: logOpts.sellAmount ? logOpts.sellAmount.toString() : undefined,
            buyTokenAddress: logOpts.buyTokenAddress,
            sellTokenAddress: logOpts.sellTokenAddress,
            integratorId: logOpts.integratorId,
            slippageBips: undefined,
        };

        const sourcesConsidered = logOpts.allQuotes.map((quote, index) => {
            return {
                quoteEntryIndex: index,
                isDelivered: false,
                liquiditySource: ERC20BridgeSource.Native,
                makerAmount: quote.makerAmount,
                takerAmount: quote.takerAmount,
                fillableTakerAmount: quote.takerAmount,
                isRFQ: true,
                makerUri: quote.makerUri,
                comparisonPrice: null,
            };
        });

        const bestQuote = logOpts.bestQuote
            ? {
                  ...logOpts.bestQuote,
                  quoteEntryIndex: 0,
                  isDelivered: true,
                  liquiditySource: ERC20BridgeSource.Native,
                  fillableTakerAmount: logOpts.bestQuote.takerAmount,
                  isRFQ: true,
                  comparisonPrice: null,
              }
            : null;
        if (kafkaProducer) {
            kafkaProducer.send({
                topic: KAFKA_TOPIC_QUOTE_REPORT,
                messages: [
                    {
                        value: JSON.stringify({
                            ...logBase,
                            sourcesConsidered,
                            sourcesDelivered: [bestQuote],
                        }),
                    },
                ],
            });
        }
    },
    publishRFQMFirmQuoteReport(logOpts: ExtendedQuoteReportForRFQMFirmLogOptions, kafkaProducer: Producer): void {
        const quoteId = numberUtils.randomHexNumberOfLength(10);
        let logBase: { [key: string]: string | boolean | number | undefined } = {
            quoteId: quoteId,
            taker: logOpts.taker,
            timestamp: Date.now(),
            firmQuoteReport: true,
            submissionBy: 'rfqm',
            buyAmount: logOpts.buyAmount ? logOpts.buyAmount.toString() : undefined,
            sellAmount: logOpts.sellAmount ? logOpts.sellAmount.toString() : undefined,
            buyTokenAddress: logOpts.buyTokenAddress,
            sellTokenAddress: logOpts.sellTokenAddress,
            integratorId: logOpts.integratorId,
            slippageBips: undefined,
        };

        const sourcesConsidered = logOpts.allQuotes.map((quote, index) => {
            return {
                quoteEntryIndex: index,
                isDelivered: false,
                liquiditySource: ERC20BridgeSource.Native,
                makerAmount: quote.order.order.makerAmount,
                takerAmount: quote.order.order.takerAmount,
                fillableTakerAmount: quote.order.order.takerAmount,
                isRFQ: true,
                makerUri: quote.makerUri,
                comparisonPrice: logOpts.comparisonPrice,
                fillData: quote.order,
            } as ExtendedQuoteReportEntry;
        });
        const bestQuote = logOpts.bestQuote
            ? ({
                  quoteEntryIndex: 0,
                  isDelivered: true,
                  liquiditySource: ERC20BridgeSource.Native,
                  makerAmount: logOpts.bestQuote?.order.order.makerAmount,
                  takerAmount: logOpts.bestQuote?.order.order.takerAmount,
                  fillableTakerAmount: logOpts.bestQuote?.order.order.takerAmount,
                  isRFQ: true,
                  makerUri: logOpts.bestQuote?.makerUri,
                  comparisonPrice: logOpts.comparisonPrice,
                  fillData: logOpts.bestQuote.order,
              } as ExtendedQuoteReportEntry)
            : null;
        console.log(bestQuote);
        if (kafkaProducer) {
            kafkaProducer.send({
                topic: KAFKA_TOPIC_QUOTE_REPORT,
                messages: [
                    {
                        value: JSON.stringify({
                            ...logBase,
                            sourcesConsidered: sourcesConsidered.map(jsonifyFillData),
                            sourcesDelivered: bestQuote ? [bestQuote].map(jsonifyFillData) : null,
                        }),
                    },
                ],
            });
        }
    },
};
