// tslint:disable:no-console
// tslint:disable:no-unbound-method

import { NonceTrackerSubprovider, PrivateKeyWalletSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { NULL_ADDRESS, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import axios from 'axios';

import { TAKER_ADDRESS, TAKER_PRIVATE_KEY } from '../config';

const mainAsync = async () => {
    if (TAKER_ADDRESS === NULL_ADDRESS) {
        throw new Error(`TAKER_ADDRESS must be specified`);
    }
    if (TAKER_PRIVATE_KEY === '') {
        throw new Error(`TAKER_PRIVATE_KEY must be specified`);
    }

    // create ethereum provider (server)
    const provider = new Web3ProviderEngine();
    provider.addProvider(new NonceTrackerSubprovider());
    provider.addProvider(new PrivateKeyWalletSubprovider(TAKER_PRIVATE_KEY));
    providerUtils.startProviderEngine(provider);

    // create ethereum provider (browser)
    // const provider = window.ethereum;
    const web3Wrapper = new Web3Wrapper(provider);

    // swap parameters
    const sellToken = 'WETH';
    const buyToken = 'DAI';
    const buyAmount = '500000000000000000'; // 0.5 DAI
    const takerAddress = TAKER_ADDRESS;

    // 1. GET /meta_transaction/quote
    const { data } = await axios.get(
        `http://localhost:3000/swap/v0/quote?buyToken=${buyToken}&sellToken=${sellToken}&buyAmount=${buyAmount}&takerAddress=${takerAddress}`,
    );
    console.log(data.orders);

    const txHash = await web3Wrapper.sendTransactionAsync(data);
    console.log('txHash: ', txHash);
};

mainAsync().catch(console.error);
