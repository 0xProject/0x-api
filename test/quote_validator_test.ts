// tslint:disable:custom-no-magic-numbers
import { ONE_SECOND_MS } from '@0x/asset-swapper/lib/src/utils/market_operation_utils/constants';
import { SignedOrder } from '@0x/connect';
import { expect, randomAddress } from '@0x/contracts-test-utils';
import { Web3Wrapper } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import 'mocha';
import { Connection, Repository } from 'typeorm';

import { ONE_MINUTE_MS } from '../src/constants';
import { MakerBalanceChainCacheEntity } from '../src/entities/MakerBalanceChainCacheEntity';
import { PostgresBackedFirmQuoteValidator } from '../src/services/postgres_backed_firm_quote_validator';

import { getTestDBConnectionAsync } from './utils/db_connection';
import { setupDependenciesAsync } from './utils/deployment';

const SUITE_NAME = 'QuoteValidatorTest';
let connection: Connection;
let chainCacheRepository: Repository<MakerBalanceChainCacheEntity>;


const createOrder = (makerAddress: string, makerToken: string, takerToken: string, makerAssetAmount: BigNumber, takerAssetAmount: BigNumber): SignedOrder => {
    return {
        chainId: 1337,
        exchangeAddress: randomAddress(),
        makerAddress,
        takerAddress: randomAddress(),
        senderAddress: randomAddress(),
        feeRecipientAddress: randomAddress(),
        makerAssetAmount,
        takerAssetAmount,
        makerFee: new BigNumber(0),
        takerFee: new BigNumber(0),
        makerAssetData: assetDataUtils.encodeERC20AssetData(makerToken),
        takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken),
        makerFeeAssetData: NULL_ADDRESS,
        takerFeeAssetData: NULL_ADDRESS,
        salt: new BigNumber(100),
        expirationTimeSeconds: new BigNumber(100),
        signature: '',
    };
};

