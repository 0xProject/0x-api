import { LimitOrderFields } from '@0x/protocol-utils';
import { BigNumber } from '@0x/utils';
import { getAddress } from '@ethersproject/address';
import { Contract } from '@ethersproject/contracts';
import { InfuraProvider } from '@ethersproject/providers';
import { ContractCallContext, ContractCallResults, Multicall } from 'ethereum-multicall';
import * as _ from 'lodash';
import { Connection, In, MoreThanOrEqual } from 'typeorm';
import * as WebSocket from 'ws';

import { BalanceCheckerContract, LimitOrder } from '../asset-swapper';
import { fetchPoolLists } from '../asset-swapper/utils/market_operation_utils/pools_cache/pool_list_cache';
import {
    CHAIN_ID,
    DB_ORDERS_UPDATE_CHUNK_SIZE,
    defaultHttpServiceConfig,
    INFURA_API_KEY,
    OfferLiquidityType,
    OfferStatus,
    SRA_ORDER_EXPIRATION_BUFFER_SECONDS,
    SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS,
    WEBSOCKET_PORT,
} from '../config';
import {
    ARRAY_LIMIT_LENGTH,
    BALANCE_CHECKER_ADDRESS,
    BALANCE_CHECKER_GAS_LIMIT,
    DEFAULT_PAGE,
    DEFAULT_PER_PAGE,
    DIVA_GOVERNANCE_ADDRESS,
    EXCHANGE_PROXY_ADDRESS,
    NULL_ADDRESS,
    NULL_TEXT,
    ONE_SECOND_MS,
    QUOTE_ORDER_EXPIRATION_BUFFER_MS,
} from '../constants';
import * as divaContractABI from '../diva-abis/DivaContractABI.json';
import * as PermissionedPositionTokenABI from '../diva-abis/PermissionedPositionTokenABI.json';
import {
    OfferAddLiquidityEntity,
    OfferCreateContingentPoolEntity,
    OfferRemoveLiquidityEntity,
    PersistentSignedOrderV4Entity,
    SignedOrderV4Entity,
} from '../entities';
import { ValidationError, ValidationErrorCodes, ValidationErrorReasons } from '../errors';
import { alertOnExpiredOrders, logger } from '../logger';
import {
    FillableOrderType,
    MakerInfoType,
    OfferAddLiquidity,
    OfferCreateContingentPool,
    OfferCreateContingentPoolFilterType,
    OfferLiquidityFilterType,
    OfferRemoveLiquidity,
    OrderbookPriceRequest,
    OrderbookPriceResponse,
    OrderbookResponse,
    OrderEventEndState,
    PaginatedCollection,
    SignedLimitOrder,
    SRAOrder,
} from '../types';
import { orderUtils } from '../utils/order_utils';
import { OrderWatcherInterface } from '../utils/order_watcher';
import { paginationUtils } from '../utils/pagination_utils';
import { providerUtils } from '../utils/provider_utils';

const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

export class OrderBookService {
    private readonly _connection: Connection;
    private readonly _orderWatcher: OrderWatcherInterface;

