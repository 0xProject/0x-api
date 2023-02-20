"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const ts_mockito_1 = require("ts-mockito");
const s3_client_1 = require("../../src/utils/s3_client");
const slippage_model_manager_1 = require("../../src/utils/slippage_model_manager");
const createMockS3Client = (slippageModels) => {
    const s3ClientMock = (0, ts_mockito_1.mock)(s3_client_1.S3Client);
    (0, ts_mockito_1.when)(s3ClientMock.hasFileAsync((0, ts_mockito_1.anything)(), (0, ts_mockito_1.anything)())).thenResolve({
        exists: true,
        lastModified: new Date(),
    });
    (0, ts_mockito_1.when)(s3ClientMock.getFileContentAsync((0, ts_mockito_1.anything)(), (0, ts_mockito_1.anything)())).thenResolve({
        content: JSON.stringify(slippageModels),
        lastModified: new Date(),
    });
    return (0, ts_mockito_1.instance)(s3ClientMock);
};
describe('SlippageModelManager', () => {
    const usdc = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const weth = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const otherToken = '0xeac17f958d2ee523a2206206994597c13d831ec7';
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
            volumeCoefficient: -0.000000002,
            intercept: -0.00001,
            token0PriceInUsd: 0.000001,
        },
    ];
    describe('calculateExpectedSlippage', () => {
        it('should return correct expected slippage if buying USDC', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, weth, new utils_1.BigNumber('100000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: 'source 1',
                    proportion: new utils_1.BigNumber(1),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(-0.00019));
        });
        it('should return correct expected slippage if selling USDC', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(weth, usdc, new utils_1.BigNumber('1000000'), new utils_1.BigNumber('100000000000'), [
                {
                    name: 'source 1',
                    proportion: new utils_1.BigNumber(1),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(-0.00019));
        });
        it('should return expected slippage for small trades', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, weth, new utils_1.BigNumber('250000000'), // $250
            new utils_1.BigNumber('250000'), [
                {
                    name: 'source 1',
                    proportion: new utils_1.BigNumber(1),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(-0.00009025));
        });
        it('should return 0 slippage if the expected slippage from the model is positive', async () => {
            // Given
            const s3Client = createMockS3Client([
                {
                    token0: usdc,
                    token1: weth,
                    source: 'positive intercept source',
                    slippageCoefficient: -0.0000004,
                    volumeCoefficient: -0.000000002,
                    intercept: 1,
                    token0PriceInUsd: 0.000001,
                },
            ]);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, weth, new utils_1.BigNumber('100000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: 'positive intercept source',
                    proportion: new utils_1.BigNumber(1),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(0));
        });
        it('should return capped expected slippage if volume is huge', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, weth, new utils_1.BigNumber('100000000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: 'source 1',
                    proportion: new utils_1.BigNumber(1),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(-0.03));
        });
        it('should return 0 slippage when source is 0x (Native)', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, weth, new utils_1.BigNumber('100000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: '0x',
                    proportion: new utils_1.BigNumber(1),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(0));
        });
        it('should return 0 slippage when source is "Native"', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, weth, new utils_1.BigNumber('100000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: 'Native',
                    proportion: new utils_1.BigNumber(1),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(0));
        });
        it('should return 0 slippage when sole source is 0x (Native) even when the pair is not supported', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(weth, otherToken, new utils_1.BigNumber('100000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: '0x',
                    proportion: new utils_1.BigNumber(1),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(0));
        });
        it('should return aggregated slippage if there are multiple sources', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, weth, new utils_1.BigNumber('100000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: 'source 1',
                    proportion: new utils_1.BigNumber(0.5),
                },
                {
                    name: 'source 2',
                    proportion: new utils_1.BigNumber(0.5),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(-0.000185));
        });
        it('should return aggregated slippage when there are multiple sources including 0x', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, weth, new utils_1.BigNumber('100000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: 'source 1',
                    proportion: new utils_1.BigNumber(0.5),
                },
                {
                    name: '0x',
                    proportion: new utils_1.BigNumber(0.5),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(new utils_1.BigNumber(-0.00007));
        });
        it('should return null if pair is not supported', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, otherToken, new utils_1.BigNumber('100000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: 'source 1',
                    proportion: new utils_1.BigNumber(1),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(null);
        });
        it('should return null if any source is not supported', async () => {
            // Given
            const s3Client = createMockS3Client(slippageModels);
            const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
            await slippageModelManager.initializeAsync();
            // When
            const expectedSlippage = slippageModelManager.calculateExpectedSlippage(usdc, weth, new utils_1.BigNumber('100000000000'), new utils_1.BigNumber('1000000'), [
                {
                    name: 'source 1',
                    proportion: new utils_1.BigNumber(0.5),
                },
                {
                    name: 'source 3',
                    proportion: new utils_1.BigNumber(0.5),
                },
            ], 0.03);
            // Then
            (0, contracts_test_utils_1.expect)(expectedSlippage).to.deep.equal(null);
        });
    });
});
//# sourceMappingURL=slippage_model_manager_test.js.map