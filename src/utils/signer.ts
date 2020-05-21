import { ContractWrappers, TxData, ZeroExProvider } from '@0x/contract-wrappers';
import { SupportedProvider, Web3Wrapper } from '@0x/dev-utils';
import {
    Callback,
    ErrorCallback,
    PrivateKeyWalletSubprovider,
    Subprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { BigNumber, providerUtils } from '@0x/utils';
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';

import { ETH_TRANSFER_GAS_LIMIT } from '../constants';
import { logger } from '../logger';

import { utils } from './utils';

class SubproviderAdapter extends Subprovider {
    private readonly _provider: ZeroExProvider;
    constructor(provider: SupportedProvider) {
        super();
        this._provider = providerUtils.standardizeOrThrow(provider);
    }
    // tslint:disable-next-line:async-suffix
    public async handleRequest(payload: any, _next: Callback, end: ErrorCallback): Promise<void> {
        this._provider.sendAsync(payload, (err, result) => {
            !utils.isNil(result) && !utils.isNil(result.result)
                ? end(null, result.result)
                : end(err || new Error(result.error.message));
        });
    }
}

// tslint:disable-next-line:max-classes-per-file
export class Signer {
    public readonly publicAddress: string;
    private readonly _provider: SupportedProvider;
    // private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;

    private static _createWeb3Provider(
        provider: SupportedProvider,
        privateWalletSubprovider: PrivateKeyWalletSubprovider,
        // nonceTrackerSubprovider: NonceTrackerSubprovider,
    ): SupportedProvider {
        const providerEngine = new Web3ProviderEngine();
        // providerEngine.addProvider(nonceTrackerSubprovider);
        providerEngine.addProvider(privateWalletSubprovider);
        providerEngine.addProvider(new SubproviderAdapter(provider));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }

    constructor(privateKeyHex: string, provider: SupportedProvider, chainId: number) {
        this._privateWalletSubprovider = new PrivateKeyWalletSubprovider(privateKeyHex);
        // this._nonceTrackerSubprovider = new NonceTrackerSubprovider();
        this._provider = Signer._createWeb3Provider(
            provider,
            this._privateWalletSubprovider,
            // this._nonceTrackerSubprovider,
        );
        this._contractWrappers = new ContractWrappers(this._provider, { chainId });
        this._web3Wrapper = new Web3Wrapper(this._provider);
        this.publicAddress = (this._privateWalletSubprovider as any)._address;
    }

    public async signAndBroadcastMetaTxAsync(
        to: string,
        data: string,
        value: BigNumber,
        gasPrice: BigNumber,
    ): Promise<{
        ethereumTxnParams: { nonce: number; from: string; gas: number };
        ethereumTransactionHash: string;
    }> {
        const nonceHex = await this._getNonceAsync(this.publicAddress);
        const nonce = web3WrapperUtils.convertHexToNumber(nonceHex);
        const from = this.publicAddress;
        const gas = await this._web3Wrapper.estimateGasAsync({
            to,
            from,
            gasPrice,
            data,
            value,
        });
        logger.info({
            message: `attempting to sign and broadcast a meta transaction`,
            nonce: web3WrapperUtils.convertHexToNumber(nonceHex),
            from,
            gas,
            gasPrice,
        });
        const txHash = await this._web3Wrapper.sendTransactionAsync({
            to: this._contractWrappers.exchange.address,
            from,
            data,
            gas,
            gasPrice,
            value,
            nonce,
        });
        logger.info({
            message: 'signed and broadcasted a meta transaction',
            txHash,
            from: this.publicAddress,
        });
        return {
            ethereumTxnParams: {
                from,
                nonce,
                gas,
            },
            ethereumTransactionHash: txHash,
        };
    }

    public async sendTransactionToItselfWithNonceAsync(nonce: number, gasPrice: BigNumber): Promise<string> {
        const ethereumTxnParams: TxData = {
            from: this.publicAddress,
            to: this.publicAddress,
            value: 0,
            nonce,
            gasPrice,
            gas: ETH_TRANSFER_GAS_LIMIT,
        };

        return this._web3Wrapper.sendTransactionAsync(ethereumTxnParams);
    }

    private async _getNonceAsync(senderAddress: string): Promise<string> {
        // HACK(fabio): NonceTrackerSubprovider doesn't expose the subsequent nonce
        // to use so we fetch it from its private instance variable
        // let nonce = (this._nonceTrackerSubprovider as any)._nonceCache[senderAddress];
        // if (nonce === undefined) {
        //    nonce = await this._getTransactionCountAsync(senderAddress);
        // }
        const nonce = await this._getTransactionCountAsync(senderAddress);
        return nonce;
    }
    private async _getTransactionCountAsync(address: string): Promise<string> {
        const nonceHex = await this._web3Wrapper.sendRawPayloadAsync<string>({
            method: 'eth_getTransactionCount',
            params: [address, 'pending'],
        });
        logger.info({
            message: 'received nonce from eth_getTransactionCount',
            nonceNumber: web3WrapperUtils.convertHexToNumber(nonceHex),
        });
        return nonceHex;
    }
}
