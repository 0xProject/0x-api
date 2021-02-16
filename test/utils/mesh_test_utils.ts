import { ContractAddresses } from '@0x/contract-addresses';
import { DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { constants, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';
import { OrderWithMetadataV4 } from '@0x/mesh-graphql-client';
import { LimitOrder, LimitOrderFields } from '@0x/protocol-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber, hexUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { AddOrdersResultsV4, MeshClient } from '../../src/utils/mesh_client';
import { CONTRACT_ADDRESSES, MAX_INT, MAX_MINT_AMOUNT } from '../constants';

type Numberish = BigNumber | number | string;

export const DEFAULT_MAKER_ASSET_AMOUNT = new BigNumber(1);
export const MAKER_WETH_AMOUNT = new BigNumber('1000000000000000000');

/**
 * Creates random limit order
 */
// tslint:disable: custom-no-magic-numbers
export function getRandomLimitOrder(fields: Partial<LimitOrderFields> = {}): LimitOrder {
    return new LimitOrder({
        makerToken: randomAddress(),
        takerToken: randomAddress(),
        makerAmount: getRandomInteger('1e18', '100e18'),
        takerAmount: getRandomInteger('1e6', '100e6'),
        takerTokenFeeAmount: getRandomInteger('0.01e18', '1e18'),
        maker: randomAddress(),
        taker: randomAddress(),
        sender: randomAddress(),
        feeRecipient: randomAddress(),
        pool: hexUtils.random(),
        expiry: new BigNumber(Math.floor(Date.now() / 1000 + 60)),
        salt: new BigNumber(hexUtils.random()),
        ...fields,
    });
}
// tslint:enable:custom-no-magic-numbers

export class MeshTestUtils {
    protected _accounts!: string[];
    protected _makerAddress!: string;
    protected _contractAddresses: ContractAddresses = CONTRACT_ADDRESSES;
    protected _meshClient!: MeshClient;
    protected _zrxToken!: DummyERC20TokenContract;
    protected _wethToken!: WETH9Contract;
    protected _web3Wrapper: Web3Wrapper;
    private _privateKey!: Buffer;

    // TODO: This can be extended to allow more types of orders to be created. Some changes
    // that might be desirable are to allow different makers to be used, different assets to
    // be used, etc.
    public async addOrdersWithPricesAsync(prices: Numberish[]): Promise<AddOrdersResultsV4> {
        if (!prices.length) {
            throw new Error('[mesh-utils] Must provide at least one price to `addOrdersAsync`');
        }
        const orders = [];
        for (const price of prices) {
            const limitOrder = getRandomLimitOrder({
                takerAmount: DEFAULT_MAKER_ASSET_AMOUNT.times(price),
                // tslint:disable-next-line:custom-no-magic-numbers
                expiry: new BigNumber(Date.now() + 24 * 3600),
            });

            const signature = limitOrder.getSignatureWithKey(this._privateKey.toString('utf-8'));
            orders.push({
                ...limitOrder,
                signature,
            });
        }
        const validationResults = await this._meshClient.addOrdersV4Async(orders);
        // NOTE(jalextowle): Wait for the 0x-api to catch up.
        await sleepAsync(2);
        return validationResults;
    }

    public async addPartialOrdersAsync(orders: Partial<LimitOrder>[]): Promise<AddOrdersResultsV4> {
        const signedOrders = await Promise.all(
            orders.map(order => {
                const limitOrder = getRandomLimitOrder(order);

                const signature = limitOrder.getSignatureWithKey(this._privateKey.toString('utf-8'));

                return {
                    ...limitOrder,
                    signature,
                };
            }),
        );
        const validationResults = await this._meshClient.addOrdersV4Async(signedOrders);
        await sleepAsync(2);
        return validationResults;
    }

    public async getOrdersAsync(): Promise<{ ordersInfos: OrderWithMetadataV4[] }> {
        return this._meshClient.getOrdersV4Async();
    }

    public async setupUtilsAsync(): Promise<void> {
        this._meshClient = new MeshClient('ws://localhost:60557', 'http://localhost:60557');

        this._zrxToken = new DummyERC20TokenContract(this._contractAddresses.zrxToken, this._provider);
        this._wethToken = new WETH9Contract(this._contractAddresses.etherToken, this._provider);

        this._accounts = await this._web3Wrapper.getAvailableAddressesAsync();
        [this._makerAddress] = this._accounts;
        this._privateKey = constants.TESTRPC_PRIVATE_KEYS[this._accounts.indexOf(this._makerAddress)];

        // NOTE(jalextowle): The way that Mesh validation currently works allows us
        // to only set the maker balance a single time. If this changes in the future,
        // this logic may need to be added to `addOrdersAsync`.
        // tslint:disable-next-line:await-promise
        await this._zrxToken.mint(MAX_MINT_AMOUNT).awaitTransactionSuccessAsync({ from: this._makerAddress });
        // tslint:disable-next-line:await-promise
        await this._zrxToken
            .approve(this._contractAddresses.erc20Proxy, MAX_INT)
            .awaitTransactionSuccessAsync({ from: this._makerAddress });
        // tslint:disable-next-line:await-promise
        await this._wethToken
            .deposit()
            .awaitTransactionSuccessAsync({ from: this._makerAddress, value: MAKER_WETH_AMOUNT });
        // tslint:disable-next-line:await-promise
        await this._wethToken
            .approve(this._contractAddresses.erc20Proxy, MAX_INT)
            .awaitTransactionSuccessAsync({ from: this._makerAddress });

        // NOTE(jalextowle): Mesh's blockwatcher must catch up to the most
        // recently mined block for the mint and approval transactions to
        // be recognized. This is added here in case `addOrdersAsync` is called
        // immediately after this function.
        await sleepAsync(2);
    }

    constructor(protected _provider: Web3ProviderEngine) {
        this._web3Wrapper = new Web3Wrapper(_provider);
    }
}

async function sleepAsync(timeSeconds: number): Promise<void> {
    return new Promise<void>(resolve => {
        const secondsPerMillisecond = 1000;
        setTimeout(resolve, timeSeconds * secondsPerMillisecond);
    });
}
