import { ContractWrappers } from '@0x/contract-wrappers';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { SupportedProvider } from '@0x/order-utils';
import { isValidECSignature } from '@0x/order-utils/lib/src/signature_utils';
import { NonceTrackerSubprovider, PartialTxParams, PrivateKeyWalletSubprovider, RedundantSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber, providerUtils, RevertError } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { CHAIN_ID, ETHEREUM_RPC_URL } from '../config';
import { SENDER_ADDRESS, SENDER_PRIVATE_KEY } from '../constants';
import { PostTransactionResponse, ZeroExTransactionWithoutDomain } from '../types';
import { utils } from '../utils/utils';

export class SignerService {
    private readonly _provider: SupportedProvider;
    private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;

    private static _createWeb3Provider(rpcHost: string, privateWalletSubprovider: PrivateKeyWalletSubprovider, nonceTrackerSubprovider: NonceTrackerSubprovider): SupportedProvider {
        const WEB3_RPC_RETRY_COUNT = 3;
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(nonceTrackerSubprovider);
        providerEngine.addProvider(privateWalletSubprovider);
        const rpcSubproviders = SignerService._range(WEB3_RPC_RETRY_COUNT).map((_index: number) => new RPCSubprovider(rpcHost));
        providerEngine.addProvider(new RedundantSubprovider(rpcSubproviders));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }
    private static _range(rangeCount: number): number[] {
        return [...Array(rangeCount).keys()];
    }
    private static readonly _calculateProtocolFee = (numOrders: number, gasPrice: BigNumber): BigNumber => {
        return new BigNumber(150000).times(gasPrice).times(numOrders);
    }
    constructor() {
        this._privateWalletSubprovider = new PrivateKeyWalletSubprovider(SENDER_PRIVATE_KEY);
        this._nonceTrackerSubprovider = new NonceTrackerSubprovider();
        this._provider = SignerService._createWeb3Provider(ETHEREUM_RPC_URL, this._privateWalletSubprovider, this._nonceTrackerSubprovider);
        this._contractWrappers = new ContractWrappers(this._provider, { chainId: CHAIN_ID });
        this._web3Wrapper = new Web3Wrapper(this._provider);
    }

    public async signAndSubmitZeroExTransactionAsync(zeroExTransaction: ZeroExTransactionWithoutDomain, signature: string): Promise<PostTransactionResponse> {
        // Verify 0x txn won't expire in next 60 seconds
        // tslint:disable-next-line:custom-no-magic-numbers
        const sixtySecondsFromNow = new BigNumber(+new Date() + 60);
        if (zeroExTransaction.expirationTimeSeconds <= sixtySecondsFromNow) {
            throw new Error('zeroExTransaction expirationTimeSeconds in less than 60 seconds from now');
        }

        // Hash 0x txn
        const devUtils = new DevUtilsContract(this._contractWrappers.contractAddresses.devUtils, this._provider);
        const zeroExTransactionHash = await devUtils
            .getTransactionHash(
                zeroExTransaction,
                new BigNumber(CHAIN_ID),
                this._contractWrappers.contractAddresses.exchange,
            )
            .callAsync();

        // ECRecover the signature to make sure it's the signerAddress specified in the 0x txn
        const ecSignatureRSV = parseSignatureHexAsRSV(signature);
        const isValidSignature = isValidECSignature(zeroExTransactionHash, ecSignatureRSV, zeroExTransaction.signerAddress);
        if (!isValidSignature) {
            throw new Error("Supplied signature doesn't correspond to ZeroExTransaction signerAddress");
        }

        const decodedArray = await devUtils.decodeZeroExTransactionData(zeroExTransaction.data).callAsync();
        const orders = decodedArray[1];

        // Verify orders don't expire in next 60 seconds
        orders.forEach(order => {
            if (order.expirationTimeSeconds <= sixtySecondsFromNow) {
                throw new Error('Order included in zeroExTransaction expires in less than 60 seconds from now');
            }
        });

        // TODO(fabio): Verify that proper affiliate fee is included

        const gasPrice = zeroExTransaction.gasPrice;
        const protocolFee = SignerService._calculateProtocolFee(orders.length, gasPrice);

        try {
            await this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature)
            .callAsync({
                from: SENDER_ADDRESS,
                gasPrice,
                value: protocolFee,
            });
        } catch (err) {
            if (err.values && err.values.errorData && err.values.errorData !== '0x') {
                const decodedCallData = RevertError.decode(err.values.errorData, false);
                throw decodedCallData;
            }
            throw err;
        }

        const gas = await this._contractWrappers.exchange
        .executeTransaction(zeroExTransaction, signature)
        .estimateGasAsync({
            from: SENDER_ADDRESS,
            gasPrice,
            value: protocolFee,
        });

        const executeTxnCalldata = await this._contractWrappers.exchange
        .executeTransaction(zeroExTransaction, signature).getABIEncodedTransactionData();

        const ethereumTxn: PartialTxParams = {
            data: executeTxnCalldata,
            gas: utils.encodeAmountAsHexString(gas),
            from: SENDER_ADDRESS,
            gasPrice: utils.encodeAmountAsHexString(gasPrice),
            value: utils.encodeAmountAsHexString(protocolFee),
            to: this._contractWrappers.exchange.address,
            nonce: await this._getNonceAsync(SENDER_ADDRESS),
            chainId: CHAIN_ID,
        };
        const signedEthereumTransaction = await this._privateWalletSubprovider.signTransactionAsync(ethereumTxn);

        const transactionHash = await this._contractWrappers.exchange
            .executeTransaction(zeroExTransaction, signature)
            .sendTransactionAsync({
                from: SENDER_ADDRESS,
                gasPrice,
                value: protocolFee,
            });

        return {
            transactionHash,
            signedEthereumTransaction,
        };
    }
    private async _getNonceAsync(senderAddress: string): Promise<string> {
        // HACK(fabio): NonceTrackerSubprovider doesn't expose the subsequent nonce
        // to use to we fetch it from it's private instance variable
        let nonce = (this._nonceTrackerSubprovider as any)._nonceCache[senderAddress];
        if (nonce === undefined) {
            nonce = await this._getTransactionCountAsync(senderAddress);
        }
        return nonce;
    }
    private async _getTransactionCountAsync(address: string): Promise<string> {
        const nonceHex = await this._web3Wrapper.sendRawPayloadAsync<string>({
            method: 'eth_getTransactionCount',
            params: [address, 'latest'],
        });
        return nonceHex;
    }
}

function parseSignatureHexAsRSV(signatureHex: string): ECSignature {
    const { v, r, s } = ethUtil.fromRpcSig(signatureHex);
    const ecSignature: ECSignature = {
        v,
        r: ethUtil.bufferToHex(r),
        s: ethUtil.bufferToHex(s),
    };
    return ecSignature;
}
