import { BigNumber } from '@0x/asset-swapper';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { RfqmTranasctionSubmissionStatus, RfqmTransactionSubmissionOpts } from '../utils/rfqm_db_utils';

import { RfqmJobEntity } from './RfqmJobEntity';
import { BigNumberTransformer } from './transformers';

@Entity({ name: 'rfqm_transaction_submissions' })
export class RfqmTransactionSubmissionEntity {
    @PrimaryColumn({ name: 'transaction_hash', type: 'varchar' })
    public transactionHash?: string;

    @ManyToOne(() => RfqmJobEntity, (rfqmJob) => rfqmJob.orderHash)
    @JoinColumn()
    public orderHash?: string;

    @Index()
    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
    public createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
    public updatedAt: Date | null;

    @Column({ name: 'from', type: 'varchar', nullable: true })
    public from?: string | null;

    @Column({ name: 'to', type: 'varchar', nullable: true })
    public to?: string | null;

    @Column({ name: 'nonce', type: 'bigint', nullable: true })
    public nonce?: number | null;

    @Column({ name: 'gas_price', type: 'numeric', nullable: true, transformer: BigNumberTransformer })
    public gasPrice?: BigNumber | null;

    @Column({ name: 'gas_used', type: 'numeric', nullable: true, transformer: BigNumberTransformer })
    public gasUsed?: BigNumber | null;

    @Column({ name: 'block_mined', type: 'numeric', nullable: true, transformer: BigNumberTransformer })
    public blockMined?: BigNumber | null;

    @Index()
    @Column({ name: 'status', type: 'varchar' })
    public status?: RfqmTranasctionSubmissionStatus;

    @Column({ name: 'status_reason', type: 'varchar', nullable: true })
    public statusReason: string | null;

    @Column({ name: 'metadata', type: 'jsonb', nullable: true })
    public metadata: object | null;

    constructor(opts: RfqmTransactionSubmissionOpts = {}) {
        this.orderHash = opts.orderHash;
        this.createdAt = opts.createdAt || new Date();
        this.updatedAt = opts.updatedAt || null;
        this.from = opts.from || null;
        this.to = opts.to || null;
        this.gasPrice = opts.gasPrice || null;
        this.gasUsed = opts.gasUsed || null;
        this.nonce = opts.nonce || null;
        this.status = opts.status;
        this.statusReason = opts.statusReason || null;
        this.metadata = opts.metadata || null;
    }
}
