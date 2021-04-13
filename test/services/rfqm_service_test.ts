// tslint:disable:custom-no-magic-numbers
// tslint:disable:no-empty
// tslint:disable:max-file-line-count

import { QuoteRequestor } from '@0x/asset-swapper';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { anything, instance, mock, when } from 'ts-mockito';

import { RfqmService } from '../../src/services/rfqm_service';
// import { ChainId } from '../../src/types';
// import { getTokenMetadataIfExists } from '../../src/utils/token_metadata_utils';

// const WETH = getTokenMetadataIfExists('WETH', ChainId.Mainnet)!;
// const DAI = getTokenMetadataIfExists('DAI', ChainId.Mainnet)!;
// const USDC = getTokenMetadataIfExists('USDC', ChainId.Mainnet)!;
// const buyAmount = new BigNumber('23318242912334152626');
// const sellAmount = new BigNumber('70100000000000000');
// const ethToDaiRate = buyAmount.div(sellAmount).decimalPlaces(18);
// const ethToWethRate = new BigNumber(1);
// const gasPrice = new BigNumber(100000000000); // 100 GWEI
// const estimatedGas = new BigNumber(136000);

// const daiWethQuoteBase = {
//     buyTokenAddress: DAI.tokenAddress,
//     sellTokenAddress: WETH.tokenAddress,
//     buyAmount,
//     sellAmount,
//     sellTokenToEthRate: ethToWethRate,
//     buyTokenToEthRate: ethToDaiRate,
//     gasPrice,
//     estimatedGas,
// };

describe.only('RfqmService', () => {
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
