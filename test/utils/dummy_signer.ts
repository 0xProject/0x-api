import { SupportedProvider } from '@0x/order-utils';
import {
    NonceTrackerSubprovider,
    PrivateKeyWalletSubprovider,
    RPCSubprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';
import { Connection, QueryFailedError, Repository } from 'typeorm';
// import { Transaction as EthTransaction, TxData } from 'ethereumjs-tx';

import { TransactionEntity } from '../../src/entities';
import { logger } from '../../src/logger';
import { TransactionStates } from '../../src/types';

export class DummySigner {
    private readonly _provider: SupportedProvider;
    private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _transactionEntityRepository: Repository<TransactionEntity>;
    private readonly _signerAddress: string;
    // private readonly _privateKeyBuffer: Buffer;

    private static _createWeb3Provider(
        rpcURL: string,
        privateWalletSubprovider: PrivateKeyWalletSubprovider,
        nonceTrackerSubprovider: NonceTrackerSubprovider,
    ): SupportedProvider {
        const providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(nonceTrackerSubprovider);
        providerEngine.addProvider(privateWalletSubprovider);
        providerEngine.addProvider(new RPCSubprovider(rpcURL));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }

    constructor(dbConnection: Connection, privateKey: string, address: string, rpcURL: string) {
        this._transactionEntityRepository = dbConnection.getRepository(TransactionEntity);
        this._privateWalletSubprovider = new PrivateKeyWalletSubprovider(privateKey);
        this._nonceTrackerSubprovider = new NonceTrackerSubprovider();
        this._provider = DummySigner._createWeb3Provider(
            rpcURL,
            this._privateWalletSubprovider,
            this._nonceTrackerSubprovider,
        );
        this._web3Wrapper = new Web3Wrapper(this._provider);
        this._signerAddress = address;
        // this._privateKeyBuffer = Buffer.from(privateKey, 'hex');
    }

    public async sendUnstickingTransaction(gasPrice: BigNumber, nonce: number): Promise<string> {
        const txHash = await this._web3Wrapper.sendTransactionAsync({
            from: this._signerAddress,
            to: this._signerAddress,
            value: 0,
            nonce,
            gasPrice,
        });

        return txHash;
    }

    public async sendTransactionToItself(gasPrice: BigNumber, expectedMinedInSec: number = 120): Promise<string> {
        const nonce = await this._getNonceAsync(this._signerAddress);
        const txHash = await this._web3Wrapper.sendTransactionAsync({
            from: this._signerAddress,
            to: this._signerAddress,
            value: 1337,
            gasPrice,
            nonce: web3WrapperUtils.convertHexToNumber(nonce),
        });

        const transactionEntity = new TransactionEntity({
            hash: txHash,
            status: TransactionStates.Submitted,
            nonce,
            gasPrice: gasPrice.toString(),
            metaTxnRelayerAddress: this._signerAddress,
            expectedMinedInSec,
        });

        try {
            await this._transactionEntityRepository.save(transactionEntity);
        } catch (err) {
            if (err instanceof QueryFailedError) {
                // the transaction is already in the database.
                logger.warn(`failed to store transaction ${txHash}, it already exists`);
            } else {
                logger.error(`failed to store transaction ${txHash}`, { err });
            }
        }

        return txHash;
    }

    public async unstickAll(): Promise<string[]> {
        const unstuckingTransactions: string[] = [];
        const pending = web3WrapperUtils.convertHexToNumber(await this._getTransactionCountAsync(this._signerAddress));
        const confirmed = web3WrapperUtils.convertHexToNumber(
            await this._getConfirmedTransactionCountAsync(this._signerAddress),
        );
        console.log(`THE DIFF IS: ${pending} - ${confirmed} = `, pending - confirmed);
        let nonceToUnstuck = confirmed;
        while (nonceToUnstuck < pending) {
            const txHash = await this.sendUnstickingTransaction(new BigNumber(13000000000), nonceToUnstuck);
            unstuckingTransactions.push(txHash);
            nonceToUnstuck++;
        }

        return unstuckingTransactions;
    }

    // public _createSignedTransaction(txData: TxData): {} {
    //     const tx = new EthTransaction(txData);
    //     tx.sign(this._privateKeyBuffer);
    //     return { tx: tx.serialize(), hash: tx.hash(true) };
    // }

    private async _getNonceAsync(senderAddress: string): Promise<string> {
        // HACK(fabio): NonceTrackerSubprovider doesn't expose the subsequent nonce
        // to use so we fetch it from it's private instance variable
        let nonce = (this._nonceTrackerSubprovider as any)._nonceCache[senderAddress];
        if (nonce === undefined) {
            nonce = await this._getTransactionCountAsync(senderAddress);
        }
        return nonce;
    }
    private async _getConfirmedTransactionCountAsync(address: string): Promise<string> {
        const nonceHex = await this._web3Wrapper.sendRawPayloadAsync<string>({
            method: 'eth_getTransactionCount',
            params: [address, 'latest'],
        });
        return nonceHex;
    }
    private async _getTransactionCountAsync(address: string): Promise<string> {
        const nonceHex = await this._web3Wrapper.sendRawPayloadAsync<string>({
            method: 'eth_getTransactionCount',
            params: [address, 'pending'],
        });
        return nonceHex;
    }
}
