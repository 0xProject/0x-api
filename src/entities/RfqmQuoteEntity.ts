import { RfqOrder } from '@0x/asset-swapper';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

import { RfqmFee } from '../services/rfqm_service';

@Entity({ name: 'rfqm_quotes' })
export class RfqmQuoteEntity {
    @PrimaryColumn({ name: 'order_hash', type: 'varchar' })
    public orderHash?: string;

    @Column({ name: 'metatransaction_hash', type: 'varchar', nullable: true, unique: true })
    public metaTransactionHash: string | null;

    @Index()
    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
    public createdAt?: Date;

    @Column({ name: 'chain_id', type: 'varchar' })
    public chainId?: string;

    @Column({ name: 'integrator_id', type: 'varchar', nullable: true })
    public integratorId: string | null;

    @Column({ name: 'maker_uri', type: 'varchar' })
    public makerUri?: string;

    @Column({ name: 'fee', type: 'jsonb', nullable: true })
    public fee: RfqmFee | null;

    @Column({ name: 'order', type: 'jsonb', nullable: true })
    public order: RfqOrder | null;

    constructor(
        opts: {
            orderHash?: string;
            metaTransactionHash?: string;
            chainId?: string;
            integratorId?: string;
            makerUri?: string;
            fee?: RfqmFee;
            order?: RfqOrder;
        } = {},
    ) {
        this.orderHash = opts.orderHash;
        this.metaTransactionHash = opts.metaTransactionHash || null;
        this.chainId = opts.chainId;
        this.integratorId = opts.integratorId || null;
        this.makerUri = opts.makerUri;
        this.fee = opts.fee || null;
        this.order = opts.order || null;
    }
}
