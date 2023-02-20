"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contract_wrappers_1 = require("@0x/contract-wrappers");
const contracts_erc20_1 = require("@0x/contracts-erc20");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const dev_utils_1 = require("@0x/dev-utils");
const token_metadata_1 = require("@0x/token-metadata");
const utils_1 = require("@0x/utils");
const HttpStatus = require("http-status-codes");
require("mocha");
const app_1 = require("../src/app");
const utils_2 = require("../src/runners/utils");
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
const SUITE_NAME = 'Meta-transaction API';
const MAKER_WETH_AMOUNT = new utils_1.BigNumber('1000000000000000000');
const ONE_THOUSAND_IN_BASE = new utils_1.BigNumber('1000000000000000000000');
const ZERO_EX_SOURCE = { name: '0x', proportion: new utils_1.BigNumber('1') };
const INTEGRATOR_ID = 'integrator';
const TAKER_ADDRESS = '0x70a9f34f9b34c64957b9c401a97bfed35b95049e';
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
    describe('v2 /price', async () => {
        it('should respond with 200 OK even if the the takerAddress cannot complete a trade', async () => {
            // The taker does not have an allowance
            const swapResponse = await requestSwap(app, 'price', 'v2', {
                takerAddress: invalidTakerAddress,
                sellToken: 'WETH',
                buyToken: 'ZRX',
                sellAmount: '10000',
                integratorId: 'integrator',
                metaTransactionVersion: 'v1',
            });
            (0, contracts_test_utils_1.expect)(swapResponse.statusCode).eq(HttpStatus.StatusCodes.OK);
        });
    });
    describe('v2 /quote', async () => {
        it('should handle valid request body permutations', async () => {
            const WETH_BUY_AMOUNT = MAKER_WETH_AMOUNT.div(10).toString();
            const ZRX_BUY_AMOUNT = ONE_THOUSAND_IN_BASE.div(10).toString();
            const bodyPermutations = [
                {
                    buyToken: 'ZRX',
                    sellToken: 'WETH',
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                },
                {
                    buyToken: 'ZRX',
                    sellToken: 'WETH',
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: {
                        integrator: { type: 'volume', volumePercentage: '0.1' },
                        zeroex: {
                            type: 'integrator_share',
                            integratorSharePercentage: '0.2',
                            feeRecipient: TAKER_ADDRESS,
                        },
                        gas: { type: 'gas' },
                    },
                },
                {
                    buyToken: 'WETH',
                    sellToken: 'ZRX',
                    buyAmount: WETH_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: {
                        integratorFee: { type: 'volume', volumePercentage: '0.1', feeRecipient: TAKER_ADDRESS },
                        zeroExFee: {
                            type: 'integrator_share',
                            integratorSharePercentage: '0.2',
                            feeRecipient: TAKER_ADDRESS,
                        },
                    },
                },
                {
                    buyToken: constants_2.ZRX_TOKEN_ADDRESS,
                    sellToken: 'WETH',
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: {
                        integratorFee: { type: 'volume', volumePercentage: '0.1' },
                        gasFee: { type: 'gas', feeRecipient: TAKER_ADDRESS },
                    },
                },
                {
                    buyToken: constants_2.ZRX_TOKEN_ADDRESS,
                    sellToken: constants_2.WETH_TOKEN_ADDRESS,
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: { integratorFee: { type: 'volume', volumePercentage: '0.1' } },
                },
                {
                    buyToken: constants_2.ZRX_TOKEN_ADDRESS,
                    sellToken: constants_2.WETH_TOKEN_ADDRESS,
                    buyAmount: ZRX_BUY_AMOUNT,
                    integratorId: INTEGRATOR_ID,
                    takerAddress: TAKER_ADDRESS,
                    feeConfigs: { gasFee: { type: 'gas', feeRecipient: TAKER_ADDRESS } },
                },
            ];
            for (const body of bodyPermutations) {
                const response = await requestSwap(app, 'quote', 'v2', {
                    ...body,
                    metaTransactionVersion: 'v1',
                });
                expectCorrectQuoteResponse(response, {
                    buyAmount: new utils_1.BigNumber(body.buyAmount),
                    sellTokenAddress: body.sellToken.startsWith('0x')
                        ? body.sellToken
                        : constants_2.SYMBOL_TO_ADDRESS[body.sellToken],
                    buyTokenAddress: body.buyToken.startsWith('0x') ? body.buyToken : constants_2.SYMBOL_TO_ADDRESS[body.buyToken],
                    allowanceTarget: (0, token_metadata_1.isNativeSymbolOrAddress)(body.sellToken, constants_2.CHAIN_ID)
                        ? constants_2.NULL_ADDRESS
                        : constants_2.CONTRACT_ADDRESSES.exchangeProxy,
                    sources: [ZERO_EX_SOURCE],
                });
            }
        });
        it("should respond with INSUFFICIENT_ASSET_LIQUIDITY when there's no liquidity", async () => {
            const response = await requestSwap(app, 'quote', 'v2', {
                buyToken: constants_2.ZRX_TOKEN_ADDRESS,
                sellToken: constants_2.WETH_TOKEN_ADDRESS,
                buyAmount: '10000000000000000000000000000000',
                integratorId: 'integrator',
                takerAddress: TAKER_ADDRESS,
                metaTransactionVersion: 'v1',
                feeConfigs: { integratorFee: { type: 'volume', volumePercentage: '0.1' } },
            });
            expectSwapError(response, {
                validationErrors: [
                    {
                        code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                        field: 'buyAmount',
                        reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
                    },
                ],
            });
        });
        it('should respect buyAmount', async () => {
            const response = await requestSwap(app, 'quote', 'v2', {
                buyToken: 'ZRX',
                sellToken: 'WETH',
                buyAmount: '1234',
                integratorId: INTEGRATOR_ID,
                takerAddress: TAKER_ADDRESS,
                metaTransactionVersion: 'v1',
                feeConfigs: {
                    integratorFee: { type: 'volume', volumePercentage: '0.1' },
                    zeroExFee: {
                        type: 'integrator_share',
                        integratorSharePercentage: '0.2',
                        feeRecipient: TAKER_ADDRESS,
                    },
                    gasFee: { type: 'gas' },
                },
            });
            expectCorrectQuoteResponse(response, { buyAmount: new utils_1.BigNumber(1234) });
        });
        it('should respect sellAmount', async () => {
            const response = await requestSwap(app, 'quote', 'v2', {
                buyToken: 'ZRX',
                sellToken: 'WETH',
                sellAmount: '1234',
                integratorId: INTEGRATOR_ID,
                takerAddress: TAKER_ADDRESS,
                metaTransactionVersion: 'v1',
                feeConfigs: {
                    integratorFee: { type: 'volume', volumePercentage: '0.1' },
                    zeroExFee: {
                        type: 'integrator_share',
                        integratorSharePercentage: '0.2',
                        feeRecipient: TAKER_ADDRESS,
                    },
                    gasFee: { type: 'gas' },
                },
            });
            expectCorrectQuoteResponse(response, { sellAmount: new utils_1.BigNumber(1234) });
        });
        it('should returns the correct trade kind', async () => {
            const response = await requestSwap(app, 'quote', 'v2', {
                buyToken: 'ZRX',
                sellToken: 'WETH',
                sellAmount: '1234',
                integratorId: INTEGRATOR_ID,
                takerAddress: TAKER_ADDRESS,
                metaTransactionVersion: 'v1',
                feeConfigs: {
                    integratorFee: { type: 'volume', volumePercentage: '0.1' },
                    zeroExFee: {
                        type: 'integrator_share',
                        integratorSharePercentage: '0.2',
                        feeRecipient: TAKER_ADDRESS,
                    },
                    gasFee: { type: 'gas' },
                },
            });
            (0, contracts_test_utils_1.expect)(response.body.trade.kind).to.eql('metatransaction');
        });
        describe('fee configs', async () => {
            describe('integrator', async () => {
                it('should throw error if kind is invalid', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        metaTransactionVersion: 'v1',
                        feeConfigs: {
                            integratorFee: { type: 'random', volumePercentage: '0.1' },
                        },
                    });
                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: errors_1.ValidationErrorCodes.IncorrectFormat,
                                reason: errors_1.ValidationErrorReasons.InvalidGaslessFeeType,
                            },
                        ],
                    });
                });
                it('should throw error if volumePercentage is out of range', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        metaTransactionVersion: 'v1',
                        feeConfigs: {
                            integratorFee: { type: 'volume', volumePercentage: '1000' },
                        },
                    });
                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                                reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
                            },
                        ],
                    });
                });
            });
            describe('0x', async () => {
                it('should throw error if kind is invalid', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        metaTransactionVersion: 'v1',
                        feeConfigs: {
                            zeroExFee: { type: 'random', volumePercentage: '0.1' },
                        },
                    });
                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: errors_1.ValidationErrorCodes.IncorrectFormat,
                                reason: errors_1.ValidationErrorReasons.InvalidGaslessFeeType,
                            },
                        ],
                    });
                });
                it('should throw error if volumePercentage is out of range', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        metaTransactionVersion: 'v1',
                        feeConfigs: {
                            zeroExFee: { type: 'volume', volumePercentage: '1000' },
                        },
                    });
                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                                reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
                            },
                        ],
                    });
                });
                it('should throw error if integrator fee config is empty and 0x fee kind is integrator_share', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        metaTransactionVersion: 'v1',
                        feeConfigs: {
                            zeroExFee: { type: 'integrator_share', integratorSharePercentage: '1000' },
                        },
                    });
                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: errors_1.ValidationErrorCodes.IncorrectFormat,
                                reason: errors_1.ValidationErrorReasons.InvalidGaslessFeeType,
                            },
                        ],
                    });
                    it('should throw error if integratorSharePercentage is out of range', async () => {
                        const response = await requestSwap(app, 'quote', 'v2', {
                            buyToken: 'ZRX',
                            sellToken: 'WETH',
                            sellAmount: '1234',
                            integratorId: INTEGRATOR_ID,
                            takerAddress: TAKER_ADDRESS,
                            metaTransactionVersion: 'v1',
                            feeConfigs: {
                                integratorFee: { type: 'volume', volumePercentage: '0.1' },
                                zeroExFee: { type: 'integrator_share', integratorSharePercentage: '1000' },
                            },
                        });
                        expectSwapError(response, {
                            validationErrors: [
                                {
                                    field: 'feeConfigs',
                                    code: errors_1.ValidationErrorCodes.ValueOutOfRange,
                                    reason: errors_1.ValidationErrorReasons.PercentageOutOfRange,
                                },
                            ],
                        });
                    });
                });
            });
            describe('gas', async () => {
                it('should throw error if kind is invalid', async () => {
                    const response = await requestSwap(app, 'quote', 'v2', {
                        buyToken: 'ZRX',
                        sellToken: 'WETH',
                        sellAmount: '1234',
                        integratorId: INTEGRATOR_ID,
                        takerAddress: TAKER_ADDRESS,
                        metaTransactionVersion: 'v1',
                        feeConfigs: {
                            gasFee: { type: 'random' },
                        },
                    });
                    expectSwapError(response, {
                        validationErrors: [
                            {
                                field: 'feeConfigs',
                                code: errors_1.ValidationErrorCodes.IncorrectFormat,
                                reason: errors_1.ValidationErrorReasons.InvalidGaslessFeeType,
                            },
                        ],
                    });
                });
            });
        });
    });
});
async function requestSwap(app, endpoint, version, body) {
    const metaTransactionPath = version === 'v1' ? constants_1.META_TRANSACTION_V1_PATH : constants_1.META_TRANSACTION_V2_PATH;
    const route = `${metaTransactionPath}/${endpoint}`;
    return await (0, http_utils_1.httpPostAsync)({ app, route, body });
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
        (0, contracts_test_utils_1.expect)(swapResponse.body.validationErrors).to.be.eql(swapErrors.validationErrors);
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
        (0, contracts_test_utils_1.expect)(quoteResponse[property], property).to.eql(expectedResponse[property]);
    }
}
//# sourceMappingURL=meta_transaction_test.js.map