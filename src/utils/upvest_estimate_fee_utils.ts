import { BigNumber } from '@0x/utils';

import { DEFAULT_UPVEST_ESTIMATE_FEE_URL, ONE_GWEI, ONE_SECOND_MS } from '../constants';

let previousGasInfo;
let lastAccessed;
const CACHE_EXPIRY_SEC = 60;

const getGasInfoAsync = async () => {
    const now = Date.now() / ONE_SECOND_MS;
    if (!previousGasInfo || now - CACHE_EXPIRY_SEC > lastAccessed) {
        try {
            const res = await fetch(DEFAULT_UPVEST_ESTIMATE_FEE_URL);
            previousGasInfo = await res.json();
            lastAccessed = now;
        } catch (e) {
            throw new Error('Failed to fetch gas price from Upvest');
        }
    }
    return previousGasInfo;
};

export const upvestEstimateFeeUtils = {
    getGasPriceOrThrowAsync: async (): Promise<BigNumber> => {
        const gasInfo = await getGasInfoAsync();
        const gasPriceGwei = new BigNumber(gasInfo.estimates.fast);
        const gasPriceWei = ONE_GWEI.times(gasPriceGwei);
        return gasPriceWei;
    },
};
