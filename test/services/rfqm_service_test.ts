// tslint:disable:custom-no-magic-numbers
// tslint:disable:no-empty
// tslint:disable:max-file-line-count

import { QuoteRequestor } from '@0x/asset-swapper';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { anything, instance, mock, when } from 'ts-mockito';

import { RfqmService } from '../../src/services/rfqm_service';

describe('RfqmService', () => {
    describe('fetchIndicativeQuoteAsync', () => {
        it('should fetch indicative quote', async () => {
            // Given
            const quoteRequestorMock = mock(QuoteRequestor);
            when(
                quoteRequestorMock.requestRfqmIndicativeQuotesAsync(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).thenResolve([
                {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(101),
                    takerToken: 'USDC',
                    takerAmount: new BigNumber(100),
                    expiry: new BigNumber(1000000000000000),
                },
            ]);

            const quoteRequestorInstance = instance(quoteRequestorMock);
            const service = new RfqmService(quoteRequestorInstance);

            // When
            const res = await service.fetchIndicativeQuoteAsync({
                apiKey: 'some-api-key',
                buyToken: 'DAI',
                sellToken: 'USDC',
                sellAmount: new BigNumber(100),
            });

            // Then
            expect(res.price.toNumber()).to.equal(1.01);
        });

        it('should only return an indicative quote that is 100% filled', async () => {
            // Given
            const partialFillQuote = {
                makerToken: 'DAI',
                makerAmount: new BigNumber(55),
                takerToken: 'USDC',
                takerAmount: new BigNumber(50),
                expiry: new BigNumber(1000000000000000),
            };
            const fullQuote = {
                makerToken: 'DAI',
                makerAmount: new BigNumber(105),
                takerToken: 'USDC',
                takerAmount: new BigNumber(100),
                expiry: new BigNumber(1000000000000000),
            };
            const quoteRequestorMock = mock(QuoteRequestor);
            when(
                quoteRequestorMock.requestRfqmIndicativeQuotesAsync(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).thenResolve([partialFillQuote, fullQuote]);

            const quoteRequestorInstance = instance(quoteRequestorMock);
            const service = new RfqmService(quoteRequestorInstance);

            // When
            const res = await service.fetchIndicativeQuoteAsync({
                apiKey: 'some-api-key',
                buyToken: 'DAI',
                sellToken: 'USDC',
                sellAmount: new BigNumber(100),
            });

            // Then
            expect(res.sellAmount.toNumber()).to.equal(100);
            expect(res.price.toNumber()).to.equal(1.05);
        });

        it('should throw an error if no quotes are valid', async () => {
            // Given
            const partialFillQuote = {
                makerToken: 'DAI',
                makerAmount: new BigNumber(55),
                takerToken: 'USDC',
                takerAmount: new BigNumber(50),
                expiry: new BigNumber(1000000000000000),
            };
            const quoteRequestorMock = mock(QuoteRequestor);
            when(
                quoteRequestorMock.requestRfqmIndicativeQuotesAsync(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).thenResolve([partialFillQuote]);

            const quoteRequestorInstance = instance(quoteRequestorMock);
            const service = new RfqmService(quoteRequestorInstance);

            // Expect
            expect(
                service.fetchIndicativeQuoteAsync({
                    apiKey: 'some-api-key',
                    buyToken: 'DAI',
                    sellToken: 'USDC',
                    sellAmount: new BigNumber(100),
                }),
            ).to.be.rejectedWith(Error, 'No valid quotes');
        });

        it('should only return an indicative quote that is 100% filled', async () => {
            // Given
            const worsePricing = {
                makerToken: 'DAI',
                makerAmount: new BigNumber(101),
                takerToken: 'USDC',
                takerAmount: new BigNumber(100),
                expiry: new BigNumber(1000000000000000),
            };
            const betterPricing = {
                makerToken: 'DAI',
                makerAmount: new BigNumber(111),
                takerToken: 'USDC',
                takerAmount: new BigNumber(100),
                expiry: new BigNumber(1000000000000000),
            };
            const quoteRequestorMock = mock(QuoteRequestor);
            when(
                quoteRequestorMock.requestRfqmIndicativeQuotesAsync(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).thenResolve([worsePricing, betterPricing]);

            const quoteRequestorInstance = instance(quoteRequestorMock);
            const service = new RfqmService(quoteRequestorInstance);

            // When
            const res = await service.fetchIndicativeQuoteAsync({
                apiKey: 'some-api-key',
                buyToken: 'DAI',
                sellToken: 'USDC',
                sellAmount: new BigNumber(100),
            });

            // Then
            expect(res.sellAmount.toNumber()).to.equal(100);
            expect(res.price.toNumber()).to.equal(1.11);
        });
    });
});
