import { BigNumber, RfqtFirmQuoteValidator, SignedOrder } from '@0x/asset-swapper';
import { assetDataUtils, ERC20AssetData } from '@0x/order-utils';
import { In } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';

import { ONE_MINUTE_MS, ZERO } from '../constants';
import { MakerBalanceChainCacheEntity } from '../entities/MakerBalanceChainCacheEntity';
import { logger } from '../logger';


const THRESHOLD_CACHE_EXPIRED_MS = ONE_MINUTE_MS * 2;


export class PostgresBackedFirmQuoteValidator implements RfqtFirmQuoteValidator {
    private readonly _chainCacheRepository: Repository<MakerBalanceChainCacheEntity>;
    private readonly _cacheExpiryThresholdMs: number;

    private static _calculateTakerFillableAmountsFromQuotes(quotes: SignedOrder[], makerLookup: {[key: string]: BigNumber}): {makerAddressesToAddToCache: string[]; takerFillableAmounts: BigNumber[]} {
        const makerAddressesToAddToCacheSet: Set<string> = new Set();
        const takerFillableAmounts =  quotes.map(quote => {
            const makerTokenBalanceForMaker: BigNumber | undefined = makerLookup[quote.makerAddress];

            // TODO: Add Prometheus hooks
            if (makerTokenBalanceForMaker === undefined) {
                makerAddressesToAddToCacheSet.add(quote.makerAddress);
                return quote.takerAssetAmount;
            }

            // Order is fully fillable, because Maker has 100% of the assets
            if (makerTokenBalanceForMaker.gte(quote.makerAssetAmount)) {
                return quote.takerAssetAmount;
            }

            // Order is empty, return zero
            if (quote.makerAssetAmount.lte(0)) {
                return ZERO;
            }

            // Order is partially fillable, because Maker has a fraction of the assets
            const partialFillableAmount = makerTokenBalanceForMaker.times(quote.takerAssetAmount).div(quote.makerAssetAmount).integerValue(BigNumber.ROUND_DOWN);
            logger.warn(`Maker ${quote.makerAddress} balance is ${makerTokenBalanceForMaker.toString()} and can only partially cover order size ${quote.makerAssetAmount.toString()}. takerAssetAmount was reduced from ${quote.takerAssetAmount.toString()} to ${partialFillableAmount.toString()}`)
            if (!partialFillableAmount.isFinite()) {
                logger.error(`Calculated maker token balance is infinite, which caused the partialFillableAmount to be infinite. This should never happen`);
                return ZERO;
            }
            return partialFillableAmount;
        });
        const makerAddressesToAddToCache = Array.from(makerAddressesToAddToCacheSet);
        return {
            makerAddressesToAddToCache,
            takerFillableAmounts,
        };
    }

    constructor(chainCacheRepository: Repository<MakerBalanceChainCacheEntity>, cacheExpiryThresholdMs: number = THRESHOLD_CACHE_EXPIRED_MS) {
        this._chainCacheRepository = chainCacheRepository;
        this._cacheExpiryThresholdMs = cacheExpiryThresholdMs;
    }

