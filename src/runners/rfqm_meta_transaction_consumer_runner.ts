/**
 * Runs the RFQM MetaTransaction Consumer
 */
import { createMetricsRouter, MetricsService } from '@0x/api-utils';
import { ProtocolFeeUtils, QuoteRequestor } from '@0x/asset-swapper';
import { IZeroExContract } from '@0x/contracts-zero-ex';
import { NULL_ADDRESS } from '@0x/utils';
import { SQS } from 'aws-sdk';
import Axios from 'axios';
import express from 'express';
import { Counter } from 'prom-client';

import { getContractAddressesForNetworkOrThrowAsync } from '../app';
import {
    CHAIN_ID,
    defaultHttpServiceWithRateLimiterConfig,
    ENABLE_PROMETHEUS_METRICS,
    ETH_GAS_STATION_API_URL,
    META_TX_WORKER_REGISTRY,
    PROMETHEUS_PORT,
    RFQM_MAKER_ASSET_OFFERINGS,
    RFQM_META_TX_SQS_URL,
    RFQT_MAKER_ASSET_OFFERINGS,
    SWAP_QUOTER_OPTS,
} from '../config';
import { METRICS_PATH, PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS } from '../constants';
import { getDBConnectionAsync } from '../db_connection';
import { logger } from '../logger';
import { RfqmService } from '../services/rfqm_service';
import { providerUtils } from '../utils/provider_utils';
import { RfqBlockchainUtils } from '../utils/rfq_blockchain_utils';
import { SqsConsumer } from '../utils/sqs_consumer';

import { getAxiosRequestConfig } from './http_rfqm_service_runner';

const RFQM_JOB_DEQUEUED = new Counter({
    name: 'rfqm_job_dequeued',
    help: 'An Rfqm Job was pulled from the queue',
});

const RFQM_JOB_SUCCEEDED = new Counter({
    name: 'rfqm_job_succeeded',
    help: 'An Rfqm Job succeeded',
});

process.on('uncaughtException', (err) => {
    logger.error(err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    if (err) {
        logger.error(err);
    }
});

if (require.main === module) {
    (async () => {
        // Start the Metrics Server
        startMetricsServer();

        // Build dependencies
        const provider = providerUtils.createWeb3Provider(defaultHttpServiceWithRateLimiterConfig.ethereumRpcUrl);
        const contractAddresses = await getContractAddressesForNetworkOrThrowAsync(provider, CHAIN_ID);
        const quoteRequestor = new QuoteRequestor(
            RFQT_MAKER_ASSET_OFFERINGS,
            RFQM_MAKER_ASSET_OFFERINGS,
            Axios.create(getAxiosRequestConfig()),
            undefined, // No Alt RFQM offerings at the moment
            logger.warn.bind(logger),
            logger.info.bind(logger),
            SWAP_QUOTER_OPTS.expiryBufferMs,
        );
        const protocolFeeUtils = ProtocolFeeUtils.getInstance(
            PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS,
            ETH_GAS_STATION_API_URL,
        );
        const metaTxWorkerRegistry = META_TX_WORKER_REGISTRY || NULL_ADDRESS;
        const exchangeProxy = new IZeroExContract(contractAddresses.exchangeProxy, provider);
        const rfqBlockchainUtils = new RfqBlockchainUtils(exchangeProxy);
        const connection = await getDBConnectionAsync();
        const rfqmService = new RfqmService(
            quoteRequestor,
            protocolFeeUtils,
            contractAddresses,
            metaTxWorkerRegistry,
            rfqBlockchainUtils,
            connection,
        );

        // Run the consumer
        await runRfqmMetaTransactionConsumerAsync(rfqmService);
    })().catch((error) => logger.error(error.stack));
}

/**
 * Runs the Rfqm Consumer
 */
export async function runRfqmMetaTransactionConsumerAsync(rfqmService: RfqmService): Promise<SqsConsumer> {
    const consumer = new SqsConsumer({
        sqs: new SQS({ apiVersion: '2012-11-05' }),
        queueUrl: RFQM_META_TX_SQS_URL!,
        handleMessage: async (message) => {
            RFQM_JOB_DEQUEUED.inc();
            const orderHash = message.Body!;
            return rfqmService.processRfqmJobAsync(orderHash);
        },
        afterHandle: async () => {
            RFQM_JOB_SUCCEEDED.inc();
        },
    });

    // Start the consumer
    consumer.consumeAsync().catch((e) => logger.error(e));
    logger.info('Rfqm Consumer running');
    return consumer;
}

function startMetricsServer(): void {
    if (ENABLE_PROMETHEUS_METRICS) {
        const metricsService = new MetricsService();
        const metricsRouter = createMetricsRouter(metricsService);
        const metricsApp = express();

        metricsApp.use(METRICS_PATH, metricsRouter);
        const metricsServer = metricsApp.listen(PROMETHEUS_PORT, () => {
            logger.info(`Metrics (HTTP) listening on port ${PROMETHEUS_PORT}`);
        });

        metricsServer.on('error', (err) => {
            logger.error(err);
        });
    }
}
