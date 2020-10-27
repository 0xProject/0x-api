// tslint:disable-next-line:no-implicit-dependencies

import { Web3Wrapper } from '@0x/dev-utils';
import { SupportedProvider } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import * as delay from 'delay';
import { uniqueId } from 'lodash';
import { Gauge } from 'prom-client';

import { AppDependencies, getDefaultAppDependenciesAsync } from '../app';
import { defaultHttpServiceWithRateLimiterConfig } from '../config';
import { ONE_SECOND_MS } from '../constants';
import { logger } from '../logger';
import { providerUtils } from '../utils/provider_utils';

const DELAY_WHEN_NEW_BLOCK_FOUND = ONE_SECOND_MS * 10;
const DELAY_WHEN_NEW_BLOCK_NOT_FOUND = ONE_SECOND_MS;

// Metric collection related fields
const LATEST_BLOCK_PROCESSED_GAUGE = new Gauge({
    name: 'rfqtw_latest_block_processed',
    help: 'Latest block processed by the RFQ worker process',
    labelNames: ['workerId'],
});

process.on('uncaughtException', err => {
    logger.error(err);
    process.exit(1);
});

process.on('unhandledRejection', err => {
    if (err) {
        logger.error(err);
    }
});

if (require.main === module) {
    (async () => {
        const provider = providerUtils.createWeb3Provider(defaultHttpServiceWithRateLimiterConfig.ethereumRpcUrl);
        const dependencies = await getDefaultAppDependenciesAsync(provider, defaultHttpServiceWithRateLimiterConfig);
        await runRfqBalanceCheckerAsync(dependencies, provider);
    })().catch(error => logger.error(error.stack));
}

async function runRfqBalanceCheckerAsync(
    _dependencies: AppDependencies,
    provider: SupportedProvider,
): Promise<void> {
    const workerId = uniqueId('rfqw_');
    const client = new Web3Wrapper(provider);
    let lastBlockSeen = -1;
    while(true) {
        const newBlock = await client.getBlockNumberAsync();
        if (lastBlockSeen < newBlock) {
            // Do work here with new block here.
            lastBlockSeen = newBlock;
            LATEST_BLOCK_PROCESSED_GAUGE.labels(workerId).set(lastBlockSeen);
            logUtils.log({
                block: lastBlockSeen,
                workerId,
            }, "Found new block");
            await delay(DELAY_WHEN_NEW_BLOCK_FOUND);
        } else {
            await delay(DELAY_WHEN_NEW_BLOCK_NOT_FOUND);
        }
    }
}
