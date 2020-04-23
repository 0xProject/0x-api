import { web3Factory } from '@0x/dev-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import 'mocha';

import * as config from '../src/config';
import { META_TRANSACTION_PATH } from '../src/constants';

import { LogType, setupApiAsync, teardownApiAsync } from './utils/deployment';
// import { expect } from './utils/expect';
import { httpGetAsync } from './utils/http_utils';

const WETH_ADDRESS = '0x0b1ba0af832d7c05fd64161e0db78e85978e8082';
const ZRX_ADDRESS = '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c';

describe.only('meta transactions test', () => {
    let takerAddress: string;

    before(async () => {
        await setupApiAsync('/price tests', { apiLogType: LogType.Console });

        // connect to ganache and run contract migrations
        const ganacheConfigs = {
            shouldUseInProcessGanache: false,
            shouldAllowUnlimitedContractSize: true,
            rpcUrl: config.ETHEREUM_RPC_URL,
        };
        // const provider = web3Factory.getRpcProvider(ganacheConfigs);
        const provider = web3Factory.getRpcProvider(ganacheConfigs);
        const web3Wrapper = new Web3Wrapper(provider);
        [takerAddress] = await web3Wrapper.getAvailableAddressesAsync();
        console.log(takerAddress);
    });

    after(async () => {
        await teardownApiAsync('/price tests');
    });

    describe('/price tests', () => {
        it('test', async () => {
            const response = await httpGetAsync({
                route: `${META_TRANSACTION_PATH}/price?sellToken=${WETH_ADDRESS}&buyToken=${ZRX_ADDRESS}&buyAmount=1&takerAddress=${takerAddress}`,
            });
            console.log(response.body);
        });
    });
});
