import { ContractWrappers, TxData } from '@0x/contract-wrappers';
import { SupportedProvider, Web3Wrapper } from '@0x/dev-utils';
import {
    NonceTrackerSubprovider,
    PrivateKeyWalletSubprovider,
    RedundantSubprovider,
    RPCSubprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { BigNumber, providerUtils } from '@0x/utils';
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';

import { CHAIN_ID } from '../config';
import { ETH_TRANSFER_GAS_LIMIT } from '../constants';
import { logger } from '../logger';

export class Signer {
    public readonly publicAddress: string;
    private readonly _provider: SupportedProvider;
    private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;

    private static _createWeb3Provider(
        rpcHost: string,
        privateWalletSubprovider: PrivateKeyWalletSubprovider,
        nonceTrackerSubprovider: NonceTrackerSubprovider,
    ): SupportedProvider {
        const WEB3_RPC_RETRY_COUNT = 3;
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(nonceTrackerSubprovider);
        providerEngine.addProvider(privateWalletSubprovider);
        const rpcSubproviders = Signer._range(WEB3_RPC_RETRY_COUNT).map(
            (_index: number) => new RPCSubprovider(rpcHost),
        );
        providerEngine.addProvider(new RedundantSubprovider(rpcSubproviders));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }

    private static _range(rangeCount: number): number[] {
        return [...Array(rangeCount).keys()];
    }

    constructor(privateKeyHex: string, rpcHost: string) {
        this._privateWalletSubprovider = new PrivateKeyWalletSubprovider(privateKeyHex);
        this._nonceTrackerSubprovider = new NonceTrackerSubprovider();
        this._provider = Signer._createWeb3Provider(
            rpcHost,
            this._privateWalletSubprovider,
            this._nonceTrackerSubprovider,
        );
        this._contractWrappers = new ContractWrappers(this._provider, { chainId: CHAIN_ID });
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
        let nonce = (this._nonceTrackerSubprovider as any)._nonceCache[senderAddress];
        if (nonce === undefined) {
            nonce = await this._getTransactionCountAsync(senderAddress);
        }
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
