import { ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { constants, expect, OrderFactory } from '@0x/contracts-test-utils';
import { web3Factory } from '@0x/dev-utils';
import { WSClient } from '@0x/mesh-rpc-client';
import { assetDataUtils } from '@0x/order-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as HttpStatus from 'http-status-codes';
import 'mocha';

import * as config from '../src/config';
import { META_TRANSACTION_PATH } from '../src/constants';

import { setupApiAsync, teardownApiAsync } from './utils/deployment';
import { httpGetAsync } from './utils/http_utils';

const SUITE_NAME = 'meta transactions test';

describe.only(SUITE_NAME, () => {
    let makerAddress: string;
    let takerAddress: string;
    let meshClient: WSClient;
    let zrxToken: DummyERC20TokenContract;
    let wethToken: WETH9Contract;
    let orderFactory: OrderFactory;
    let contractAddresses: ContractAddresses;

    before(async () => {
        await setupApiAsync(SUITE_NAME);

        // connect to ganache and run contract migrations
        const ganacheConfigs = {
            shouldUseInProcessGanache: false,
            shouldAllowUnlimitedContractSize: true,
            rpcUrl: config.ETHEREUM_RPC_URL,
        };
        const provider = web3Factory.getRpcProvider(ganacheConfigs);
        const web3Wrapper = new Web3Wrapper(provider);

        const chainId = await web3Wrapper.getChainIdAsync();
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [makerAddress, takerAddress] = accounts;
        contractAddresses = getContractAddressesForChainOrThrow(chainId);
        zrxToken = new DummyERC20TokenContract(contractAddresses.zrxToken, provider);
        wethToken = new WETH9Contract(contractAddresses.etherToken, provider);

        meshClient = new WSClient('ws://localhost:60557');

        // Configure order defaults
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
            takerAssetData: assetDataUtils.encodeERC20AssetData(wethToken.address),
            makerFeeAssetData: '0x',
            takerFeeAssetData: '0x',
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            exchangeAddress: contractAddresses.exchange,
            chainId,
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });

    after(async () => {
        await teardownApiAsync(SUITE_NAME);
    });

    describe('/price tests', () => {
        it('single order test', async () => {
            // Add a single signed order to Mesh directly.
            const order = await orderFactory.newSignedOrderAsync({});
            await zrxToken.mint(order.makerAssetAmount).awaitTransactionSuccessAsync({ from: makerAddress });
            await zrxToken
                .approve(contractAddresses.erc20Proxy, order.makerAssetAmount)
                .awaitTransactionSuccessAsync({ from: makerAddress });
            // NOTE(jalextowle): Mesh's blockwatcher must catch up to the most
            // recently mined block for the mint and approval transactions to
            // be recognized.
            await sleepAsync(1.5);
            await meshClient.addOrdersAsync([order]);

            // Query the `/price` endpoint and verify that the optimal route was
            // chosen (in this case, it is the only route).
            const priceRequestRoute = `${META_TRANSACTION_PATH}/price` +
                `?buyToken=ZRX` +
                `&sellToken=WETH` +
                `&buyAmount=${constants.STATIC_ORDER_PARAMS.makerAssetAmount.toString()}` +
                `&takerAddress=${takerAddress}` +
                `&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`;
            const response = await httpGetAsync({ route: priceRequestRoute });
            expect(response.type).to.be.eq('application/json');
            expect(response.status).to.be.eq(HttpStatus.OK);
            expect(response.body).to.be.deep.eq({
                price: '2',
                buyAmount: '100000000000000000000',
                sellTokenAddress: '0x0b1ba0af832d7c05fd64161e0db78e85978e8082',
                buyTokenAddress: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c'
            })
        });
    });
});

async function sleepAsync(timeSeconds: number): Promise<void> {
    return new Promise<void>(resolve => {
        const secondsPerMillisecond = 1000;
        setTimeout(resolve, timeSeconds * secondsPerMillisecond);
    });
}
