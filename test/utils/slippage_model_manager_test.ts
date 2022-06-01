// tslint:disable:custom-no-magic-numbers

import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { anything, instance, mock, when } from 'ts-mockito';

import { S3Client } from '../../src/utils/s3_client';
import { SlippageModel, SlippageModelManager } from '../../src/utils/slippage_model_manager';

const createMockS3Client = (slippageModels: SlippageModel[]): S3Client => {
    const s3ClientMock = mock(S3Client);
    when(s3ClientMock.hasFileAsync(anything(), anything())).thenResolve({
        exists: true,
        lastModified: new Date(),
    });
    when(s3ClientMock.getFileContentAsync(anything(), anything())).thenResolve({
        content: JSON.stringify(slippageModels),
        lastModified: new Date(),
    });

    return instance(s3ClientMock);
};

describe('SlippageModelManager', () => {
    const usdc = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const weth = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const otherToken = '0xeAC17F958D2ee523a2206206994597C13D831ec7';
    const slippageModels = [
        {
            token0: usdc,
            token1: weth,
            source: 'source 1',
            slippageCoefficient: -0.0000003,
            volumeCoefficient: -0.000000001,
            intercept: 0,
            token0PriceInUsd: 0.000001,
        },
        {
            token0: usdc,
            token1: weth,
            source: 'source 2',
            slippageCoefficient: -0.0000004,
            volumeCoefficient: -0.000000003,
            intercept: -0.0001,
            token0PriceInUsd: 0.000001,
        },
    ];

    describe('calculateExpectedSlippage', () => {
        it('should return correct expected slippage if buying USDC', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();

            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(
                usdc,
                weth,
                new BigNumber('100000000000'),
                new BigNumber('1000000'),
                [
                    {
                        name: 'source 1',
                        proportion: new BigNumber(1),
                    },
                ],
                0.03,
            );

            // Then
            expect(expectedSlippage).to.deep.equal(new BigNumber(-0.00019));
        });
        it('should return correct expected slippage if selling USDC', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();

            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(
                weth,
                usdc,
                new BigNumber('1000000'),
                new BigNumber('100000000000'),
                [
                    {
                        name: 'source 1',
                        proportion: new BigNumber(1),
                    },
                ],
                0.03,
            );

            // Then
            expect(expectedSlippage).to.deep.equal(new BigNumber(-0.00019));
        });
        it('should return capped expected slippage if volume is huge', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();

            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(
                usdc,
                weth,
                new BigNumber('100000000000000'),
                new BigNumber('1000000'),
                [
                    {
                        name: 'source 1',
                        proportion: new BigNumber(1),
                    },
                ],
                0.03,
            );

            // Then
            expect(expectedSlippage).to.deep.equal(new BigNumber(-0.03));
        });
        it('should return aggregated slippage if there are multiple sources', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();

            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(
                usdc,
                weth,
                new BigNumber('100000000000'),
                new BigNumber('1000000'),
                [
                    {
                        name: 'source 1',
                        proportion: new BigNumber(0.5),
                    },
                    {
                        name: 'source 2',
                        proportion: new BigNumber(0.5),
                    },
                ],
                0.03,
            );

            // Then
            expect(expectedSlippage).to.deep.equal(new BigNumber(-0.000205));
        });
        it('should return null if pair is not supported', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();

            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(
                usdc,
                otherToken,
                new BigNumber('100000000000'),
                new BigNumber('1000000'),
                [
                    {
                        name: 'source 1',
                        proportion: new BigNumber(1),
                    },
                ],
                0.03,
            );

            // Then
            expect(expectedSlippage).to.deep.equal(null);
        });
        it('should return null if any source is not supported', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();

            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(
                usdc,
                weth,
                new BigNumber('100000000000'),
                new BigNumber('1000000'),
                [
                    {
                        name: 'source 1',
                        proportion: new BigNumber(0.5),
                    },
                    {
                        name: 'source 3',
                        proportion: new BigNumber(0.5),
                    },
                ],
                0.03,
            );

            // Then
            expect(expectedSlippage).to.deep.equal(null);
        });
        it('should return null if trade size is less than 10k USD', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();

            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(
                usdc,
                weth,
                new BigNumber('999000000'),
                new BigNumber('1000000'),
                [
                    {
                        name: 'source 1',
                        proportion: new BigNumber(1),
                    },
                ],
                0.03,
            );

            // Then
            expect(expectedSlippage).to.deep.equal(null);
        });
    });
});
