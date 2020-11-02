import { LogFunction, RfqtFirmQuoteValidator } from '@0x/asset-swapper';
import { Connection } from 'typeorm';
import { RFQTFirmQuote } from '@0x/quote-server';

    constructor(private readonly _database: Connection, private readonly _warningLogger: LogFunction) {}

export class RfqtQuoteProcessor implements RfqtFirmQuoteValidator {
    /**
     * Does a "synthetic order validation" of RFQ-T firm quotes based on cached
     * maker asset balances from the database.
     *
     * Currently just a stub.
     */
    public async filterInvalidQuotesAsync(
        quotes: { response: RFQTFirmQuote; makerUri: string }[],
    ): Promise<RFQTFirmQuote[]> {
        if (this._database === undefined) {
            this._warningLogger({ msg: 'invalid database' });
        }
        return Promise.resolve(quotes.map(quote => quote.response));
    }

}
