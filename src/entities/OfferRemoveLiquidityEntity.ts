import { PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
    name: 'offer_remove_liquidity',
    materialized: true,
    synchronize: false,
})
export class OfferRemoveLiquidityEntity {
    @PrimaryColumn({ name: 'offer_hash' })
    public offerHash?: string;

    @ViewColumn()
    public maker?: string;

    @ViewColumn()
    public taker?: string;

    @ViewColumn({ name: 'maker_collateral_amount' })
    public makerCollateralAmount?: string;

    @ViewColumn({ name: 'position_token_amount' })
    public positionTokenAmount?: string;

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

    @ViewColumn({ name: 'chain_id' })
    public chainId?: number;

    @ViewColumn({ name: 'verifying_contract' })
    public verifyingContract?: string;

    @ViewColumn({ name: 'actual_taker_fillable_amount' })
    public actualTakerFillableAmount?: string;

    @ViewColumn({ name: 'reference_asset' })
    public referenceAsset?: string;

    @ViewColumn({ name: 'collateral_token' })
    public collateralToken?: string;

    @ViewColumn({ name: 'data_provider' })
    public dataProvider?: string;

    @ViewColumn({ name: 'permissioned_token' })
    public permissionedERC721Token?: string;

    @ViewColumn()
    public signature?: string;

    constructor(
        opts: {
            offerHash?: string;
            maker?: string;
            taker?: string;
            makerCollateralAmount?: string;
            positionTokenAmount?: string;
            makerDirection?: string;
            offerExpiry?: string;
            minimumTakerFillAmount?: string;
            poolId?: string;
            salt?: string;
            actualTakerFillableAmount?: string;
            chainId?: number;
            verifyingContract?: string;
            referenceAsset?: string;
            collateralToken?: string;
            dataProvider?: string;
            permissionedERC721Token?: string;
            signature?: string;
        } = {},
    ) {
        Object.assign(this, opts);
    }
}
