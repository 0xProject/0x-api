import { RitualBridgeContract } from '@0x/contracts-asset-proxy';
import { PrivateKeyWalletSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
// import { SupportedProvider } from '@0x/order-utils';
import { BigNumber, logUtils } from '@0x/utils';
import * as cron from 'node-cron';
import { Connection, Repository } from 'typeorm';

import { CHAIN_ID, RECURRING_ORDER_BOT_ADDRESS, RECURRING_ORDER_BOT_PRIVATE_KEY } from '../config';
import { ONE_GWEI, RITUAL_BRIDGE_ADDRESSES } from '../constants';
import { RecurringTradeEntity } from '../entities';
import { RecurringTradeEntityOpts } from '../entities/types';

import { SwapService } from './swap_service';

// CONSTANTS
// wait an hour for pending to confirm
const MILLISECONDS_TO_WAIT_FOR_PENDING = 3.6e6;
const SECONDS_TO_WAIT_BEFORE_FILLING = 1800;
const MILLISECONDS_IN_A_SECOND = 1000;

const recurringBuyResponseMap: {[key: string]: number} = {
    'sellAmount': 0,
    'interval': 1,
    'minBuyAmount': 2,
    'maxSlippageBps': 3,
    'currentBuyWindowStart': 4,
    'currentIntervalAmountSold': 5,
    'unwrapWeth': 6,
};

export class RecurringTradeService {
    private readonly _connection: Connection;
    private readonly _recurringTradeEntityRepository: Repository<RecurringTradeEntity>;
    private readonly _ritualBridgeWrapper: RitualBridgeContract;
    private readonly _swapService: SwapService;

    constructor(dbConnection: Connection, ethRpcUrl: string, swapService: SwapService) {
        this._connection = dbConnection;
        this._recurringTradeEntityRepository = this._connection.getRepository(RecurringTradeEntity);
        const providerEngine = new Web3ProviderEngine();
        const rpcProvider = new RPCSubprovider(ethRpcUrl);
        const privateKeyProvider = new PrivateKeyWalletSubprovider(RECURRING_ORDER_BOT_PRIVATE_KEY);

        providerEngine.addProvider(privateKeyProvider);
        providerEngine.addProvider(rpcProvider);
        providerEngine.start();

        this._ritualBridgeWrapper = new RitualBridgeContract(RITUAL_BRIDGE_ADDRESSES[CHAIN_ID], providerEngine);
        this._swapService = swapService;
    }

    public async runCronJobAsync(): Promise<void> {
        // run job every minute
        cron.schedule(`0 * * * * *`, async () => {
            await this.checkForUpdatesAsync();
            await this.tradeIfTradableAsync();
            logUtils.log(`it's running`);
        });
    }

    public async checkForUpdatesAsync(): Promise<void> {
        const activePendingRecurringTrades = await this._recurringTradeEntityRepository.find({
            where: [
              { status: 'pending' },
              { status: 'active' },
            ],
        });

        logUtils.log(activePendingRecurringTrades);

        await Promise.all(activePendingRecurringTrades.map(async entity => {
            const onChainInfo = await this._ritualBridgeWrapper.recurringBuys(entity.id).callAsync();
            if (isEmptyContractData(onChainInfo) && entity.status === 'active') {
                entity.status = 'cancelled';
                await this._recurringTradeEntityRepository.save(entity);
            } else if (isEmptyContractData(onChainInfo) && entity.status === 'pending') {
                const now = new Date();

                if ((now.getTime() - entity.createdAt.getTime()) > MILLISECONDS_TO_WAIT_FOR_PENDING) {
                    entity.status = 'failed';
                    await this._recurringTradeEntityRepository.save(entity);
                }
            } else {
                entity.fromTokenAmount = onChainInfo[recurringBuyResponseMap.sellAmount] as BigNumber;
                entity.interval = onChainInfo[recurringBuyResponseMap.interval] as BigNumber;
                entity.minBuyAmount = onChainInfo[recurringBuyResponseMap.minBuyAmount] as BigNumber;
                entity.maxSlippageBps = onChainInfo[recurringBuyResponseMap.maxSlippageBps] as BigNumber;
                entity.currentBuyWindowStart = onChainInfo[recurringBuyResponseMap.currentBuyWindowStart] as BigNumber;
                entity.currentIntervalAmountSold = onChainInfo[recurringBuyResponseMap.currentIntervalAmountSold] as BigNumber;
                entity.unwrapWeth = onChainInfo[recurringBuyResponseMap.unwrapWeth] as boolean;

                entity.status = 'active';

                await this._recurringTradeEntityRepository.save(entity);
            }
        }));
    }

    public async tradeIfTradableAsync(): Promise<void> {
        const activeRecurringTrades = await this._recurringTradeEntityRepository.find({
            where: [
              { status: 'active' },
            ],
        });

        await Promise.all(activeRecurringTrades.map(async entity => {
            // check if there is an amount to be traded
            // and a half hour has passed since becoming tradeable
            const currentTimeSeconds = new BigNumber((new Date().getTime()) / MILLISECONDS_IN_A_SECOND);
            if (
                ((currentTimeSeconds.minus(entity.currentBuyWindowStart)).isGreaterThan(SECONDS_TO_WAIT_BEFORE_FILLING)) &&
                (entity.fromTokenAmount.isGreaterThan(entity.currentIntervalAmountSold)) &&
                (entity.lastTxSentForBuyWindow.isLessThan(entity.currentBuyWindowStart))
            ) {
                logUtils.log(`met conditions to fill`);
                logUtils.log(`getting a quote`);

                // create swap quote params
                const swapQuoteParams = {
                    sellAmount: entity.fromTokenAmount.minus(entity.currentIntervalAmountSold),
                    buyAmount: undefined,
                    buyTokenAddress: entity.toTokenAddress,
                    sellTokenAddress: entity.fromTokenAddress,
                    isETHSell: false,
                    skipValidation: false,
                    from: undefined,
                };

                const swapQuote = await this._swapService.calculateSwapQuoteAsync(swapQuoteParams);
                logUtils.log(swapQuote);

                // TODO: Call fill function
                const signatures = swapQuote.orders.map(order => order.signature);
                logUtils.log(signatures);
                const floatGasPrice = swapQuote.gasPrice;
                const gasPrice = floatGasPrice
                    .div(ONE_GWEI)
                    .integerValue(BigNumber.ROUND_UP)
                    .times(ONE_GWEI);
                logUtils.log(gasPrice);

                const txData = {
                    gasPrice,
                    from: RECURRING_ORDER_BOT_ADDRESS,
                };

                logUtils.log(txData);

                // this._ritualBridgeWrapper.fillRecurringBuy(entity.traderAddress, entity.fromTokenAmount, entity.toTokenAddress, swapQuote.orders, signatures).getABIEncodedTransactionData();

                entity.lastTxSentForBuyWindow = entity.currentBuyWindowStart;
                await this._recurringTradeEntityRepository.save(entity);
            }
        }));
    }

    public async getAllRecurringTradesAsync(): Promise<RecurringTradeEntity[]> {
        const result = await this._recurringTradeEntityRepository.find();
        return result;
    }

    public async getRecurringTradesByTraderAsync(trader: string): Promise<RecurringTradeEntity[]> {
        const result = await this._recurringTradeEntityRepository.find({
            where: [
              { trader },
            ],
        });
        return result;
    }

    public async createRecurringTradeAsync(
        recurringTradeEntityOpts: RecurringTradeEntityOpts,
    ): Promise<RecurringTradeEntity> {
        const recurringTradeEntity = RecurringTradeEntity.make(recurringTradeEntityOpts);
        await this._recurringTradeEntityRepository.save(recurringTradeEntity);
        return recurringTradeEntity;
    }
}

function isEmptyContractData(recurringBuyContractResponse: Array<boolean|BigNumber>): boolean {
    return (recurringBuyContractResponse[0].valueOf() === '0') &&
        (recurringBuyContractResponse[1].valueOf() === '0') &&
        (recurringBuyContractResponse[2].valueOf() === '0') &&
        // tslint:disable-next-line:custom-no-magic-numbers
        (recurringBuyContractResponse[3].valueOf() === '0') &&
        // tslint:disable-next-line:custom-no-magic-numbers
        (recurringBuyContractResponse[4].valueOf() === '0') &&
        // tslint:disable-next-line:custom-no-magic-numbers
        (recurringBuyContractResponse[5].valueOf() === '0') &&
        // tslint:disable-next-line:custom-no-magic-numbers
        (recurringBuyContractResponse[6] === false);
}
