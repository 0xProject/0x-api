/**
 * Runs the RFQM MetaTransaction Consumer
 */
import { createMetricsRouter, MetricsService } from '@0x/api-utils';
import express from 'express';
import { Counter } from 'prom-client';
import { Consumer } from 'sqs-consumer';

import { ENABLE_PROMETHEUS_METRICS, PROMETHEUS_PORT, RFQM_META_TX_SQS_URL } from '../config';
import { METRICS_PATH } from '../constants';
import { RfqmConsumers } from '../consumers/rfqm_consumers';
import { logger } from '../logger';

const RFQM_JOB_DEQUEUED = new Counter({
    name: 'rfqm_job_dequeued',
    help: 'An Rfqm Job was pulled from the queue',
});

const RFQM_JOB_SUCCEEDED = new Counter({
    name: 'rfqm_job_succeeded',
    help: 'An Rfqm Job succeeded',
});

const RFQM_JOB_FAILED = new Counter({
    name: 'rfqm_job_failed',
    help: 'An Rfqm Job failed',
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

        // Start the Rfqm Consumer
        const rfqmConsumers = new RfqmConsumers();
        await runRfqmMetaTransactionConsumerAsync(rfqmConsumers);
    })().catch((error) => logger.error(error.stack));
}

/**
 * Runs the Rfqm Consumer
 */
export async function runRfqmMetaTransactionConsumerAsync(rfqmConsumers: RfqmConsumers): Promise<Consumer> {
    const app = Consumer.create({
        queueUrl: RFQM_META_TX_SQS_URL,
        handleMessage: async (msg) => {
            const payload = msg.Body;
            if (payload === undefined) {
                return;
            }

            return rfqmConsumers.processJobAsync(payload);
        },
    });

    app.on('message_received', (msg) => {
        RFQM_JOB_DEQUEUED.inc();
    });

    app.on('message_processed', (msg) => {
        RFQM_JOB_SUCCEEDED.inc();
    });

    app.on('processing_error', (err) => {
        RFQM_JOB_FAILED.inc();
        logger.error('a job was unable to be processed', err);
    });

    app.on('error', (err) => {
        logger.error('a system error occurred', err);
    });

    app.start();
    logger.info('Rfqm Consumer running');
    return app;
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