describe(SUITE_NAME, () => {
    const DAI_TOKEN = randomAddress();
    const USDC_TOKEN = randomAddress();
    const MAKER1_ADDRESS = randomAddress();
    const MAKER2_ADDRESS = randomAddress();
    const MAKER3_ADDRESS = randomAddress();
    const MAKER4_ADDRESS = randomAddress();

    let validator: PostgresBackedFirmQuoteValidator;

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        connection = await getTestDBConnectionAsync();
        chainCacheRepository = connection.getRepository(MakerBalanceChainCacheEntity);
        validator = new PostgresBackedFirmQuoteValidator(chainCacheRepository);
    });
    afterEach(async () => {
        await chainCacheRepository.query('TRUNCATE TABLE maker_balance_chain_cache;');
        // await teardownDependenciesAsync(SUITE_NAME);
    });

    describe('PostgresBackedFirmQuoteValidator', async () => {
        it('should fail gracefully and mark orders as fully fillable if no entries are found', async () => {
            const beforefilter = await chainCacheRepository.count();
            expect(beforefilter).to.eql(0);
            const orders = [800, 801, 802].map(takerAmount => {
                return createOrder(
                    MAKER1_ADDRESS,
                    DAI_TOKEN,
                    USDC_TOKEN,
                    Web3Wrapper.toBaseUnitAmount(700, 18),
                    Web3Wrapper.toBaseUnitAmount(takerAmount, 6),
                );
            });
            const results = await validator.getRFQTTakerFillableAmounts(orders);
            expect(results.length).to.eql(3);
            expect(results.map(r => r.toString())).to.eql([
                '800000000',
                '801000000',
                '802000000',
            ]);

            const afterFilter = await chainCacheRepository.count();
            expect(afterFilter).to.eql(1);
        });

        it('should correctly round down taker amounts', async () => {
            await chainCacheRepository.insert({
                tokenAddress: DAI_TOKEN,
                makerAddress: MAKER1_ADDRESS,
                balance: Web3Wrapper.toBaseUnitAmount(300, 18),
                timeFirstSeen: 'NOW()',
                timeOfSample: 'NOW()',
            });

            const orderToValidate =  createOrder(
                MAKER1_ADDRESS,
                DAI_TOKEN,
                USDC_TOKEN,
                Web3Wrapper.toBaseUnitAmount(700, 18),
                Web3Wrapper.toBaseUnitAmount(800, 6),
            );
            const results = await validator.getRFQTTakerFillableAmounts([orderToValidate]);
            expect(results.length).to.eql(1);
            expect(results.map(r => r.toString())).to.eql([
                '342857142',    // 342.857142
            ]);
        });

        it('should ignore orders that have a stale cache', async () => {
            const fiveMinuteAgo = new Date((new Date()).getTime() - 5 * 60 * ONE_SECOND_MS);
            await chainCacheRepository.insert({
                makerAddress: MAKER1_ADDRESS,
                tokenAddress: DAI_TOKEN,
                balance: Web3Wrapper.toBaseUnitAmount(300, 18),
                timeFirstSeen: new Date(fiveMinuteAgo.getTime() - (ONE_SECOND_MS * 30)),
                timeOfSample: fiveMinuteAgo,
            });
            await chainCacheRepository.insert({
                makerAddress: MAKER2_ADDRESS,
                tokenAddress: DAI_TOKEN,
                timeFirstSeen: new Date(fiveMinuteAgo.getTime() - (ONE_SECOND_MS * 30)),
            });
            await chainCacheRepository.insert({
                makerAddress: MAKER3_ADDRESS,
                tokenAddress: DAI_TOKEN,
                timeFirstSeen: new Date(new Date().getTime() - (ONE_SECOND_MS * 30)),
            });

            const orders = [MAKER1_ADDRESS, MAKER2_ADDRESS, MAKER3_ADDRESS].map(makerAddress => {
                return createOrder(
                    makerAddress,
                    DAI_TOKEN,
                    USDC_TOKEN,
                    Web3Wrapper.toBaseUnitAmount(700, 18),
                    Web3Wrapper.toBaseUnitAmount(800, 6),
                );
            });
            const results = await validator.getRFQTTakerFillableAmounts(orders);
            expect(results.length).to.eql(3);
            expect(results.map(r => r.toString())).to.eql([
                '0',            // order maker has a cache entry which is too old
                '0',            // order maker never had a cache entry and was first seen 5 minutes ago - not fillable
                '800000000',    // order maker has a cache entry and was seen 30 seconds ago - fully fillable
            ]);

        });

        it('should correctly report no taker fillable amount if makers do not have a balance', async () => {
            const oneMinuteAgo = new Date((new Date()).getTime() - ONE_MINUTE_MS);

            // Maker1 does not have capital
            // Maker2 has some capital
            // Maker3 has all the capital
            // Maker4 has no entries in the database
            await chainCacheRepository.insert({
                tokenAddress: DAI_TOKEN,
                makerAddress: MAKER1_ADDRESS,
                balance: new BigNumber(0),
                timeFirstSeen: 'NOW()',
                timeOfSample: oneMinuteAgo,
            });
            await chainCacheRepository.insert({
                tokenAddress: DAI_TOKEN,
                makerAddress: MAKER2_ADDRESS,
                balance: Web3Wrapper.toBaseUnitAmount(120, 18),
                timeOfSample: oneMinuteAgo,
                timeFirstSeen: 'NOW()',
            });
            await chainCacheRepository.insert({
                tokenAddress: DAI_TOKEN,
                makerAddress: MAKER3_ADDRESS,
                balance: Web3Wrapper.toBaseUnitAmount(3000, 18),
                timeOfSample: oneMinuteAgo,
                timeFirstSeen: 'NOW()',
            });

            const orders = [MAKER1_ADDRESS, MAKER2_ADDRESS, MAKER3_ADDRESS, MAKER4_ADDRESS].map(address => {
                return createOrder(
                    address,
                    DAI_TOKEN,
                    USDC_TOKEN,
                    Web3Wrapper.toBaseUnitAmount(1000, 18),
                    Web3Wrapper.toBaseUnitAmount(1000, 6),
                );
            });
            // Balances were adjusted accordingly, and Maker4 was added to the chain cache
            const now = new Date();
            const results = await validator.getRFQTTakerFillableAmounts(orders);
            expect(results.length).to.eql(4);
            expect(results.map(r => r.toString())).to.eql([
                '0',
                '120000000',
                '1000000000',
                '1000000000',
            ]);

            // MAKER4 did not exist in the cache, so check to ensure it's been added.
            const maker4Entry = await chainCacheRepository.findOneOrFail({
                where: {
                    makerAddress: MAKER4_ADDRESS,
                    tokenAddress: DAI_TOKEN,
                }
            });
            expect(maker4Entry.timeFirstSeen).to.be.gt(now);
        });
    });
});
