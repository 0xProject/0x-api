import { BigNumber } from '@0x/utils';

import { GAS_PRICE_CEILING_WEI } from '../constants';

import { upvestEstimateFeeUtils } from './upvest_estimate_fee_utils';

const isSaneGasPrice = (gasPriceInWei: BigNumber): boolean => {
    return gasPriceInWei.isLessThan(GAS_PRICE_CEILING_WEI);
};

export const estimateFeeUtils = {
    getGasPriceOrThrowAsync: async (): Promise<BigNumber> => {
        const upvestGasPrice = await upvestEstimateFeeUtils.getGasPriceOrThrowAsync();
        if (!isSaneGasPrice(upvestGasPrice)) {
            throw new Error(`returned gas price ${upvestGasPrice} is above GAS_PRICE_CEILING_WEI constant`);
        }
        return upvestGasPrice;
    },
};
