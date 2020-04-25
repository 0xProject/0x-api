import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { constants, OrderFactory } from '@0x/contracts-test-utils';
import { web3Factory } from '@0x/dev-utils';
import { WSClient } from '@0x/mesh-rpc-client';
import { assetDataUtils } from '@0x/order-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import 'mocha';

import * as config from '../src/config';
import { META_TRANSACTION_PATH } from '../src/constants';

import { LogType, setupApiAsync, teardownApiAsync } from './utils/deployment';
import { httpGetAsync } from './utils/http_utils';

describe.only('meta transactions test', () => {
    let makerAddress: string;
    let takerAddress: string;
    let meshClient: WSClient;
    let zrxToken: DummyERC20TokenContract;
    let wethToken: WETH9Contract;
    let orderFactory: OrderFactory;

    before(async () => {
        await setupApiAsync('/price tests', { /* apiLogType: LogType.Console, */ dependencyLogType: LogType.Console });

        // connect to ganache and run contract migrations
        const ganacheConfigs = {
            shouldUseInProcessGanache: false,
            shouldAllowUnlimitedContractSize: true,
            rpcUrl: config.ETHEREUM_RPC_URL,
        };
        // const provider = web3Factory.getRpcProvider(ganacheConfigs);
        const provider = web3Factory.getRpcProvider(ganacheConfigs);
        const web3Wrapper = new Web3Wrapper(provider);

        const chainId = await web3Wrapper.getChainIdAsync();
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [makerAddress, takerAddress] = accounts;
        const contractAddresses = getContractAddressesForChainOrThrow(chainId);
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
            exchangeAddress: contractAddresses.exchange,
            chainId,
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });

    after(async () => {
        await teardownApiAsync('/price tests');
    });

    describe('/price tests', () => {
        it('/price test', async () => {
            const orders = [await orderFactory.newSignedOrderAsync({})];
            await meshClient.addOrdersAsync(orders);

            const response = await httpGetAsync({
                route: `${META_TRANSACTION_PATH}/price?buyToken=ZRX&sellToken=WETH&buyAmount=${constants.STATIC_ORDER_PARAMS.takerAssetAmount}&takerAddress=${takerAddress}&excludedSources=Uniswap,Eth2Dai,Kyber,LiquidityProvider`,
            });
            console.log(response.body);
        });
    });
});
