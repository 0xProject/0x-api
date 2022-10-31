import { ViewColumn, ViewEntity } from 'typeorm';

import { OfferLiquidityEntity } from './OfferLiquidityEntity';

@ViewEntity({
    name: 'offer_add_liquidity',
    materialized: true,
    synchronize: false,
})
export class OfferAddLiquidityEntity extends OfferLiquidityEntity {
    @ViewColumn({ name: 'taker_collateral_amount' })
    public takerCollateralAmount?: string;

    constructor(
        opts: {
            takerCollateralAmount?: string;
        } = {},
    ) {
        super();
        Object.assign(this, opts);
    }
}
