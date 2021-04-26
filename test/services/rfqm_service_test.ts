// tslint:disable:custom-no-magic-numbers
// tslint:disable:no-empty
// tslint:disable:max-file-line-count

import { ProtocolFeeUtils, QuoteRequestor } from '@0x/asset-swapper';
import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { anything, instance, mock, when } from 'ts-mockito';

import { ONE_MINUTE_MS } from '../../src/constants';
import { RfqmService } from '../../src/services/rfqm_service';

describe.only('RfqmService', () => {
    describe('fetchIndicativeQuoteAsync', () => {
        describe('sells', async () => {
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
                        takerToken: 'SUSD',
                        takerAmount: new BigNumber(100),
                        expiry: new BigNumber(1000000000000000),
                    },
                ]);

                const quoteRequestorInstance = instance(quoteRequestorMock);
                const protocolFeeUtilsMock = mock(ProtocolFeeUtils);
                const contractAddresses = getContractAddressesForChainOrThrow(1);
                const service = new RfqmService(quoteRequestorInstance, protocolFeeUtilsMock, contractAddresses);

                // When
                const res = await service.fetchIndicativeQuoteAsync({
                    apiKey: 'some-api-key',
                    buyToken: 'DAI',
                    sellToken: 'SUSD',
                    buyTokenDecimals: 18,
                    sellTokenDecimals: 18,
                    sellAmount: new BigNumber(100),
                });

                // Then
                if (res === null) {
                    expect.fail('res is null, but not expected to be null');
                    return;
                }
                expect(res.sellAmount.toNumber()).to.be.at.least(100);
                expect(res.price.toNumber()).to.equal(1.01);
            });

            it('should only return an indicative quote that is 100% filled when selling', async () => {
                // Given
                const partialFillQuote = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(55),
                    takerToken: 'SUSD',
                    takerAmount: new BigNumber(50),
                    expiry: new BigNumber(1000000000000000),
                };
                const fullQuote = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(105),
                    takerToken: 'SUSD',
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
                const protocolFeeUtilsMock = mock(ProtocolFeeUtils);
                const contractAddresses = getContractAddressesForChainOrThrow(1);
                const service = new RfqmService(quoteRequestorInstance, protocolFeeUtilsMock, contractAddresses);

                // When
                const res = await service.fetchIndicativeQuoteAsync({
                    apiKey: 'some-api-key',
                    buyToken: 'DAI',
                    sellToken: 'SUSD',
                    buyTokenDecimals: 18,
                    sellTokenDecimals: 18,
                    sellAmount: new BigNumber(100),
                });

                // Then
                if (res === null) {
                    expect.fail('res is null, but not expected to be null');
                    return;
                }
                expect(res.sellAmount.toNumber()).to.equal(100);
                expect(res.price.toNumber()).to.equal(1.05);
            });

            it('should return null if no quotes are valid', async () => {
                // Given
                const partialFillQuote = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(55),
                    takerToken: 'SUSD',
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
                const protocolFeeUtilsMock = mock(ProtocolFeeUtils);
                const contractAddresses = getContractAddressesForChainOrThrow(1);
                const service = new RfqmService(quoteRequestorInstance, protocolFeeUtilsMock, contractAddresses);

                // Expect
                const res = await service.fetchIndicativeQuoteAsync({
                    apiKey: 'some-api-key',
                    buyToken: 'DAI',
                    sellToken: 'SUSD',
                    buyTokenDecimals: 18,
                    sellTokenDecimals: 18,
                    sellAmount: new BigNumber(100),
                });
                expect(res).to.eq(null);
            });

            it('should return an indicative quote that can fill more than 100%', async () => {
                // Given
                const worsePricing = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(101),
                    takerToken: 'SUSD',
                    takerAmount: new BigNumber(100),
                    expiry: new BigNumber(1000000000000000),
                };
                const betterPricing = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(222),
                    takerToken: 'SUSD',
                    takerAmount: new BigNumber(200),
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
                const protocolFeeUtilsMock = mock(ProtocolFeeUtils);
                const contractAddresses = getContractAddressesForChainOrThrow(1);
                const service = new RfqmService(quoteRequestorInstance, protocolFeeUtilsMock, contractAddresses);

                // When
                const res = await service.fetchIndicativeQuoteAsync({
                    apiKey: 'some-api-key',
                    buyToken: 'DAI',
                    sellToken: 'SUSD',
                    buyTokenDecimals: 18,
                    sellTokenDecimals: 18,
                    sellAmount: new BigNumber(100),
                });

                // Then
                if (res === null) {
                    expect.fail('res is null, but not expected to be null');
                    return;
                }
                expect(res.sellAmount.toNumber()).to.equal(200);
                expect(res.price.toNumber()).to.equal(1.11);
            });

            it('should ignore quotes that are for the wrong pair', async () => {
                // Given
                const worsePricing = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(101),
                    takerToken: 'SUSD',
                    takerAmount: new BigNumber(100),
                    expiry: new BigNumber(1000000000000000),
                };
                const wrongPair = {
                    makerToken: 'BUSD',
                    makerAmount: new BigNumber(111),
                    takerToken: 'SUSD',
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
                ).thenResolve([worsePricing, wrongPair]);

                const quoteRequestorInstance = instance(quoteRequestorMock);
                const protocolFeeUtilsMock = mock(ProtocolFeeUtils);
                const contractAddresses = getContractAddressesForChainOrThrow(1);
                const service = new RfqmService(quoteRequestorInstance, protocolFeeUtilsMock, contractAddresses);

                // When
                const res = await service.fetchIndicativeQuoteAsync({
                    apiKey: 'some-api-key',
                    buyToken: 'DAI',
                    sellToken: 'SUSD',
                    buyTokenDecimals: 18,
                    sellTokenDecimals: 18,
                    sellAmount: new BigNumber(100),
                });

                // Then
                if (res === null) {
                    expect.fail('res is null, but not expected to be null');
                    return;
                }
                expect(res.sellAmount.toNumber()).to.equal(100);
                expect(res.price.toNumber()).to.equal(1.01); // Worse pricing wins because better pricing is for wrong pair
            });

            it('should ignore quotes that expire within 3 minutes', async () => {
                // Given
                const inOneMinute = Date.now() + ONE_MINUTE_MS;
                const expiresSoon = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(111),
                    takerToken: 'SUSD',
                    takerAmount: new BigNumber(100),
                    expiry: new BigNumber(inOneMinute),
                };
                const expiresNever = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(101),
                    takerToken: 'SUSD',
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
                ).thenResolve([expiresSoon, expiresNever]);

                const quoteRequestorInstance = instance(quoteRequestorMock);
                const protocolFeeUtilsMock = mock(ProtocolFeeUtils);
                const contractAddresses = getContractAddressesForChainOrThrow(1);
                const service = new RfqmService(quoteRequestorInstance, protocolFeeUtilsMock, contractAddresses);

                // When
                const res = await service.fetchIndicativeQuoteAsync({
                    apiKey: 'some-api-key',
                    buyToken: 'DAI',
                    sellToken: 'SUSD',
                    buyTokenDecimals: 18,
                    sellTokenDecimals: 18,
                    sellAmount: new BigNumber(100),
                });

                // Then
                if (res === null) {
                    expect.fail('res is null, but not expected to be null');
                    return;
                }
                expect(res.sellAmount.toNumber()).to.equal(100);
                expect(res.price.toNumber()).to.equal(1.01); // Worse pricing wins because better pricing expires too soon
            });
        });

        describe('buys', async () => {
            it('should fetch indicative quote when buying', async () => {
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
                        takerToken: 'SUSD',
                        takerAmount: new BigNumber(100),
                        expiry: new BigNumber(1000000000000000),
                    },
                ]);

                const quoteRequestorInstance = instance(quoteRequestorMock);
                const protocolFeeUtilsMock = mock(ProtocolFeeUtils);
                const contractAddresses = getContractAddressesForChainOrThrow(1);
                const service = new RfqmService(quoteRequestorInstance, protocolFeeUtilsMock, contractAddresses);

                // When
                const res = await service.fetchIndicativeQuoteAsync({
                    apiKey: 'some-api-key',
                    buyToken: 'DAI',
                    sellToken: 'SUSD',
                    buyTokenDecimals: 18,
                    sellTokenDecimals: 18,
                    buyAmount: new BigNumber(100),
                });

                // Then
                if (res === null) {
                    expect.fail('res is null, but not expected to be null');
                    return;
                }
                expect(res.buyAmount.toNumber()).to.be.at.least(100);
                expect(res.price.toNumber()).to.equal(1.01);
            });

            it('should only return an indicative quote that is 100% filled when buying', async () => {
                // Given
                const partialFillQuoteBadPricing = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(95),
                    takerToken: 'SUSD',
                    takerAmount: new BigNumber(100),
                    expiry: new BigNumber(1000000000000000),
                };
                const partialFillQuoteGoodPricing = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(95),
                    takerToken: 'SUSD',
                    takerAmount: new BigNumber(50),
                    expiry: new BigNumber(1000000000000000),
                };
                const fullQuote = {
                    makerToken: 'DAI',
                    makerAmount: new BigNumber(105),
                    takerToken: 'SUSD',
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
                ).thenResolve([partialFillQuoteBadPricing, partialFillQuoteGoodPricing, fullQuote]);

                const quoteRequestorInstance = instance(quoteRequestorMock);
                const protocolFeeUtilsMock = mock(ProtocolFeeUtils);
                const contractAddresses = getContractAddressesForChainOrThrow(1);
                const service = new RfqmService(quoteRequestorInstance, protocolFeeUtilsMock, contractAddresses);

                // When
                const res = await service.fetchIndicativeQuoteAsync({
                    apiKey: 'some-api-key',
                    buyToken: 'DAI',
                    sellToken: 'SUSD',
                    buyTokenDecimals: 18,
                    sellTokenDecimals: 18,
                    buyAmount: new BigNumber(100),
                });

                // Then
                if (res === null) {
                    expect.fail('res is null, but not expected to be null');
                    return;
                }
                expect(res.buyAmount.toNumber()).to.be.at.least(100);
                expect(res.price.toNumber()).to.equal(1.05);
            });
        });
    });
});
