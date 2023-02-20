"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapQuoter = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const fast_abi_1 = require("@0x/fast-abi");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const ethereum_types_1 = require("ethereum-types");
const _ = require("lodash");
const artifacts_1 = require("../artifacts");
const wrappers_1 = require("../wrappers");
const constants_1 = require("./constants");
const types_1 = require("./types");
const market_operation_utils_1 = require("./utils/market_operation_utils");
const bancor_service_1 = require("./utils/market_operation_utils/bancor_service");
const constants_2 = require("./utils/market_operation_utils/constants");
const sampler_1 = require("./utils/market_operation_utils/sampler");
const source_filters_1 = require("./utils/market_operation_utils/source_filters");
const types_2 = require("./types");
const gas_price_utils_1 = require("./utils/gas_price_utils");
const quote_requestor_1 = require("./utils/quote_requestor");
const utils_2 = require("./utils/utils");
const quote_info_1 = require("./utils/quote_info");
class SwapQuoter {
    /**
     * Instantiates a new SwapQuoter instance
     * @param   supportedProvider   The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orderbook           An object that conforms to Orderbook, see type for definition.
     * @param   options             Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    constructor(supportedProvider, orderbook, options = {}) {
        var _a;
        this._limitOrderPruningFn = (limitOrder) => {
            const order = new protocol_utils_1.LimitOrder(limitOrder.order);
            const isOpenOrder = order.taker === constants_1.constants.NULL_ADDRESS;
            const willOrderExpire = order.willExpire(this.expiryBufferMs / constants_1.constants.ONE_SECOND_MS);
            const isFeeTypeAllowed = this.permittedOrderFeeTypes.has(types_1.OrderPrunerPermittedFeeTypes.NoFees) &&
                order.takerTokenFeeAmount.eq(constants_1.constants.ZERO_AMOUNT);
            return isOpenOrder && !willOrderExpire && isFeeTypeAllowed;
        };
        const { chainId, expiryBufferMs, permittedOrderFeeTypes, samplerGasLimit, rfqt, tokenAdjacencyGraph } = {
            ...constants_1.constants.DEFAULT_SWAP_QUOTER_OPTS,
            ...options,
        };
        const provider = utils_1.providerUtils.standardizeOrThrow(supportedProvider);
        utils_2.assert.isValidOrderbook('orderbook', orderbook);
        utils_2.assert.isNumber('chainId', chainId);
        utils_2.assert.isNumber('expiryBufferMs', expiryBufferMs);
        this.chainId = chainId;
        this.provider = provider;
        this.orderbook = orderbook;
        this.expiryBufferMs = expiryBufferMs;
        this.permittedOrderFeeTypes = permittedOrderFeeTypes;
        this._rfqtOptions = rfqt;
        this._contractAddresses = options.contractAddresses || {
            ...(0, contract_addresses_1.getContractAddressesForChainOrThrow)(chainId),
        };
        this._gasPriceUtils = gas_price_utils_1.GasPriceUtils.getInstance(constants_1.constants.PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS, options.zeroExGasApiUrl);
        // Allow the sampler bytecode to be overwritten using geths override functionality
        const samplerBytecode = _.get(artifacts_1.artifacts.ERC20BridgeSampler, 'compilerOutput.evm.deployedBytecode.object');
        // Allow address of the Sampler to be overridden, i.e in Ganache where overrides do not work
        const samplerAddress = (options.samplerOverrides && options.samplerOverrides.to) || constants_2.SAMPLER_ADDRESS;
        const defaultCodeOverrides = samplerBytecode
            ? {
                [samplerAddress]: { code: samplerBytecode },
            }
            : {};
        if (constants_2.SELL_SOURCE_FILTER_BY_CHAIN_ID[this.chainId].isAllowed(types_2.ERC20BridgeSource.UniswapV3) ||
            constants_2.BUY_SOURCE_FILTER_BY_CHAIN_ID[this.chainId].isAllowed(types_2.ERC20BridgeSource.UniswapV3)) {
            // Allow the UniV3 MultiQuoter bytecode to be written to a specic address
            const uniV3MultiQuoterBytecode = _.get(artifacts_1.artifacts.UniswapV3MultiQuoter, 'compilerOutput.evm.deployedBytecode.object');
            defaultCodeOverrides[constants_2.UNISWAP_V3_MULTIQUOTER_ADDRESS] = { code: uniV3MultiQuoterBytecode };
        }
        const samplerOverrides = _.assign({ block: ethereum_types_1.BlockParamLiteral.Latest, overrides: defaultCodeOverrides }, options.samplerOverrides);
        const fastAbi = new fast_abi_1.FastABI(wrappers_1.ERC20BridgeSamplerContract.ABI(), { BigNumber: utils_1.BigNumber });
        const samplerContract = new wrappers_1.ERC20BridgeSamplerContract(samplerAddress, this.provider, {
            gas: samplerGasLimit,
        }, {}, undefined, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            encodeInput: (fnName, values) => fastAbi.encodeInput(fnName, values),
            decodeOutput: (fnName, data) => fastAbi.decodeOutput(fnName, data),
        });
        this._marketOperationUtils = new market_operation_utils_1.MarketOperationUtils(new sampler_1.DexOrderSampler(this.chainId, samplerContract, samplerOverrides, undefined, // pools caches for balancer
        tokenAdjacencyGraph, this.chainId === contract_addresses_1.ChainId.Mainnet // Enable Bancor only on Mainnet
            ? async () => bancor_service_1.BancorService.createAsync(provider)
            : async () => undefined), this._contractAddresses);
        const integratorIds = ((_a = this._rfqtOptions) === null || _a === void 0 ? void 0 : _a.integratorsWhitelist.map((integrator) => integrator.integratorId)) || [];
        this._integratorIdsSet = new Set(integratorIds);
        this._buySources = constants_2.BUY_SOURCE_FILTER_BY_CHAIN_ID[chainId];
        this._sellSources = constants_2.SELL_SOURCE_FILTER_BY_CHAIN_ID[chainId];
    }
    /**
     * Returns the recommended gas price for a fast transaction
     */
    async getGasPriceEstimationOrThrowAsync() {
        const gasPrices = await this._gasPriceUtils.getGasPriceEstimationOrThrowAsync();
        return new utils_1.BigNumber(gasPrices.fast);
    }
    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerToken       The address of the maker asset
     * @param   takerToken       The address of the taker asset
     * @param   assetFillAmount  If a buy, the amount of maker asset to buy. If a sell, the amount of taker asset to sell.
     * @param   marketOperation  Either a Buy or a Sell quote
     * @param   options          Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    async getSwapQuoteAsync(makerToken, takerToken, assetFillAmount, marketOperation, options, rfqClient) {
        utils_2.assert.isETHAddressHex('makerToken', makerToken);
        utils_2.assert.isETHAddressHex('takerToken', takerToken);
        utils_2.assert.isBigNumber('assetFillAmount', assetFillAmount);
        const opts = _.merge({}, constants_1.constants.DEFAULT_SWAP_QUOTE_REQUEST_OPTS, options);
        let gasPrice;
        if (opts.gasPrice) {
            gasPrice = opts.gasPrice;
            utils_2.assert.isBigNumber('gasPrice', gasPrice);
        }
        else {
            gasPrice = await this.getGasPriceEstimationOrThrowAsync();
        }
        const sourceFilters = new source_filters_1.SourceFilters([], opts.excludedSources, opts.includedSources);
        opts.rfqt = this._validateRfqtOpts(sourceFilters, opts.rfqt);
        //  ** Prepare options for fetching market side liquidity **
        // Scale fees by gas price.
        const cloneOpts = _.omit(opts, 'gasPrice');
        const calcOpts = {
            ...cloneOpts,
            gasPrice,
            feeSchedule: _.mapValues(constants_2.DEFAULT_GAS_SCHEDULE, (gasCost) => (fillData) => {
                const gas = gasCost ? gasCost(fillData) : 0;
                const fee = gasPrice.times(gas);
                return { gas, fee };
            }),
            exchangeProxyOverhead: (flags) => gasPrice.times(opts.exchangeProxyOverhead(flags)),
        };
        // pass the rfqClient on if rfqt enabled
        if (calcOpts.rfqt !== undefined) {
            calcOpts.rfqt.quoteRequestor = new quote_requestor_1.QuoteRequestor();
            calcOpts.rfqt.rfqClient = rfqClient;
        }
        const limitOrders = await this.getLimitOrders(marketOperation, makerToken, takerToken, calcOpts);
        const result = await this._marketOperationUtils.getOptimizerResultAsync(makerToken, takerToken, limitOrders, assetFillAmount, marketOperation, calcOpts);
        const swapQuote = createSwapQuote(result, makerToken, takerToken, marketOperation, assetFillAmount, gasPrice, constants_2.DEFAULT_GAS_SCHEDULE, opts.bridgeSlippage);
        // Use the raw gas, not scaled by gas price
        const exchangeProxyOverhead = opts.exchangeProxyOverhead(result.path.sourceFlags).toNumber();
        swapQuote.bestCaseQuoteInfo.gas += exchangeProxyOverhead;
        swapQuote.worstCaseQuoteInfo.gas += exchangeProxyOverhead;
        return swapQuote;
    }
    async getLimitOrders(side, makerToken, takerToken, opts) {
        var _a;
        const requestFilters = new source_filters_1.SourceFilters([], opts.excludedSources, opts.includedSources);
        const sourceFilter = side === types_1.MarketOperation.Sell ? this._sellSources : this._buySources;
        const quoteFilter = sourceFilter.merge(requestFilters);
        if (!quoteFilter.isAllowed(types_2.ERC20BridgeSource.Native) || ((_a = opts.rfqt) === null || _a === void 0 ? void 0 : _a.nativeExclusivelyRFQ) === true) {
            return [];
        }
        return await this.orderbook.getOrdersAsync(makerToken, takerToken, this._limitOrderPruningFn);
    }
    _isIntegratorIdWhitelisted(integratorId) {
        if (!integratorId) {
            return false;
        }
        return this._integratorIdsSet.has(integratorId);
    }
    _isTxOriginBlacklisted(txOrigin) {
        if (!txOrigin) {
            return false;
        }
        const blacklistedTxOrigins = this._rfqtOptions ? this._rfqtOptions.txOriginBlacklist : new Set();
        return blacklistedTxOrigins.has(txOrigin.toLowerCase());
    }
    _validateRfqtOpts(sourceFilters, rfqt) {
        if (!rfqt) {
            return rfqt;
        }
        const { integrator, nativeExclusivelyRFQ, intentOnFilling, txOrigin } = rfqt;
        // If RFQ-T is enabled and `nativeExclusivelyRFQ` is set, then `ERC20BridgeSource.Native` should
        // never be excluded.
        if (nativeExclusivelyRFQ === true && !sourceFilters.isAllowed(types_2.ERC20BridgeSource.Native)) {
            throw new Error('Native liquidity cannot be excluded if "rfqt.nativeExclusivelyRFQ" is set');
        }
        // If an integrator ID was provided, but the ID is not whitelisted, raise a warning and disable RFQ
        if (!this._isIntegratorIdWhitelisted(integrator.integratorId)) {
            if (this._rfqtOptions && this._rfqtOptions.warningLogger) {
                this._rfqtOptions.warningLogger({
                    ...integrator,
                }, 'Attempt at using an RFQ API key that is not whitelisted. Disabling RFQ for the request lifetime.');
            }
            return undefined;
        }
        // If the requested tx origin is blacklisted, raise a warning and disable RFQ
        if (this._isTxOriginBlacklisted(txOrigin)) {
            if (this._rfqtOptions && this._rfqtOptions.warningLogger) {
                this._rfqtOptions.warningLogger({
                    txOrigin,
                }, 'Attempt at using a tx Origin that is blacklisted. Disabling RFQ for the request lifetime.');
            }
            return undefined;
        }
        // Otherwise check other RFQ options
        if (intentOnFilling && // The requestor is asking for a firm quote
            this._isIntegratorIdWhitelisted(integrator.integratorId) && // A valid API key was provided
            sourceFilters.isAllowed(types_2.ERC20BridgeSource.Native) // Native liquidity is not excluded
        ) {
            if (!txOrigin || txOrigin === constants_1.constants.NULL_ADDRESS) {
                throw new Error('RFQ-T firm quote requests must specify a tx origin');
            }
        }
        return rfqt;
    }
}
exports.SwapQuoter = SwapQuoter;
// begin formatting and report generation functions
function createSwapQuote(optimizerResult, makerToken, takerToken, operation, assetFillAmount, gasPrice, gasSchedule, slippage) {
    const { path, quoteReport, extendedQuoteReportSources, takerAmountPerEth, makerAmountPerEth } = optimizerResult;
    const { bestCaseQuoteInfo, worstCaseQuoteInfo, sourceBreakdown } = (0, quote_info_1.calculateQuoteInfo)({
        path,
        operation,
        assetFillAmount,
        gasPrice,
        gasSchedule,
        slippage,
    });
    // Put together the swap quote
    const { makerTokenDecimals, takerTokenDecimals, blockNumber, samplerGasUsage } = optimizerResult.marketSideLiquidity;
    const swapQuote = {
        makerToken,
        takerToken,
        gasPrice,
        path,
        bestCaseQuoteInfo,
        worstCaseQuoteInfo,
        sourceBreakdown,
        makerTokenDecimals,
        takerTokenDecimals,
        takerAmountPerEth,
        makerAmountPerEth,
        quoteReport,
        extendedQuoteReportSources,
        blockNumber,
        samplerGasUsage,
    };
    if (operation === types_1.MarketOperation.Buy) {
        return {
            ...swapQuote,
            type: types_1.MarketOperation.Buy,
            makerTokenFillAmount: assetFillAmount,
        };
    }
    else {
        return {
            ...swapQuote,
            type: types_1.MarketOperation.Sell,
            takerTokenFillAmount: assetFillAmount,
        };
    }
}
//# sourceMappingURL=swap_quoter.js.map