// tslint:disable:max-file-line-count
import { ERC20BridgeSource, RfqtRequestOpts, SwapQuoterError } from '@0x/asset-swapper';
import { MarketOperation } from '@0x/types';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';
import _ = require('lodash');
import { Counter } from 'prom-client';

import { CHAIN_ID, PLP_API_KEY_WHITELIST, RFQT_API_KEY_WHITELIST, RFQT_REGISTRY_PASSWORDS } from '../config';
import {
    DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE,
    MARKET_DEPTH_DEFAULT_DISTRIBUTION,
    MARKET_DEPTH_MAX_SAMPLES,
    SWAP_DOCS_URL,
} from '../constants';
import {
    InternalServerError,
    RevertAPIError,
    ValidationError,
    ValidationErrorCodes,
    ValidationErrorReasons,
} from '../errors';
import { logger } from '../logger';
import { isAPIError, isRevertError } from '../middleware/error_handling';
import { schemas } from '../schemas/schemas';
import { SwapService } from '../services/swap_service';
import { TokenMetadatasForChains } from '../token_metadatas_for_networks';
import { GetSwapPriceResponse, GetSwapQuoteParams, GetSwapQuoteResponse } from '../types';
import { paginationUtils } from '../utils/pagination_utils';
import { parseUtils } from '../utils/parse_utils';
import { priceComparisonUtils } from '../utils/price_comparison_utils';
import { schemaUtils } from '../utils/schema_utils';
import { serviceUtils } from '../utils/service_utils';
import {
    findTokenAddressOrThrow,
    findTokenAddressOrThrowApiError,
    getTokenMetadataIfExists,
    isETHSymbolOrAddress,
    isWETHSymbolOrAddress,
} from '../utils/token_metadata_utils';

import { quoteReportUtils } from './../utils/quote_report_utils';

const BEARER_REGEX = /^Bearer\s(.{36})$/;
const REGISTRY_SET: Set<string> = new Set(RFQT_REGISTRY_PASSWORDS);
const REGISTRY_ENDPOINT_FETCHED = new Counter({
    name: 'swap_handler_registry_endpoint_fetched',
    help: 'Requests to the swap handler',
    labelNames: ['identifier'],
});

export class SwapHandlers {
    private readonly _swapService: SwapService;
    public static root(_req: express.Request, res: express.Response): void {
        const message = `This is the root of the Swap API. Visit ${SWAP_DOCS_URL} for details about this API.`;
        res.status(HttpStatus.OK).send({ message });
    }
    // tslint:disable-next-line:prefer-function-over-method
    public static getTokens(_req: express.Request, res: express.Response): void {
        const tokens = TokenMetadatasForChains.map(tm => ({
            symbol: tm.symbol,
            address: tm.tokenAddresses[CHAIN_ID],
            name: tm.name,
            decimals: tm.decimals,
        }));
        const filteredTokens = tokens.filter(t => t.address !== NULL_ADDRESS);
        res.status(HttpStatus.OK).send({ records: filteredTokens });
    }

    public static getRfqRegistry(req: express.Request, res: express.Response): void {
        const auth = req.header('Authorization');
        REGISTRY_ENDPOINT_FETCHED.labels(auth || 'N/A').inc();
        if (auth === undefined) {
            return res.status(HttpStatus.UNAUTHORIZED).end();
        }
        const authTokenRegex = auth.match(BEARER_REGEX);
        if (!authTokenRegex) {
            return res.status(HttpStatus.UNAUTHORIZED).end();
        }
        const authToken = authTokenRegex[1];
        if (!REGISTRY_SET.has(authToken)) {
            return res.status(HttpStatus.UNAUTHORIZED).end();
        }
        res.status(HttpStatus.OK)
            .send(RFQT_API_KEY_WHITELIST)
            .end();
    }

    constructor(swapService: SwapService) {
        this._swapService = swapService;
    }

    public async getTokenPricesAsync(req: express.Request, res: express.Response): Promise<void> {
        const symbolOrAddress = (req.query.sellToken as string) || 'WETH';
        const baseAsset = getTokenMetadataIfExists(symbolOrAddress, CHAIN_ID);
        if (!baseAsset) {
            throw new ValidationError([
                {
                    field: 'sellToken',
                    code: ValidationErrorCodes.ValueOutOfRange,
                    reason: `Could not find token ${symbolOrAddress}`,
                },
            ]);
        }
        const { page, perPage } = paginationUtils.parsePaginationConfig(req);
        const unitAmount = new BigNumber(1);
        const tokenPrices = await this._swapService.getTokenPricesAsync(baseAsset, unitAmount, page, perPage);
        res.status(HttpStatus.OK).send(tokenPrices);
    }

