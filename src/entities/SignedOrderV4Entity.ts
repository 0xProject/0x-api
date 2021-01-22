import { Column, Entity, PrimaryColumn } from 'typeorm';

// makerToken: NULL_ADDRESS,
//
// takerToken: NULL_ADDRESS,
// makerAmount: ZERO,
// takerAmount: ZERO,
// maker: NULL_ADDRESS,
// taker: NULL_ADDRESS,
// pool: hexUtils.leftPad(0),
// expiry: ZERO,
// salt: ZERO,
// chainId: 1,
// verifyingContract: getContractAddressesForChainOrThrow(1).exchangeProxy,
// takerTokenFeeAmount: ZERO,
// sender: NULL_ADDRESS,
// feeRecipient: NULL_ADDRESS,
//
// { type: 'address', name: 'makerToken' },
// { type: 'address', name: 'takerToken' },
// { type: 'uint128', name: 'makerAmount' },
// { type: 'uint128', name: 'takerAmount' },
// { type: 'uint128', name: 'takerTokenFeeAmount' },
// { type: 'address', name: 'maker' },
// { type: 'address', name: 'taker' },
// { type: 'address', name: 'sender' },
// { type: 'address', name: 'feeRecipient' },
// { type: 'bytes32', name: 'pool' },
// { type: 'uint64', name: 'expiry' },
// { type: 'uint256', name: 'salt' },

@Entity({ name: 'signed_orders_v4' })
export class SignedOrderV4Entity {
    @PrimaryColumn({ name: 'hash', type: 'varchar' })
    public hash?: string;

    @Column({ name: 'maker_token', type: 'varchar' })
    public makerToken?: string;

    @Column({ name: 'taker_token', type: 'varchar' })
    public takerToken?: string;

    @Column({ name: 'maker_amount', type: 'varchar' })
    public makerAmount?: string;

    @Column({ name: 'taker_amount', type: 'varchar' })
    public takerAmount?: string;

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
        } = {},
    ) {
        this.hash = opts.hash;
        this.makerToken = opts.makerToken;
        this.takerToken = opts.takerToken;
        this.makerAmount = opts.makerAmount;
        this.takerAmount = opts.takerAmount;
        this.maker = opts.maker;
        this.taker = opts.taker;
        this.pool = opts.pool;
        this.expiry = opts.expiry;
        this.salt = opts.salt;
        this.verifyingContract = opts.verifyingContract;
        this.takerTokenFeeAmount = opts.takerTokenFeeAmount;
        this.sender = opts.sender;
        this.feeRecipient = opts.feeRecipient;
        this.signature = opts.signature;
        this.remainingFillableTakerAssetAmount = opts.remainingFillableTakerAssetAmount;
        this.signature = opts.signature;
    }
}
