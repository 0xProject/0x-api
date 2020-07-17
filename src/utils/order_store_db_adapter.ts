import { APIOrder, OrderSet, OrderStore } from '@0x/asset-swapper';
import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { ERC20AssetData, SignedOrder } from '@0x/types';
import { BigNumber, NULL_BYTES, NULL_ADDRESS } from '@0x/utils';

import { CHAIN_ID, SWAP_IGNORED_ADDRESSES } from '../config';
import { FIRST_PAGE } from '../constants';
import { RecurringTradeEntity } from '../entities';
import { OrderBookService } from '../services/orderbook_service';
import { RecurringTradeService } from '../services/recurring_trade_service';

import { orderUtils } from './order_utils';

const ONE_SECOND_MS = 1000;
const ONE_HOUR_IN_SECONDS = 60 * 60;
const ZERO_AMOUNT = new BigNumber(0);
const WALLET_SIGNATURE = '0x04';

// HACK: The returned order's `makerAssetData`, `makerAssetAmount`, and `takerAssetAmount`
// will get overwritten by AssetSwapper.
function recurringTradeEntityToOrder(entity: RecurringTradeEntity): APIOrder {
    const order: SignedOrder = {
        makerAddress: entity.bridgeAddress,
        makerAssetData: assetDataUtils.encodeERC20AssetData(entity.fromTokenAddress),
        takerAssetData: assetDataUtils.encodeERC20AssetData(entity.toTokenAddress),
        makerAssetAmount: entity.fromTokenAmount,
        takerAssetAmount: entity.minBuyAmount,
        takerAddress: NULL_ADDRESS,
        senderAddress: NULL_ADDRESS,
        feeRecipientAddress: entity.traderAddress,
        salt: generatePseudoRandomSalt(),
        // 1 hour from now
        expirationTimeSeconds: new BigNumber(Math.floor(Date.now() / ONE_SECOND_MS) + ONE_HOUR_IN_SECONDS),
        makerFeeAssetData: NULL_BYTES,
        takerFeeAssetData: NULL_BYTES,
        makerFee: ZERO_AMOUNT,
        takerFee: ZERO_AMOUNT,
        signature: WALLET_SIGNATURE,
        chainId: CHAIN_ID,
        exchangeAddress: getContractAddressesForChainOrThrow(CHAIN_ID).exchange,
    };
    return {
        order,
        metaData: {},
    };
}

const MAX_QUERY_SIZE = 1000;
export class OrderStoreDbAdapter extends OrderStore {
    public recurringTradeService?: RecurringTradeService;

    constructor(private readonly _orderbookService: OrderBookService) {
        super();
    }

    public async getOrderSetForAssetsAsync(makerAssetData: string, takerAssetData: string): Promise<OrderSet> {
        const { bids } = await this._orderbookService.getOrderBookAsync(
            FIRST_PAGE,
            MAX_QUERY_SIZE,
            takerAssetData,
            makerAssetData,
        );
        const orderSet = new OrderSet();
        let orders = bids.records.filter(apiOrder => !orderUtils.isIgnoredOrder(SWAP_IGNORED_ADDRESSES, apiOrder));

        if (this.recurringTradeService) {
            try {
                const makerToken = (assetDataUtils.decodeAssetDataOrThrow(makerAssetData) as ERC20AssetData)
                    .tokenAddress;
                const takerToken = (assetDataUtils.decodeAssetDataOrThrow(takerAssetData) as ERC20AssetData)
                    .tokenAddress;
                const recurringTrades = await this.recurringTradeService.getActiveRecurringTradesForAssetPairAsync(
                    makerToken,
                    takerToken,
                );
                orders = orders.concat(recurringTrades.map(entity => recurringTradeEntityToOrder(entity)));
            } catch (e) {}
        }
        await orderSet.addManyAsync(orders);
        return orderSet;
    }

    public async getOrderSetForAssetPairAsync(assetPairKey: string): Promise<OrderSet> {
        const [makerAssetData, takerAssetData] = OrderStore.assetPairKeyToAssets(assetPairKey);
        return this.getOrderSetForAssetsAsync(makerAssetData, takerAssetData);
    }

    public async getBatchOrderSetsForAssetsAsync(
        makerAssetDatas: string[],
        takerAssetDatas: string[],
    ): Promise<OrderSet[]> {
        const { records: apiOrders } = await this._orderbookService.getBatchOrdersAsync(
            FIRST_PAGE,
            MAX_QUERY_SIZE,
            makerAssetDatas,
            takerAssetDatas,
        );
        const orderSets: { [makerAssetData: string]: OrderSet } = {};
        makerAssetDatas.forEach(m =>
            takerAssetDatas.forEach(t => (orderSets[OrderStore.getKeyForAssetPair(m, t)] = new OrderSet())),
        );
        const allowedOrders = apiOrders.filter(
            apiOrder => !orderUtils.isIgnoredOrder(SWAP_IGNORED_ADDRESSES, apiOrder),
        );
        await Promise.all(
            allowedOrders.map(async o =>
                orderSets[OrderStore.getKeyForAssetPair(o.order.makerAssetData, o.order.takerAssetData)].addAsync(o),
            ),
        );

        if (this.recurringTradeService) {
            try {
                const recurringTrades = await this.recurringTradeService.getBatchActiveRecurringTradesForAssetPairAsync(
                    makerAssetDatas.map(
                        assetData => (assetDataUtils.decodeAssetDataOrThrow(assetData) as ERC20AssetData).tokenAddress,
                    ),
                    takerAssetDatas.map(
                        assetData => (assetDataUtils.decodeAssetDataOrThrow(assetData) as ERC20AssetData).tokenAddress,
                    ),
                );
                await Promise.all(
                    recurringTrades.map(async entity => {
                        const makerAssetData = assetDataUtils.encodeERC20AssetData(entity.fromTokenAddress);
                        const takerAssetData = assetDataUtils.encodeERC20AssetData(entity.toTokenAddress);

                        await orderSets[OrderStore.getKeyForAssetPair(makerAssetData, takerAssetData)].addAsync(
                            recurringTradeEntityToOrder(entity),
                        );
                    }),
                );
            } catch (e) {}
        }

        return Object.values(orderSets);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async hasAsync(_assetPairKey: string): Promise<boolean> {
        return true;
    }

    public async valuesAsync(assetPairKey: string): Promise<APIOrder[]> {
        return Array.from((await this.getOrderSetForAssetPairAsync(assetPairKey)).values());
    }

    public async keysAsync(): Promise<IterableIterator<string>> {
        const pairs = await this._orderbookService.getAssetPairsAsync(FIRST_PAGE, MAX_QUERY_SIZE);
        const keys = pairs.records.map(r =>
            OrderStore.getKeyForAssetPair(r.assetDataA.assetData, r.assetDataB.assetData),
        );
        return keys.values();
    }
}
