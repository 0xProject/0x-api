import { ERC20BridgeSource } from '@0x/asset-swapper';
import { WETH9Contract } from '@0x/contract-wrappers';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { expect } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, web3Factory, Web3ProviderEngine } from '@0x/dev-utils';
import { ObjectMap, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as HttpStatus from 'http-status-codes';
import 'mocha';

import * as config from '../src/config';
import { SWAP_PATH as BASE_SWAP_PATH } from '../src/constants';
import { ValidationErrorItem } from '../src/errors';
import { logger } from '../src/logger';
import { GetSwapQuoteResponse } from '../src/types';

import {
    CONTRACT_ADDRESSES,
    MAX_INT,
    MAX_MINT_AMOUNT,
    SYMBOL_TO_ADDRESS,
    UNKNOWN_TOKEN_ADDRESS,
    UNKNOWN_TOKEN_ASSET_DATA,
    WETH_ASSET_DATA,
    WETH_TOKEN_ADDRESS,
    ZRX_ASSET_DATA,
    ZRX_TOKEN_ADDRESS,
} from './constants';
import { setupApiAsync, setupMeshAsync, teardownApiAsync, teardownMeshAsync } from './utils/deployment';
import { constructRoute, httpGetAsync } from './utils/http_utils';
import { MAKER_WETH_AMOUNT, MeshTestUtils } from './utils/mesh_test_utils';

const SUITE_NAME = '/swap/v1';
const SWAP_PATH = `${BASE_SWAP_PATH}/v1`;

const excludedSources = [
    ERC20BridgeSource.Uniswap,
    ERC20BridgeSource.UniswapV2,
    ERC20BridgeSource.UniswapV2Eth,
    ERC20BridgeSource.Kyber,
    ERC20BridgeSource.LiquidityProvider,
    ERC20BridgeSource.Eth2Dai,
    ERC20BridgeSource.MultiBridge,
];

const DEFAULT_QUERY_PARAMS = {
    buyToken: 'ZRX',
    sellToken: 'WETH',
    excludedSources: excludedSources.join(','),
};

const ONE_THOUSAND_IN_BASE = new BigNumber('1000000000000000000000');

describe(SUITE_NAME, () => {
    let meshUtils: MeshTestUtils;
    let accounts: string[];
    let takerAddress: string;
    let invalidTakerAddress: string;

    let blockchainLifecycle: BlockchainLifecycle;
    let provider: Web3ProviderEngine;

    before(async () => {
        await setupApiAsync(SUITE_NAME);
        // connect to ganache and run contract migrations
        const ganacheConfigs = {
            shouldUseInProcessGanache: false,
            shouldAllowUnlimitedContractSize: true,
            rpcUrl: config.ETHEREUM_RPC_URL,
        };
        provider = web3Factory.getRpcProvider(ganacheConfigs);

        const web3Wrapper = new Web3Wrapper(provider);
        blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

        accounts = await web3Wrapper.getAvailableAddressesAsync();
        [, /* makerAdddress, */ takerAddress, invalidTakerAddress] = accounts;

        // Set up liquidity.
        await blockchainLifecycle.startAsync();
        await setupMeshAsync(SUITE_NAME);
        meshUtils = new MeshTestUtils(provider);
        await meshUtils.setupUtilsAsync();
        await meshUtils.addPartialOrdersAsync([
            {
                makerAssetData: ZRX_ASSET_DATA,
                takerAssetData: WETH_ASSET_DATA,
                makerAssetAmount: ONE_THOUSAND_IN_BASE,
                takerAssetAmount: ONE_THOUSAND_IN_BASE,
            },
            {
                makerAssetData: ZRX_ASSET_DATA,
                takerAssetData: WETH_ASSET_DATA,
                makerAssetAmount: ONE_THOUSAND_IN_BASE,
                // tslint:disable:custom-no-magic-numbers
                takerAssetAmount: ONE_THOUSAND_IN_BASE.multipliedBy(2),
            },
            {
                makerAssetData: ZRX_ASSET_DATA,
                takerAssetData: WETH_ASSET_DATA,
                makerAssetAmount: MAX_MINT_AMOUNT,
                // tslint:disable:custom-no-magic-numbers
                takerAssetAmount: ONE_THOUSAND_IN_BASE.multipliedBy(3),
            },
            {
                makerAssetData: WETH_ASSET_DATA,
                takerAssetData: ZRX_ASSET_DATA,
                makerAssetAmount: MAKER_WETH_AMOUNT,
                takerAssetAmount: ONE_THOUSAND_IN_BASE,
            },
            {
                makerAssetData: ZRX_ASSET_DATA,
                takerAssetData: UNKNOWN_TOKEN_ASSET_DATA,
                makerAssetAmount: ONE_THOUSAND_IN_BASE,
                takerAssetAmount: ONE_THOUSAND_IN_BASE,
            },
        ]);
        const wethToken = new WETH9Contract(CONTRACT_ADDRESSES.etherToken, provider);
        const zrxToken = new DummyERC20TokenContract(CONTRACT_ADDRESSES.zrxToken, provider);
        // EP setup so maker address can take
        await zrxToken.mint(MAX_MINT_AMOUNT).awaitTransactionSuccessAsync({ from: takerAddress });
        await wethToken.deposit().awaitTransactionSuccessAsync({ from: takerAddress, value: MAKER_WETH_AMOUNT });
        await wethToken
            .approve(CONTRACT_ADDRESSES.exchangeProxyAllowanceTarget, MAX_INT)
            .awaitTransactionSuccessAsync({ from: takerAddress });
        await zrxToken
            .approve(CONTRACT_ADDRESSES.exchangeProxyAllowanceTarget, MAX_INT)
            .awaitTransactionSuccessAsync({ from: takerAddress });
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
        await teardownMeshAsync(SUITE_NAME);
        await teardownApiAsync(SUITE_NAME);
    });
    describe('/quote', () => {
        it("with INSUFFICIENT_ASSET_LIQUIDITY when there's no liquidity (empty orderbook, sampling excluded, no RFQ)", async () => {
            await quoteAndExpectAsync(
                { buyAmount: '10000000000000000000000000000000' },
                {
                    validationErrors: [
                        {
                            code: 1004,
                            field: 'buyAmount',
                            reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
                        },
                    ],
                },
            );
        });

        describe(`valid token parameter permutations`, async () => {
            const parameterPermutations = [
                { buyToken: 'ZRX', sellToken: 'WETH', buyAmount: '1000' },
                { buyToken: 'WETH', sellToken: 'ZRX', buyAmount: '1000' },
                { buyToken: ZRX_TOKEN_ADDRESS, sellToken: 'WETH', buyAmount: '1000' },
                { buyToken: ZRX_TOKEN_ADDRESS, sellToken: WETH_TOKEN_ADDRESS, buyAmount: '1000' },
                { buyToken: 'ZRX', sellToken: UNKNOWN_TOKEN_ADDRESS, buyAmount: '1000' },
            ];
            for (const parameters of parameterPermutations) {
                it(`should return a valid quote with ${JSON.stringify(parameters)}`, async () => {
                    await quoteAndExpectAsync(parameters, {
                        buyAmount: parameters.buyAmount,
                        sellTokenAddress: parameters.sellToken.startsWith('0x')
                            ? parameters.sellToken
                            : SYMBOL_TO_ADDRESS[parameters.sellToken],
                        buyTokenAddress: parameters.buyToken.startsWith('0x')
                            ? parameters.buyToken
                            : SYMBOL_TO_ADDRESS[parameters.buyToken],
                    });
                });
            }
        });

        it('should respect buyAmount', async () => {
            await quoteAndExpectAsync({ buyAmount: '1234' }, { buyAmount: '1234' });
        });
        it('should respect sellAmount', async () => {
            await quoteAndExpectAsync({ sellAmount: '1234' }, { sellAmount: '1234' });
        });
        it('should respect gasPrice', async () => {
            await quoteAndExpectAsync({ sellAmount: '1234', gasPrice: '150000000000' }, { gasPrice: '150000000000' });
        });
        it('should respect excludedSources', async () => {
            await quoteAndExpectAsync(
                {
                    sellAmount: '1234',
                    excludedSources: Object.values(ERC20BridgeSource).join(','),
                },
                {
                    validationErrors: [
                        {
                            code: 1004,
                            field: 'sellAmount',
                            reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
                        },
                    ],
                },
            );
        });
        it('should return a ExchangeProxy transaction for sellToken=ETH', async () => {
            await quoteAndExpectAsync(
                {
                    sellToken: 'WETH',
                    sellAmount: '1234',
                },
                {
                    to: CONTRACT_ADDRESSES.exchangeProxy,
                },
            );
            await quoteAndExpectAsync(
                {
                    sellToken: 'ETH',
                    sellAmount: '1234',
                },
                {
                    to: CONTRACT_ADDRESSES.exchangeProxy,
                },
            );
        });
        it('should not throw a validation error if takerAddress can complete the quote', async () => {
            // The maker has an allowance
            await quoteAndExpectAsync(
                {
                    takerAddress,
                    sellToken: 'WETH',
                    buyToken: 'ZRX',
                    sellAmount: '10000',
                },
                {
                    sellAmount: '10000',
                },
            );
        });
        it('should throw a validation error if takerAddress cannot complete the quote', async () => {
            // The taker does not have an allowance
            await quoteAndExpectAsync(
                {
                    takerAddress: invalidTakerAddress,
                    sellToken: 'WETH',
                    buyToken: 'ZRX',
                    sellAmount: '10000',
                },
                {
                    revertErrorReason: 'SpenderERC20TransferFromFailedError',
                },
            );
        });
        it('should not return estimatedGasTokenRefund: 0 if there are not gas tokens in our wallet', async () => {
            await quoteAndExpectAsync(
                {
                    sellAmount: '1234',
                },
                {
                    estimatedGasTokenRefund: '0',
                },
            );
        });
    });
});

interface QuoteAssertion {
    buyAmount: string;
    sellAmount: string;
    price: string;
    guaranteedPrice: string;
    gasPrice: string;
    to: string;
    signedOrders: SignedOrder[];
    sellTokenAddress: string;
    buyTokenAddress: string;
    estimatedGasTokenRefund: string;
    validationErrors: ValidationErrorItem[];
    revertErrorReason: string;
}

async function quoteAndExpectAsync(
    queryParams: ObjectMap<string>,
    quoteAssertions: Partial<QuoteAssertion>,
): Promise<void> {
    const route = constructRoute({
        baseRoute: `${SWAP_PATH}/quote`,
        queryParams: {
            ...DEFAULT_QUERY_PARAMS,
            ...queryParams,
        },
    });
    const response = await httpGetAsync({ route });
    expect(response.type).to.be.eq('application/json');
    if (quoteAssertions.revertErrorReason) {
        expect(response.status).to.be.eq(HttpStatus.BAD_REQUEST);
        expect(response.body.code).to.eq(105);
        expect(response.body.reason).to.be.eql(quoteAssertions.revertErrorReason);
        return;
    }
    if (quoteAssertions.validationErrors) {
        expect(response.status).to.be.eq(HttpStatus.BAD_REQUEST);
        expect(response.body.code).to.eq(100);
        expect(response.body.validationErrors).to.be.eql(quoteAssertions.validationErrors);
        return;
    }
    if (response.status !== HttpStatus.OK) {
        logger.warn(response);
    }
    expect(response.status).to.be.eq(HttpStatus.OK);
    expectCorrectQuote(response.body, quoteAssertions);
}

function expectCorrectQuote(quoteResponse: GetSwapQuoteResponse, quoteAssertions: Partial<QuoteAssertion>): void {
    for (const property of Object.keys(quoteAssertions)) {
        expect(quoteResponse[property]).to.be.eql(quoteAssertions[property]);
    }
    // Only have 0x liquidity for now.
    expect(quoteResponse.sources).to.be.eql([
        { name: '0x', proportion: '1' },
        { name: 'Uniswap', proportion: '0' },
        { name: 'Uniswap_V2', proportion: '0' },
        { name: 'Uniswap_V2_ETH', proportion: '0' },
        { name: 'Eth2Dai', proportion: '0' },
        { name: 'Kyber', proportion: '0' },
        { name: 'Curve_USDC_DAI', proportion: '0' },
        { name: 'Curve_USDC_DAI_USDT', proportion: '0' },
        { name: 'Curve_USDC_DAI_USDT_TUSD', proportion: '0' },
        { name: 'Curve_USDC_DAI_USDT_BUSD', proportion: '0' },
        { name: 'Curve_USDC_DAI_USDT_SUSD', proportion: '0' },
        { name: 'LiquidityProvider', proportion: '0' },
        { name: 'MultiBridge', proportion: '0' },
    ]);
}