    // tslint:disable-next-line: prefer-function-over-method
    public async getRFQTTakerFillableAmounts(quotes: SignedOrder[]): Promise<BigNumber[]> {
        // TODO: Handle error on query

        // Ensure that all quotes have the same exact maker token.
        const makerTokenAddressesSet = new Set(
            quotes.map(quote => {
                const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(quote.makerAssetData) as ERC20AssetData;
                return decodedAssetData.tokenAddress;
            })
        );
        if (makerTokenAddressesSet.size !== 1) {
            logger.error(`Quotes array was empty or found multiple maker token addresses within one single RFQ batch: ${JSON.stringify(Array.from(makerTokenAddressesSet))}. Rejecting the batch`);
            return quotes.map(_quote => ZERO);
        }
        const makerTokenAddress: string = makerTokenAddressesSet.values().next().value;

        // Fetch balances and create a lookup table. In order to fetch all the unique addresses we use a set, but then convert
        // the set to an array so that it can work with TypeORM.
        const makerLookup: {[key: string]: BigNumber} = {};
        const makerAddresses = Array.from(new Set(quotes.map(quote => quote.makerAddress)));
        const cacheResults = await this._chainCacheRepository.find({
            where: [{
                tokenAddress: makerTokenAddress,
                makerAddress: In(makerAddresses),
            }],
        });
        const nowUnix = (new Date()).getTime();
        for (const result of cacheResults) {
            makerLookup[result.makerAddress!] = this._calculateMakerBalanceFromResult(result, makerTokenAddress, nowUnix);
        }

        // Finally, adjust takerFillableAmount based on maker balances
        const {makerAddressesToAddToCache, takerFillableAmounts} = PostgresBackedFirmQuoteValidator._calculateTakerFillableAmountsFromQuotes(quotes, makerLookup);

        // If any new addresses were found, add new addresses to cache.
        // NOTE: since this insertion happens on the web processes, we need to gracefully handle conflict
        // that can happen if two threads try to insert the same entry at the same time. This is why we add
        // the "ON CONFLICT" clause.
        if (makerAddressesToAddToCache.length > 0) {
            logger.info(`Adding new addresses to cache: ${JSON.stringify(makerAddressesToAddToCache)}`);
            await this._chainCacheRepository
                .createQueryBuilder()
                .insert()
                .values(
                    makerAddressesToAddToCache.map(makerAddress => {
                        return {
                            makerAddress,
                            tokenAddress: makerTokenAddress,
                            timeFirstSeen: 'NOW()',
                        };
                    })
                )
                .onConflict(`("token_address", "maker_address") DO NOTHING`)
                .execute();
        }
        return takerFillableAmounts;
    }

    private _calculateMakerBalanceFromResult(result: MakerBalanceChainCacheEntity, makerTokenAddress: string, nowUnix: number): BigNumber {
        if (!result.timeOfSample) {
            // If a record exists but a time of sample does not yet exist, this means that the cache entry has not yet been
            // populated by the worker process. This may be due to a new address being added a few minutes ago, but it could
            // also be due to a bug in the worker.
            const timeFirstSeen = result.timeFirstSeen ? result.timeFirstSeen.getTime() : 0;
            const msPassedSinceLastSeen = nowUnix - timeFirstSeen;
            if (msPassedSinceLastSeen > this._cacheExpiryThresholdMs) {
                logger.error(`Cache entry for maker ${result.makerAddress} and token ${result.tokenAddress} was first added on ${timeFirstSeen} which is more than ${this._cacheExpiryThresholdMs} ms ago. Assuming worker is stuck and setting maker balance to 0.`);
                return ZERO;
            } else {
                logger.warn(`Cannot find cache for token ${makerTokenAddress} and maker ${result.makerAddress}. This entry was recently added so assuming the entire maker fillable amount is available`);
                return new BigNumber(Number.POSITIVE_INFINITY);
            }
        } else if (nowUnix - result.timeOfSample.getTime() > this._cacheExpiryThresholdMs) {
            // In this case a cache entry exists, but it's simply too old and this should never really happen unless the worker is stuck.
            logger.error(`Cache entry for maker ${result.makerAddress} and token ${result.tokenAddress} was last refreshed on ${result.timeOfSample.getTime()} which is more than ${this._cacheExpiryThresholdMs} ms ago. Assuming worker is stuck and setting maker balance to 0.`);
            return ZERO;
        }

        // Quick validity check to ensure data isn't invalid. This should never happen if `timeOfSample` exists.
        if (!result.balance) {
            logger.error(`Cache entry for maker ${result.makerAddress} and token ${result.tokenAddress} has a null balance. This should never happen`);
            return ZERO;
        }
        return result.balance;
    }

}
