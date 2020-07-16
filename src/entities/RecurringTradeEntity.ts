import { BigNumber, hexUtils } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { BigNumberTransformer } from './transformers';
import { RecurringTradeEntityOpts } from './types';

@Entity({ name: 'recurring_trades' })
export class RecurringTradeEntity {
    @PrimaryColumn({ name: 'id', type: 'varchar' })
    public id: string;

    @Column({ name: 'trader_address', type: 'varchar' })
    public traderAddress: string;

    @Column({ name: 'bridge_address', type: 'varchar' })
    public bridgeAddress: string;

    @Column({ name: 'created_at', type: 'timestamptz' })
    public createdAt: Date;

    @Column({ name: 'from_token_address', type: 'varchar' })
    public fromTokenAddress: string;

    @Column({ name: 'to_token_address', type: 'varchar' })
    public toTokenAddress: string;

    @Column({ name: 'from_token_amount', type: 'numeric', transformer: BigNumberTransformer })
    public fromTokenAmount: BigNumber;

    @Column({ name: 'interval', type: 'numeric', transformer: BigNumberTransformer })
    // time between trades
    public interval: BigNumber;

    @Column({ name: 'min_buy_amount', type: 'numeric', transformer: BigNumberTransformer })
    public minBuyAmount: BigNumber;

    @Column({ name: 'max_slippage_bps', type: 'numeric', transformer: BigNumberTransformer })
    public maxSlippageBps: BigNumber;

    @Column({ name: 'unwrap_weth', type: 'boolean' })
    public unwrapWeth: boolean;

    @Column({ name: 'current_window_buy_start', type: 'numeric', transformer: BigNumberTransformer, nullable: true })
    public currentWindowBuyStart: BigNumber;

    @Column({ name: 'current_window_amount_sold', type: 'numeric', transformer: BigNumberTransformer, nullable: true })
    public currentIntervalAmountSold: BigNumber;

    @Column({ name: 'status', type: 'varchar' })
    // can be 'pending', 'failed', 'cancelled', 'active'
    public status: string;

    public static make(opts: RecurringTradeEntityOpts): RecurringTradeEntity {
        return new RecurringTradeEntity(opts);
    }

    // HACK(oskar) we want all fields to be set and valid, otherwise we should
    // not accept a transaction entity, however because of this issue:
    // https://github.com/typeorm/typeorm/issues/1772 we cannot accept undefined
    // as an argument to the constructor, to not break migrations with
    // serialize. Please use the public static make method instead.
    private constructor(
        opts: RecurringTradeEntityOpts = {
            traderAddress: '',
            bridgeAddress: '',
            fromTokenAddress: '',
            toTokenAddress: '',
            fromTokenAmount: new BigNumber('0'),
            interval: new BigNumber('0'),
            minBuyAmount: new BigNumber('0'),
            maxSlippageBps: new BigNumber('0'),
            unwrapWeth: false,
        },
    ) {
        const combinedIdArgs = hexUtils.concat(opts.traderAddress, opts.fromTokenAddress, opts.toTokenAddress);
        this.id = hexUtils.hash(combinedIdArgs);
        this.traderAddress = opts.traderAddress;
        this.bridgeAddress = opts.bridgeAddress;
        this.createdAt = new Date();
        this.fromTokenAddress = opts.fromTokenAddress;
        this.toTokenAddress = opts.toTokenAddress;
        this.fromTokenAmount = opts.fromTokenAmount;
        this.interval = opts.interval;
        this.minBuyAmount = opts.minBuyAmount;
        this.maxSlippageBps = opts.maxSlippageBps;
        this.unwrapWeth = opts.unwrapWeth;
        this.status = 'pending';
    }
}
