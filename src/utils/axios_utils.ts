import Axios from 'axios';
import * as rax from 'retry-axios';

import { logger } from '../logger';

export const DEFAULT_AXIOS_RETRY_CONFIG: rax.RetryConfig = {
    // Retry 3 times
    retry: 3,
    // Retry twice on no response (ETIMEDOUT)
    noResponseRetries: 2,
    onRetryAttempt: err => {
        const cfg = rax.getConfig(err);
        if (cfg) {
            logger.warn(`HTTP retry attempt #${cfg.currentRetryAttempt}. ${err.message}`);
        } else {
            logger.warn(`HTTP retry. ${err.message}`);
        }
    },
};

export const retryableAxios = Axios.create();
retryableAxios.defaults.raxConfig = {
    instance: retryableAxios,
    ...DEFAULT_AXIOS_RETRY_CONFIG,
};
rax.attach(retryableAxios);
