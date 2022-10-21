import * as Sentry from '@sentry/node';

import {
    SENTRY_DSN,
    SENTRY_ENVIRONMENT,
    SENTRY_SAMPLE_RATE,
    SENTRY_TRACES_SAMPLE_RATE,
    defaultHttpServiceConfig,
} from '../config';

import { NodeOptions as SentryNodeOptions } from '@sentry/node';
import { createGetQuoteHandler } from '../handlers/meta_transaction_rpc_handler';
import { createMetaTransactionService } from '../proto-ts/meta_transaction.pb';
import { createServer } from 'http';
import { createTwirpServer } from 'twirpscript';
import { getDefaultAppDependenciesAsync } from '../app';
import { logger } from '../logger';
import { providerUtils } from '../utils/provider_utils';
import { TwirpContext } from 'twirpscript/runtime/server';

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
        const config = defaultHttpServiceConfig;
        const provider = providerUtils.createWeb3Provider(
            defaultHttpServiceConfig.ethereumRpcUrl,
            defaultHttpServiceConfig.rpcRequestTimeout,
            defaultHttpServiceConfig.shouldCompressRequest,
        );
        const dependencies = await getDefaultAppDependenciesAsync(provider, defaultHttpServiceConfig);

        if (!dependencies.metaTransactionService) {
            logger.error(`No metaTransactionService provided in dependencies`);
            process.exit(1);
        }

        if (dependencies.hasSentry) {
            const options: SentryNodeOptions = {
                dsn: SENTRY_DSN,
                environment: SENTRY_ENVIRONMENT,
                sampleRate: SENTRY_SAMPLE_RATE,
                tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
            };

            Sentry.init(options);
        }

        const metaTransactionService = createMetaTransactionService({
            GetQuote: createGetQuoteHandler(dependencies.metaTransactionService),
        });
        const services = [metaTransactionService];

        const app = createTwirpServer<TwirpContext<void, typeof services>, typeof services>(services);

        app.on('error', (_context, error) => {
            if (dependencies.hasSentry) {
                Sentry.captureException(error);
            }
        });

        createServer(app).listen(config.httpPort, () =>
            console.log(`MetaTransaction server listening on port ${config.httpPort}`),
        );
    })().catch((error) => logger.error(error));
}
