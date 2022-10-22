import { PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
    name: 'signed_offers',
    materialized: true,
    synchronize: false,
})
export class SignedOfferEntity {
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

    @ViewColumn({ name: 'reference_asset' })
    public referenceAsset?: string;

    @ViewColumn({ name: 'expiry_time' })
    public expiryTime?: string;

    @ViewColumn()
    public floor?: string;

    @ViewColumn()
    public inflection?: string;

    @ViewColumn()
    public cap?: string;

    @ViewColumn()
    public gradient?: string;

    @ViewColumn({ name: 'collateral_token' })
    public collateralToken?: string;

    @ViewColumn({ name: 'data_provider' })
    public dataProvider?: string;

    @ViewColumn()
    public capacity?: string;

    @ViewColumn({ name: 'permissioned_token' })
    public permissionedERC721Token?: string;

    @ViewColumn()
    public salt?: string;

    @ViewColumn()
    public signature?: string;

    @ViewColumn({ name: 'chain_id' })
    public chainId?: string;

    @ViewColumn({ name: 'verifying_contract' })
    public verifyingContract?: string;

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
            referenceAsset?: string;
            expiryTime?: string;
            floor?: string;
            inflection?: string;
            cap?: string;
            gradient?: string;
            collateralToken?: string;
            dataProvider?: string;
            capacity?: string;
            permissionedERC721Token?: string;
            salt?: string;
            signature?: string;
            chainId?: string;
            verifyingContract?: string;
        } = {},
    ) {
        Object.assign(this, opts);
    }
}
