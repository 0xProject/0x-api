"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contract_addresses_1 = require("@0x/contract-addresses");
const chai = require("chai");
require("mocha");
const pools_cache_1 = require("../../src/asset-swapper/utils/market_operation_utils/pools_cache");
const chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const timeoutMs = 5000;
const poolKeys = ['id', 'balanceIn', 'balanceOut', 'weightIn', 'weightOut', 'swapFee'];
describe('Pools Caches for Balancer-based sampling', () => {
    async function fetchAndAssertPoolsAsync(cache, takerToken, makerToken) {
        const pools = await cache.getFreshPoolsForPairAsync(takerToken, makerToken, timeoutMs);
        expect(pools.length).greaterThan(0, `Failed to find any pools for ${takerToken} and ${makerToken}`);
        expect(pools[0]).not.undefined();
        expect(Object.keys(pools[0])).to.include.members(poolKeys);
        const cachedPoolIds = cache.getPoolAddressesForPair(takerToken, makerToken);
        expect(cachedPoolIds).to.deep.equal(pools.map((p) => p.id));
    }
    describe('BalancerPoolsCache', () => {
        const cache = pools_cache_1.BalancerPoolsCache.create(contract_addresses_1.ChainId.Mainnet);
        it('fetches pools', async () => {
            const pairs = [
                [usdcAddress, daiAddress],
                [usdcAddress, wethAddress],
                [daiAddress, wethAddress],
            ];
            await Promise.all(pairs.map(async ([takerToken, makerToken]) => fetchAndAssertPoolsAsync(cache, takerToken, makerToken)));
        });
    });
});
//# sourceMappingURL=pools_cache_test.js.map