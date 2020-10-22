import { LogFunction, RfqtFirmQuoteValidator, RfqtQuoteObserver } from '@0x/asset-swapper';
import { RFQTFirmQuote, RFQTIndicativeQuote } from '@0x/quote-server';
import { Connection } from 'typeorm';

export class RfqtQuoteProcessor implements RfqtFirmQuoteValidator, RfqtQuoteObserver {
    constructor(private readonly _database: Connection, private readonly _warningLogger: LogFunction) {}

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

    /**
     * Observes maker addresses and inserts them into the database so that the
     * balance caching worker knows what addresses to cache.
     *
     * Currently just a stub.
     */
    public onValidQuotes(quotes: { response: RFQTIndicativeQuote | RFQTFirmQuote; makerUri: string }[]): void {
        if (this._database === undefined) {
            this._warningLogger({ msg: 'invalid database' });
        }
        if (quotes === undefined) {
            this._warningLogger({ msg: 'quotes undefined' });
        }
    }
}
