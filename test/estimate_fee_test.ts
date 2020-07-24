import { expect } from '@0x/contracts-test-utils';

import { GAS_PRICE_CEILING_WEI } from '../src/constants';
import { estimateFeeUtils } from '../src/utils/estimate_fee_utils';

describe('estimateFeeUtils', () => {
    it('works', async () => {
        const fee = await estimateFeeUtils.getGasPriceOrThrowAsync();
        expect(fee).to.be.bignumber.lte(GAS_PRICE_CEILING_WEI);
    });
});
