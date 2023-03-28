import { BigNumber } from '@0x/utils';
import { Contract } from '@ethersproject/contracts';
import { ContractCallContext, ContractCallResults, Multicall } from 'ethereum-multicall';
import * as _ from 'lodash';
import { Connection } from 'typeorm';

import { OfferLiquidityType, OfferStatus, Web3Provider } from '../config';
import { NULL_ADDRESS, NULL_TEXT, QUOTE_ORDER_EXPIRATION_BUFFER_MS } from '../constants';
import * as divaContractABI from '../diva-abis/DivaContractABI.json';
import * as PermissionedPositionTokenABI from '../diva-abis/PermissionedPositionTokenABI.json';
import { OfferAddLiquidityEntity, OfferCreateContingentPoolEntity, OfferRemoveLiquidityEntity } from '../entities';
import { logger } from '../logger';
import {
    OfferAddLiquidity,
    OfferCreateContingentPool,
    OfferCreateContingentPoolFilterType,
    OfferLiquidityFilterType,
    OfferRemoveLiquidity,
} from '../types';
import { offerUtils } from '../utils/offer_utils';
import { paginationUtils } from '../utils/pagination_utils';

export class OfferService {
    private readonly _connection: Connection;

    constructor(connection: Connection) {
        this._connection = connection;

        // Check the validation status of offerCreateContingentPools and offerAddLiquidities
        setInterval(async () => {
            await this.checkVaildateOffersAsync();
        }, QUOTE_ORDER_EXPIRATION_BUFFER_MS);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public checkSortParams(takerCollateralAmount: string, makerCollateralAmount: string): BigNumber {
        const takerAmount = new BigNumber(takerCollateralAmount);
        const makerAmount = new BigNumber(makerCollateralAmount);

        return takerAmount.div(takerAmount.plus(makerAmount));
    }

    // tslint:disable-next-line:prefer-function-over-method
    public offerCreateContingentPoolFilter(apiEntities: any[], req: any): any {
        return apiEntities.filter((apiEntity: OfferCreateContingentPool) => {
            if (req.maker !== NULL_ADDRESS && apiEntity.maker.toLowerCase() !== req.maker) {
                return false;
            }
            if (req.taker !== NULL_ADDRESS && apiEntity.taker.toLowerCase() !== req.taker) {
                return false;
            }
            if (req.makerIsLong !== NULL_TEXT) {
                if (
                    (req.makerIsLong !== 'true' && apiEntity.makerIsLong) ||
                    (req.makerIsLong !== 'false' && !apiEntity.makerIsLong)
                ) {
                    return false;
                }
            }
            if (req.referenceAsset !== NULL_TEXT && apiEntity.referenceAsset !== req.referenceAsset) {
                return false;
            }
            if (
                req.collateralToken !== NULL_ADDRESS &&
                apiEntity.collateralToken.toLowerCase() !== req.collateralToken
            ) {
                return false;
            }
            if (req.dataProvider !== NULL_ADDRESS && apiEntity.dataProvider.toLowerCase() !== req.dataProvider) {
                return false;
            }
            if (
                req.permissionedERC721Token !== NULL_ADDRESS &&
                apiEntity.permissionedERC721Token.toLowerCase() !== req.permissionedERC721Token
            ) {
                return false;
            }

            return true;
        });
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async offerCreateContingentPoolsAsync(req: OfferCreateContingentPoolFilterType): Promise<any> {
        const offerCreateContingentPoolEntities = await this._connection.manager.find(OfferCreateContingentPoolEntity);
        const apiEntities: OfferCreateContingentPool[] = (
            offerCreateContingentPoolEntities as Required<OfferCreateContingentPoolEntity[]>
        ).map(offerUtils.deserializeOfferCreateContingentPool);

        // Sort offers with the same referenceAsset, floor, inflection, cap, gradient, expiryTime and makerIsLong in ascending order by the takerCollateralAmount / (takerCollateralAmount + makerCollateralAmount).
        apiEntities
            .sort((a, b) => {
                if (
                    a.floor === b.floor &&
                    a.inflection === b.inflection &&
                    a.cap === b.cap &&
                    a.gradient === b.gradient &&
                    a.expiryTime === b.expiryTime &&
                    a.makerIsLong === b.makerIsLong
                ) {
                    const sortValA = this.checkSortParams(a.takerCollateralAmount, a.makerCollateralAmount);
                    const sortValB = this.checkSortParams(b.takerCollateralAmount, b.makerCollateralAmount);
                    const sortValue = sortValA.minus(sortValB);

                    return Number(sortValue.toString());
                } else {
                    return 1;
                }
            })
            .sort((a, b) => a.referenceAsset.localeCompare(b.referenceAsset));

        const filterEntities: OfferCreateContingentPool[] = this.offerCreateContingentPoolFilter(apiEntities, req);

        // Calculate the actualFillableTakerAmount and appends it to data
        const resultEntities = await this.appendActualFillableTakerAmountAsync(filterEntities, 'CreateContingentPool');

        return paginationUtils.paginate(resultEntities, req.page, req.perPage);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOfferCreateContingentPoolByOfferHashAsync(offerHash: string): Promise<any> {
        const offerCreateContingentPoolEntity = await this._connection.manager.findOne(
            OfferCreateContingentPoolEntity,
            offerHash,
        );

        const entity = offerUtils.deserializeOfferCreateContingentPool(
            offerCreateContingentPoolEntity as Required<OfferCreateContingentPoolEntity>,
        );

        // Calculate the actualFillableTakerAmount and appends it to data
        const resultEntities = await this.appendActualFillableTakerAmountAsync([entity], 'CreateContingentPool');

        return resultEntities[0];
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async postOfferCreateContingentPoolAsync(
        offerCreateContingentPoolEntity: OfferCreateContingentPoolEntity,
    ): Promise<any> {
        await this._connection.getRepository(OfferCreateContingentPoolEntity).insert(offerCreateContingentPoolEntity);

        return offerCreateContingentPoolEntity.offerHash;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async appendActualFillableTakerAmountAsync(apiEntities: any[], offerLiquidityType: string): Promise<any[]> {
        // Get provider to call web3 function
        const multicall = new Multicall({ ethersProvider: Web3Provider, tryAggregate: true });
        const callData: ContractCallContext[] = [];

        apiEntities.map((apiEntity) => {
            if (offerLiquidityType === OfferLiquidityType.Add) {
                if (apiEntity.collateralToken !== NULL_ADDRESS) {
                    callData.push({
                        reference: `OfferAddLiquidity-${apiEntity.offerHash}`,
                        contractAddress: apiEntity.verifyingContract,
                        abi: divaContractABI,
                        calls: [
                            {
                                reference: `OfferAddLiquidity-${apiEntity.offerHash}`,
                                methodName: 'getOfferRelevantStateAddLiquidity',
                                methodParameters: [apiEntity, apiEntity.signature],
                            },
                        ],
                    });
                }
            } else if (offerLiquidityType === OfferLiquidityType.Remove) {
                if (apiEntity.collateralToken !== NULL_ADDRESS) {
                    callData.push({
                        reference: `OfferRemoveLiquidity-${apiEntity.offerHash}`,
                        contractAddress: apiEntity.verifyingContract,
                        abi: divaContractABI,
                        calls: [
                            {
                                reference: `OfferRemoveLiquidity-${apiEntity.offerHash}`,
                                methodName: 'getOfferRelevantStateRemoveLiquidity',
                                methodParameters: [apiEntity, apiEntity.signature],
                            },
                        ],
                    });
                }
            } else {
                if (apiEntity.collateralToken !== NULL_ADDRESS) {
                    callData.push({
                        reference: `OfferCreateContingentPool-${apiEntity.offerHash}`,
                        contractAddress: apiEntity.verifyingContract,
                        abi: divaContractABI,
                        calls: [
                            {
                                reference: `OfferCreateContingentPool-${apiEntity.offerHash}`,
                                methodName: 'getOfferRelevantStateCreateContingentPool',
                                methodParameters: [apiEntity, apiEntity.signature],
                            },
                        ],
                    });
                }
            }
        });

        const multicallResponse: ContractCallResults = await multicall.call(callData);
        const result = multicallResponse.results;

        const resultEntities = apiEntities.map((apiEntity) => {
            if (apiEntity.collateralToken === NULL_ADDRESS) {
                return {
                    ...apiEntity,
                    actualTakerFillableAmount: '0',
                };
            } else {
                let relevantStateParams: any;

                if (offerLiquidityType === OfferLiquidityType.Add) {
                    relevantStateParams =
                        result[`OfferAddLiquidity-${apiEntity.offerHash}`].callsReturnContext[0].returnValues;
                } else if (offerLiquidityType === OfferLiquidityType.Remove) {
                    relevantStateParams =
                        result[`OfferRemoveLiquidity-${apiEntity.offerHash}`].callsReturnContext[0].returnValues;
                } else {
                    relevantStateParams =
                        result[`OfferCreateContingentPool-${apiEntity.offerHash}`].callsReturnContext[0].returnValues;
                }

                const actualTakerFillableAmount = parseInt(relevantStateParams[1].hex, 16);

                return {
                    ...apiEntity,
                    actualTakerFillableAmount: actualTakerFillableAmount.toString(),
                };
            }
        });

        return resultEntities;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async offerAddLiquidityAsync(req: OfferLiquidityFilterType): Promise<any> {
        const offerAddLiquidityEntities = await this._connection.manager.find(OfferAddLiquidityEntity);
        const apiEntities: OfferAddLiquidity[] = (offerAddLiquidityEntities as Required<OfferAddLiquidityEntity[]>).map(
            offerUtils.deserializeOfferAddLiquidity,
        );

        // Sort offers with the same poolId and the same makerIsLong in ascending order by the takerCollateralAmount / (takerCollateralAmount + makerCollateralAmount).
        apiEntities
            .sort((a, b) => {
                if (a.makerIsLong === b.makerIsLong) {
                    const sortValA = this.checkSortParams(a.takerCollateralAmount, a.makerCollateralAmount);
                    const sortValB = this.checkSortParams(b.takerCollateralAmount, b.makerCollateralAmount);
                    const sortValue = sortValA.minus(sortValB);

                    return Number(sortValue.toString());
                } else {
                    return 1;
                }
            })
            .sort((a, b) => {
                return Number(b.poolId) - Number(a.poolId);
            });

        const filterEntities = this.filterOfferLiquidity(apiEntities, req);

        // Calculate the actualFillableTakerAmount and appends it to data
        const resultEntities = await this.appendActualFillableTakerAmountAsync(filterEntities, OfferLiquidityType.Add);

        return paginationUtils.paginate(resultEntities, req.page, req.perPage);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOfferAddLiquidityByOfferHashAsync(offerHash: string): Promise<any> {
        const offerAddLiquidityEntity = await this._connection.manager.findOne(OfferAddLiquidityEntity, offerHash);

        const entity = offerUtils.deserializeOfferAddLiquidity(
            offerAddLiquidityEntity as Required<OfferAddLiquidityEntity>,
        );

        // Calculate the actualFillableTakerAmount and appends it to data
        const resultEntities = await this.appendActualFillableTakerAmountAsync([entity], OfferLiquidityType.Add);

        return resultEntities[0];
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async postOfferLiquidityAsync(offerLiquidityEntity: any, offerLiquidityType: string): Promise<any> {
        // Get provider to call web3 function
        // Get DIVA contract to call web3 function
        const divaContract = new Contract(
            offerLiquidityEntity.verifyingContract || NULL_ADDRESS,
            divaContractABI,
            Web3Provider,
        );

        // Get parameters of pool using pool id
        const parameters = await divaContract.functions.getPoolParameters(offerLiquidityEntity.poolId);
        const referenceAsset = parameters[0].referenceAsset;
        const collateralToken = parameters[0].collateralToken;
        const dataProvider = parameters[0].dataProvider;

        // Get longToken address
        const longToken = parameters[0].longToken;

        // Get PermissionedPositionToken contract to call web3 function
        const permissionedPositionContract = new Contract(
            longToken as string,
            PermissionedPositionTokenABI,
            Web3Provider,
        );
        // Get PermissionedERC721Token address
        let permissionedERC721Token = NULL_ADDRESS;

        // TODO: If this call succeeds, longToken is permissionedPositionToken and the permissionedERC721Token exists, not NULL_ADDRESS.
        // If this call fails, longToken is the permissionlessToken and the permissionedERC721Token is NULL_ADDRESS.
        try {
            permissionedERC721Token = await permissionedPositionContract.functions.permissionedERC721Token();
        } catch (err) {
            logger.warn('There is no permissionedERC721Token for this pool.');
        }

        const fillableOfferLiquidityEntity: any = {
            ...offerLiquidityEntity,
            referenceAsset,
            collateralToken,
            dataProvider,
            permissionedERC721Token,
        };

        if (offerLiquidityType === OfferLiquidityType.Add) {
            await this._connection.getRepository(OfferAddLiquidityEntity).insert(fillableOfferLiquidityEntity);
        } else {
            await this._connection.getRepository(OfferRemoveLiquidityEntity).insert(fillableOfferLiquidityEntity);
        }

        return offerLiquidityEntity.offerHash;
    }

    // tslint:disable-next-line:prefer-function-over-method
    public filterOfferLiquidity(apiEntities: any[], req: OfferLiquidityFilterType): any {
        const filterEntities = this.offerCreateContingentPoolFilter(apiEntities, req);

        return filterEntities.filter((apiEntity: any) => {
            if (req.poolId !== NULL_TEXT && apiEntity.poolId !== req.poolId) {
                return false;
            }

            return true;
        });
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async offerRemoveLiquidityAsync(req: OfferLiquidityFilterType): Promise<any> {
        const offerRemoveLiquidityEntities = await this._connection.manager.find(OfferRemoveLiquidityEntity);
        const apiEntities: OfferRemoveLiquidity[] = (
            offerRemoveLiquidityEntities as Required<OfferRemoveLiquidityEntity[]>
        ).map(offerUtils.deserializeOfferRemoveLiquidity);

        // Sort offers with the same poolId and the same makerIsLong in ascending order by the positionTokenAmount / (positionTokenAmount + makerCollateralAmount).
        apiEntities
            .sort((a, b) => {
                if (a.makerIsLong === b.makerIsLong) {
                    const sortValA = this.checkSortParams(a.positionTokenAmount, a.makerCollateralAmount);
                    const sortValB = this.checkSortParams(b.positionTokenAmount, b.makerCollateralAmount);
                    const sortValue = sortValA.minus(sortValB);

                    return Number(sortValue.toString());
                } else {
                    return 1;
                }
            })
            .sort((a, b) => {
                return Number(b.poolId) - Number(a.poolId);
            });

        const filterEntities = this.filterOfferLiquidity(apiEntities, req);

        // Calculate the actualFillableTakerAmount and appends it to data
        const resultEntities = await this.appendActualFillableTakerAmountAsync(
            filterEntities,
            OfferLiquidityType.Remove,
        );

        return paginationUtils.paginate(resultEntities, req.page, req.perPage);
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async getOfferRemoveLiquidityByOfferHashAsync(offerHash: string): Promise<any> {
        const offerRemoveLiquidityEntity = await this._connection.manager.findOne(
            OfferRemoveLiquidityEntity,
            offerHash,
        );

        const entity = offerUtils.deserializeOfferRemoveLiquidity(
            offerRemoveLiquidityEntity as Required<OfferRemoveLiquidityEntity>,
        );

        // Calculate the actualFillableTakerAmount and appends it to data
        const resultEntities = await this.appendActualFillableTakerAmountAsync([entity], OfferLiquidityType.Remove);

        return resultEntities[0];
    }

    // tslint:disable-next-line:prefer-function-over-method
    public async checkVaildateOffersAsync(): Promise<void> {
        // Get provider to call web3 function
        const multicall = new Multicall({ ethersProvider: Web3Provider, tryAggregate: true });
        const callData: ContractCallContext[] = [];

        // Check validate of offerCreateContingentPools
        const offerCreateContingentPoolEntities = await this._connection.manager.find(OfferCreateContingentPoolEntity);
        const apiOfferCreateContingentPoolEntities: OfferCreateContingentPool[] = (
            offerCreateContingentPoolEntities as Required<OfferCreateContingentPoolEntity[]>
        ).map(offerUtils.deserializeOfferCreateContingentPool);

        apiOfferCreateContingentPoolEntities.map((apiEntity) => {
            const offerCreateContingentPool = {
                maker: apiEntity.maker,
                taker: apiEntity.taker,
                makerCollateralAmount: apiEntity.makerCollateralAmount,
                takerCollateralAmount: apiEntity.takerCollateralAmount,
                makerIsLong: apiEntity.makerIsLong,
                offerExpiry: apiEntity.offerExpiry,
                minimumTakerFillAmount: apiEntity.minimumTakerFillAmount,
                referenceAsset: apiEntity.referenceAsset,
                expiryTime: apiEntity.expiryTime,
                floor: apiEntity.floor,
                inflection: apiEntity.inflection,
                cap: apiEntity.cap,
                gradient: apiEntity.gradient,
                collateralToken: apiEntity.collateralToken,
                dataProvider: apiEntity.dataProvider,
                capacity: apiEntity.capacity,
                permissionedERC721Token: apiEntity.permissionedERC721Token,
                salt: apiEntity.salt,
            };
            const signature = apiEntity.signature;

            callData.push({
                reference: `OfferCreateContingentPool-${apiEntity.offerHash}`,
                contractAddress: apiEntity.verifyingContract,
                abi: divaContractABI,
                calls: [
                    {
                        reference: `OfferCreateContingentPool-${apiEntity.offerHash}`,
                        methodName: 'getOfferRelevantStateCreateContingentPool',
                        methodParameters: [offerCreateContingentPool, signature],
                    },
                ],
            });
        });

        // Check validate of offerAddLiquidities
        const offerAddLiquidityEntities = await this._connection.manager.find(OfferAddLiquidityEntity);
        const apiOfferAddLiquidityEntities: OfferAddLiquidity[] = (
            offerAddLiquidityEntities as Required<OfferAddLiquidityEntity[]>
        ).map(offerUtils.deserializeOfferAddLiquidity);

        apiOfferAddLiquidityEntities.map((apiEntity) => {
            // Get parameters to call the getOfferRelevantStateAddLiquidity function
            const offerAddLiquidity = {
                maker: apiEntity.maker,
                taker: apiEntity.taker,
                makerCollateralAmount: apiEntity.makerCollateralAmount,
                takerCollateralAmount: apiEntity.takerCollateralAmount,
                makerIsLong: apiEntity.makerIsLong,
                offerExpiry: apiEntity.offerExpiry,
                minimumTakerFillAmount: apiEntity.minimumTakerFillAmount,
                poolId: apiEntity.poolId,
                salt: apiEntity.salt,
            };
            const signature = apiEntity.signature;

            callData.push({
                reference: `OfferAddLiquidity-${apiEntity.offerHash}`,
                contractAddress: apiEntity.verifyingContract,
                abi: divaContractABI,
                calls: [
                    {
                        reference: `OfferAddLiquidity-${apiEntity.offerHash}`,
                        methodName: 'getOfferRelevantStateAddLiquidity',
                        methodParameters: [offerAddLiquidity, signature],
                    },
                ],
            });
        });

        // Check validate of offerRemoveLiquidities
        const offerRemoveLiquidityEntities = await this._connection.manager.find(OfferRemoveLiquidityEntity);
        const apiOfferRemoveLiquidityEntities: OfferRemoveLiquidity[] = (
            offerRemoveLiquidityEntities as Required<OfferRemoveLiquidityEntity[]>
        ).map(offerUtils.deserializeOfferRemoveLiquidity);

        apiOfferRemoveLiquidityEntities.map((apiEntity) => {
            // Get parameters to call the getOfferRelevantStateRemoveLiquidity function
            const offerRemoveLiquidity = {
                maker: apiEntity.maker,
                taker: apiEntity.taker,
                makerCollateralAmount: apiEntity.makerCollateralAmount,
                positionTokenAmount: apiEntity.positionTokenAmount,
                makerIsLong: apiEntity.makerIsLong,
                offerExpiry: apiEntity.offerExpiry,
                minimumTakerFillAmount: apiEntity.minimumTakerFillAmount,
                poolId: apiEntity.poolId,
                salt: apiEntity.salt,
            };
            const signature = apiEntity.signature;

            callData.push({
                reference: `OfferRemoveLiquidity-${apiEntity.offerHash}`,
                contractAddress: apiEntity.verifyingContract,
                abi: divaContractABI,
                calls: [
                    {
                        reference: `OfferRemoveLiquidity-${apiEntity.offerHash}`,
                        methodName: 'getOfferRelevantStateRemoveLiquidity',
                        methodParameters: [offerRemoveLiquidity, signature],
                    },
                ],
            });
        });

        const multicallResponse: ContractCallResults = await multicall.call(callData);
        const result = multicallResponse.results;

        await Promise.all(
            apiOfferCreateContingentPoolEntities.map(async (apiEntity) => {
                const offerCreateContingentPoolInfo =
                    result[`OfferCreateContingentPool-${apiEntity.offerHash}`].callsReturnContext[0].returnValues;

                try {
                    const isInValid =
                        offerCreateContingentPoolInfo.length === 0 ||
                        offerCreateContingentPoolInfo[0][1] !== OfferStatus.Fillable;
                    // Delete the inValid, canceled, expired offerCreateContingentPools
                    if (isInValid) {
                        await this._connection.manager.delete(OfferCreateContingentPoolEntity, apiEntity.offerHash);
                    }
                } catch (err) {
                    logger.warn(
                        'Error deleting offerCreateContingentPool using offerHash = ',
                        apiEntity.offerHash,
                        '.',
                    );
                }
            }),
        );

        await Promise.all(
            apiOfferAddLiquidityEntities.map(async (apiEntity) => {
                const offerAddLiquidityInfo =
                    result[`OfferAddLiquidity-${apiEntity.offerHash}`].callsReturnContext[0].returnValues;

                try {
                    const isInValid =
                        offerAddLiquidityInfo.length === 0 || offerAddLiquidityInfo[0][1] !== OfferStatus.Fillable;
                    // Delete the inValid, canceled, expired offerAddLiquidity
                    if (isInValid) {
                        await this._connection.manager.delete(OfferAddLiquidityEntity, apiEntity.offerHash);
                    }
                } catch (err) {
                    logger.warn('Error deleting offerAddLiquidity using offerHash = ', apiEntity.offerHash, '.');
                }
            }),
        );

        await Promise.all(
            apiOfferRemoveLiquidityEntities.map(async (apiEntity) => {
                const offerRemoveLiquidityInfo =
                    result[`OfferRemoveLiquidity-${apiEntity.offerHash}`].callsReturnContext[0].returnValues;

                try {
                    const isInValid =
                        offerRemoveLiquidityInfo.length === 0 ||
                        offerRemoveLiquidityInfo[0][1] !== OfferStatus.Fillable;
                    // Delete the inValid, canceled, expired offerAddLiquidity
                    if (isInValid) {
                        await this._connection.manager.delete(OfferRemoveLiquidityEntity, apiEntity.offerHash);
                    }
                } catch (err) {
                    logger.warn('Error deleting offerRemoveLiquidity using offerHash = ', apiEntity.offerHash, '.');
                }
            }),
        );
    }
}
