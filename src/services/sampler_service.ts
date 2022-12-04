import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import * as _ from 'lodash';

import { AssetSwapperContractAddresses, MarketOperation } from '../asset-swapper/types';
import {
    BUY_SOURCE_FILTER_BY_CHAIN_ID,
    FEE_QUOTE_SOURCES_BY_CHAIN_ID,
    NATIVE_FEE_TOKEN_AMOUNT_BY_CHAIN_ID,
    NATIVE_FEE_TOKEN_BY_CHAIN_ID,
    SELL_SOURCE_FILTER_BY_CHAIN_ID,
} from '../asset-swapper/utils/market_operation_utils/constants';
import { DexOrderSampler, getSampleAmounts } from '../asset-swapper/utils/market_operation_utils/sampler';
import { SourceFilters } from '../asset-swapper/utils/market_operation_utils/source_filters';
import {
    ERC20BridgeSource,
    FeeSchedule,
    MarketSideLiquidity,
} from '../asset-swapper/utils/market_operation_utils/types';

export class SamplerService {
    private readonly _sellSources: SourceFilters;
    private readonly _buySources: SourceFilters;
    private readonly _feeSources: SourceFilters;
    private readonly _nativeFeeToken: string;
    private readonly _nativeFeeTokenAmount: BigNumber;

    constructor(
        private readonly _sampler: DexOrderSampler,
        private readonly contractAddresses: AssetSwapperContractAddresses,
    ) {
        this._buySources = BUY_SOURCE_FILTER_BY_CHAIN_ID[_sampler.chainId];
        this._sellSources = SELL_SOURCE_FILTER_BY_CHAIN_ID[_sampler.chainId];
        this._feeSources = new SourceFilters(FEE_QUOTE_SOURCES_BY_CHAIN_ID[_sampler.chainId]);
        this._nativeFeeToken = NATIVE_FEE_TOKEN_BY_CHAIN_ID[_sampler.chainId];
        this._nativeFeeTokenAmount = NATIVE_FEE_TOKEN_AMOUNT_BY_CHAIN_ID[_sampler.chainId];
    }

    public async getSamplesAsync(input: {
        side: MarketOperation;
        inputAmount: BigNumber;
        makerToken: string;
        takerToken: string;
        feeSchedule: FeeSchedule;
        includedSources: ERC20BridgeSource[];
        excludedSources: ERC20BridgeSource[];
        includedFeeSources: ERC20BridgeSource[];
        excludedFeeSources: ERC20BridgeSource[];
        txOrigin?: string;
    }): Promise<MarketSideLiquidity> {
        const {
            side,
            inputAmount,
            makerToken,
            takerToken,
            feeSchedule,
            includedSources,
            excludedSources,
            includedFeeSources,
            excludedFeeSources,
            txOrigin,
        } = input;

        // Define sampling granularity
        const numSamples = 13;
        const sampleAmounts = getSampleAmounts(inputAmount, numSamples);

        // Get sources we'll sample for fees
        const feeSources = this._feeSources.exclude(excludedFeeSources).include(includedFeeSources).sources;

        // Get sources we'll sample for liquidity
        const startingSources = side === MarketOperation.Sell ? this._sellSources : this._buySources;
        const sourceFilters = startingSources.exclude(excludedSources).include(includedSources);
        const sources = sourceFilters.sources;

        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            this._sampler.getBlockNumber(),
            this._sampler.getGasLeft(),
            this._sampler.getTokenDecimals([makerToken, takerToken]),
            // Get ETH -> maker token price.
            this._sampler.getBestNativeTokenSellRate(
                feeSources,
                makerToken,
                this._nativeFeeToken,
                this._nativeFeeTokenAmount,
                feeSchedule,
            ),
            // Get ETH -> taker token price.
            this._sampler.getBestNativeTokenSellRate(
                feeSources,
                takerToken,
                this._nativeFeeToken,
                this._nativeFeeTokenAmount,
                feeSchedule,
            ),
            // Get quotes for taker -> maker.
            side === MarketOperation.Sell
                ? this._sampler.getSellQuotes(sources, makerToken, takerToken, sampleAmounts)
                : this._sampler.getBuyQuotes(sources, makerToken, takerToken, sampleAmounts),
            this._sampler.getTwoHopSellQuotes(
                sourceFilters.isAllowed(ERC20BridgeSource.MultiHop) ? sources : [],
                makerToken,
                takerToken,
                [inputAmount],
            ),
            this._sampler.isAddressContract(txOrigin || NULL_ADDRESS),
            this._sampler.getGasLeft(),
        );

        // Refresh the cached pools asynchronously if required
        this._refreshPoolCacheIfRequiredAsync(takerToken, makerToken);

        const [
            blockNumber,
            gasBefore,
            tokenDecimals,
            ethToMakerAssetRate,
            ethToTakerAssetRate,
            dexQuotes,
            rawTwoHopQuotes,
            isTxOriginContract,
            gasAfter,
        ] = await samplerPromise;

        const [makerTokenDecimals, takerTokenDecimals] = tokenDecimals;

        // Filter out any invalid two hop quotes where we couldn't find a route
        const twoHopQuotes = rawTwoHopQuotes.filter(
            (q) => q && q.fillData && q.fillData.firstHopSource && q.fillData.secondHopSource,
        );

        if (side === MarketOperation.Sell) {
            return {
                side: MarketOperation.Sell,
                inputAmount,
                inputToken: takerToken, // Note this is the opposite of Buys
                inputAmountPerEth: ethToTakerAssetRate,
                outputToken: makerToken,
                outputAmountPerEth: ethToMakerAssetRate,
                quoteSourceFilters: sourceFilters,
                makerTokenDecimals: makerTokenDecimals.toNumber(),
                takerTokenDecimals: takerTokenDecimals.toNumber(),
                quotes: {
                    nativeOrders: [], // TODO
                    rfqtIndicativeQuotes: [],
                    twoHopQuotes,
                    dexQuotes,
                },
                isRfqSupported: false, // TODO
                blockNumber: blockNumber.toNumber(),
            };
        } else {
            return {
                side: MarketOperation.Buy,
                inputAmount,
                inputToken: makerToken, // Note this is the opposite of Sells
                inputAmountPerEth: ethToMakerAssetRate,
                outputToken: takerToken,
                outputAmountPerEth: ethToTakerAssetRate,
                quoteSourceFilters: sourceFilters,
                makerTokenDecimals: makerTokenDecimals.toNumber(),
                takerTokenDecimals: takerTokenDecimals.toNumber(),
                quotes: {
                    nativeOrders: [], // TODO
                    rfqtIndicativeQuotes: [],
                    twoHopQuotes,
                    dexQuotes,
                },
                isRfqSupported: false, // TODO
                blockNumber: blockNumber.toNumber(),
            };
        }
    }

    private async _refreshPoolCacheIfRequiredAsync(takerToken: string, makerToken: string): Promise<void> {
        _.values(this._sampler.poolsCaches)
            .filter((cache) => cache !== undefined && !cache.isFresh(takerToken, makerToken))
            .forEach((cache) => cache?.getFreshPoolsForPairAsync(takerToken, makerToken));
    }
}
