import { ViewColumn, ViewEntity } from 'typeorm';

import { OfferLiquidityEntity } from './OfferLiquidityEntity';

@ViewEntity({
    name: 'offer_remove_liquidity',
    materialized: true,
    synchronize: false,
})
export class OfferRemoveLiquidityEntity extends OfferLiquidityEntity {
    @ViewColumn({ name: 'position_token_amount' })
    public positionTokenAmount?: string;

    constructor(
        opts: {
            positionTokenAmount?: string;
        } = {},
    ) {
        super();
        Object.assign(this, opts);
    }
}
