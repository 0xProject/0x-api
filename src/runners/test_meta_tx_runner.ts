// tslint:disable:no-console
// tslint:disable:no-unbound-method

import { signatureUtils } from '@0x/order-utils';
import { PrivateKeyWalletSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import axios from 'axios';

import { TAKER_PRIVATE_KEY } from '../constants';

const mainAsync = async () => {
    // create ethereum provider (server)
    const provider = new Web3ProviderEngine();
    provider.addProvider(new PrivateKeyWalletSubprovider(TAKER_PRIVATE_KEY));
    providerUtils.startProviderEngine(provider);

    // create ethereum provider (browser)
    // const provider = window.ethereum;

    // swap parameters
    const sellToken = 'WETH';
    const buyToken = 'DAI';
    const buyAmount = '1000000000000000000'; // 1 DAI
    const takerAddress = '0x9cc9fd7ac00ed2b5e219fa778e545316a19ac212';

    // 1. GET /meta/tx
    const { data } = await axios.get(
        `http://localhost:3000/meta/tx?buyToken=${buyToken}&sellToken=${sellToken}&buyAmount=${buyAmount}&takerAddress=${takerAddress}`,
    );
    const { zeroExTransactionHash, zeroExTransaction } = data;

    // 2. Sign the meta tx
    const signature = await signatureUtils.ecSignHashAsync(provider, zeroExTransactionHash, takerAddress);

    // 3. POST /meta/tx
    const { status, statusText } = await axios.post('http://localhost:3000/meta/tx', { zeroExTransaction, signature });

    console.log(`${status} ${statusText}`);
};

mainAsync().catch(console.error);