    // tslint:disable-next-line:prefer-function-over-method
    public static isAllowedPersistentOrders(apiKey: string): boolean {
        return SRA_PERSISTENT_ORDER_POSTING_WHITELISTED_API_KEYS.includes(apiKey);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOrderByHashIfExistsAsync(orderHash: string): Promise<SRAOrder | undefined> {
        let signedOrderEntity;
        signedOrderEntity = await this._connection.manager.findOne(SignedOrderV4Entity, orderHash);
        if (!signedOrderEntity) {
            signedOrderEntity = await this._connection.manager.findOne(PersistentSignedOrderV4Entity, orderHash);
        }
        if (signedOrderEntity === undefined) {
            return undefined;
        } else {
            return orderUtils.deserializeOrderToSRAOrder(signedOrderEntity as Required<SignedOrderV4Entity>);
        }
    }

    // tslint:disable-next-line:prefer-function-over-method
    public filterOrder(order: SRAOrder, req: OrderbookPriceRequest): boolean {
        // 1 is 0.001% and the actual amount is token fee / 100000, so we divided it by 100000
        // filter by taker token fee
        if (req.takerTokenFee !== -1) {
            const takerTokenFeeAmountExpected = order.order.takerAmount.multipliedBy(
                new BigNumber(req.takerTokenFee / 100000),
            );

            if (
                order.order.taker === NULL_ADDRESS && // Ensure that orders are fillable by anyone and not reserved for a specific address
                order.order.feeRecipient === DIVA_GOVERNANCE_ADDRESS.toLowerCase() && // Ensure that the feeRecipient is DIVA Governance address
                (order.order.takerTokenFeeAmount.lte(takerTokenFeeAmountExpected.minus(1)) || // calculate the toleance
                    order.order.takerTokenFeeAmount.gte(takerTokenFeeAmountExpected.plus(1)))
            ) {
                return false;
            }
            const toleranceTakerTokenFeeAmount = new BigNumber(1);

            if (
                order.order.takerTokenFeeAmount.lte(takerTokenFeeAmountExpected.minus(toleranceTakerTokenFeeAmount)) ||
                order.order.takerTokenFeeAmount.gte(takerTokenFeeAmountExpected.plus(toleranceTakerTokenFeeAmount))
            ) {
                return false;
            }
        }
        // filter by taker address
        if (req.taker !== NULL_ADDRESS && req.taker !== order.order.taker.toLowerCase()) {
            return false;
        }
        // filter by feeRecipent address
        if (req.feeRecipient !== NULL_ADDRESS && order.order.feeRecipient.toLowerCase() !== req.feeRecipient) {
            return false;
        }
        // filter by threshold
        if (
            (req.threshold !== 0 && order.metaData.remainingFillableTakerAmount.lte(req.threshold)) ||
            order.metaData.remainingFillableTakerAmount.lte(100)
        ) {
            return false;
        }

        return true;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public getBidOrAskFormat(record: SRAOrder): OrderbookPriceResponse {
        return {
            order: {
                maker: getAddress(record.order.maker),
                taker: getAddress(record.order.taker),
                makerToken: getAddress(record.order.makerToken),
                takerToken: getAddress(record.order.takerToken),
                makerAmount: record.order.makerAmount,
                takerAmount: record.order.takerAmount,
                takerTokenFeeAmount: record.order.takerTokenFeeAmount,
                feeRecipient: getAddress(record.order.feeRecipient),
                expiry: record.order.expiry,
            },
            metaData: {
                remainingFillableTakerAmount: record.metaData.remainingFillableTakerAmount,
            },
        };
    }

    // tslint:disable-next-line:prefer-function-over-method
    public getMakerInfo(records: SRAOrder[]): MakerInfoType {
        // maker address array
        const makers: string[] = records.map((data) => {
            return data.order.maker;
        });
        // makerToken array
        const makerTokens: string[] = records.map((data) => {
            return data.order.makerToken;
        });

        return {
            makers,
            makerTokens,
        };
    }

    // tslint:disable-next-line:prefer-function-over-method
    public getFillableOrder(
        makers: string[],
        makerTokens: string[],
        minOfBalancesOrAllowances: BigNumber[],
        order: SRAOrder,
    ): FillableOrderType {
        // Calculate remainingFillableMakerAmount using remainingFillableTakerAmount, makerAmount and takerAmount information received from 0x api
        // This new variable is compared to the maker's maker token balance and allowance to assess fillability.
        const remainingFillableMakerAmount = order.order.makerAmount
            .multipliedBy(new BigNumber(order.metaData.remainingFillableTakerAmount))
            .div(order.order.takerAmount);
        let makerIndex: number = -1;

        // Find the index
        makers.map((maker: string, index: number) => {
            if (
                maker.toLowerCase() === order.order.maker.toLowerCase() &&
                makerTokens[index].toLowerCase() === order.order.makerToken.toLowerCase()
            ) {
                makerIndex = index;
            }
        });

        // Get minimum of maker's maker token balance and allowance and include it as a new field in order metaData.
        // Note that remainingMakerMinOfBalancesOrAllowances is the minimum of full makerAllowance and balance for the first (best) order
        // and then decreases for the following orders as the remainingFillableMakerAmount gets reduced.
        const remainingMakerMinOfBalancesOrAllowances = minOfBalancesOrAllowances[makerIndex];

        if (remainingMakerMinOfBalancesOrAllowances.gt(0)) {
            let remainingFillableTakerAmount = order.metaData.remainingFillableTakerAmount;
            // remainingFillableMakerAmount is the minimum of remainingMakerMinOfBalancesOrAllowances and remainingFillableMakerAmount implied by remainingFillableTakerAmount.
            // If remainingMakerMinOfBalancesOrAllowances < remainingFillableMakerAmount, then remainingFillableTakerAmount needs to be reduced as well.
            if (remainingFillableMakerAmount.gt(remainingMakerMinOfBalancesOrAllowances)) {
                remainingFillableTakerAmount = remainingMakerMinOfBalancesOrAllowances
                    .multipliedBy(order.order.takerAmount)
                    .div(order.order.makerAmount);
            }

            minOfBalancesOrAllowances[makerIndex] =
                minOfBalancesOrAllowances[makerIndex].minus(remainingFillableMakerAmount);

            const extendedOrder = {
                ...order,
                metaData: {
                    ...order.metaData,
                    remainingFillableTakerAmount,
                },
            };

            return {
                extendedOrder,
                minOfBalancesOrAllowances,
            };
            // If makerAllowance is lower than remainingFillabelMakerAmount, then remainingFillableTakerAmount needs to be reduced
            // e.g., if remainingTakerFillableAmount = 1 and implied remainingTakerFillableAmount = 500 but remainingMakerMinOfBalancesOrAllowances = 100
            // then new remainingTakerFillableAmount = 1 * 100 / 500 = 1/5 = 0 -> gets filtered out from the orderbook automatically
        } else {
            const extendedOrder = {
                ...order,
                metaData: {
                    ...order.metaData,
                    remainingFillableTakerAmount: new BigNumber(0),
                },
            };

            return {
                extendedOrder,
                minOfBalancesOrAllowances,
            };
        }
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getSignedOrderEntitiesAsync(baseToken: string, quoteToken: string): Promise<any> {
        const orderEntities = await this._connection.manager.find(SignedOrderV4Entity, {
            where: {
                takerToken: In([baseToken, quoteToken]),
                makerToken: In([baseToken, quoteToken]),
            },
        });
        const bidSignedOrderEntities = orderEntities.filter(
            (o) => o.takerToken === baseToken && o.makerToken === quoteToken,
        );
        const askSignedOrderEntities = orderEntities.filter(
            (o) => o.takerToken === quoteToken && o.makerToken === baseToken,
        );
        const bidApiOrders: SRAOrder[] = (bidSignedOrderEntities as Required<SignedOrderV4Entity>[])
            .map(orderUtils.deserializeOrderToSRAOrder)
            .filter(orderUtils.isFreshOrder)
            .sort((orderA, orderB) => orderUtils.compareBidOrder(orderA.order, orderB.order));
        const askApiOrders: SRAOrder[] = (askSignedOrderEntities as Required<SignedOrderV4Entity>[])
            .map(orderUtils.deserializeOrderToSRAOrder)
            .filter(orderUtils.isFreshOrder)
            .sort((orderA, orderB) => orderUtils.compareAskOrder(orderA.order, orderB.order));

        return {
            bidApiOrders,
            askApiOrders,
        };
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOrderBookAsync(
        page: number,
        perPage: number,
        baseToken: string,
        quoteToken: string,
    ): Promise<OrderbookResponse> {
        const { bidApiOrders, askApiOrders } = await this.getSignedOrderEntitiesAsync(baseToken, quoteToken);

        let makers: string[] = []; // maker address array
        let makerTokens: string[] = []; // maker token address array

        // Get maker address array and makerToken address array of bid
        const bidMakerInfo = this.getMakerInfo(bidApiOrders);
        makers = makers.concat(bidMakerInfo.makers);
        makerTokens = makerTokens.concat(bidMakerInfo.makerTokens);

        // Get maker address array and makerToken address array of ask
        const askMakerInfo = this.getMakerInfo(askApiOrders);
        makers = makers.concat(askMakerInfo.makers);
        makerTokens = makerTokens.concat(askMakerInfo.makerTokens);

        // Get minOfBalancesOrAllowances
        let minOfBalancesOrAllowances = await this.getMinOfBalancesOrAllowancesAsync(makers, makerTokens);

        const req: OrderbookPriceRequest = {
            page,
            perPage,
            graphUrl: '',
            createdBy: '',
            taker: NULL_ADDRESS,
            feeRecipient: NULL_ADDRESS,
            takerTokenFee: -1,
            threshold: 0,
        };
        const resultBids: SRAOrder[] = [];
        const resultAsks: SRAOrder[] = [];

        bidApiOrders.map((order: SRAOrder) => {
            // Get fillable of bid
            const fillableOrder = this.getFillableOrder(makers, makerTokens, minOfBalancesOrAllowances, order);

            minOfBalancesOrAllowances = fillableOrder.minOfBalancesOrAllowances;

            // Filtering the bid
            if (this.filterOrder(fillableOrder.extendedOrder, req)) {
                resultBids.push(order);
            }
        });

        askApiOrders.map((order: SRAOrder) => {
            // Get fillable of bid
            const fillableOrder = this.getFillableOrder(makers, makerTokens, minOfBalancesOrAllowances, order);

            minOfBalancesOrAllowances = fillableOrder.minOfBalancesOrAllowances;

            // Filtering the bid
            if (this.filterOrder(fillableOrder.extendedOrder, req)) {
                resultAsks.push(order);
            }
        });

        const paginatedBidApiOrders = paginationUtils.paginate(resultBids, page, perPage);
        const paginatedAskApiOrders = paginationUtils.paginate(resultAsks, page, perPage);
        return {
            bids: paginatedBidApiOrders,
            asks: paginatedAskApiOrders,
        };
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getMinOfBalancesOrAllowancesAsync(makers: string[], makerTokens: string[]): Promise<BigNumber[]> {
        // The limit on the length of an array that can be sent as a parameter of smart contract function is 400.
        // Generate makers chunks
        const makersChunks = makers.reduce((resultArray: string[][], item, index) => {
            const batchIndex = Math.floor(index / ARRAY_LIMIT_LENGTH);
            if (!resultArray[batchIndex]) {
                resultArray[batchIndex] = [];
            }
            resultArray[batchIndex].push(item);
            return resultArray;
        }, []);

        // Generate maker tokens chunks
        const makersTokensChunks = makerTokens.reduce((resultArray: string[][], item, index) => {
            const batchIndex = Math.floor(index / ARRAY_LIMIT_LENGTH);
            if (!resultArray[batchIndex]) {
                resultArray[batchIndex] = [];
            }
            resultArray[batchIndex].push(item);
            return resultArray;
        }, []);

        // Create web3 provider
        const provider = providerUtils.createWeb3Provider(
            defaultHttpServiceConfig.ethereumRpcUrl,
            defaultHttpServiceConfig.rpcRequestTimeout,
            defaultHttpServiceConfig.shouldCompressRequest,
        );

        // Generate the balance checker contract interface
        const balanceCheckerContractInterface = new BalanceCheckerContract(BALANCE_CHECKER_ADDRESS, provider, {
            gas: BALANCE_CHECKER_GAS_LIMIT,
        });

        // Call the getMinOfBalancesOrAllowances function of balance checker contract
        const checkRes = await Promise.all(
            makersChunks.map(async (makersChunk: string[], index: number) => {
                return balanceCheckerContractInterface
                    .getMinOfBalancesOrAllowances(makersChunk, makersTokensChunks[index], EXCHANGE_PROXY_ADDRESS)
                    .callAsync();
            }),
        );

        let minOfBalancesOrAllowances: BigNumber[] = []; // minOfBalancesOrAllowances of every makers about every makerToken
        checkRes.map((data: BigNumber[]) => {
            minOfBalancesOrAllowances = minOfBalancesOrAllowances.concat(data);
        });

        return minOfBalancesOrAllowances;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getPricesAsync(req: OrderbookPriceRequest): Promise<any> {
        const result: any[] = [];
        // Get list of pools using Graphql query
        const res = await fetchPoolLists(req.page, req.perPage, req.createdBy, req.graphUrl);
        const pools: any[] = []; // pools list
        res.map((pool: any) => {
            pools.push({
                baseToken: pool.longToken.id,
                quoteToken: pool.collateralToken.id,
            });

            pools.push({
                baseToken: pool.shortToken.id,
                quoteToken: pool.collateralToken.id,
            });
        });

        let makers: string[] = []; // maker address array
        let makerTokens: string[] = []; // maker token address array

        // Get all tokens list
        await Promise.all(
            pools.map(async (pool) => {
                // Get bid list using pool's baseToken and quoteToken
                const { bidApiOrders, askApiOrders } = await this.getSignedOrderEntitiesAsync(
                    pool.baseToken,
                    pool.quoteToken,
                );
                // Get ask list using pool's baseToken and quoteToken
                pool.bids = bidApiOrders;
                pool.asks = askApiOrders;

                // Get maker address array and makerToken address array of bid
                const bidMakerInfo = this.getMakerInfo(pool.bids);
                makers = makers.concat(bidMakerInfo.makers);
                makerTokens = makerTokens.concat(bidMakerInfo.makerTokens);

                // Get maker address array and makerToken address array of ask
                const askMakerInfo = this.getMakerInfo(pool.asks);
                makers = makers.concat(askMakerInfo.makers);
                makerTokens = makerTokens.concat(askMakerInfo.makerTokens);
            }),
        );

        let minOfBalancesOrAllowances = await this.getMinOfBalancesOrAllowancesAsync(makers, makerTokens);

        // Get best bid and ask
        for (const pool of pools) {
            let bestBid = {}; // best bid
            let count = 0;
            if (pool.bids.length !== 0) {
                while (count < pool.bids.length) {
                    // Get fillable of bid
                    const fillableOrder = this.getFillableOrder(
                        makers,
                        makerTokens,
                        minOfBalancesOrAllowances,
                        pool.bids[count],
                    );

                    minOfBalancesOrAllowances = fillableOrder.minOfBalancesOrAllowances;

                    // Filtering the bid
                    if (this.filterOrder(fillableOrder.extendedOrder, req)) {
                        bestBid = this.getBidOrAskFormat(pool.bids[count]);
                        break;
                    }
                    count++;
                }
            }

            let bestAsk = {}; // best ask
            count = 0;
            if (pool.asks.length !== 0) {
                while (count < pool.asks.length) {
                    // Get fillable of ask
                    const fillableOrder = this.getFillableOrder(
                        makers,
                        makerTokens,
                        minOfBalancesOrAllowances,
                        pool.asks[count],
                    );

                    minOfBalancesOrAllowances = fillableOrder.minOfBalancesOrAllowances;

                    // Filtering the ask
                    if (this.filterOrder(fillableOrder.extendedOrder, req)) {
                        bestAsk = this.getBidOrAskFormat(pool.asks[count]);
                        break;
                    }
                    count++;
                }
            }

            result.push({
                baseToken: getAddress(pool.baseToken), // baseToken of pool
                quoteToken: getAddress(pool.quoteToken), // quoteToken of pool
                bid: bestBid, // best bid of pool
                ask: bestAsk, // best ask of pool
            });
        }

        return paginationUtils.paginate(result, DEFAULT_PAGE, req.perPage);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOrdersAsync(
        page: number,
        perPage: number,
        orderFieldFilters: Partial<SignedOrderV4Entity>,
        additionalFilters: { isUnfillable?: boolean; trader?: string },
    ): Promise<PaginatedCollection<SRAOrder>> {
        // Validation
        if (additionalFilters.isUnfillable === true && orderFieldFilters.maker === undefined) {
            throw new ValidationError([
                {
                    field: 'maker',
                    code: ValidationErrorCodes.RequiredField,
                    reason: ValidationErrorReasons.UnfillableRequiresMakerAddress,
                },
            ]);
        }

        // Each array element in `filters` is an OR subclause
        const filters = [];

        // Pre-filters; exists in the entity verbatim
        const columnNames = this._connection.getMetadata(SignedOrderV4Entity).columns.map((x) => x.propertyName);
        const orderFilter = _.pickBy(orderFieldFilters, (_v, k) => {
            return columnNames.includes(k);
        });

        // Post-filters; filters that don't exist verbatim
        if (additionalFilters.trader) {
            filters.push({
                ...orderFilter,
                maker: additionalFilters.trader,
            });

            filters.push({
                ...orderFilter,
                taker: additionalFilters.trader,
            });
        } else {
            filters.push(orderFilter);
        }

        // Add an expiry time check to all filters
        const minExpiryTime = Math.floor(Date.now() / ONE_SECOND_MS) + SRA_ORDER_EXPIRATION_BUFFER_SECONDS;
        const filtersWithExpirationCheck = filters.map((filter) => ({
            ...filter,
            expiry: MoreThanOrEqual(minExpiryTime),
        }));

        const [signedOrderCount, signedOrderEntities] = await Promise.all([
            this._connection.manager.count(SignedOrderV4Entity, {
                where: filtersWithExpirationCheck,
            }),
            this._connection.manager.find(SignedOrderV4Entity, {
                where: filtersWithExpirationCheck,
                ...paginationUtils.paginateDBFilters(page, perPage),
                order: {
                    hash: 'ASC',
                },
            }),
        ]);
        const apiOrders = (signedOrderEntities as Required<SignedOrderV4Entity>[]).map(
            orderUtils.deserializeOrderToSRAOrder,
        );

        // Join with persistent orders
        let persistentOrders: SRAOrder[] = [];
        let persistentOrdersCount = 0;
        if (additionalFilters.isUnfillable === true) {
            const removedStates = [
                OrderEventEndState.Cancelled,
                OrderEventEndState.Expired,
                OrderEventEndState.FullyFilled,
                OrderEventEndState.Invalid,
                OrderEventEndState.StoppedWatching,
                OrderEventEndState.Unfunded,
            ];
            const filtersWithoutDuplicateSignedOrders = filters.map((filter) => ({
                ...filter,
                orderState: In(removedStates),
            }));
            let persistentOrderEntities = [];
            [persistentOrdersCount, persistentOrderEntities] = await Promise.all([
                this._connection.manager.count(PersistentSignedOrderV4Entity, {
                    where: filtersWithoutDuplicateSignedOrders,
                }),
                this._connection.manager.find(PersistentSignedOrderV4Entity, {
                    where: filtersWithoutDuplicateSignedOrders,
                    ...paginationUtils.paginateDBFilters(page, perPage),
                    order: {
                        hash: 'ASC',
                    },
                }),
            ]);
            persistentOrders = (persistentOrderEntities as Required<PersistentSignedOrderV4Entity>[]).map(
                orderUtils.deserializeOrderToSRAOrder,
            );
        }

        const allOrders = apiOrders.concat(persistentOrders);
        const total = signedOrderCount + persistentOrdersCount;

        // Paginate
        const paginatedApiOrders = paginationUtils.paginateSerialize(allOrders, total, page, perPage);
        return paginatedApiOrders;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getBatchOrdersAsync(
        page: number,
        perPage: number,
        makerTokens: string[],
        takerTokens: string[],
    ): Promise<PaginatedCollection<SRAOrder>> {
        const filterObject = {
            makerToken: In(makerTokens),
            takerToken: In(takerTokens),
        };
        const signedOrderEntities = (await this._connection.manager.find(SignedOrderV4Entity, {
            where: filterObject,
        })) as Required<SignedOrderV4Entity>[];
        const apiOrders = signedOrderEntities.map(orderUtils.deserializeOrderToSRAOrder);

        // check for expired orders
        const { fresh, expired } = orderUtils.groupByFreshness(apiOrders, SRA_ORDER_EXPIRATION_BUFFER_SECONDS);
        alertOnExpiredOrders(expired);

        const paginatedApiOrders = paginationUtils.paginate(fresh, page, perPage);
        return paginatedApiOrders;
    }

    constructor(connection: Connection, orderWatcher: OrderWatcherInterface) {
        this._connection = connection;
        this._orderWatcher = orderWatcher;

        // Check the validation status of offerCreateContingentPools and offerAddLiquidities
        setInterval(async () => {
            await this.checkVaildateOffersAsync();
        }, QUOTE_ORDER_EXPIRATION_BUFFER_MS);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async addOrderAsync(signedOrder: SignedLimitOrder): Promise<void> {
        await this._orderWatcher.postOrdersAsync([signedOrder]);
        // After creating this order, we get the updated bid and ask information for the pool.
        const result: any[] = [];
        result.push({
            poolId: signedOrder.poolId,
            first: await this.getOrderBookAsync(
                DEFAULT_PAGE,
                DEFAULT_PER_PAGE,
                signedOrder.makerToken,
                signedOrder.takerToken,
            ),
            second: await this.getOrderBookAsync(
                DEFAULT_PAGE,
                DEFAULT_PER_PAGE,
                signedOrder.takerToken,
                signedOrder.makerToken,
            ),
        });

        // Send the data using websocket to every clients
        wss.clients.forEach((client) => {
            client.send(JSON.stringify(result));
        });
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async addOrdersAsync(signedOrders: SignedLimitOrder[]): Promise<void> {
        await this._orderWatcher.postOrdersAsync(signedOrders);
        // After creating these orders, we get the updated bid and ask information for the pool.
        const result: any[] = [];
        await Promise.all(
            signedOrders.map(async (signedOrder) => {
                const isExists = result.filter((item) => item[0] === signedOrder.poolId);

                if (isExists.length === 0) {
                    result.push({
                        poolId: signedOrder.poolId,
                        first: await this.getOrderBookAsync(
                            DEFAULT_PAGE,
                            DEFAULT_PER_PAGE,
                            signedOrder.makerToken,
                            signedOrder.takerToken,
                        ),
                        second: await this.getOrderBookAsync(
                            DEFAULT_PAGE,
                            DEFAULT_PER_PAGE,
                            signedOrder.takerToken,
                            signedOrder.makerToken,
                        ),
                    });
                }
            }),
        );

        // Send the data using websocket to every clients
        wss.clients.forEach((client) => {
            client.send(JSON.stringify(result));
        });
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async addPersistentOrdersAsync(signedOrders: SignedLimitOrder[]): Promise<void> {
        await this._orderWatcher.postOrdersAsync(signedOrders);
        // After creating these orders, we get the updated bid and ask information for the pool.
        const result: any[] = [];
        await Promise.all(
            signedOrders.map(async (signedOrder) => {
                const isExists = result.filter((item) => item[0] === signedOrder.poolId);

                if (isExists.length === 0) {
                    result.push({
                        poolId: signedOrder.poolId,
                        first: await this.getOrderBookAsync(
                            DEFAULT_PAGE,
                            DEFAULT_PER_PAGE,
                            signedOrder.makerToken,
                            signedOrder.takerToken,
                        ),
                        second: await this.getOrderBookAsync(
                            DEFAULT_PAGE,
                            DEFAULT_PER_PAGE,
                            signedOrder.takerToken,
                            signedOrder.makerToken,
                        ),
                    });
                }
            }),
        );

        // Send the data using websocket to every clients
        wss.clients.forEach((client) => {
            client.send(JSON.stringify(result));
        });

        // Figure out which orders were accepted by looking for them in the database.
        const hashes = signedOrders.map((o) => {
            const limitOrder = new LimitOrder(o as LimitOrderFields);
            return limitOrder.getHash();
        });
        const addedOrders = await this._connection.manager.find(SignedOrderV4Entity, {
            where: { hash: In(hashes) },
        });
        // MAX SQL variable size is 999. This limit is imposed via Sqlite.
        // The SELECT query is not entirely effecient and pulls in all attributes
        // so we need to leave space for the attributes on the model represented
        // as SQL variables in the "AS" syntax. We leave 99 free for the
        // signedOrders model
        await this._connection
            .getRepository(PersistentSignedOrderV4Entity)
            .save(addedOrders, { chunk: DB_ORDERS_UPDATE_CHUNK_SIZE });
    }

    // tslint:disable-next-line:prefer-function-over-method
    public checkSortParams(takerCollateralAmount: string, makerCollateralAmount: string): BigNumber {
        const takerAmount = new BigNumber(takerCollateralAmount);
        const makerAmount = new BigNumber(makerCollateralAmount);

        return takerAmount.div(takerAmount.plus(makerAmount));
    }

    // tslint:disable-next-line:prefer-function-over-method
    public offerCreateContingentPoolFilter(apiEntities: any[], req: any): any {
        return apiEntities.filter((apiEntity: OfferCreateContingentPool) => {
            if (req.maker !== NULL_ADDRESS && apiEntity.maker.toLowerCase() !== req.maker) {
                return false;
            }
            if (req.taker !== NULL_ADDRESS && apiEntity.taker.toLowerCase() !== req.taker) {
                return false;
            }
            if (req.makerDirection !== NULL_TEXT && req.makerDirection !== apiEntity.makerDirection) {
                return false;
            }
            if (req.referenceAsset !== NULL_TEXT && apiEntity.referenceAsset !== req.referenceAsset) {
                return false;
            }
            if (
                req.collateralToken !== NULL_ADDRESS &&
                apiEntity.collateralToken.toLowerCase() !== req.collateralToken
            ) {
                return false;
            }
            if (req.dataProvider !== NULL_ADDRESS && apiEntity.dataProvider.toLowerCase() !== req.dataProvider) {
                return false;
            }
            if (
                req.permissionedERC721Token !== NULL_ADDRESS &&
                apiEntity.permissionedERC721Token.toLowerCase() !== req.permissionedERC721Token
            ) {
                return false;
            }

            return true;
        });
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async offerCreateContingentPoolsAsync(req: OfferCreateContingentPoolFilterType): Promise<any> {
        const offerCreateContingentPoolEntities = await this._connection.manager.find(OfferCreateContingentPoolEntity);
        const apiEntities: OfferCreateContingentPool[] = (
            offerCreateContingentPoolEntities as Required<OfferCreateContingentPoolEntity[]>
        ).map(orderUtils.deserializeOfferCreateContingentPool);

        // Sort offers with the same referenceAsset, floor, inflection, cap, gradient, expiryTime and makerDirection in ascending order by the takerCollateralAmount / (takerCollateralAmount + makerCollateralAmount).
        apiEntities
            .sort((a, b) => {
                if (
                    a.floor === b.floor &&
                    a.inflection === b.inflection &&
                    a.cap === b.cap &&
                    a.gradient === b.gradient &&
                    a.expiryTime === b.expiryTime &&
                    a.makerDirection === b.makerDirection
                ) {
                    const sortValA = this.checkSortParams(a.takerCollateralAmount, a.makerCollateralAmount);
                    const sortValB = this.checkSortParams(b.takerCollateralAmount, b.makerCollateralAmount);
                    const sortValue = sortValA.minus(sortValB);

                    return Number(sortValue.toString());
                } else {
                    return 1;
                }
            })
            .sort((a, b) => a.referenceAsset.localeCompare(b.referenceAsset));

        const filterEntities: OfferCreateContingentPool[] = this.offerCreateContingentPoolFilter(apiEntities, req);

        return paginationUtils.paginate(filterEntities, req.page, req.perPage);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOfferCreateContingentPoolByOfferHashAsync(offerHash: string): Promise<any> {
        const offerCreateContingentPoolEntity = await this._connection.manager.findOne(
            OfferCreateContingentPoolEntity,
            offerHash,
        );

        return orderUtils.deserializeOfferCreateContingentPool(
            offerCreateContingentPoolEntity as Required<OfferCreateContingentPoolEntity>,
        );
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async postOfferCreateContingentPoolAsync(
        offerCreateContingentPoolEntity: OfferCreateContingentPoolEntity,
    ): Promise<any> {
        await this._connection.getRepository(OfferCreateContingentPoolEntity).insert(offerCreateContingentPoolEntity);

        return offerCreateContingentPoolEntity.offerHash;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async offerAddLiquidityAsync(req: OfferLiquidityFilterType): Promise<any> {
        const offerAddLiquidityEntities = await this._connection.manager.find(OfferAddLiquidityEntity);
        const apiEntities: OfferAddLiquidity[] = (offerAddLiquidityEntities as Required<OfferAddLiquidityEntity[]>).map(
            orderUtils.deserializeOfferAddLiquidity,
        );

        // Sort offers with the same poolId and the same makerDirection in ascending order by the takerCollateralAmount / (takerCollateralAmount + makerCollateralAmount).
        apiEntities
            .sort((a, b) => {
                if (a.makerDirection === b.makerDirection) {
                    const sortValA = this.checkSortParams(a.takerCollateralAmount, a.makerCollateralAmount);
                    const sortValB = this.checkSortParams(b.takerCollateralAmount, b.makerCollateralAmount);
                    const sortValue = sortValA.minus(sortValB);

                    return Number(sortValue.toString());
                } else {
                    return 1;
                }
            })
            .sort((a, b) => {
                return Number(b.poolId) - Number(a.poolId);
            });

        const filterEntities = this.filterOfferLiquidity(apiEntities, req);

        return paginationUtils.paginate(filterEntities, req.page, req.perPage);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOfferAddLiquidityByOfferHashAsync(offerHash: string): Promise<any> {
        const offerAddLiquidityEntity = await this._connection.manager.findOne(OfferAddLiquidityEntity, offerHash);

        return orderUtils.deserializeOfferAddLiquidity(offerAddLiquidityEntity as Required<OfferAddLiquidityEntity>);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async postOfferLiquidityAsync(offerLiquidityEntity: any, offerLiquidityType: string): Promise<any> {
        // Get provider to call web3 function
        const provider = new InfuraProvider(offerLiquidityEntity.chainId, INFURA_API_KEY);
        // Get DIVA contract to call web3 function
        const divaContract = new Contract(
            offerLiquidityEntity.verifyingContract || NULL_ADDRESS,
            divaContractABI,
            provider,
        );
        // Get parameters of pool using pool id
        const parameters = await divaContract.functions.getPoolParameters(offerLiquidityEntity.poolId);
        const referenceAsset = parameters[0].referenceAsset;
        const collateralToken = parameters[0].collateralToken;
        const dataProvider = parameters[0].dataProvider;

        // Get longToken address
        const longToken = parameters[0].longToken;

        // Get PermissionedPositionToken contract to call web3 function
        const permissionedPositionContract = new Contract(longToken as string, PermissionedPositionTokenABI, provider);
        // Get PermissionedERC721Token address
        let permissionedERC721Token = NULL_ADDRESS;

        // TODO: If this call succeeds, longToken is permissionedPositionToken and the permissionedERC721Token exists, not NULL_ADDRESS.
        // If this call fails, longToken is the permissionlessToken and the permissionedERC721Token is NULL_ADDRESS.
        try {
            permissionedERC721Token = await permissionedPositionContract.functions.permissionedERC721Token();
        } catch (err) {
            logger.warn('There is no permissionedERC721Token for this pool.');
        }

        const fillableOfferLiquidityEntity: any = {
            ...offerLiquidityEntity,
            referenceAsset,
            collateralToken,
            dataProvider,
            permissionedERC721Token,
        };

        if (offerLiquidityType === OfferLiquidityType.Add) {
            await this._connection.getRepository(OfferAddLiquidityEntity).insert(fillableOfferLiquidityEntity);
        } else {
            await this._connection.getRepository(OfferRemoveLiquidityEntity).insert(fillableOfferLiquidityEntity);
        }

        return offerLiquidityEntity.offerHash;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public filterOfferLiquidity(apiEntities: any[], req: OfferLiquidityFilterType): any {
        const filterEntities = this.offerCreateContingentPoolFilter(apiEntities, req);

        return filterEntities.filter((apiEntity: any) => {
            if (req.poolId !== NULL_TEXT && apiEntity.poolId !== req.poolId) {
                return false;
            }

            return true;
        });
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async offerRemoveLiquidityAsync(req: OfferLiquidityFilterType): Promise<any> {
        const offerRemoveLiquidityEntities = await this._connection.manager.find(OfferRemoveLiquidityEntity);
        const apiEntities: OfferRemoveLiquidity[] = (
            offerRemoveLiquidityEntities as Required<OfferRemoveLiquidityEntity[]>
        ).map(orderUtils.deserializeOfferRemoveLiquidity);

        // Sort offers with the same poolId and the same makerDirection in ascending order by the positionTokenAmount / (positionTokenAmount + makerCollateralAmount).
        apiEntities
            .sort((a, b) => {
                if (a.makerDirection === b.makerDirection) {
                    const sortValA = this.checkSortParams(a.positionTokenAmount, a.makerCollateralAmount);
                    const sortValB = this.checkSortParams(b.positionTokenAmount, b.makerCollateralAmount);
                    const sortValue = sortValA.minus(sortValB);

                    return Number(sortValue.toString());
                } else {
                    return 1;
                }
            })
            .sort((a, b) => {
                return Number(b.poolId) - Number(a.poolId);
            });

        const filterEntities = this.filterOfferLiquidity(apiEntities, req);

        return paginationUtils.paginate(filterEntities, req.page, req.perPage);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOfferRemoveLiquidityByOfferHashAsync(offerHash: string): Promise<any> {
        const offerRemoveLiquidityEntity = await this._connection.manager.findOne(
            OfferRemoveLiquidityEntity,
            offerHash,
        );

        return orderUtils.deserializeOfferRemoveLiquidity(
            offerRemoveLiquidityEntity as Required<OfferRemoveLiquidityEntity>,
        );
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async checkVaildateOffersAsync(): Promise<void> {
        // Get provider to call web3 function
        const provider = new InfuraProvider(CHAIN_ID, INFURA_API_KEY);
        const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true });
        const callData: ContractCallContext[] = [];

        // Check validate of offerCreateContingentPools
        const offerCreateContingentPoolEntities = await this._connection.manager.find(OfferCreateContingentPoolEntity);
        const apiOfferCreateContingentPoolEntities: OfferCreateContingentPool[] = (
            offerCreateContingentPoolEntities as Required<OfferCreateContingentPoolEntity[]>
        ).map(orderUtils.deserializeOfferCreateContingentPool);

        apiOfferCreateContingentPoolEntities.map((apiEntity) => {
            const offerCreateContingentPool = {
                maker: apiEntity.maker,
                taker: apiEntity.taker,
                makerCollateralAmount: apiEntity.makerCollateralAmount,
                takerCollateralAmount: apiEntity.takerCollateralAmount,
                makerDirection: apiEntity.makerDirection,
                offerExpiry: apiEntity.offerExpiry,
                minimumTakerFillAmount: apiEntity.minimumTakerFillAmount,
                referenceAsset: apiEntity.referenceAsset,
                expiryTime: apiEntity.expiryTime,
                floor: apiEntity.floor,
                inflection: apiEntity.inflection,
                cap: apiEntity.cap,
                gradient: apiEntity.gradient,
                collateralToken: apiEntity.collateralToken,
                dataProvider: apiEntity.dataProvider,
                capacity: apiEntity.capacity,
                permissionedERC721Token: apiEntity.permissionedERC721Token,
                salt: apiEntity.salt,
            };
            const signature = apiEntity.signature;

            callData.push({
                reference: `OfferCreateContingentPool-${apiEntity.offerHash}`,
                contractAddress: apiEntity.verifyingContract,
                abi: divaContractABI,
                calls: [
                    {
                        reference: `OfferCreateContingentPool-${apiEntity.offerHash}`,
                        methodName: 'getOfferRelevantStateCreateContingentPool',
                        methodParameters: [offerCreateContingentPool, signature],
                    },
                ],
            });
        });

        // Check validate of offerAddLiquidities
        const offerAddLiquidityEntities = await this._connection.manager.find(OfferAddLiquidityEntity);
        const apiOfferAddLiquidityEntities: OfferAddLiquidity[] = (
            offerAddLiquidityEntities as Required<OfferAddLiquidityEntity[]>
        ).map(orderUtils.deserializeOfferAddLiquidity);

        apiOfferAddLiquidityEntities.map((apiEntity) => {
            // Get parameters to call the getOfferRelevantStateAddLiquidity function
            const offerAddLiquidity = {
                maker: apiEntity.maker,
                taker: apiEntity.taker,
                makerCollateralAmount: apiEntity.makerCollateralAmount,
                takerCollateralAmount: apiEntity.takerCollateralAmount,
                makerDirection: apiEntity.makerDirection,
                offerExpiry: apiEntity.offerExpiry,
                minimumTakerFillAmount: apiEntity.minimumTakerFillAmount,
                poolId: apiEntity.poolId,
                salt: apiEntity.salt,
            };
            const signature = apiEntity.signature;

            callData.push({
                reference: `OfferAddLiquidity-${apiEntity.offerHash}`,
                contractAddress: apiEntity.verifyingContract,
                abi: divaContractABI,
                calls: [
                    {
                        reference: `OfferAddLiquidity-${apiEntity.offerHash}`,
                        methodName: 'getOfferRelevantStateAddLiquidity',
                        methodParameters: [offerAddLiquidity, signature],
                    },
                ],
            });
        });

        const multicallResponse: ContractCallResults = await multicall.call(callData);
        const result = multicallResponse.results;

        await Promise.all(
            apiOfferCreateContingentPoolEntities.map(async (apiEntity) => {
                const offerCreateContingentPoolInfo =
                    result[`OfferCreateContingentPool-${apiEntity.offerHash}`].callsReturnContext[0].returnValues;

                try {
                    // Get the offerCreateContingentPoolStatus
                    const status = offerCreateContingentPoolInfo[0][1];
                    // Delete the inValid, canceled, expired offerCreateContingentPools
                    if (status !== OfferStatus.Fillable) {
                        await this._connection.manager.delete(OfferCreateContingentPoolEntity, apiEntity.offerHash);
                    }
                } catch (err) {
                    logger.warn(
                        'Error deleting offerCreateContingentPool using offerHash = ',
                        apiEntity.offerHash,
                        '.',
                    );
                }
            }),
        );

        await Promise.all(
            apiOfferAddLiquidityEntities.map(async (apiEntity) => {
                const offerAddLiquidityInfo =
                    result[`OfferAddLiquidity-${apiEntity.offerHash}`].callsReturnContext[0].returnValues;

                try {
                    const status = offerAddLiquidityInfo[0][1];
                    // Delete the inValid, canceled, expired offerAddLiquidity
                    if (status !== OfferStatus.Fillable) {
                        await this._connection.manager.delete(OfferAddLiquidityEntity, apiEntity.offerHash);
                    }
                } catch (err) {
                    logger.warn('Error deleting offerAddLiquidity using offerHash = ', apiEntity.offerHash, '.');
                }
            }),
        );
    }
}
