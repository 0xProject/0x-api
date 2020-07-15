import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { BigNumberTransformer } from './transformers';
import { RecurringTradeEntityOpts } from './types';

@Entity({ name: 'recurring_trades' })
export class RecurringTradeEntity {
    @PrimaryColumn({ name: 'id', type: 'varchar' })
    public id: string;

    @Column({ name: 'trader_address', type: 'varchar' })
    public traderAddress: string;

    @Column({ name: 'created_at', type: 'timestamptz' })
    public createdAt: Date;

    @Column({ name: 'from_token_address', type: 'varchar' })
    public fromTokenAddress: string;

    @Column({ name: 'to_token_address', type: 'varchar' })
    public toTokenAddress: string;

    @Column({ name: 'from_token_amount', type: 'numeric', transformer: BigNumberTransformer })
    public fromTokenAmount: BigNumber;

    @Column({ name: 'schedule_type', type: 'varchar' })
    // can be 'daily', 'weekly, 'monthly'
    public scheduleType: string;

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
    private constructor(opts: RecurringTradeEntityOpts) {
        this.id = opts.id;
        this.traderAddress = opts.traderAddress;
        this.createdAt = new Date();
        this.fromTokenAddress = opts.fromTokenAddress;
        this.toTokenAddress = opts.toTokenAddress;
        this.fromTokenAmount = opts.fromTokenAmount;
        this.scheduleType = opts.scheduleType;
        this.status = opts.status;
    }
}
