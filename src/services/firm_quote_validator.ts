import { BigNumber, RfqtFirmQuoteValidator, SignedOrder } from '@0x/asset-swapper';
import { assetDataUtils, ERC20AssetData } from '@0x/order-utils';
import { In } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { MakerBalanceChainCache } from '../entities/MakerBalanceChainCacheEntity';
import { logger } from '../logger';


const BIG_NUMBER_ZERO = new BigNumber(0);


export class PostgresBackedFirmQuoteValidator implements RfqtFirmQuoteValidator {
    private readonly _chainCacheRepository: Repository<MakerBalanceChainCache>;

    constructor(chainCacheRepository: Repository<MakerBalanceChainCache>) {
        this._chainCacheRepository = chainCacheRepository;
    }

    // tslint:disable-next-line: prefer-function-over-method
    async getRFQTTakerFillableAmounts(quotes: SignedOrder[]): Promise<BigNumber[]> {

        if (quotes.length === 0) {
            return [];
        }

        // Ensure that all quotes have the same exact maker token.
        const makerTokenAddressesSet = new Set(
            quotes.map(quote => {
                const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(quote.makerAssetData) as ERC20AssetData;
                return decodedAssetData.tokenAddress;
            })
        );
        const makerTokenAddresses = Array.from(makerTokenAddressesSet);
        if (makerTokenAddresses.length !== 1) {
            logger.error(`Found multiple maker token addresses within one single RFQ batch: ${JSON.stringify(makerTokenAddresses)}. Rejecting the batch`);
            return quotes.map(_quote => BIG_NUMBER_ZERO);
        }

        // Collect a list of maker addresses
        const makerAddressesSet = new Set(quotes.map(quote => quote.makerAddress));
        const makerAddresses = Array.from(makerAddressesSet);

        // Fetch balances and create a lookup table
        const makerLookup: {[key: string]: BigNumber} = {};
        // TODO: Handle error on query
        const cacheResults = await this._chainCacheRepository.find({
            where: [{
                tokenAddress: makerTokenAddresses[0],
                makerAddress: In(makerAddresses),
            }]
        });
        for (const result of cacheResults) {

            // TODO: validate the `timeOfSample`

            if ((result.balance !== undefined) && (result.balance !== null)) {
                makerLookup[result.makerAddress!] = result.balance;
            }
        }

        // Finally, adjust takerFillableAmount based on maker balances
        return quotes.map(quote => {
            const makerTokenBalanceForMaker: BigNumber | undefined = makerLookup[quote.makerAddress];

            // TODO: Add Prometheus hooks
            if (makerTokenBalanceForMaker === undefined) {
                // ERROR: maker token balance was never seen, therefore this may be a new address
                // or there could be some issue with the worker process. Error on the side of assuming
                // the order is fillable.
                logger.error(`Cannot find cache for token ${makerTokenAddresses[0]} and maker ${quote.makerAddress}. If this error persists, there could be a problem`);
                return quote.takerAssetAmount;
            }

            // Order is fully fillable, because Maker has 100% of the assets
            if (makerTokenBalanceForMaker.gte(quote.makerAssetAmount)) {
                return quote.takerAssetAmount;
            }

            // Order is empty, return zero
            if (quote.makerAssetAmount.lte(0)) {
                return BIG_NUMBER_ZERO;
            }

            // Order is partially fillable, because Maker has a fraction of the assets
            return makerTokenBalanceForMaker.times(quote.takerAssetAmount).div(quote.makerAssetAmount);
        });
    }

}
