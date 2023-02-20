"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contract_wrappers_1 = require("@0x/contract-wrappers");
const contracts_erc20_1 = require("@0x/contracts-erc20");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const dev_utils_1 = require("@0x/dev-utils");
const token_metadata_1 = require("@0x/token-metadata");
const utils_1 = require("@0x/utils");
const HttpStatus = require("http-status-codes");
const _ = require("lodash");
require("mocha");
const app_1 = require("../src/app");
const utils_2 = require("../src/runners/utils");
const asset_swapper_1 = require("../src/asset-swapper");
const config = require("../src/config");
const constants_1 = require("../src/constants");
const db_connection_1 = require("../src/db_connection");
const errors_1 = require("../src/errors");
const constants_2 = require("./constants");
const deployment_1 = require("./utils/deployment");
const http_utils_1 = require("./utils/http_utils");
const mock_order_watcher_1 = require("./utils/mock_order_watcher");
const orders_1 = require("./utils/orders");
const http_status_codes_1 = require("http-status-codes");
// Force reload of the app avoid variables being polluted between test suites
// Warning: You probably don't want to move this
delete require.cache[require.resolve('../src/app')];
delete require.cache[require.resolve('../src/runners/utils')];
const SUITE_NAME = 'Swap API';
const EXCLUDED_SOURCES = asset_swapper_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[asset_swapper_1.ChainId.Mainnet].sources.filter((s) => s !== asset_swapper_1.ERC20BridgeSource.Native);
const DEFAULT_QUERY_PARAMS = {
    buyToken: 'ZRX',
    sellToken: 'WETH',
    excludedSources: EXCLUDED_SOURCES.join(','),
};
const MAKER_WETH_AMOUNT = new utils_1.BigNumber('1000000000000000000');
const ONE_THOUSAND_IN_BASE = new utils_1.BigNumber('1000000000000000000000');
const ZERO_EX_SOURCE = { name: '0x', proportion: new utils_1.BigNumber('1') };
describe(SUITE_NAME, () => {
    let app;
    let server;
    let dependencies;
    let accounts;
    let takerAddress;
    let makerAddress;
    const invalidTakerAddress = '0x0000000000000000000000000000000000000001';
    let blockchainLifecycle;
    let provider;
    before(async () => {
        await (0, deployment_1.setupDependenciesAsync)(SUITE_NAME);
        const connection = await (0, db_connection_1.getDBConnectionOrThrow)();
        await connection.runMigrations();
        provider = (0, constants_2.getProvider)();
        const web3Wrapper = new dev_utils_1.Web3Wrapper(provider);
        blockchainLifecycle = new dev_utils_1.BlockchainLifecycle(web3Wrapper);
        const mockOrderWatcher = new mock_order_watcher_1.MockOrderWatcher(connection);
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        [, makerAddress, takerAddress] = accounts;
        // Set up liquidity.
        await blockchainLifecycle.startAsync();
        const wethToken = new contract_wrappers_1.WETH9Contract(constants_2.CONTRACT_ADDRESSES.etherToken, provider);
        const zrxToken = new contracts_erc20_1.DummyERC20TokenContract(constants_2.CONTRACT_ADDRESSES.zrxToken, provider);
        // EP setup so maker address can take
        await zrxToken.mint(constants_2.MAX_MINT_AMOUNT).awaitTransactionSuccessAsync({ from: takerAddress });
        await zrxToken.mint(constants_2.MAX_MINT_AMOUNT).awaitTransactionSuccessAsync({ from: makerAddress });
        await wethToken.deposit().awaitTransactionSuccessAsync({ from: takerAddress, value: MAKER_WETH_AMOUNT });
        await wethToken.deposit().awaitTransactionSuccessAsync({ from: makerAddress, value: MAKER_WETH_AMOUNT });
        await wethToken
            .approve(constants_2.CONTRACT_ADDRESSES.exchangeProxy, constants_2.MAX_INT)
            .awaitTransactionSuccessAsync({ from: takerAddress });
        await wethToken
            .approve(constants_2.CONTRACT_ADDRESSES.exchangeProxy, constants_2.MAX_INT)
            .awaitTransactionSuccessAsync({ from: makerAddress });
        await zrxToken
            .approve(constants_2.CONTRACT_ADDRESSES.exchangeProxy, constants_2.MAX_INT)
            .awaitTransactionSuccessAsync({ from: takerAddress });
        await zrxToken
            .approve(constants_2.CONTRACT_ADDRESSES.exchangeProxy, constants_2.MAX_INT)
            .awaitTransactionSuccessAsync({ from: makerAddress });
        const limitOrders = [
            {
                makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                takerToken: constants_2.WETH_TOKEN_ADDRESS,
                makerAmount: ONE_THOUSAND_IN_BASE,
                takerAmount: ONE_THOUSAND_IN_BASE,
                maker: makerAddress,
            },
            {
                makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                takerToken: constants_2.WETH_TOKEN_ADDRESS,
                makerAmount: ONE_THOUSAND_IN_BASE,
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(2),
                maker: makerAddress,
            },
            {
                makerToken: constants_2.ZRX_TOKEN_ADDRESS,
                takerToken: constants_2.WETH_TOKEN_ADDRESS,
                makerAmount: constants_2.MAX_MINT_AMOUNT,
                takerAmount: ONE_THOUSAND_IN_BASE.multipliedBy(3),
                maker: makerAddress,
            },
            {
                makerToken: constants_2.WETH_TOKEN_ADDRESS,
                takerToken: constants_2.ZRX_TOKEN_ADDRESS,
                makerAmount: MAKER_WETH_AMOUNT,
                takerAmount: ONE_THOUSAND_IN_BASE,
                maker: makerAddress,
            },
        ];
        const signPartialOrder = (order) => (0, orders_1.getRandomSignedLimitOrderAsync)(provider, order);
        const signedOrders = await Promise.all(limitOrders.map(signPartialOrder));
        await mockOrderWatcher.postOrdersAsync(signedOrders);
        // start the 0x-api app
        dependencies = await (0, utils_2.getDefaultAppDependenciesAsync)(provider, {
            ...config.defaultHttpServiceConfig,
            ethereumRpcUrl: constants_2.ETHEREUM_RPC_URL,
        });
        ({ app, server } = await (0, app_1.getAppAsync)({ ...dependencies }, { ...config.defaultHttpServiceConfig, ethereumRpcUrl: constants_2.ETHEREUM_RPC_URL }));
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        await (0, deployment_1.teardownDependenciesAsync)(SUITE_NAME);
    });
    describe(`/quote should handle valid token parameter permutations`, () => {
        const WETH_BUY_AMOUNT = MAKER_WETH_AMOUNT.div(10).toString();
        const ZRX_BUY_AMOUNT = ONE_THOUSAND_IN_BASE.div(10).toString();
        const parameterPermutations = [
            { buyToken: 'ZRX', sellToken: 'WETH', buyAmount: ZRX_BUY_AMOUNT },
            { buyToken: 'WETH', sellToken: 'ZRX', buyAmount: WETH_BUY_AMOUNT },
            { buyToken: constants_2.ZRX_TOKEN_ADDRESS, sellToken: 'WETH', buyAmount: ZRX_BUY_AMOUNT },
            { buyToken: constants_2.ZRX_TOKEN_ADDRESS, sellToken: constants_2.WETH_TOKEN_ADDRESS, buyAmount: ZRX_BUY_AMOUNT },
            // { buyToken: 'ZRX', sellToken: UNKNOWN_TOKEN_ADDRESS, buyAmount: ZRX_BUY_AMOUNT },
            { buyToken: 'ZRX', sellToken: 'ETH', buyAmount: ZRX_BUY_AMOUNT },
            { buyToken: 'ETH', sellToken: 'ZRX', buyAmount: WETH_BUY_AMOUNT },
            { buyToken: 'ZRX', sellToken: constants_2.ETH_TOKEN_ADDRESS, buyAmount: ZRX_BUY_AMOUNT },
            { buyToken: constants_2.ETH_TOKEN_ADDRESS, sellToken: 'ZRX', buyAmount: WETH_BUY_AMOUNT },
        ];
        parameterPermutations.map((parameters) => {
            it(`should return a valid quote for ${JSON.stringify(parameters)}`, async () => {
                const response = await requestSwap(app, 'quote', parameters);
                expectCorrectQuoteResponse(response, {
                    buyAmount: new utils_1.BigNumber(parameters.buyAmount),
                    sellTokenAddress: parameters.sellToken.startsWith('0x')
                        ? parameters.sellToken
                        : constants_2.SYMBOL_TO_ADDRESS[parameters.sellToken],
                    buyTokenAddress: parameters.buyToken.startsWith('0x')
                        ? parameters.buyToken
                        : constants_2.SYMBOL_TO_ADDRESS[parameters.buyToken],
                    allowanceTarget: (0, token_metadata_1.isNativeSymbolOrAddress)(parameters.sellToken, constants_2.CHAIN_ID)
                        ? constants_2.NULL_ADDRESS
                        : constants_2.CONTRACT_ADDRESSES.exchangeProxy,
                    sources: [ZERO_EX_SOURCE],
                });
            });
        });
    });
    describe('/price', async () => {
        it('should respond with 200 OK even if the the takerAddress cannot complete a trade', async () => {
            // The taker does not have an allowance
            const swapResponse = await requestSwap(app, 'price', {
                takerAddress: invalidTakerAddress,
                sellToken: 'WETH',
                buyToken: 'ZRX',
                sellAmount: '10000',
            });
            (0, contracts_test_utils_1.expect)(swapResponse.statusCode).eq(HttpStatus.StatusCodes.OK);
        });
    });
    describe('/quote', async () => {
        it("should respond with INSUFFICIENT_ASSET_LIQUIDITY when there's no liquidity (empty orderbook, sampling excluded, no RFQ)", async () => {
            const response = await requestSwap(app, 'quote', { buyAmount: '10000000000000000000000000000000' });
            expectSwapError(response, {
                validationErrors: [
                    {
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        description: 'We are not able to fulfill an order for this token pair at the requested amount due to a lack of liquidity',
                        field: 'buyAmount',
                        reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
                    },
                ],
            });
        });
        it('should handle wrapping of native token', async () => {
            const response = await requestSwap(app, 'quote', {
                sellToken: 'ETH',
                buyToken: 'WETH',
                sellAmount: '10000000',
            });
            expectCorrectQuoteResponse(response, {
                sellTokenAddress: constants_2.ETH_TOKEN_ADDRESS,
                buyTokenAddress: constants_2.WETH_TOKEN_ADDRESS,
                buyAmount: new utils_1.BigNumber('10000000'),
            });
        });
        it('should handle unwrapping of native token', async () => {
            const response = await requestSwap(app, 'quote', {
                sellToken: 'WETH',
                buyToken: 'ETH',
                sellAmount: '10000000',
            });
            expectCorrectQuoteResponse(response, {
                sellTokenAddress: constants_2.WETH_TOKEN_ADDRESS,
                buyTokenAddress: constants_2.ETH_TOKEN_ADDRESS,
                buyAmount: new utils_1.BigNumber('10000000'),
            });
        });
        it('should respect buyAmount', async () => {
            const response = await requestSwap(app, 'quote', { buyAmount: '1234' });
            expectCorrectQuoteResponse(response, { buyAmount: new utils_1.BigNumber(1234) });
        });
        it('should respect sellAmount', async () => {
            const response = await requestSwap(app, 'quote', { sellAmount: '1234' });
            expectCorrectQuoteResponse(response, { sellAmount: new utils_1.BigNumber(1234) });
        });
        it('should respect gasPrice', async () => {
            const response = await requestSwap(app, 'quote', { sellAmount: '1234', gasPrice: '150000000000' });
            expectCorrectQuoteResponse(response, { gasPrice: new utils_1.BigNumber('150000000000') });
        });
        it('should respect protocolFee for non RFQT orders', async () => {
            const gasPrice = new utils_1.BigNumber('150000000000');
            const protocolFee = gasPrice.times(config.PROTOCOL_FEE_MULTIPLIER);
            const response = await requestSwap(app, 'quote', { sellAmount: '1234', gasPrice: '150000000000' });
            expectCorrectQuoteResponse(response, { gasPrice, protocolFee, value: protocolFee });
        });
        it('should throw an error when requested to exclude all sources', async () => {
            const response = await requestSwap(app, 'quote', {
                sellAmount: '1234',
                excludedSources: Object.values(asset_swapper_1.ERC20BridgeSource).join(','),
            });
            expectSwapError(response, {
                validationErrors: [
                    {
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        field: 'excludedSources',
                        reason: 'Request excluded all sources',
                    },
                ],
            });
        });
        it('should not use a source that is in excludedSources', async () => {
            // TODO: When non-native source is supported for this test, it should test whether the
            // proportion of Native in response.sources is 0 instead of checking whether it failed
            // because of INSUFFICIENT_ASSET_LIQUIDITY
            const response = await requestSwap(app, 'quote', {
                sellAmount: '1234',
                excludedSources: `${asset_swapper_1.ERC20BridgeSource.Native}`,
            });
            expectSwapError(response, {
                validationErrors: [
                    {
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        description: 'We are not able to fulfill an order for this token pair at the requested amount due to a lack of liquidity',
                        field: 'sellAmount',
                        reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
                    },
                ],
            });
        });
        it('should not use source that is not in includedSources', async () => {
            // TODO: When non-native source is supported for this test, it should test whether the
            // proportion of Native in response.sources is 0 instead of checking whether it failed
            // because of INSUFFICIENT_ASSET_LIQUIDITY
            const response = await requestSwap(app, 'quote', {
                sellAmount: '1234',
                excludedSources: '',
                includedSources: `${asset_swapper_1.ERC20BridgeSource.UniswapV2}`,
            });
            expectSwapError(response, {
                validationErrors: [
                    {
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        description: 'We are not able to fulfill an order for this token pair at the requested amount due to a lack of liquidity',
                        field: 'sellAmount',
                        reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
                    },
                ],
            });
        });
        it('should respect includedSources', async () => {
            const response = await requestSwap(app, 'quote', {
                sellAmount: '1234',
                excludedSources: '',
                includedSources: [asset_swapper_1.ERC20BridgeSource.Native].join(','),
            });
            expectCorrectQuoteResponse(response, { sellAmount: new utils_1.BigNumber(1234) });
        });
        it('should return a ExchangeProxy transaction for sellToken=WETH', async () => {
            const response = await requestSwap(app, 'quote', {
                sellToken: 'WETH',
                sellAmount: '1234',
            });
            expectCorrectQuoteResponse(response, {
                to: constants_2.CONTRACT_ADDRESSES.exchangeProxy,
            });
        });
        it('should include debugData when debug=true', async () => {
            const response = await requestSwap(app, 'quote', {
                sellToken: 'WETH',
                sellAmount: '1234',
                debug: 'true',
            });
            expectCorrectQuoteResponse(response, {
                debugData: {
                    samplerGasUsage: 130000, // approximate: +- 50%
                },
            });
        });
        it('should return a ExchangeProxy transaction for sellToken=ETH', async () => {
            const response = await requestSwap(app, 'quote', {
                sellToken: 'WETH',
                sellAmount: '1234',
            });
            expectCorrectQuoteResponse(response, {
                to: constants_2.CONTRACT_ADDRESSES.exchangeProxy,
            });
        });
        // TODO: unskip when Docker Ganache snapshot has been updated
        it.skip('should not throw a validation error if takerAddress can complete the quote', async () => {
            // The maker has an allowance
            const response = await requestSwap(app, 'quote', {
                takerAddress,
                sellToken: 'WETH',
                buyToken: 'ZRX',
                sellAmount: '10000',
            });
            expectCorrectQuoteResponse(response, {
                sellAmount: new utils_1.BigNumber(10000),
            });
        });
        it('should throw a validation error if takerAddress cannot complete the quote', async () => {
            // The taker does not have an allowance
            const response = await requestSwap(app, 'quote', {
                takerAddress: invalidTakerAddress,
                sellToken: 'WETH',
                buyToken: 'ZRX',
                sellAmount: '10000',
            });
            expectSwapError(response, { generalUserError: true });
        });
        describe('affiliate fees', () => {
            const sellQuoteParams = {
                ...DEFAULT_QUERY_PARAMS,
                sellAmount: (0, contracts_test_utils_1.getRandomInteger)(1, 100000).toString(),
            };
            const buyQuoteParams = {
                ...DEFAULT_QUERY_PARAMS,
                buyAmount: (0, contracts_test_utils_1.getRandomInteger)(1, 100000).toString(),
            };
            let sellQuoteWithoutFee;
            let buyQuoteWithoutFee;
            before(async () => {
                const sellQuoteRoute = (0, http_utils_1.constructRoute)({
                    baseRoute: `${constants_1.SWAP_PATH}/quote`,
                    queryParams: sellQuoteParams,
                });
                const sellQuoteResponse = await (0, http_utils_1.httpGetAsync)({ route: sellQuoteRoute });
                sellQuoteWithoutFee = sellQuoteResponse.body;
                const buyQuoteRoute = (0, http_utils_1.constructRoute)({
                    baseRoute: `${constants_1.SWAP_PATH}/quote`,
                    queryParams: buyQuoteParams,
                });
                const buyQuoteResponse = await (0, http_utils_1.httpGetAsync)({ route: buyQuoteRoute });
                buyQuoteWithoutFee = buyQuoteResponse.body;
            });
            it('can add a buy token affiliate fee to a sell quote', async () => {
                const feeRecipient = (0, contracts_test_utils_1.randomAddress)();
                const buyTokenPercentageFee = new utils_1.BigNumber(0.05);
                const response = await requestSwap(app, 'quote', {
                    ...sellQuoteParams,
                    feeRecipient,
                    buyTokenPercentageFee: buyTokenPercentageFee.toString(),
                });
                expectCorrectQuoteResponse(response, _.omit({
                    ...sellQuoteWithoutFee,
                    buyAmount: new utils_1.BigNumber(sellQuoteWithoutFee.buyAmount).dividedBy(buyTokenPercentageFee.plus(1)),
                    estimatedGas: new utils_1.BigNumber(sellQuoteWithoutFee.estimatedGas).plus(constants_1.AFFILIATE_FEE_TRANSFORMER_GAS),
                    gas: new utils_1.BigNumber(sellQuoteWithoutFee.gas).plus(constants_1.AFFILIATE_FEE_TRANSFORMER_GAS.times(constants_1.GAS_LIMIT_BUFFER_MULTIPLIER)),
                    price: new utils_1.BigNumber(sellQuoteWithoutFee.price).dividedBy(buyTokenPercentageFee.plus(1)),
                    guaranteedPrice: new utils_1.BigNumber(sellQuoteWithoutFee.guaranteedPrice).dividedBy(buyTokenPercentageFee.plus(1)),
                }, 'data', 'decodedUniqueId'));
            });
            it('can add a buy token affiliate fee to a buy quote', async () => {
                const feeRecipient = (0, contracts_test_utils_1.randomAddress)();
                const buyTokenPercentageFee = new utils_1.BigNumber(0.05);
                const response = await requestSwap(app, 'quote', {
                    ...buyQuoteParams,
                    feeRecipient,
                    buyTokenPercentageFee: buyTokenPercentageFee.toString(),
                });
                expectCorrectQuoteResponse(response, _.omit({
                    ...buyQuoteWithoutFee,
                    estimatedGas: new utils_1.BigNumber(buyQuoteWithoutFee.estimatedGas).plus(constants_1.AFFILIATE_FEE_TRANSFORMER_GAS),
                    gas: new utils_1.BigNumber(buyQuoteWithoutFee.gas).plus(constants_1.AFFILIATE_FEE_TRANSFORMER_GAS.times(constants_1.GAS_LIMIT_BUFFER_MULTIPLIER)),
                    price: new utils_1.BigNumber(buyQuoteWithoutFee.price).times(buyTokenPercentageFee.plus(1)),
                    guaranteedPrice: new utils_1.BigNumber(buyQuoteWithoutFee.guaranteedPrice).times(buyTokenPercentageFee.plus(1)),
                }, 'data', 'sellAmount', 'orders', 'decodedUniqueId'));
            });
            it('validation error if given a non-zero sell token fee', async () => {
                const feeRecipient = (0, contracts_test_utils_1.randomAddress)();
                const response = await requestSwap(app, 'quote', {
                    ...sellQuoteParams,
                    feeRecipient,
                    sellTokenPercentageFee: '0.01',
                });
                expectSwapError(response, {
                    validationErrors: [
                        {
                            code: errors_1.ValidationErrorCodes.UnsupportedOption,
                            field: 'sellTokenPercentageFee',
                            reason: errors_1.ValidationErrorReasons.ArgumentNotYetSupported,
                        },
                    ],
                });
            });
            it('validation error if given an invalid percentage', async () => {
                const feeRecipient = (0, contracts_test_utils_1.randomAddress)();
                const response = await requestSwap(app, 'quote', {
                    ...sellQuoteParams,
                    feeRecipient,
                    buyTokenPercentageFee: '1.01',
                });
                expectSwapError(response, {
                    validationErrors: [
                        {
                            code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                            field: 'buyTokenPercentageFee',
                            reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
                        },
                    ],
                });
            });
        });
        describe('affiliate address', () => {
            it('encodes affiliate address into quote call data', async () => {
                const sellQuoteParams = {
                    ...DEFAULT_QUERY_PARAMS,
                    sellAmount: (0, contracts_test_utils_1.getRandomInteger)(1, 100000).toString(),
                    affiliateAddress: constants_2.MATCHA_AFFILIATE_ADDRESS,
                };
                const buyQuoteParams = {
                    ...DEFAULT_QUERY_PARAMS,
                    buyAmount: (0, contracts_test_utils_1.getRandomInteger)(1, 100000).toString(),
                    affiliateAddress: constants_2.MATCHA_AFFILIATE_ADDRESS,
                };
                for (const params of [sellQuoteParams, buyQuoteParams]) {
                    const quoteRoute = (0, http_utils_1.constructRoute)({
                        baseRoute: `${constants_1.SWAP_PATH}/quote`,
                        queryParams: params,
                    });
                    const quoteResponse = await (0, http_utils_1.httpGetAsync)({ route: quoteRoute });
                    (0, contracts_test_utils_1.expect)(quoteResponse.body.data).to.include(constants_2.MATCHA_AFFILIATE_ENCODED_PARTIAL_ORDER_DATA);
                }
            });
        });
    });
});
async function requestSwap(app, endpoint, queryParams) {
    const route = (0, http_utils_1.constructRoute)({
        baseRoute: `${constants_1.SWAP_PATH}/${endpoint}`,
        queryParams: {
            // NOTE: consider removing default params
            ...DEFAULT_QUERY_PARAMS,
            ...queryParams,
        },
    });
    return await (0, http_utils_1.httpGetAsync)({ app, route });
}
async function expectSwapError(swapResponse, swapErrors) {
    (0, contracts_test_utils_1.expect)(swapResponse.type).to.be.eq('application/json');
    (0, contracts_test_utils_1.expect)(swapResponse.statusCode).not.eq(http_status_codes_1.StatusCodes.OK);
    if (swapErrors.revertErrorReason) {
        (0, contracts_test_utils_1.expect)(swapResponse.status).to.be.eq(http_status_codes_1.StatusCodes.BAD_REQUEST);
        (0, contracts_test_utils_1.expect)(swapResponse.body.code).to.eq(105);
        (0, contracts_test_utils_1.expect)(swapResponse.body.reason).to.be.eql(swapErrors.revertErrorReason);
        return swapResponse;
    }
    if (swapErrors.validationErrors) {
        (0, contracts_test_utils_1.expect)(swapResponse.status).to.be.eq(http_status_codes_1.StatusCodes.BAD_REQUEST);
        (0, contracts_test_utils_1.expect)(swapResponse.body.code).to.eq(100);
        (0, contracts_test_utils_1.expect)(swapResponse.body.validationErrors).to.be.deep.eq(swapErrors.validationErrors);
        return swapResponse;
    }
    if (swapErrors.generalUserError) {
        (0, contracts_test_utils_1.expect)(swapResponse.status).to.be.eq(http_status_codes_1.StatusCodes.BAD_REQUEST);
        return swapResponse;
    }
}
const PRECISION = 2;
function expectCorrectQuoteResponse(response, expectedResponse) {
    (0, contracts_test_utils_1.expect)(response.type).to.be.eq('application/json');
    (0, contracts_test_utils_1.expect)(response.statusCode).eq(http_status_codes_1.StatusCodes.OK);
    const quoteResponse = response.body;
    for (const prop of Object.keys(expectedResponse)) {
        const property = prop;
        if (utils_1.BigNumber.isBigNumber(expectedResponse[property])) {
            (0, contracts_test_utils_1.assertRoughlyEquals)(quoteResponse[property], expectedResponse[property], PRECISION);
            continue;
        }
        if (prop === 'sources' && expectedResponse.sources !== undefined) {
            const expectedSources = expectedResponse.sources.map((source) => ({
                ...source,
                proportion: source.proportion.toString(),
            }));
            (0, contracts_test_utils_1.expect)(quoteResponse.sources).to.deep.include.members(expectedSources);
            continue;
        }
        if (prop === 'debugData') {
            const { samplerGasUsage, ...rest } = quoteResponse[property];
            const { samplerGasUsage: expectedSamplerGasUsage, ...expectedRest } = expectedResponse[property];
            console.log(samplerGasUsage, expectedSamplerGasUsage);
            (0, contracts_test_utils_1.expect)(samplerGasUsage).gt(expectedSamplerGasUsage * 0.5, 'samplerGasUsage is too low');
            (0, contracts_test_utils_1.expect)(samplerGasUsage).lt(expectedSamplerGasUsage * 1.5, 'samplerGasUsage is too high');
            (0, contracts_test_utils_1.expect)(rest).to.be.deep.eq(expectedRest);
            continue;
        }
        (0, contracts_test_utils_1.expect)(quoteResponse[property], property).to.deep.eq(expectedResponse[property]);
    }
}
//# sourceMappingURL=swap_test.js.map