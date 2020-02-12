import {
    ERC20BridgeSource,
    ExtensionContractType,
    MarketBuySwapQuote,
    MarketSellSwapQuote,
    Orderbook,
    SignedOrder,
    SwapQuoteConsumer,
    SwapQuoteOrdersBreakdown,
    SwapQuoter,
} from '@0x/asset-swapper';
import { assetDataUtils, SupportedProvider } from '@0x/order-utils';
import { AbiEncoder, BigNumber, decodeThrownErrorAsRevertError, RevertError } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { ASSET_SWAPPER_MARKET_ORDERS_OPTS, CHAIN_ID, FEE_RECIPIENT_ADDRESS } from '../config';
import { DEFAULT_TOKEN_DECIMALS, PERCENTAGE_SIG_DIGITS, QUOTE_ORDER_EXPIRATION_BUFFER_MS, ZERO } from '../constants';
import { logger } from '../logger';
import { TokenMetadatasForChains } from '../token_metadatas_for_networks';
import { CalculateSwapQuoteParams, GetSwapQuoteResponse, GetSwapQuoteResponseLiquiditySource } from '../types';
import { orderUtils } from '../utils/order_utils';
import { findTokenDecimalsIfExists } from '../utils/token_metadata_utils';

export class SwapService {
    private readonly _provider: SupportedProvider;
    private readonly _swapQuoter: SwapQuoter;
    private readonly _swapQuoteConsumer: SwapQuoteConsumer;
    private readonly _web3Wrapper: Web3Wrapper;
    constructor(orderbook: Orderbook, provider: SupportedProvider) {
        this._provider = provider;
        const swapQuoterOpts = {
            chainId: CHAIN_ID,
            expiryBufferMs: QUOTE_ORDER_EXPIRATION_BUFFER_MS,
        };
        this._swapQuoter = new SwapQuoter(this._provider, orderbook, swapQuoterOpts);
        this._swapQuoteConsumer = new SwapQuoteConsumer(this._provider, swapQuoterOpts);
        this._web3Wrapper = new Web3Wrapper(this._provider);
    }
    public async calculateSwapQuoteAsync(params: CalculateSwapQuoteParams): Promise<GetSwapQuoteResponse> {
        let swapQuote;
        const {
            sellAmount,
            buyAmount,
            buyTokenAddress,
            sellTokenAddress,
            slippagePercentage,
            gasPrice: providedGasPrice,
            isETHSell,
            from,
            excludedSources,
            affiliateAddress,
        } = params;
        const assetSwapperOpts = {
            slippagePercentage,
            gasPrice: providedGasPrice,
            ...ASSET_SWAPPER_MARKET_ORDERS_OPTS,
            excludedSources, // TODO(dave4506): overrides the excluded sources selected by chainId
        };
        if (sellAmount !== undefined) {
            swapQuote = await this._swapQuoter.getMarketSellSwapQuoteAsync(
                buyTokenAddress,
                sellTokenAddress,
                sellAmount,
                assetSwapperOpts,
            );
        } else if (buyAmount !== undefined) {
            swapQuote = await this._swapQuoter.getMarketBuySwapQuoteAsync(
                buyTokenAddress,
                sellTokenAddress,
                buyAmount,
                assetSwapperOpts,
            );
        } else {
            throw new Error('sellAmount or buyAmount required');
        }
        const attributedSwapQuote = this._attributeSwapQuoteOrders(swapQuote);
        const {
            makerAssetAmount,
            totalTakerAssetAmount,
            protocolFeeInWeiAmount: protocolFee,
        } = attributedSwapQuote.bestCaseQuoteInfo;
        const { orders, gasPrice, sourceBreakdown } = attributedSwapQuote;

        // If ETH was specified as the token to sell then we use the Forwarder
        const extensionContractType = isETHSell ? ExtensionContractType.Forwarder : ExtensionContractType.None;
        const {
            calldataHexString: data,
            ethAmount: value,
            toAddress: to,
        } = await this._swapQuoteConsumer.getCalldataOrThrowAsync(attributedSwapQuote, {
            useExtensionContract: extensionContractType,
        });

        const affiliatedData = this._attributeCallData(data, affiliateAddress);

        let gas;
        if (from) {
            // Force a revert error if the takerAddress does not have enough ETH.
            const txDataValue = extensionContractType === ExtensionContractType.Forwarder
                ? BigNumber.min(value, await this._web3Wrapper.getBalanceInWeiAsync(from))
                : value;
            gas = await this._estimateGasOrThrowRevertErrorAsync({
                to,
                data: affiliatedData,
                from,
                value: txDataValue,
                gasPrice,
            });
        }

        const buyTokenDecimals = await this._fetchTokenDecimalsIfRequiredAsync(buyTokenAddress);
        const sellTokenDecimals = await this._fetchTokenDecimalsIfRequiredAsync(sellTokenAddress);
        const unitMakerAssetAmount = Web3Wrapper.toUnitAmount(makerAssetAmount, buyTokenDecimals);
        const unitTakerAssetAMount = Web3Wrapper.toUnitAmount(totalTakerAssetAmount, sellTokenDecimals);
        const price =
            buyAmount === undefined
                ? unitMakerAssetAmount.dividedBy(unitTakerAssetAMount).decimalPlaces(sellTokenDecimals)
                : unitTakerAssetAMount.dividedBy(unitMakerAssetAmount).decimalPlaces(buyTokenDecimals);

        const apiSwapQuote: GetSwapQuoteResponse = {
            price,
            to,
            data: affiliatedData,
            value,
            gas,
            from,
            gasPrice,
            protocolFee,
            buyTokenAddress,
            sellTokenAddress,
            buyAmount: makerAssetAmount,
            sellAmount: totalTakerAssetAmount,
            sources: this._convertSourceBreakdownToArray(sourceBreakdown),
            orders: this._cleanSignedOrderFields(orders),
        };
        return apiSwapQuote;
    }
    public async getTokenPricesAsync(): Promise<Array<{ symbol: string; price: BigNumber }>> {
        const baseAssetSymbol = 'WETH';
        const unitAmount = new BigNumber(1);
        const baseAsset = TokenMetadatasForChains.find(m => m.symbol === baseAssetSymbol);
        if (!baseAsset) {
            throw new Error('Invalid Base Asset');
        }
        const takerAssetData = assetDataUtils.encodeERC20AssetData(baseAsset.tokenAddresses[CHAIN_ID]); // WETH
        const queryAssetData = TokenMetadatasForChains.filter(m => m.symbol !== baseAssetSymbol);
        // tslint:disable-next-line:custom-no-magic-numbers
        const tokenMetadataChunks = _.chunk(queryAssetData, 30);
        const allResults = _.flatten(
            await Promise.all(
                tokenMetadataChunks.map(async chunk => {
                    const makerAssetDatas = chunk.map(m =>
                        assetDataUtils.encodeERC20AssetData(m.tokenAddresses[CHAIN_ID]),
                    );
                    const amounts = chunk.map(m => Web3Wrapper.toBaseUnitAmount(unitAmount, m.decimals));
                    return this._swapQuoter.getBatchMarketBuySwapQuoteForAssetDataAsync(
                        makerAssetDatas,
                        takerAssetData,
                        amounts,
                        { slippagePercentage: 0 },
                    );
                }),
            ),
        );
        const prices = allResults.map((quote, i) => {
            if (!quote) {
                return { symbol: queryAssetData[i].symbol, price: ZERO };
            }
            const buyTokenDecimals = queryAssetData[i].decimals;
            const sellTokenDecimals = baseAsset.decimals;
            const { makerAssetAmount, totalTakerAssetAmount } = quote.bestCaseQuoteInfo;
            const makerAssetUnitAmount = Web3Wrapper.toUnitAmount(makerAssetAmount, buyTokenDecimals);
            const takerAssetUnitAmount = Web3Wrapper.toUnitAmount(totalTakerAssetAmount, sellTokenDecimals);
            const price = makerAssetUnitAmount.dividedBy(takerAssetUnitAmount).decimalPlaces(sellTokenDecimals);
            return {
                symbol: queryAssetData[i].symbol,
                price,
            };
        });
        return prices;
    }
    // tslint:disable-next-line: prefer-function-over-method
    private _convertSourceBreakdownToArray(sourceBreakdown: SwapQuoteOrdersBreakdown): GetSwapQuoteResponseLiquiditySource[] {
        const breakdown: GetSwapQuoteResponseLiquiditySource[] = [];
        return Object.entries(sourceBreakdown).reduce((acc: GetSwapQuoteResponseLiquiditySource[], [source, percentage]) => {
            return [...acc, {
                name: source === ERC20BridgeSource.Native ? '0x' : source,
                proportion: new BigNumber(percentage.toPrecision(PERCENTAGE_SIG_DIGITS)),
            }];
        }, breakdown);
    }
    private async _estimateGasOrThrowRevertErrorAsync(txData: Partial<TxData>): Promise<BigNumber> {
        // Perform this concurrently
        // if the call fails the gas estimation will also fail, we can throw a more helpful
        // error message than gas estimation failure
        const estimateGasPromise = this._web3Wrapper.estimateGasAsync(txData);
        await this._throwIfCallIsRevertErrorAsync(txData);
        const gas = await estimateGasPromise;
        return new BigNumber(gas);
    }

