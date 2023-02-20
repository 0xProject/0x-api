"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapQuoteConsumer = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const _ = require("lodash");
const constants_1 = require("../constants");
const assert_1 = require("../utils/assert");
const exchange_proxy_swap_quote_consumer_1 = require("./exchange_proxy_swap_quote_consumer");
class SwapQuoteConsumer {
    constructor(options = {}) {
        const { chainId } = _.merge({}, constants_1.constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert_1.assert.isNumber('chainId', chainId);
        this.chainId = chainId;
        this._contractAddresses = options.contractAddresses || (0, contract_addresses_1.getContractAddressesForChainOrThrow)(chainId);
        this._exchangeProxyConsumer = new exchange_proxy_swap_quote_consumer_1.ExchangeProxySwapQuoteConsumer(this._contractAddresses, options);
    }
    static getSwapQuoteConsumer(options = {}) {
        return new SwapQuoteConsumer(options);
    }
    /**
     * Given a SwapQuote, returns 'CalldataInfo' for a 0x extesion or exchange call. See type definition of CalldataInfo for more information.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting SmartContractParams. See type definition for more information.
     */
    async getCalldataOrThrowAsync(quote, opts = {}) {
        const consumer = await this._getConsumerForSwapQuoteAsync(opts);
        return consumer.getCalldataOrThrowAsync(quote, opts);
    }
    /**
     * Given a SwapQuote and desired rate (in takerAsset), attempt to execute the swap with 0x extension or exchange contract.
     * @param quote An object that conforms to SwapQuote. See type definition for more information.
     * @param opts  Options for getting CalldataInfo. See type definition for more information.
     */
    async executeSwapQuoteOrThrowAsync(quote, opts = {}) {
        const consumer = await this._getConsumerForSwapQuoteAsync(opts);
        return consumer.executeSwapQuoteOrThrowAsync(quote, opts);
    }
    async _getConsumerForSwapQuoteAsync(_opts) {
        return this._exchangeProxyConsumer;
    }
}
exports.SwapQuoteConsumer = SwapQuoteConsumer;
//# sourceMappingURL=swap_quote_consumer.js.map