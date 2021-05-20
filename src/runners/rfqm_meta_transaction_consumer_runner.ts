/**
 * Runs the RFQM MetaTransaction Consumer
 */
import { createMetricsRouter, MetricsService } from '@0x/api-utils';
import { BlockParamLiteral, Web3Wrapper } from '@0x/web3-wrapper';
import * as AWS from 'aws-sdk';
import BigNumber from 'bignumber.js';
import express from 'express';
import { Counter } from 'prom-client';
import { Consumer } from 'sqs-consumer';

import {
    AWS_ACCESS_KEY,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    ENABLE_PROMETHEUS_METRICS,
    PROMETHEUS_PORT,
    RFQM_META_TX_SQS_URL,
} from '../config';
import { METRICS_PATH, RFQM_TX_GAS_ESTIMATE } from '../constants';
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
        // Override AWS configs if provided
        if (AWS_ACCESS_KEY !== undefined && AWS_SECRET_ACCESS_KEY !== undefined) {
            AWS.config.update({
                region: AWS_REGION,
                accessKeyId: AWS_ACCESS_KEY,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            });
        }

        // Start the Metrics Server
        startMetricsServer();

        // Start the Rfqm Consumer
        const rfqmConsumers = new RfqmConsumers();
        await runRfqmMetaTransactionConsumerAsync(rfqmConsumers);
    })().catch((error) => logger.error(error.stack));
}

export function workerHasEnoughBalance(
    accountBalance: BigNumber,
    gasPriceBaseUnits: BigNumber,
): boolean {
    const minimumCostToTrade = gasPriceBaseUnits.times(RFQM_TX_GAS_ESTIMATE).times(3);
    console.log(`${accountBalance.toString()} - ${gasPriceBaseUnits.toString()} = ${minimumCostToTrade.toString()}`)
    return accountBalance.gte(minimumCostToTrade);
}

async function workerHasNoPendingTransactionsAsync(accountAddress: string, wrapper: Web3Wrapper): Promise<boolean> {
    const lastNonceOnChain = await wrapper.getAccountNonceAsync(accountAddress);
    const lastNoncePending = await wrapper.getAccountNonceAsync(accountAddress, BlockParamLiteral.Pending);
    return lastNonceOnChain.toString() === lastNoncePending.toString();
}

export async function isWorkerReadyAndAbleAsync(
    wrapper: Web3Wrapper,
    accountAddress: string,
    gasPriceBaseUnits: BigNumber,
): Promise<boolean> {
    // Check worker has enough ETH to support 3 trades (small buffer)
    const accountBalance = await wrapper.getBalanceInWeiAsync(accountAddress);
    if (!workerHasEnoughBalance(accountBalance, gasPriceBaseUnits)) {
        return false;
    }
    return workerHasNoPendingTransactionsAsync(accountAddress, wrapper);
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
