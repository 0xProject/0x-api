import { BigNumber } from '@0x/asset-swapper';
import { RfqOrder } from '@0x/protocol-utils';
import { Fee } from '@0x/quote-server/lib/src/types';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

import { RfqmJobOpts, RfqmJobStatus } from '../services/rfqm_service';

@Entity({ name: 'rfqm_jobs' })
export class RfqmJobEntity {
    @PrimaryColumn({ name: 'order_hash', type: 'varchar' })
    public orderHash: string;

    @Column({ name: 'metatransaction_hash', type: 'varchar', nullable: true, unique: true })
    public metaTransactionHash: string | null;

    @Index()
    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
    public createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
    public updatedAt: Date | null;

    @Column({ name: 'expiry', type: 'numeric' })
    public expiry: BigNumber;

    @Column({ name: 'chain_id', type: 'integer' })
    public chainId: number;

    @Column({ name: 'integrator_id', type: 'varchar', nullable: true })
    public integratorId: string | null;

    @Column({ name: 'maker_uri', type: 'varchar' })
    public makerUri: string;

    @Column({ name: 'status', type: 'varchar' })
    public status: RfqmJobStatus;

    @Column({ name: 'status_reason', type: 'varchar', nullable: true })
    public statusReason: string | null;

    @Column({ name: 'calldata', type: 'varchar' })
    public calldata: string;

    @Column({ name: 'fee', type: 'jsonb', nullable: true })
    public fee: Fee | null;

    @Column({ name: 'order', type: 'jsonb', nullable: true })
    public order: RfqOrder | null;

    @Column({ name: 'metadata', type: 'jsonb', nullable: true })
    public metadata: object | null;

    constructor(opts: RfqmJobOpts) {
        this.orderHash = opts.orderHash;
        this.metaTransactionHash = opts.metaTransactionHash || null;
        this.createdAt = opts.createdAt || new Date();
        this.updatedAt = opts.updatedAt || null;
        this.expiry = opts.expiry;
        this.chainId = opts.chainId;
        this.integratorId = opts.integratorId || null;
        this.makerUri = opts.makerUri;
        this.status = opts.status;
        this.statusReason = opts.statusReason;
        this.calldata = opts.calldata;
        this.fee = opts.fee || null;
        this.order = opts.order || null;
        this.metadata = opts.metadata || null;
    }
}
