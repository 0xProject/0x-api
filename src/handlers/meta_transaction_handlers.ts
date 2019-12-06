import { SwapQuoter } from '@0x/asset-swapper';
import { ContractWrappers } from '@0x/contract-wrappers';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { generatePseudoRandomSalt, ZeroExTransaction } from '@0x/order-utils';
import { RedundantSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider } from 'ethereum-types';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';
import * as _ from 'lodash';

import { CHAIN_ID, ETHEREUM_RPC_URL, MESH_WEBSOCKET_URI } from '../config';
import { ONE_SECOND_MS, TEN_MINUTES_MS } from '../constants';
import { OrderBookService } from '../services/orderbook_service';
import { findTokenAddress } from '../utils/token_metadata_utils';

export class MetaTransactionHandlers {
    // private readonly _orderBook: OrderBookService;
    private readonly _provider: SupportedProvider;
    private readonly _swapQuoter: SwapQuoter;
    private readonly _contractWrappers: ContractWrappers;
    constructor(_orderBookService: OrderBookService) {
        this._provider = createWeb3Provider(ETHEREUM_RPC_URL);
        const swapQuoterOpts = {
            chainId: CHAIN_ID,
        };
        this._swapQuoter = SwapQuoter.getSwapQuoterForMeshEndpoint(this._provider, MESH_WEBSOCKET_URI, swapQuoterOpts);
        this._contractWrappers = new ContractWrappers(this._provider, { chainId: CHAIN_ID });
    }
    public async getTransactionAsync(req: express.Request, res: express.Response): Promise<void> {
        // parse query params
        const { takerAddress, sellToken, buyToken, sellAmount, buyAmount } = parseGetTransactionRequestParams(req);
        const sellTokenAddress = findTokenAddress(sellToken, CHAIN_ID);
        const buyTokenAddress = findTokenAddress(buyToken, CHAIN_ID);
        // generate txData for marketSellOrdersFillOrKill or marketBuyOrdersFillOrKill
        let txData;
        if (sellAmount !== undefined) {
            const marketSellSwapQuote = await this._swapQuoter.getMarketSellSwapQuoteAsync(
                buyTokenAddress,
                sellTokenAddress,
                sellAmount,
            );
            const orders = marketSellSwapQuote.orders;
            const signatures = orders.map(order => order.signature);
            txData = this._contractWrappers.exchange
                .marketSellOrdersFillOrKill(orders, sellAmount, signatures)
                .getABIEncodedTransactionData();
        } else if (buyAmount !== undefined) {
            const marketBuySwapQuote = await this._swapQuoter.getMarketBuySwapQuoteAsync(
                buyTokenAddress,
                sellTokenAddress,
                buyAmount,
            );
            const orders = marketBuySwapQuote.orders;
            const signatures = orders.map(order => order.signature);
            txData = this._contractWrappers.exchange
                .marketBuyOrdersFillOrKill(orders, buyAmount, signatures)
                .getABIEncodedTransactionData();
        } else {
            throw new Error('sellAmount or buyAmount required');
        }
        // generate the zeroExTransaction object
        const takerTransactionSalt = generatePseudoRandomSalt();
        const gasPrice = new BigNumber(40000000000); // 40 gwei
        const expirationTimeSeconds = new BigNumber(Date.now() + TEN_MINUTES_MS)
            .div(ONE_SECOND_MS)
            .integerValue(BigNumber.ROUND_CEIL);
        const zeroExTransaction: ZeroExTransaction = {
            data: txData,
            salt: takerTransactionSalt,
            signerAddress: takerAddress,
            gasPrice,
            expirationTimeSeconds,
            domain: {
                chainId: CHAIN_ID,
                verifyingContract: this._contractWrappers.contractAddresses.exchange,
            },
        };
        // use the DevUtils contract to generate the transaction hash
        const devUtils = new DevUtilsContract(this._contractWrappers.contractAddresses.devUtils, this._provider);
        const transactionHash = await devUtils
            .getTransactionHash(
                zeroExTransaction,
                new BigNumber(CHAIN_ID),
                this._contractWrappers.contractAddresses.exchange,
            )
            .callAsync();
        // return the transaction object and hash
        res.status(HttpStatus.OK).send({
            transactionHash,
            zeroExTransaction,
        });
    }
    public async postTransactionAsync(_req: express.Request, _res: express.Response): Promise<void> {
        // const signedOrder = unmarshallOrder(req.body);
        // if (WHITELISTED_TOKENS !== '*') {
        //     const allowedTokens: string[] = WHITELISTED_TOKENS;
        //     validateAssetDataIsWhitelistedOrThrow(allowedTokens, signedOrder.makerAssetData, 'makerAssetData');
        //     validateAssetDataIsWhitelistedOrThrow(allowedTokens, signedOrder.takerAssetData, 'takerAssetData');
        // }
        // await this._orderBook.addOrderAsync(signedOrder);
        // res.status(HttpStatus.OK).send();
        console.log('POST /transaction');
    }
}

interface GetTransactionRequestParams {
    takerAddress: string;
    sellToken: string;
    buyToken: string;
    sellAmount?: BigNumber;
    buyAmount?: BigNumber;
}
const parseGetTransactionRequestParams = (req: express.Request): GetTransactionRequestParams => {
    const takerAddress = req.query.takerAddress;
    const sellToken = req.query.sellToken;
    const buyToken = req.query.buyToken;
    const sellAmount = req.query.sellAmount === undefined ? undefined : new BigNumber(req.query.sellAmount);
    const buyAmount = req.query.buyAmount === undefined ? undefined : new BigNumber(req.query.buyAmount);
    return { takerAddress, sellToken, buyToken, sellAmount, buyAmount };
};

const range = (rangeCount: number): number[] => [...Array(rangeCount).keys()];
const createWeb3Provider = (rpcHost: string): SupportedProvider => {
    const WEB3_RPC_RETRY_COUNT = 3;
    const providerEngine = new Web3ProviderEngine();
    // providerEngine.addProvider(new PrivateKeyWalletSubprovider(privateKey.replace('0x', '')));
    const rpcSubproviders = range(WEB3_RPC_RETRY_COUNT).map((_index: number) => new RPCSubprovider(rpcHost));
    providerEngine.addProvider(new RedundantSubprovider(rpcSubproviders));
    providerUtils.startProviderEngine(providerEngine);
    return providerEngine;
};
