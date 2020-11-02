import { LogFunction, RfqtFirmQuoteValidator } from '@0x/asset-swapper';
import { assetDataUtils } from '@0x/order-utils';
import { RFQTFirmQuote } from '@0x/quote-server';
import { ERC20AssetData } from '@0x/types';
import { Connection, In } from 'typeorm';

import { MakerValidationCacheEntity } from './entities/MakerValidationCacheEntity';
import { ObservedMakerAddressEntity } from './entities/ObservedMakerAddressEntity';

export class RfqtQuoteProcessor implements RfqtFirmQuoteValidator {
    constructor(private readonly _database: Connection, private readonly _warningLogger: LogFunction) {}
    /**
     * Does a "synthetic order validation" of RFQ-T firm quotes based on cached
     * maker asset balances from the database.  Also inserts maker address
     * observations into the database.
     *
     * Assumes that all quotes are for the same asset pair.
     *
     * Currently just a stub.
     */
    public async filterInvalidQuotesAsync(
        quotes: { response: RFQTFirmQuote; makerUri: string }[],
    ): Promise<RFQTFirmQuote[]> {
        quotes.forEach(quote =>
            this._database
                .createQueryBuilder()
                .insert()
                .into(ObservedMakerAddressEntity)
                .values([new ObservedMakerAddressEntity(quote.makerUri, quote.response.signedOrder.makerAddress)])
                .onConflict('DO NOTHING')
                .execute(),
        );

        const makerAssetTokenAddresses = quotes
            .map(quote => quote.response.signedOrder.makerAssetData)
            .map(makerAssetData => assetDataUtils.decodeAssetDataOrThrow(makerAssetData))
            .map(decodedAssetData => (decodedAssetData as ERC20AssetData).tokenAddress);

        const makerAddresses = quotes.map(quote => quote.response.signedOrder.makerAddress);

        const validationCacheEntries = await this._database.getRepository(MakerValidationCacheEntity).find({
            tokenAddress: In(makerAssetTokenAddresses),
            makerAddress: In(makerAddresses),
        });

        const validationCacheEntriesByMaker = validationCacheEntries.reduce<{
            [makerAddress: string]: MakerValidationCacheEntity;
        }>((entriesByMaker, entry) => {
            entriesByMaker[entry.makerAddress] = entry;
            return entriesByMaker;
        }, {});

        return Promise.resolve(
            quotes
                .filter(quote =>
                    this._isFirmQuoteValid(
                        quote.response,
                        validationCacheEntriesByMaker[quote.response.signedOrder.makerAddress],
                    ),
                )
                .map(quote => quote.response),
        );
    }
    private _isFirmQuoteValid(quote: RFQTFirmQuote, validationCacheEntry: MakerValidationCacheEntity): boolean {
        if (quote.signedOrder.makerAssetAmount.lt(validationCacheEntry.balance)) {
            this._warningLogger({ quote, validationCacheEntry }, 'invalid firm quote');
            return false;
        }
        return true;
    }
}
