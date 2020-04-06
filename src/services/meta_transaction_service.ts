import { SwapQuoter } from '@0x/asset-swapper';
import { ContractWrappers } from '@0x/contract-wrappers';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { generatePseudoRandomSalt, SupportedProvider, ZeroExTransaction } from '@0x/order-utils';
import { RedundantSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { ASSET_SWAPPER_MARKET_ORDERS_OPTS, CHAIN_ID, ETHEREUM_RPC_URL, MESH_WEBSOCKET_URI } from '../config';
import { ONE_SECOND_MS, TEN_MINUTES_MS } from '../constants';
import { CalculateMetaTransactionQuoteParams, GetMetaTransactionQuoteResponse } from '../types';
import { serviceUtils } from '../utils/service_utils';

export class MetaTransactionService {
    private readonly _provider: SupportedProvider;
    private readonly _swapQuoter: SwapQuoter;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;

    private static _createWeb3Provider(rpcHost: string): SupportedProvider {
        const WEB3_RPC_RETRY_COUNT = 3;
        const providerEngine = new Web3ProviderEngine();
        const rpcSubproviders = MetaTransactionService._range(WEB3_RPC_RETRY_COUNT).map(
            (_index: number) => new RPCSubprovider(rpcHost),
        );
        providerEngine.addProvider(new RedundantSubprovider(rpcSubproviders));
        providerUtils.startProviderEngine(providerEngine);
        return providerEngine;
    }
    private static _range(rangeCount: number): number[] {
        return [...Array(rangeCount).keys()];
    }
    constructor() {
        this._provider = MetaTransactionService._createWeb3Provider(ETHEREUM_RPC_URL);
        const swapQuoterOpts = {
            chainId: CHAIN_ID,
        };
        this._swapQuoter = SwapQuoter.getSwapQuoterForMeshEndpoint(this._provider, MESH_WEBSOCKET_URI, swapQuoterOpts);
        this._contractWrappers = new ContractWrappers(this._provider, { chainId: CHAIN_ID });
        this._web3Wrapper = new Web3Wrapper(this._provider);
    }
    public async calculateMetaTransactionQuoteAsync(
        params: CalculateMetaTransactionQuoteParams,
    ): Promise<GetMetaTransactionQuoteResponse> {
        const { takerAddress, sellAmount, buyAmount, buyTokenAddress, sellTokenAddress, slippagePercentage, excludedSources } = params;

        const assetSwapperOpts = {
            ...ASSET_SWAPPER_MARKET_ORDERS_OPTS,
            slippagePercentage,
            bridgeSlippage: slippagePercentage,
            excludedSources, // TODO(dave4506): overrides the excluded sources selected by chainId
        };

        let swapQuote;
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

        const makerAssetAmount = swapQuote.bestCaseQuoteInfo.makerAssetAmount;
        const totalTakerAssetAmount = swapQuote.bestCaseQuoteInfo.totalTakerAssetAmount;
        const gasPrice = swapQuote.gasPrice;
        const attributedSwapQuote = serviceUtils.attributeSwapQuoteOrders(swapQuote);
        const orders = attributedSwapQuote.orders;
        const signatures = orders.map(order => order.signature);

        const devUtils = new DevUtilsContract(this._contractWrappers.contractAddresses.devUtils, this._provider);

        const zeroExTransaction = this._generateZeroExTransaction(
            orders,
            sellAmount,
            buyAmount,
            signatures,
            takerAddress,
            gasPrice,
        );

        // use the DevUtils contract to generate the transaction hash
        const zeroExTransactionHash = await devUtils
            .getTransactionHash(
                zeroExTransaction,
                new BigNumber(CHAIN_ID),
                this._contractWrappers.contractAddresses.exchange,
            )
            .callAsync();

        const buyTokenDecimals = await serviceUtils.fetchTokenDecimalsIfRequiredAsync(
            buyTokenAddress,
            this._web3Wrapper,
        );
        const sellTokenDecimals = await serviceUtils.fetchTokenDecimalsIfRequiredAsync(
            sellTokenAddress,
            this._web3Wrapper,
        );
        const unitMakerAssetAmount = Web3Wrapper.toUnitAmount(makerAssetAmount, buyTokenDecimals);
        const unitTakerAssetAMount = Web3Wrapper.toUnitAmount(totalTakerAssetAmount, sellTokenDecimals);
        const price =
            buyAmount === undefined
                ? unitMakerAssetAmount.dividedBy(unitTakerAssetAMount).decimalPlaces(sellTokenDecimals)
                : unitTakerAssetAMount.dividedBy(unitMakerAssetAmount).decimalPlaces(buyTokenDecimals);

        const apiMetaTransactionQuote: GetMetaTransactionQuoteResponse = {
            price,
            zeroExTransactionHash,
            zeroExTransaction,
            buyAmount: makerAssetAmount,
            sellAmount: totalTakerAssetAmount,
            orders: serviceUtils.cleanSignedOrderFields(orders),
        };
        return apiMetaTransactionQuote;
    }
    private _generateZeroExTransaction(
        orders: SignedOrder[],
        sellAmount: BigNumber | undefined,
        buyAmount: BigNumber | undefined,
        signatures: string[],
        takerAddress: string,
        gasPrice: BigNumber,
    ): ZeroExTransaction {
        // generate txData for marketSellOrdersFillOrKill or marketBuyOrdersFillOrKill
        let txData;
        if (sellAmount !== undefined) {
            txData = this._contractWrappers.exchange
                .marketSellOrdersFillOrKill(orders, sellAmount, signatures)
                .getABIEncodedTransactionData();
        } else if (buyAmount !== undefined) {
            txData = this._contractWrappers.exchange
                .marketBuyOrdersFillOrKill(orders, buyAmount, signatures)
                .getABIEncodedTransactionData();
        } else {
            throw new Error('sellAmount or buyAmount required');
        }

        // generate the zeroExTransaction object
        const expirationTimeSeconds = new BigNumber(Date.now() + TEN_MINUTES_MS)
            .div(ONE_SECOND_MS)
            .integerValue(BigNumber.ROUND_CEIL);
        const zeroExTransaction: ZeroExTransaction = {
            data: txData,
            salt: generatePseudoRandomSalt(),
            signerAddress: takerAddress,
            gasPrice,
            expirationTimeSeconds,
            domain: {
                chainId: CHAIN_ID,
                verifyingContract: this._contractWrappers.contractAddresses.exchange,
            },
        };
        return zeroExTransaction;
    }
}
