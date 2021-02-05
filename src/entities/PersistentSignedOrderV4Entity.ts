import { OrderEventEndState } from '@0x/mesh-graphql-client';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

import { SignedOrderV4Entity } from './SignedOrderV4Entity';

// Adds a field `orderState` to SignedOrderEntity
// Persists after cancellation, expiration, etc
// We save these to support account history for Matcha front-end
@Entity({ name: 'persistent_signed_orders_v4' })
export class PersistentSignedOrderV4Entity extends SignedOrderV4Entity {
    @PrimaryColumn({ name: 'hash', type: 'varchar' })
    public hash?: string;

    @Index()
    @Column({ name: 'maker_token', type: 'varchar' })
    public makerToken?: string;

    @Index()
    @Column({ name: 'taker_token', type: 'varchar' })
    public takerToken?: string;

    @Column({ name: 'maker_amount', type: 'varchar' })
    public makerAmount?: string;

    @Column({ name: 'taker_amount', type: 'varchar' })
    public takerAmount?: string;

    @Index()
    @Column({ name: 'maker', type: 'varchar' })
    public maker?: string;

    @Column({ name: 'taker', type: 'varchar' })
    public taker?: string;

    @Column({ name: 'pool', type: 'varchar' })
    public pool?: string;

    @Column({ name: 'expiry', type: 'varchar' })
    public expiry?: string;

    @Column({ name: 'salt', type: 'varchar' })
    public salt?: string;

    @Column({ name: 'verifying_contract', type: 'varchar' })
    public verifyingContract?: string;

    @Column({ name: 'taker_token_fee_amount', type: 'varchar' })
    public takerTokenFeeAmount?: string;

    @Column({ name: 'sender', type: 'varchar' })
    public sender?: string;

    @Column({ name: 'fee_recipient', type: 'varchar' })
    public feeRecipient?: string;

    @Column({ name: 'signature', type: 'varchar' })
    public signature?: string;

    @Column({ name: 'remaining_fillable_taker_asset_amount', type: 'varchar' })
    public remainingFillableTakerAssetAmount?: string;

    @Column({ name: 'state', type: 'enum', enum: OrderEventEndState, default: OrderEventEndState.Added })
    public orderState?: OrderEventEndState;

    @Column({ name: 'created_at', type: 'timestamptz', default: 'now()' })
    public createdAt?: string;

    constructor(
        opts: {
            hash?: string;
            makerToken?: string;
            takerToken?: string;
            makerAmount?: string;
            takerAmount?: string;
            maker?: string;
            taker?: string;
            pool?: string;
            expiry?: string;
            salt?: string;
            verifyingContract?: string;
            takerTokenFeeAmount?: string;
            sender?: string;
            feeRecipient?: string;
            signature?: string;
            remainingFillableTakerAssetAmount?: string;
            orderState?: OrderEventEndState;
        } = {},
    ) {
        super(opts);
        this.orderState = opts.orderState || OrderEventEndState.Added;
    }
}
