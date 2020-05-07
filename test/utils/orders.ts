import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { assetDataUtils, generatePseudoRandomSalt, orderHashUtils, signatureUtils } from '@0x/order-utils';
import { Order, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Connection } from 'typeorm';

import { NULL_ADDRESS, NULL_BYTES } from '../../src/constants';
import { SignedOrderEntity } from '../../src/entities';

const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
const TEN_MINUTES_MS = ONE_MINUTE_MS * 10;
const CHAIN_ID = 1337;

export const addresses = getContractAddressesForChainOrThrow(CHAIN_ID);

export const DAI_ASSET_DATA = assetDataUtils.encodeERC20AssetData('0x34d402f14d58e001d8efbe6585051bf9706aa064');
export const WETH_ASSET_DATA = assetDataUtils.encodeERC20AssetData(addresses.etherToken);
export const ZRX_ASSET_DATA = assetDataUtils.encodeERC20AssetData(addresses.zrxToken);

const getRandomFutureDateInSeconds = () => {
    return new BigNumber(Date.now() + TEN_MINUTES_MS).div(ONE_SECOND_MS).integerValue(BigNumber.ROUND_CEIL);
};

const getDefaultOrder = (makerAddress: string): Order => ({
    chainId: CHAIN_ID,
    exchangeAddress: addresses.exchange,
    makerAddress,
    takerAddress: NULL_ADDRESS,
    senderAddress: NULL_ADDRESS,
    feeRecipientAddress: NULL_ADDRESS,
    expirationTimeSeconds: getRandomFutureDateInSeconds(),
    salt: generatePseudoRandomSalt(),
    makerAssetAmount: new BigNumber('1000000000000000000'),
    takerAssetAmount: new BigNumber('1000000000000000000'),
    makerAssetData: assetDataUtils.encodeERC20AssetData(addresses.zrxToken),
    takerAssetData: assetDataUtils.encodeERC20AssetData(addresses.etherToken),
    makerFeeAssetData: NULL_BYTES,
    takerFeeAssetData: NULL_BYTES,
    makerFee: new BigNumber(0),
    takerFee: new BigNumber(0),
});

/**
 * Wrap a function with calls to add and remove 0x orders from the testing DB.
 */
export async function withOrdersInDatabaseAsync(connection: Connection, web3Wrapper: Web3Wrapper, partialOrders: Array<Partial<Order>>, performFn: (orderEntities: SignedOrderEntity[]) => Promise<void>): Promise<void> {
    // const orderModels = partialOrders.map(generateOrderModel);
    const [makerAddress] = await web3Wrapper.getAvailableAddressesAsync();
    const fullOrders: Order[] = partialOrders.map(partialOrder => ({
        ...getDefaultOrder(makerAddress),
        ...partialOrder,
    }));
    const provider = web3Wrapper.getProvider();
    const fullSignedOrders = await Promise.all(fullOrders.map(order => signatureUtils.ecSignOrderAsync(provider, order, makerAddress)));
    const orderModels = fullSignedOrders.map(serializeSignedOrder);
    await connection.manager.save(orderModels);
    try {
        await performFn(orderModels);
    } catch (e) {
        throw e;
    } finally {
        await connection.manager.remove(orderModels);
    }
}

function serializeSignedOrder(signedOrder: SignedOrder): SignedOrderEntity {
    const signedOrderEntity = new SignedOrderEntity({
        signature: signedOrder.signature,
        senderAddress: signedOrder.senderAddress,
        makerAddress: signedOrder.makerAddress,
        takerAddress: signedOrder.takerAddress,
        makerAssetAmount: signedOrder.makerAssetAmount.toString(),
        takerAssetAmount: signedOrder.takerAssetAmount.toString(),
        makerAssetData: signedOrder.makerAssetData,
        takerAssetData: signedOrder.takerAssetData,
        makerFee: signedOrder.makerFee.toString(),
        takerFee: signedOrder.takerFee.toString(),
        makerFeeAssetData: signedOrder.makerFeeAssetData.toString(),
        takerFeeAssetData: signedOrder.takerFeeAssetData.toString(),
        salt: signedOrder.salt.toString(),
        exchangeAddress: signedOrder.exchangeAddress,
        feeRecipientAddress: signedOrder.feeRecipientAddress,
        expirationTimeSeconds: signedOrder.expirationTimeSeconds.toString(),
        hash: orderHashUtils.getOrderHash(signedOrder),
        // Assume it is all available
        remainingFillableTakerAssetAmount: signedOrder.takerAssetAmount.toString(),
    });
    return signedOrderEntity;
}
