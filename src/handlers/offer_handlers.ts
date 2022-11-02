import * as express from 'express';
import * as HttpStatus from 'http-status-codes';

import { FEE_RECIPIENT_ADDRESS, OfferLiquidityType, TAKER_FEE_UNIT_AMOUNT } from '../config';
import { NULL_ADDRESS, NULL_TEXT, SRA_DOCS_URL } from '../constants';
import { OfferAddLiquidityEntity, OfferCreateContingentPoolEntity, OfferRemoveLiquidityEntity } from '../entities';
import { schemas } from '../schemas';
import { OfferService } from '../services/offer_service';
import { OrderConfigResponse } from '../types';
import { paginationUtils } from '../utils/pagination_utils';
import { schemaUtils } from '../utils/schema_utils';

export class OfferHandlers {
    private readonly _offerService: OfferService;
    public static rootAsync(_req: express.Request, res: express.Response): void {
        const message = `This is the root of the Standard Relayer API. Visit ${SRA_DOCS_URL} for details about this API.`;
        res.status(HttpStatus.OK).send({ message });
    }
    public static feeRecipients(req: express.Request, res: express.Response): void {
        const { page, perPage } = paginationUtils.parsePaginationConfig(req);
        const normalizedFeeRecipient = FEE_RECIPIENT_ADDRESS.toLowerCase();
        const feeRecipients = [normalizedFeeRecipient];
        const paginatedFeeRecipients = paginationUtils.paginate(feeRecipients, page, perPage);
        res.status(HttpStatus.OK).send(paginatedFeeRecipients);
    }
    public static orderConfig(req: express.Request, res: express.Response): void {
        schemaUtils.validateSchema(req.body, schemas.sraOrderConfigPayloadSchema);
        const orderConfigResponse: OrderConfigResponse = {
            sender: NULL_ADDRESS,
            feeRecipient: FEE_RECIPIENT_ADDRESS.toLowerCase(),
            takerTokenFeeAmount: TAKER_FEE_UNIT_AMOUNT,
        };
        res.status(HttpStatus.OK).send(orderConfigResponse);
    }
    constructor(offerService: OfferService) {
        this._offerService = offerService;
    }
    public async offerCreateContingentPoolsAsync(req: express.Request, res: express.Response): Promise<void> {
        const params = offerCreateContingentPoolFilterParams(req);

        const response = await this._offerService.offerCreateContingentPoolsAsync(params);

        res.status(HttpStatus.OK).send(response);
    }
    public async getOfferCreateContingentPoolByOfferHashAsync(
        req: express.Request,
        res: express.Response,
    ): Promise<void> {
        const response = await this._offerService.getOfferCreateContingentPoolByOfferHashAsync(req.params.offerHash);

        res.status(HttpStatus.OK).send(response);
    }
    public async postOfferCreateContingentPoolAsync(req: express.Request, res: express.Response): Promise<void> {
        schemaUtils.validateSchema(req.body, schemas.sraOfferCreateContingentPoolSchema);

        const offerCreateContingentPoolEntity = new OfferCreateContingentPoolEntity(req.body);
        const response = await this._offerService.postOfferCreateContingentPoolAsync(offerCreateContingentPoolEntity);

        res.status(HttpStatus.OK).send(response);
    }
    public async offerAddLiquidityAsync(req: express.Request, res: express.Response): Promise<void> {
        const params = offerLiquidityFilterParams(req);
        const response = await this._offerService.offerAddLiquidityAsync(params);

        res.status(HttpStatus.OK).send(response);
    }
    public async getOfferAddLiquidityByOfferHashAsync(req: express.Request, res: express.Response): Promise<void> {
        const response = await this._offerService.getOfferAddLiquidityByOfferHashAsync(req.params.offerHash);

        res.status(HttpStatus.OK).send(response);
    }
    public async postOfferAddLiquidityAsync(req: express.Request, res: express.Response): Promise<void> {
        schemaUtils.validateSchema(req.body, schemas.sraOfferAddLiquiditySchema);

        const offerAddLiquidityEntity = new OfferAddLiquidityEntity({
            ...req.body,
            referenceAsset: NULL_TEXT,
            collateralToken: NULL_ADDRESS,
            dataProvider: NULL_ADDRESS,
            permissionedERC721Token: NULL_ADDRESS,
        });

        const response = await this._offerService.postOfferLiquidityAsync(
            offerAddLiquidityEntity,
            OfferLiquidityType.Add,
        );

        res.status(HttpStatus.OK).send(response);
    }
    public async offerRemoveLiquidityAsync(req: express.Request, res: express.Response): Promise<void> {
        const params = offerLiquidityFilterParams(req);
        const response = await this._offerService.offerRemoveLiquidityAsync(params);

        res.status(HttpStatus.OK).send(response);
    }
    public async getOfferRemoveLiquidityByOfferHashAsync(req: express.Request, res: express.Response): Promise<void> {
        const response = await this._offerService.getOfferRemoveLiquidityByOfferHashAsync(req.params.offerHash);

        res.status(HttpStatus.OK).send(response);
    }
    public async postOfferRemoveLiquidityAsync(req: express.Request, res: express.Response): Promise<void> {
        schemaUtils.validateSchema(req.body, schemas.sraOfferRemoveLiquiditySchema);

        const offerRemoveLiquidityEntity = new OfferRemoveLiquidityEntity({
            ...req.body,
            referenceAsset: NULL_TEXT,
            collateralToken: NULL_ADDRESS,
            dataProvider: NULL_ADDRESS,
            permissionedERC721Token: NULL_ADDRESS,
        });

        const response = await this._offerService.postOfferLiquidityAsync(
            offerRemoveLiquidityEntity,
            OfferLiquidityType.Remove,
        );

        res.status(HttpStatus.OK).send(response);
    }
}

// The function to get filter parameter about OfferCreateContingentPool
function offerCreateContingentPoolFilterParams(req: express.Request): any {
    const { page, perPage } = paginationUtils.parsePaginationConfig(req);
    const maker = req.query.maker === undefined ? NULL_ADDRESS : (req.query.maker as string).toLowerCase();
    const taker = req.query.taker === undefined ? NULL_ADDRESS : (req.query.taker as string).toLowerCase();
    const makerDirection = req.query.makerDirection === undefined ? NULL_TEXT : (req.query.makerDirection as string);
    const referenceAsset = req.query.referenceAsset === undefined ? NULL_TEXT : (req.query.referenceAsset as string);
    const collateralToken =
        req.query.collateralToken === undefined ? NULL_ADDRESS : (req.query.collateralToken as string).toLowerCase();
    const dataProvider =
        req.query.dataProvider === undefined ? NULL_ADDRESS : (req.query.dataProvider as string).toLowerCase();
    const permissionedERC721Token =
        req.query.permissionedERC721Token === undefined
            ? NULL_ADDRESS
            : (req.query.permissionedERC721Token as string).toLowerCase();

    return {
        page,
        perPage,
        maker,
        taker,
        makerDirection,
        referenceAsset,
        collateralToken,
        dataProvider,
        permissionedERC721Token,
    };
}

// The function to get filter parameter about OfferAddLiqudity or OfferRemoveLiqudity
function offerLiquidityFilterParams(req: express.Request): any {
    const params = offerCreateContingentPoolFilterParams(req);

    return {
        ...params,
        poolId: req.query.poolId === undefined ? NULL_TEXT : (req.query.poolId as string),
    };
}
