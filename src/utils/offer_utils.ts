import { OfferAddLiquidityEntity, OfferCreateContingentPoolEntity, OfferRemoveLiquidityEntity } from '../entities';
import { OfferAddLiquidity, OfferCreateContingentPool, OfferRemoveLiquidity } from '../types';

const convertStringToBoolean = (str: string): boolean => {
    if (str === 'true') {
        return true;
    } else {
        return false;
    }
};

export const offerUtils = {
    deserializeOfferCreateContingentPool: (
        offerCreateContingentPoolEntity: OfferCreateContingentPoolEntity,
    ): OfferCreateContingentPool => {
        const signedOffer: OfferCreateContingentPool = {
            offerHash: offerCreateContingentPoolEntity.offerHash as string,
            maker: offerCreateContingentPoolEntity.maker as string,
            taker: offerCreateContingentPoolEntity.taker as string,
            makerCollateralAmount: offerCreateContingentPoolEntity.makerCollateralAmount as string,
            takerCollateralAmount: offerCreateContingentPoolEntity.takerCollateralAmount as string,
            makerDirection: convertStringToBoolean(offerCreateContingentPoolEntity.makerDirection as string),
            offerExpiry: offerCreateContingentPoolEntity.offerExpiry as string,
            minimumTakerFillAmount: offerCreateContingentPoolEntity.minimumTakerFillAmount as string,
            referenceAsset: offerCreateContingentPoolEntity.referenceAsset as string,
            expiryTime: offerCreateContingentPoolEntity.expiryTime as string,
            floor: offerCreateContingentPoolEntity.floor as string,
            inflection: offerCreateContingentPoolEntity.inflection as string,
            cap: offerCreateContingentPoolEntity.cap as string,
            gradient: offerCreateContingentPoolEntity.gradient as string,
            collateralToken: offerCreateContingentPoolEntity.collateralToken as string,
            dataProvider: offerCreateContingentPoolEntity.dataProvider as string,
            capacity: offerCreateContingentPoolEntity.capacity as string,
            permissionedERC721Token: offerCreateContingentPoolEntity.permissionedERC721Token as string,
            salt: offerCreateContingentPoolEntity.salt as string,
            signature: JSON.parse(offerCreateContingentPoolEntity.signature as string),
            chainId: Number(offerCreateContingentPoolEntity.chainId),
            verifyingContract: offerCreateContingentPoolEntity.verifyingContract as string,
        };
        return signedOffer;
    },
    deserializeOfferAddLiquidity: (offerAddLiquidityEntity: OfferAddLiquidityEntity): OfferAddLiquidity => {
        const signedOffer: OfferAddLiquidity = {
            offerHash: offerAddLiquidityEntity.offerHash as string,
            maker: offerAddLiquidityEntity.maker as string,
            taker: offerAddLiquidityEntity.taker as string,
            makerCollateralAmount: offerAddLiquidityEntity.makerCollateralAmount as string,
            takerCollateralAmount: offerAddLiquidityEntity.takerCollateralAmount as string,
            makerDirection: convertStringToBoolean(offerAddLiquidityEntity.makerDirection as string),
            offerExpiry: offerAddLiquidityEntity.offerExpiry as string,
            minimumTakerFillAmount: offerAddLiquidityEntity.minimumTakerFillAmount as string,
            salt: offerAddLiquidityEntity.salt as string,
            poolId: offerAddLiquidityEntity.poolId as string,
            chainId: Number(offerAddLiquidityEntity.chainId),
            verifyingContract: offerAddLiquidityEntity.verifyingContract as string,
            referenceAsset: offerAddLiquidityEntity.referenceAsset as string,
            collateralToken: offerAddLiquidityEntity.collateralToken as string,
            dataProvider: offerAddLiquidityEntity.dataProvider as string,
            permissionedERC721Token: offerAddLiquidityEntity.permissionedERC721Token as string,
            signature: JSON.parse(offerAddLiquidityEntity.signature as string),
        };
        return signedOffer;
    },
    deserializeOfferRemoveLiquidity: (offerRemoveLiquidityEntity: OfferRemoveLiquidityEntity): OfferRemoveLiquidity => {
        const signedOffer: OfferRemoveLiquidity = {
            offerHash: offerRemoveLiquidityEntity.offerHash as string,
            maker: offerRemoveLiquidityEntity.maker as string,
            taker: offerRemoveLiquidityEntity.taker as string,
            makerCollateralAmount: offerRemoveLiquidityEntity.makerCollateralAmount as string,
            positionTokenAmount: offerRemoveLiquidityEntity.positionTokenAmount as string,
            makerDirection: convertStringToBoolean(offerRemoveLiquidityEntity.makerDirection as string),
            offerExpiry: offerRemoveLiquidityEntity.offerExpiry as string,
            minimumTakerFillAmount: offerRemoveLiquidityEntity.minimumTakerFillAmount as string,
            salt: offerRemoveLiquidityEntity.salt as string,
            poolId: offerRemoveLiquidityEntity.poolId as string,
            chainId: Number(offerRemoveLiquidityEntity.chainId),
            verifyingContract: offerRemoveLiquidityEntity.verifyingContract as string,
            referenceAsset: offerRemoveLiquidityEntity.referenceAsset as string,
            collateralToken: offerRemoveLiquidityEntity.collateralToken as string,
            dataProvider: offerRemoveLiquidityEntity.dataProvider as string,
            permissionedERC721Token: offerRemoveLiquidityEntity.permissionedERC721Token as string,
            signature: JSON.parse(offerRemoveLiquidityEntity.signature as string),
        };
        return signedOffer;
    },
};
