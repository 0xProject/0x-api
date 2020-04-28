import { SupportedProvider } from '@0x/order-utils';
import {
    NonceTrackerSubprovider,
    PartialTxParams,
    PrivateKeyWalletSubprovider,
    RPCSubprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';
import EthereumTx = require('ethereumjs-tx');
import { Connection, Repository } from 'typeorm';

import { ETH_TRANSFER_GAS_LIMIT, EXPECTED_MINED_SEC } from '../../src/constants';
import { TransactionEntity } from '../../src/entities';
import { logger } from '../../src/logger';
import { TransactionStates } from '../../src/types';
import { TEST_RINKEBY_CHAIN_ID } from '../config';

const DEFAULT_TX_VALUE = 1337;
const HIGH_GAS_PRICE_FOR_UNSTICKING = 13000000000;

export class TestSigner {
    private readonly _provider: SupportedProvider;
    private readonly _nonceTrackerSubprovider: NonceTrackerSubprovider;
    private readonly _privateWalletSubprovider: PrivateKeyWalletSubprovider;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _transactionEntityRepository: Repository<TransactionEntity>;
    private readonly _signerAddress: string;
    private readonly _privateKeyBuffer: Buffer;

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
        this._provider = TestSigner._createWeb3Provider(
            rpcURL,
            this._privateWalletSubprovider,
            this._nonceTrackerSubprovider,
        );
        this._web3Wrapper = new Web3Wrapper(this._provider);
        this._signerAddress = address;
        this._privateKeyBuffer = Buffer.from(privateKey, 'hex');
    }

    public async sendUnstickingTransactionAsync(gasPrice: BigNumber, nonce: string): Promise<string> {
        return this._sendTransactionAsync(DEFAULT_TX_VALUE, nonce, gasPrice);
    }

    public async sendTransactionToItselfAsync(gasPrice: BigNumber, expectedMinedInSec: number = 120): Promise<string> {
        const nonce = await this._getNonceAsync(this._signerAddress);
        return this._sendTransactionAsync(DEFAULT_TX_VALUE, nonce, gasPrice, expectedMinedInSec);
    }

    public async unstickAllAsync(): Promise<string[]> {
        const unstuckingTransactions: string[] = [];
        const pending = web3WrapperUtils.convertHexToNumber(await this._getTransactionCountAsync(this._signerAddress));
        const confirmed = web3WrapperUtils.convertHexToNumber(
            await this._getConfirmedTransactionCountAsync(this._signerAddress),
        );
        logger.info(`THE DIFF IS: ${pending} - ${confirmed} = `, pending - confirmed);
        let nonceToUnstick = confirmed;
        while (nonceToUnstick < pending) {
            const txHash = await this.sendUnstickingTransactionAsync(
                new BigNumber(HIGH_GAS_PRICE_FOR_UNSTICKING),
                web3WrapperUtils.encodeAmountAsHexString(nonceToUnstick),
            );
            unstuckingTransactions.push(txHash);
            nonceToUnstick++;
        }

        return unstuckingTransactions;
    }

    private async _sendTransactionAsync(
        value: number,
        nonce: string,
        gasPrice: BigNumber,
        expectedMinedInSec: number = EXPECTED_MINED_SEC,
    ): Promise<string> {
        const ethereumTxnParams: PartialTxParams = {
            from: this._signerAddress,
            to: this._signerAddress,
            value: web3WrapperUtils.encodeAmountAsHexString(value),
            nonce,
            chainId: TEST_RINKEBY_CHAIN_ID,
            gasPrice: web3WrapperUtils.encodeAmountAsHexString(gasPrice),
            gas: web3WrapperUtils.encodeAmountAsHexString(ETH_TRANSFER_GAS_LIMIT),
        };
        const ethTx = new EthereumTx(ethereumTxnParams);
        ethTx.sign(this._privateKeyBuffer, true);
        const txHash = ethTx.hash() as Buffer;
        const txHashHex = `0x${txHash.toString('hex')}`;
        logger.info('hashed: ', txHashHex);
        logger.info('nonce: ', nonce);
        const transactionEntity = new TransactionEntity({
            hash: txHashHex,
            status: TransactionStates.Unsubmitted,
            nonce: web3WrapperUtils.convertHexToNumber(nonce),
            gasPrice,
            metaTxnRelayerAddress: this._signerAddress,
            expectedMinedInSec,
        });
        await this._transactionEntityRepository.save(transactionEntity);
        const rawTx = `0x${ethTx.serialize().toString('hex')}`;
        await this._web3Wrapper.sendRawPayloadAsync({
            method: 'eth_sendRawTransaction',
            params: [rawTx],
        });
        try {
            await this._transactionEntityRepository.manager.transaction(async transactionEntityManager => {
                transactionEntity.status = TransactionStates.Submitted;
                await transactionEntityManager.save(transactionEntity);
            });
        } catch (err) {
            // the TransacitonEntity was updated in the meantime. This will
            // rollback the database transaction.
            logger.warn('failed to store transaction with submitted status, rolling back', { err });
        }
        return txHashHex;
    }

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