    // tslint:disable-next-line:prefer-function-over-method
    private _attributeSwapQuoteOrders(
        swapQuote: MarketSellSwapQuote | MarketBuySwapQuote,
    ): MarketSellSwapQuote | MarketBuySwapQuote {
        // Where possible, attribute any fills of these orders to the Fee Recipient Address
        const attributedOrders = swapQuote.orders.map(o => {
            try {
                const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(o.makerAssetData);
                if (orderUtils.isBridgeAssetData(decodedAssetData)) {
                    return {
                        ...o,
                        feeRecipientAddress: FEE_RECIPIENT_ADDRESS,
                    };
                }
                // tslint:disable-next-line:no-empty
            } catch (err) {}
            // Default to unmodified order
            return o;
        });
        const attributedSwapQuote = {
            ...swapQuote,
            orders: attributedOrders,
        };
        return attributedSwapQuote;
    }

    // tslint:disable-next-line:prefer-function-over-method
    private _attributeCallData(data: string, affiliateAddress?: string): string {
        const affiliateAddressOrDefault = affiliateAddress ? affiliateAddress : FEE_RECIPIENT_ADDRESS;
        const affiliateCallDataEncoder = new AbiEncoder.Method({
            constant: true,
            outputs: [],
            name: 'ZeroExAPIAffiliate',
            inputs: [{ name: '', type: 'address' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        });
        const encodedAffiliateData = affiliateCallDataEncoder.encode([affiliateAddressOrDefault]);
        const affiliatedData = `${data}${encodedAffiliateData.slice(2)}`;
        return affiliatedData;
    }

    // tslint:disable-next-line:prefer-function-over-method
    private _cleanSignedOrderFields(orders: SignedOrder[]): SignedOrder[] {
        return orders.map(o => ({
            chainId: o.chainId,
            exchangeAddress: o.exchangeAddress,
            makerAddress: o.makerAddress,
            takerAddress: o.takerAddress,
            feeRecipientAddress: o.feeRecipientAddress,
            senderAddress: o.senderAddress,
            makerAssetAmount: o.makerAssetAmount,
            takerAssetAmount: o.takerAssetAmount,
            makerFee: o.makerFee,
            takerFee: o.takerFee,
            expirationTimeSeconds: o.expirationTimeSeconds,
            salt: o.salt,
            makerAssetData: o.makerAssetData,
            takerAssetData: o.takerAssetData,
            makerFeeAssetData: o.makerFeeAssetData,
            takerFeeAssetData: o.takerFeeAssetData,
            signature: o.signature,
        }));
    }
    private async _fetchTokenDecimalsIfRequiredAsync(tokenAddress: string): Promise<number> {
        // HACK(dekz): Our ERC20Wrapper does not have decimals as it is optional
        // so we must encode this ourselves
        let decimals = findTokenDecimalsIfExists(tokenAddress, CHAIN_ID);
        if (!decimals) {
            const decimalsEncoder = new AbiEncoder.Method({
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [{ name: '', type: 'uint8' }],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            });
            const encodedCallData = decimalsEncoder.encode(tokenAddress);
            try {
                const result = await this._web3Wrapper.callAsync({ data: encodedCallData, to: tokenAddress });
                decimals = decimalsEncoder.strictDecodeReturnValue<BigNumber>(result).toNumber();
                logger.info(`Unmapped token decimals ${tokenAddress} ${decimals}`);
            } catch (err) {
                logger.error(`Error fetching token decimals ${tokenAddress}`);
                decimals = DEFAULT_TOKEN_DECIMALS;
            }
        }
        return decimals;
    }
    private async _throwIfCallIsRevertErrorAsync(txData: Partial<TxData>): Promise<void> {
        let callResult;
        let revertError;
        try {
            callResult = await this._web3Wrapper.callAsync(txData);
        } catch (e) {
            // RPCSubprovider can throw if .error exists on the response payload
            // This `error` response occurs from Parity nodes (incl Alchemy) but not on INFURA (geth)
            revertError = decodeThrownErrorAsRevertError(e);
            throw revertError;
        }
        try {
            revertError = RevertError.decode(callResult, false);
        } catch (e) {
            // No revert error
        }
        if (revertError) {
            throw revertError;
        }
    }
}
