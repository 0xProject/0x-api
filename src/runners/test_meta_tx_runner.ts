// tslint:disable:no-console
// tslint:disable:no-unbound-method

import { signatureUtils } from '@0x/order-utils';
import { PrivateKeyWalletSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import axios from 'axios';

import { TAKER_ADDRESS, TAKER_PRIVATE_KEY } from '../constants';

const mainAsync = async () => {
    // create ethereum provider (server)
    const provider = new Web3ProviderEngine();
    provider.addProvider(new PrivateKeyWalletSubprovider(TAKER_PRIVATE_KEY));
    provider.addProvider(new RPCSubprovider('https://eth-mainnet.alchemyapi.io/jsonrpc/KeUFQuuW7d-WHLGY62WYrHv8V_W7KYU5'));
    providerUtils.startProviderEngine(provider);

    // create ethereum provider (browser)
    // const provider = window.ethereum;

    // swap parameters
    const sellToken = 'WETH';
    const buyToken = 'DAI';
    const buyAmount = '500000000000000000'; // 0.5 DAI
    const takerAddress = TAKER_ADDRESS;

    // 1. GET /meta_transaction/quote
    const { data } = await axios.get(
        `http://localhost:3000/meta_transaction/v0/quote?buyToken=${buyToken}&sellToken=${sellToken}&buyAmount=${buyAmount}&takerAddress=${takerAddress}`,
    );
    const { zeroExTransactionHash, zeroExTransaction } = data;

    // 2. Sign the meta tx
    const signature = await signatureUtils.ecSignHashAsync(provider, zeroExTransactionHash, takerAddress);

    // 3. POST /meta_transaction/fill
    const { status, statusText } = await axios.post('http://localhost:3000/meta_transaction/v0/fill', { zeroExTransaction, signature });

    console.log(`${status} ${statusText}`);
};

mainAsync().catch(console.error);
