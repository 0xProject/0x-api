// tslint:disable:no-console
// tslint:disable:no-unbound-method

import { signatureUtils } from '@0x/order-utils';
import { PrivateKeyWalletSubprovider, RPCSubprovider, SupportedProvider, Web3ProviderEngine } from '@0x/subproviders';
import { NULL_ADDRESS, providerUtils } from '@0x/utils';
import axios from 'axios';
import { Connection, Repository } from 'typeorm';

import { EXPECTED_MINED_SEC } from '../../src/constants';
import { TransactionEntity } from '../../src/entities';
import { SignerService } from '../../src/services/signer_service';
import { TransactionStates, ZeroExTransactionWithoutDomain } from '../../src/types';
import { utils } from '../../src/utils/utils';

export class TestMetaTxnUser {
    private readonly _apiBasePath: string;
    private readonly _takerAddress: string;
    private readonly _takerPrivateKey: string;
    private readonly _provider: SupportedProvider;
    private readonly _connection: Connection;
    private readonly _transactionRepository: Repository<TransactionEntity>;
    private readonly _signerService: SignerService;

    constructor(apiBasePath: string, dbConnection: Connection) {
        const TAKER_ADDRESS = process.env.TAKER_ADDRESS;
        const TAKER_PRIVATE_KEY = process.env.TAKER_PRIVATE_KEY;
        const TAKER_RPC_ADDR = process.env.TAKER_RPC_ADDR;
        if (TAKER_ADDRESS === NULL_ADDRESS || TAKER_ADDRESS === undefined) {
            throw new Error(`TAKER_ADDRESS must be specified`);
        }
        if (TAKER_PRIVATE_KEY === '' || TAKER_PRIVATE_KEY === undefined) {
            throw new Error(`TAKER_PRIVATE_KEY must be specified`);
        }
        if (TAKER_RPC_ADDR === undefined) {
            throw new Error(`TAKER_RPC_ADDR must be specified`);
        }
        this._apiBasePath = apiBasePath;
        this._takerAddress = TAKER_ADDRESS;
        this._takerPrivateKey = TAKER_PRIVATE_KEY;
        this._connection = dbConnection;
        this._transactionRepository = this._connection.getRepository(TransactionEntity);
        this._signerService = new SignerService(dbConnection);
        // create ethereum provider (server)
        this._provider = this._createWeb3Provider(TAKER_RPC_ADDR);
    }

    // tslint:disable-next-line
    public getQuoteString(buyToken: string, sellToken: string, buyAmount: string): string {
        return `?buyToken=${buyToken}&sellToken=${sellToken}&buyAmount=${buyAmount}&takerAddress=${this._takerAddress}`;
    }

    public async getQuoteAsync(
        buyToken: string,
        sellToken: string,
        buyAmount: string,
    ): Promise<{ zeroExTransactionHash: string; zeroExTransaction: ZeroExTransactionWithoutDomain }> {
        const connString = `${
            this._apiBasePath
        }/meta_transaction/v0/quote?buyToken=${buyToken}&sellToken=${sellToken}&buyAmount=${buyAmount}&takerAddress=${
            this._takerAddress
        }`;
        const { data } = await axios.get(connString);
        console.log(connString);
        console.log(data);
        return data;
    }

    public async signAsync(zeroExTransactionHash: string): Promise<string> {
        return signatureUtils.ecSignHashAsync(this._provider, zeroExTransactionHash, this._takerAddress);
    }

    public async prepareAndStoreMetaTx(): Promise<string> {
        // 1. GET /meta_transaction/quote
        // swap parameters
        const sellToken = 'MKR';
        const buyToken = 'ETH';
        const buyAmount = '50000000';
        const { zeroExTransactionHash, zeroExTransaction } = await this.getQuoteAsync(buyToken, sellToken, buyAmount);

        // 2. Sign the meta tx
        const signature = await signatureUtils.ecSignHashAsync(
            this._provider,
            zeroExTransactionHash,
            this._takerAddress,
        );
        console.log(zeroExTransaction);
        console.log(typeof zeroExTransaction.expirationTimeSeconds);
        const protocolFee = await this._signerService.validateZeroExTransactionFillAsync(zeroExTransaction, signature);
        const txEntity = TransactionEntity.make({
            status: TransactionStates.Unsubmitted,
            zeroExTransaction,
            zeroExTransactionSignature: signature,
            expectedMinedInSec: EXPECTED_MINED_SEC,
            protocolFee,
        });
        await this._transactionRepository.save(txEntity);
        let txHash = null;

        while (txHash === null) {
            const tx = await this._transactionRepository.findOne(signature);
            console.log(tx);
            if (tx !== undefined && tx.status === TransactionStates.Submitted && tx.txHash !== undefined) {
                txHash = tx.txHash;
            }

            await utils.delayAsync(200);
        }

        return txHash;
    }

    // public async submitMetaTx() {
    //     // 1. GET /meta_transaction/quote
    //     // swap parameters
    //     const sellToken = 'MKR';
    //     const buyToken = 'ETH';
    //     const buyAmount = '50000000';
    //     const { zeroExTransactionHash, zeroExTransaction } = await this.getQuoteAsync(
    //         buyToken,
    //         sellToken,
    //         buyAmount,
    //         this._takerAddress,
    //     );

    //     // 2. Sign the meta tx
    //     const signature = await signatureUtils.ecSignHashAsync(
    //         this._provider,
    //         zeroExTransactionHash,
    //         this._takerAddress,
    //     );
    //     await this.metaTxPost(zeroExTransaction, signature);
    // }

    // public async metaTxPost(zeroExTransaction: string, signature: string) {
    //     // 3. POST /meta_transaction/submit
    //     const body = {
    //         zeroExTransaction,
    //         signature,
    //     };
    //     console.log(JSON.stringify(body));
    //     try {
    //         const response = await axios.post(`${this._apiBasePath}/meta_transaction/v0/submit`, body, {
    //             headers: {
    //                 '0x-api-key': process.env.ZEROEX_API_KEY,
    //             },
    //         });
    //         console.log('RESPONSE: ', JSON.stringify(response.data));
    //         // console.log('RESPONSE: ', JSON.stringify(response.data), response.status, response.statusText);
    //     } catch (err) {
    //         console.log('ERROR', err.response);
    //         console.log('ERROR', JSON.stringify(err.response.data));
    //     }
    // }

    private _createWeb3Provider(takerRPCAddress: string): SupportedProvider {
        const provider = new Web3ProviderEngine();
        provider.addProvider(new PrivateKeyWalletSubprovider(this._takerPrivateKey));
        provider.addProvider(new RPCSubprovider(takerRPCAddress));
        providerUtils.startProviderEngine(provider);

        return provider;
    }
}
