/**
 * Runs the RFQM MetaTransaction Consumer
 */
import { createMetricsRouter, MetricsService } from '@0x/api-utils';
import { SQS } from 'aws-sdk';
import express from 'express';
import { Counter } from 'prom-client';

import { ENABLE_PROMETHEUS_METRICS, PROMETHEUS_PORT, RFQM_META_TX_SQS_URL } from '../config';
import { METRICS_PATH } from '../constants';
import { getDBConnectionAsync } from '../db_connection';
import { logger } from '../logger';
import { RfqmService } from '../services/rfqm_service';
import { SqsClient } from '../utils/sqs_client';
import { SqsConsumer } from '../utils/sqs_consumer';

import { buildRfqmServiceAsync } from './http_rfqm_service_runner';

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
        const connection = await getDBConnectionAsync();
        const rfqmService = await buildRfqmServiceAsync(connection);

        // Run the worker
        await runRfqmWorkerAsync(rfqmService);
    })().catch((error) => logger.error(error.stack));
}

/**
 * Runs the Rfqm Consumer
 */
export async function runRfqmWorkerAsync(rfqmService: RfqmService): Promise<SqsConsumer> {
    // Build the Sqs consumer
    const sqsClient = new SqsClient({
        sqs: new SQS({ apiVersion: '2012-11-05' }),
        queueUrl: RFQM_META_TX_SQS_URL!,
    });
    const consumer = new SqsConsumer({
        sqsClient,
        handleMessage: async (message) => {
            RFQM_JOB_DEQUEUED.inc();
            const orderHash = message.Body!;
            return rfqmService.processRfqmJobAsync(orderHash);
        },
        afterHandle: async () => {
            RFQM_JOB_SUCCEEDED.inc();
        },
    });

    // Start the consumer - aka the worker
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
