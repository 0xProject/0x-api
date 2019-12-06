import { SupportedProvider, Web3ProviderEngine } from '0x.js';
import { signatureUtils } from '@0x/order-utils';
import { PrivateKeyWalletSubprovider, RedundantSubprovider, RPCSubprovider } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import axios from 'axios';

import { ETHEREUM_RPC_URL } from '../config';
import { TAKER_ADDRESS, TAKER_PRIVATE_KEY } from '../constants';

const mainAsync = async () => {
    // quote parameters
    const buyToken = 'DAI';
    const sellToken = 'WETH';
    const buyAmount = '1000000000000000000'; // 1 DAI
    const takerAddress = TAKER_ADDRESS;

    // form API request
    const getMetaTransactionUrl = `http://localhost:3000/meta/transaction?buyToken=${buyToken}&sellToken=${sellToken}&buyAmount=${buyAmount}&takerAddress=${takerAddress}`;

    // GET /meta/transaction
    const getResponse = await axios.get(getMetaTransactionUrl);
    const { zeroExTransactionHash, zeroExTransaction } = getResponse.data;

    // create ethereum provider and sign
    const provider = createWeb3Provider(TAKER_PRIVATE_KEY, ETHEREUM_RPC_URL);
    const signature = await signatureUtils.ecSignHashAsync(provider, zeroExTransactionHash, takerAddress);

    // POST /meta/transaction
    const postMetaTransactionUrl = 'http://localhost:3000/meta/transaction';
    const postResponse = await axios.post(postMetaTransactionUrl, { zeroExTransaction, signature });

    console.log(postResponse);
};
mainAsync().catch(console.error);

const range = (rangeCount: number): number[] => [...Array(rangeCount).keys()];
const createWeb3Provider = (privateKey: string, rpcUrl: string): SupportedProvider => {
    const WEB3_RPC_RETRY_COUNT = 3;
    const providerEngine = new Web3ProviderEngine();
    providerEngine.addProvider(new PrivateKeyWalletSubprovider(privateKey));
    const rpcSubproviders = range(WEB3_RPC_RETRY_COUNT).map((_index: number) => new RPCSubprovider(rpcUrl));
    providerEngine.addProvider(new RedundantSubprovider(rpcSubproviders));
    providerUtils.startProviderEngine(providerEngine);
    return providerEngine;
};