    public async getQuoteAsync(req: express.Request, res: express.Response): Promise<void> {
        const params = parseSwapQuoteRequestParams(req, 'quote');
        const quote = await this._getSwapQuoteAsync(params);
        if (params.rfqt !== undefined) {
            logger.info({
                firmQuoteServed: {
                    taker: params.takerAddress,
                    apiKey: params.apiKey,
                    buyToken: params.buyToken,
                    sellToken: params.sellToken,
                    buyAmount: params.buyAmount,
                    sellAmount: params.sellAmount,
                    // makers: quote.orders.map(order => order.makerAddress),
                },
            });
            if (quote.quoteReport && params.rfqt && params.rfqt.intentOnFilling) {
                quoteReportUtils.logQuoteReport({
                    quoteReport: quote.quoteReport,
                    submissionBy: 'taker',
                    decodedUniqueId: quote.decodedUniqueId,
                    buyTokenAddress: quote.buyTokenAddress,
                    sellTokenAddress: quote.sellTokenAddress,
                    buyAmount: params.buyAmount,
                    sellAmount: params.sellAmount,
                });
            }
        }
        const response = _.omit(
            {
                ...quote,
                orders: quote.orders.map((o: any) => _.omit(o, 'fills')),
            },
            'quoteReport',
            'decodedUniqueId',
        );
        const { quoteReport } = quote;
        if (params.includePriceComparisons && quoteReport) {
            const side = params.sellAmount ? MarketOperation.Sell : MarketOperation.Buy;
            const priceComparisons = priceComparisonUtils.getPriceComparisonFromQuote(CHAIN_ID, side, quote);
            response.priceComparisons = priceComparisons?.map(sc => priceComparisonUtils.renameNative(sc));
        }
        res.status(HttpStatus.OK).send(response);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getQuotePriceAsync(req: express.Request, res: express.Response): Promise<void> {
        const params = parseSwapQuoteRequestParams(req, 'price');
        const quote = await this._getSwapQuoteAsync({ ...params, skipValidation: true });
        logger.info({
            indicativeQuoteServed: {
                taker: params.takerAddress,
                apiKey: params.apiKey,
                buyToken: params.buyToken,
                sellToken: params.sellToken,
                buyAmount: params.buyAmount,
                sellAmount: params.sellAmount,
                // makers: quote.orders.map(o => o.makerAddress),
            },
        });

        const response: GetSwapPriceResponse = _.pick(
            quote,
            'price',
            'value',
            'gasPrice',
            'gas',
            'estimatedGas',
            'protocolFee',
            'minimumProtocolFee',
            'buyTokenAddress',
            'buyAmount',
            'sellTokenAddress',
            'sellAmount',
            'sources',
            'allowanceTarget',
            'sellTokenToEthRate',
            'buyTokenToEthRate',
        );
        const { quoteReport } = quote;
        if (params.includePriceComparisons && quoteReport) {
            const marketSide = params.sellAmount ? MarketOperation.Sell : MarketOperation.Buy;
            response.priceComparisons = priceComparisonUtils
                .getPriceComparisonFromQuote(CHAIN_ID, marketSide, quote)
                ?.map(sc => priceComparisonUtils.renameNative(sc));
        }
        res.status(HttpStatus.OK).send(response);
    }

    public async getMarketDepthAsync(req: express.Request, res: express.Response): Promise<void> {
        // NOTE: Internally all ETH trades are for WETH, we just wrap/unwrap automatically
        const buyTokenSymbolOrAddress = isETHSymbolOrAddress(req.query.buyToken as string)
            ? 'WETH'
            : (req.query.buyToken as string);
        const sellTokenSymbolOrAddress = isETHSymbolOrAddress(req.query.sellToken as string)
            ? 'WETH'
            : (req.query.sellToken as string);

        if (buyTokenSymbolOrAddress === sellTokenSymbolOrAddress) {
            throw new ValidationError([
                {
                    field: 'buyToken',
                    code: ValidationErrorCodes.InvalidAddress,
                    reason: `Invalid pair ${sellTokenSymbolOrAddress}/${buyTokenSymbolOrAddress}`,
                },
            ]);
        }
        const response = await this._swapService.calculateMarketDepthAsync({
            buyToken: findTokenAddressOrThrow(buyTokenSymbolOrAddress, CHAIN_ID),
            sellToken: findTokenAddressOrThrow(sellTokenSymbolOrAddress, CHAIN_ID),
            sellAmount: new BigNumber(req.query.sellAmount as string),
            // tslint:disable-next-line:radix custom-no-magic-numbers
            numSamples: req.query.numSamples ? parseInt(req.query.numSamples as string) : MARKET_DEPTH_MAX_SAMPLES,
            sampleDistributionBase: req.query.sampleDistributionBase
                ? parseFloat(req.query.sampleDistributionBase as string)
                : MARKET_DEPTH_DEFAULT_DISTRIBUTION,
            excludedSources:
                req.query.excludedSources === undefined
                    ? []
                    : parseUtils.parseStringArrForERC20BridgeSources((req.query.excludedSources as string).split(',')),
            includedSources:
                req.query.includedSources === undefined
                    ? []
                    : parseUtils.parseStringArrForERC20BridgeSources((req.query.includedSources as string).split(',')),
        });
        res.status(HttpStatus.OK).send(response);
    }

    private async _getSwapQuoteAsync(params: GetSwapQuoteParams): Promise<GetSwapQuoteResponse> {
        try {
            let swapQuote: GetSwapQuoteResponse;
            if (params.isUnwrap) {
                swapQuote = await this._swapService.getSwapQuoteForUnwrapAsync(params);
            } else if (params.isWrap) {
                swapQuote = await this._swapService.getSwapQuoteForWrapAsync(params);
            } else {
                swapQuote = await this._swapService.calculateSwapQuoteAsync(params);
            }
            return swapQuote;
        } catch (e) {
            // If this is already a transformed error then just re-throw
            if (isAPIError(e)) {
                throw e;
            }
            // Wrap a Revert error as an API revert error
            if (isRevertError(e)) {
                throw new RevertAPIError(e);
            }
            const errorMessage: string = e.message;
            // TODO AssetSwapper can throw raw Errors or InsufficientAssetLiquidityError
            if (
                errorMessage.startsWith(SwapQuoterError.InsufficientAssetLiquidity) ||
                errorMessage.startsWith('NO_OPTIMAL_PATH')
            ) {
                throw new ValidationError([
                    {
                        field: params.sellAmount ? 'sellAmount' : 'buyAmount',
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: SwapQuoterError.InsufficientAssetLiquidity,
                    },
                ]);
            }
            if (errorMessage.startsWith(SwapQuoterError.AssetUnavailable)) {
                throw new ValidationError([
                    {
                        field: 'token',
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: e.message,
                    },
                ]);
            }
            logger.info('Uncaught error', e.message, e.stack);
            throw new InternalServerError(e.message);
        }
    }
}

const parseSwapQuoteRequestParams = (req: express.Request, endpoint: 'price' | 'quote'): GetSwapQuoteParams => {
    // HACK typescript typing does not allow this valid json-schema
    schemaUtils.validateSchema(req.query, schemas.swapQuoteRequestSchema as any);
    const apiKey: string | undefined = req.header('0x-api-key');

    // Parse string params
    const { takerAddress, affiliateAddress } = req.query;

    // Parse boolean params and defaults
    // tslint:disable:boolean-naming
    const skipValidation = req.query.skipValidation === undefined ? false : req.query.skipValidation === 'true';
    const includePriceComparisons = req.query.includePriceComparisons === 'true' ? true : false;
    // Whether the entire callers balance should be sold, used for contracts where the
    // amount available is non-deterministic
    const shouldSellEntireBalance = req.query.shouldSellEntireBalance === 'true' ? true : false;
    // tslint:enable:boolean-naming

    // Parse tokens and eth wrap/unwraps
    const sellTokenRaw = req.query.sellToken as string;
    const buyTokenRaw = req.query.buyToken as string;
    const isETHSell = isETHSymbolOrAddress(sellTokenRaw);
    const isETHBuy = isETHSymbolOrAddress(buyTokenRaw);
    // NOTE: Internally all ETH trades are for WETH, we just wrap/unwrap automatically
    const sellToken = findTokenAddressOrThrowApiError(
        isETHSell ? 'WETH' : sellTokenRaw,
        'sellToken',
        CHAIN_ID,
    ).toLowerCase();
    const buyToken = findTokenAddressOrThrowApiError(
        isETHBuy ? 'WETH' : buyTokenRaw,
        'buyToken',
        CHAIN_ID,
    ).toLowerCase();
    const isWrap = isETHSell && isWETHSymbolOrAddress(buyToken, CHAIN_ID);
    const isUnwrap = isWETHSymbolOrAddress(sellToken, CHAIN_ID) && isETHBuy;
    // if token addresses are the same but a unwrap or wrap operation is requested, ignore error
    if (!isUnwrap && !isWrap && sellToken === buyToken) {
        throw new ValidationError(
            ['buyToken', 'sellToken'].map(field => {
                return {
                    field,
                    code: ValidationErrorCodes.RequiredField,
                    reason: 'buyToken and sellToken must be different',
                };
            }),
        );
    }

    // Parse number params
    const sellAmount = req.query.sellAmount === undefined ? undefined : new BigNumber(req.query.sellAmount as string);
    const buyAmount = req.query.buyAmount === undefined ? undefined : new BigNumber(req.query.buyAmount as string);
    const gasPrice = req.query.gasPrice === undefined ? undefined : new BigNumber(req.query.gasPrice as string);
    const slippagePercentage =
        Number.parseFloat(req.query.slippagePercentage as string) || DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE;
    if (slippagePercentage > 1) {
        throw new ValidationError([
            {
                field: 'slippagePercentage',
                code: ValidationErrorCodes.ValueOutOfRange,
                reason: ValidationErrorReasons.PercentageOutOfRange,
            },
        ]);
    }

    // Parse sources
    // tslint:disable-next-line: boolean-naming
    const { excludedSources, includedSources, nativeExclusivelyRFQT } = parseUtils.parseRequestForExcludedSources(
        {
            excludedSources: req.query.excludedSources as string | undefined,
            includedSources: req.query.includedSources as string | undefined,
            intentOnFilling: req.query.intentOnFilling as string | undefined,
            takerAddress: takerAddress as string,
            apiKey,
        },
        RFQT_API_KEY_WHITELIST,
        endpoint,
    );

    // Determine if any other sources should be excluded. This usually has an effect
    // if an API key is not present, or the API key is ineligible for PLP.
    const updatedExcludedSources = serviceUtils.determineExcludedSources(
        excludedSources,
        apiKey,
        PLP_API_KEY_WHITELIST,
    );

    const isAllExcluded = Object.values(ERC20BridgeSource).every(s => updatedExcludedSources.includes(s));
    if (isAllExcluded) {
        throw new ValidationError([
            {
                field: 'excludedSources',
                code: ValidationErrorCodes.ValueOutOfRange,
                reason: 'Request excluded all sources',
            },
        ]);
    }

    // Log the request if it passes all validations
    logger.info({
        type: 'swapRequest',
        endpoint,
        updatedExcludedSources,
        nativeExclusivelyRFQT,
        apiKey: apiKey || 'N/A',
    });

    const rfqt:
        | Pick<RfqtRequestOpts, 'intentOnFilling' | 'isIndicative' | 'nativeExclusivelyRFQT'>
        | undefined = (() => {
        if (apiKey) {
            if (endpoint === 'quote' && takerAddress) {
                return {
                    intentOnFilling: req.query.intentOnFilling === 'true',
                    isIndicative: false,
                    nativeExclusivelyRFQT,
                };
            } else if (endpoint === 'price') {
                return {
                    intentOnFilling: false,
                    isIndicative: true,
                    nativeExclusivelyRFQT,
                };
            }
        }
        return undefined;
    })();

    const affiliateFee = parseUtils.parseAffiliateFeeOptions(req);

    return {
        takerAddress: takerAddress as string,
        sellToken,
        buyToken,
        sellAmount,
        buyAmount,
        slippagePercentage,
        gasPrice,
        excludedSources: updatedExcludedSources,
        includedSources,
        affiliateAddress: affiliateAddress as string,
        rfqt,
        skipValidation,
        apiKey,
        affiliateFee,
        includePriceComparisons,
        shouldSellEntireBalance,
        isMetaTransaction: false,
        isETHSell,
        isETHBuy,
        isUnwrap,
        isWrap,
    };
};
