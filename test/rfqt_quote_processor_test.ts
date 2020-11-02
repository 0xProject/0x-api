import { expect } from '@0x/contracts-test-utils';
import { logUtils } from '@0x/utils';
import 'mocha';
import { Connection } from 'typeorm';

import { RfqtQuoteProcessor } from '../src/rfqt_quote_processor';

describe('RfqtQuoteProcessor', () => {
    describe('#filterInvalidQuotesAsync', () => {
        it('returns an empty array when given an empty array', async () => {
            expect(
                await new RfqtQuoteProcessor(
                    (undefined as unknown) as Connection,
                    logUtils.warn,
                ).filterInvalidQuotesAsync([]),
            ).to.eql([]);
        });
    });
});
