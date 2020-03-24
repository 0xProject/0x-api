import {
    ExtensionContractType,
    Orderbook,
    SwapQuoteConsumer,
    SwapQuoter,
} from '@0x/asset-swapper';
import { SupportedProvider } from '@0x/order-utils';
import { BigNumber, decodeThrownErrorAsRevertError, RevertError } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';

import { ASSET_SWAPPER_MARKET_ORDERS_OPTS, CHAIN_ID } from '../config';
import { QUOTE_ORDER_EXPIRATION_BUFFER_MS } from '../constants';
import { CalculateSwapQuoteParams, GetSwapQuoteResponse } from '../types';
import { serviceUtils } from '../utils/service_utils';

export class SignerService {
    private readonly _provider: SupportedProvider;
    private readonly _web3Wrapper: Web3Wrapper;
    constructor(provider: SupportedProvider) {
        this._provider = provider;
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
        const attributedSwapQuote = serviceUtils.attributeSwapQuoteOrders(swapQuote);
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

        let gas;
        if (from) {
            // Force a revert error if the takerAddress does not have enough ETH.
            const txDataValue = extensionContractType === ExtensionContractType.Forwarder
                ? BigNumber.min(value, await this._web3Wrapper.getBalanceInWeiAsync(from))
                : value;
            gas = await this._estimateGasOrThrowRevertErrorAsync({
                to,
                data,
                from,
                value: txDataValue,
                gasPrice,
            });
        }

        const buyTokenDecimals = await serviceUtils.fetchTokenDecimalsIfRequiredAsync(buyTokenAddress, this._web3Wrapper);
        const sellTokenDecimals = await serviceUtils.fetchTokenDecimalsIfRequiredAsync(sellTokenAddress, this._web3Wrapper);
        const unitMakerAssetAmount = Web3Wrapper.toUnitAmount(makerAssetAmount, buyTokenDecimals);
        const unitTakerAssetAMount = Web3Wrapper.toUnitAmount(totalTakerAssetAmount, sellTokenDecimals);
        const price =
            buyAmount === undefined
                ? unitMakerAssetAmount.dividedBy(unitTakerAssetAMount).decimalPlaces(sellTokenDecimals)
                : unitTakerAssetAMount.dividedBy(unitMakerAssetAmount).decimalPlaces(buyTokenDecimals);

        const apiSwapQuote: GetSwapQuoteResponse = {
            price,
            to,
            data,
            value,
            gas,
            from,
            gasPrice,
            protocolFee,
            buyTokenAddress,
            sellTokenAddress,
            buyAmount: makerAssetAmount,
            sellAmount: totalTakerAssetAmount,
            sources: serviceUtils.convertSourceBreakdownToArray(sourceBreakdown),
            orders: serviceUtils.cleanSignedOrderFields(orders),
        };
        return apiSwapQuote;
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
