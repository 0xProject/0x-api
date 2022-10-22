import { PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
    name: 'signed_offer_liquidities',
    materialized: true,
    synchronize: false,
})
class ValidSignedOffer {
    @PrimaryColumn({ name: 'offer_hash' })
    public offerHash?: string;

    @ViewColumn()
    public maker?: string;

    @ViewColumn()
    public taker?: string;

    @ViewColumn({ name: 'maker_collateral_amount' })
    public makerCollateralAmount?: string;

    @ViewColumn({ name: 'taker_collateral_amount' })
    public takerCollateralAmount?: string;

    @ViewColumn({ name: 'maker_direction' })
    public makerDirection?: string;

    @ViewColumn({ name: 'offer_expiry' })
    public offerExpiry?: string;

    @ViewColumn({ name: 'minimum_taker_fill_amount' })
    public minimumTakerFillAmount?: string;

    @ViewColumn({ name: 'pool_id' })
    public poolId?: string;

    @ViewColumn()
    public salt?: string;

    @ViewColumn()
    public signature?: string;

    @ViewColumn({ name: 'chain_id' })
    public chainId?: string;

    @ViewColumn({ name: 'verifying_contract' })
    public verifyingContract?: string;

    @ViewColumn({ name: 'actual_taker_fillable_amount' })
    public actualTakerFillableAmount?: string;

    constructor(
        opts: {
            offerHash?: string;
            maker?: string;
            taker?: string;
            makerCollateralAmount?: string;
            takerCollateralAmount?: string;
            makerDirection?: string;
            offerExpiry?: string;
            minimumTakerFillAmount?: string;
            poolId?: string;
            salt?: string;
            actualTakerFillableAmount?: string;
            signature?: string;
            chainId?: string;
            verifyingContract?: string;
        } = {},
    ) {
        Object.assign(this, opts);
    }
}

export { ValidSignedOffer as SignedOfferLiquidityEntity };
