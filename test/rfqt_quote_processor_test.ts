import { expect } from '@0x/contracts-test-utils';
import { logUtils } from '@0x/utils';
import 'mocha';
import { It, Mock } from 'typemoq';
import { Connection, Repository } from 'typeorm';

import { MakerValidationCacheEntity } from '../src/entities/MakerValidationCacheEntity';
import { RfqtQuoteProcessor } from '../src/rfqt_quote_processor';

describe('RfqtQuoteProcessor', () => {
    describe('#filterInvalidQuotesAsync', () => {
        it('returns an empty array when given an empty array', async () => {
            const mockRepo = Mock.ofType<Repository<MakerValidationCacheEntity>>();
            mockRepo.setup(mock => mock.find(It.isAny())).returns(() => Promise.resolve([]));

            const mockTypeorm = Mock.ofType<Connection>();
            mockTypeorm.setup(mock => mock.getRepository(MakerValidationCacheEntity)).returns(() => mockRepo.object);

            expect(await new RfqtQuoteProcessor(mockTypeorm.object, logUtils.warn).filterInvalidQuotesAsync([])).to.eql(
                [],
            );
        });
    });
});
