import { BigNumber } from '@0x/utils';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { ONE_SECOND_MS } from '../constants';

import { BigNumberTransformer } from './transformers';
import { TransactionEntityOpts } from './types';

@Entity({ name: 'transactions' })
export class TransactionEntity {
    @PrimaryColumn({ name: 'hash', type: 'varchar' })
    public hash: string;

    @Column({ name: 'status', type: 'varchar' })
    public status: string;

    @Column({ name: 'expected_mined_in_sec', type: 'int' })
    public expectedMinedInSec?: number;

    @Column({ name: 'nonce', type: 'bigint' })
    public nonce: number;

    @Column({ name: 'gas_price', type: 'varchar', transformer: BigNumberTransformer })
    public gasPrice: BigNumber;

    @Column({ name: 'block_number', type: 'bigint', nullable: true })
    public blockNumber?: number;

    @Column({ name: 'meta_txn_relayer_address', type: 'varchar' })
    public metaTxnRelayerAddress: string;

    @CreateDateColumn({ name: 'created_at' })
    // tslint:ignore-next-line
    public createdAt?: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt?: Date;

    @Column({ name: 'expected_at', type: 'timestamptz' })
    public expectedAt: Date;

    // HACK(oskar) we want all fields to be set, otherwise we should not accept
    // a transaction entity, however because of this issue:
    // https://github.com/typeorm/typeorm/issues/1772 we cannot accept undefined
    // as an argument to the constructor, to not break migrations with serialize
    constructor(
        opts: TransactionEntityOpts = {
            hash: '',
            status: '',
            expectedMinedInSec: 120,
            nonce: 0,
            gasPrice: new BigNumber(0),
            metaTxnRelayerAddress: '',
        },
    ) {
        this.hash = opts.hash;
        this.status = opts.status;
        this.expectedMinedInSec = opts.expectedMinedInSec;
        this.nonce = opts.nonce;
        this.gasPrice = opts.gasPrice;
        this.blockNumber = opts.blockNumber;
        this.metaTxnRelayerAddress = opts.metaTxnRelayerAddress;
        const now = new Date();
        this.expectedAt = new Date(now.getTime() + this.expectedMinedInSec * ONE_SECOND_MS);
    }
}
