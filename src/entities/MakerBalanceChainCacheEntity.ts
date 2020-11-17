import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { BigNumberTransformer } from './transformers';

// A table of cached erc20 balances for RFQT market makers
@Entity({ name: 'maker_balance_chain_cache' })
export class MakerBalanceChainCache {
    @PrimaryColumn({ name: 'token_address', type: 'varchar' })
    public tokenAddress?: string;

    @PrimaryColumn({ name: 'maker_address', type: 'varchar' })
    public makerAddress?: string;

    @Column({ name: 'balance', type: 'numeric', nullable: true, transformer: BigNumberTransformer })
    public balance?: BigNumber | null;

    @Column({ name: 'time_of_sample', type: 'timestamptz', nullable: true })
    public timeOfSample?: Date | null;
}
