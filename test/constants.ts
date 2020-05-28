import { ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { assetDataUtils } from '@0x/order-utils';
import { ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';

export const CHAIN_ID = 1337;
// tslint:disable-next-line:custom-no-magic-numbers
export const MAX_INT = new BigNumber(2).pow(256).minus(1);
export const MAX_MINT_AMOUNT = new BigNumber('10000000000000000000000');
export const CONTRACT_ADDRESSES: ContractAddresses = getContractAddressesForChainOrThrow(CHAIN_ID);
export const ZRX_TOKEN_ADDRESS = CONTRACT_ADDRESSES.zrxToken;
export const WETH_TOKEN_ADDRESS = CONTRACT_ADDRESSES.etherToken;
export const ZRX_ASSET_DATA = assetDataUtils.encodeERC20AssetData(ZRX_TOKEN_ADDRESS);
export const WETH_ASSET_DATA = assetDataUtils.encodeERC20AssetData(WETH_TOKEN_ADDRESS);
export const UNKNOWN_TOKEN_ADDRESS = '0xbe0037eaf2d64fe5529bca93c18c9702d3930376';
export const UNKNOWN_TOKEN_ASSET_DATA = assetDataUtils.encodeERC20AssetData(UNKNOWN_TOKEN_ADDRESS);
export const SYMBOL_TO_ADDRESS: ObjectMap<string> = {
    ZRX: ZRX_TOKEN_ADDRESS,
    WETH: WETH_TOKEN_ADDRESS,
};
