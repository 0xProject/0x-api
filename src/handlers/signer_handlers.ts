import { ERC20BridgeSource, SwapQuoterError } from '@0x/asset-swapper';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';

import { CHAIN_ID } from '../config';
import { DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE } from '../constants';
import { InternalServerError, RevertAPIError, ValidationError, ValidationErrorCodes } from '../errors';
import { logger } from '../logger';
import { isAPIError, isRevertError } from '../middleware/error_handling';
import { schemas } from '../schemas/schemas';
import { SignerService } from '../services/signer_service';
import { TokenMetadatasForChains } from '../token_metadatas_for_networks';
import { ChainId, GetSwapQuoteRequestParams } from '../types';
import { schemaUtils } from '../utils/schema_utils';
import { findTokenAddress, isETHSymbol } from '../utils/token_metadata_utils';

export class SignerHandlers {
    private readonly _signerService: SignerService;
    public static rootAsync(_req: express.Request, res: express.Response): void {
        const message = `This is the root of the Signer API.`;
        res.status(HttpStatus.OK).send({ message });
    }
    constructor(signerService: SignerService) {
        this._signerService = signerService;
    }
    public async whitelistZeroExTransactionAsync(req: express.Request, res: express.Response): Promise<void> {
        // TODO(fabio): Implement me
    }
    public async signZeroExTransactionAsync(req: express.Request, res: express.Response): Promise<void> {
        // TODO(fabio):
        // Get 0x txn and signature from body
        // Verify that affiliate fee is included
        // Verify that order and 0x txn don't expire in less than 60sec
        // Verify that 0x txn hash has been whitelisted

        // parse query params
        const {
            sellToken,
            buyToken,
            sellAmount,
            buyAmount,
            takerAddress,
            slippagePercentage,
            gasPrice,
            excludedSources,
        } = parseGetSwapQuoteRequestParams(req);
        const isETHSell = isETHSymbol(sellToken);
        const sellTokenAddress = findTokenAddressOrThrowApiError(sellToken, 'sellToken', CHAIN_ID);
        const buyTokenAddress = findTokenAddressOrThrowApiError(buyToken, 'buyToken', CHAIN_ID);
        try {
            const swapQuote = await this._signerService.calculateSwapQuoteAsync({
                buyTokenAddress,
                sellTokenAddress,
                buyAmount,
                sellAmount,
                from: takerAddress,
                isETHSell,
                slippagePercentage,
                gasPrice,
                excludedSources,
            });
            res.status(HttpStatus.OK).send(swapQuote);
        } catch (e) {
            // If this is already a transformed error then just re-throw
            if (isAPIError(e)) {
                throw e;
            }
            // Wrap a Revert error as an API revert error
            if (isRevertError(e)) {
                throw new RevertAPIError(e);
            }
            const errorMessage: string = e.message;
            // TODO AssetSwapper can throw raw Errors or InsufficientAssetLiquidityError
            if (
                errorMessage.startsWith(SwapQuoterError.InsufficientAssetLiquidity) ||
                errorMessage.startsWith('NO_OPTIMAL_PATH')
            ) {
                throw new ValidationError([
                    {
                        field: buyAmount ? 'buyAmount' : 'sellAmount',
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: SwapQuoterError.InsufficientAssetLiquidity,
                    },
                ]);
            }
            if (errorMessage.startsWith(SwapQuoterError.AssetUnavailable)) {
                throw new ValidationError([
                    {
                        field: 'token',
                        code: ValidationErrorCodes.ValueOutOfRange,
                        reason: e.message,
                    },
                ]);
            }
            logger.info('Uncaught error', e);
            throw new InternalServerError(e.message);
        }
    }
    // tslint:disable-next-line:prefer-function-over-method
    public async getSwapTokensAsync(_req: express.Request, res: express.Response): Promise<void> {
        const tokens = TokenMetadatasForChains.map(tm => ({
            symbol: tm.symbol,
            address: tm.tokenAddresses[CHAIN_ID],
            name: tm.name,
            decimals: tm.decimals,
        }));
        const filteredTokens = tokens.filter(t => t.address !== NULL_ADDRESS);
        res.status(HttpStatus.OK).send({ records: filteredTokens });
    }
}

const findTokenAddressOrThrowApiError = (address: string, field: string, chainId: ChainId): string => {
    try {
        return findTokenAddress(address, chainId);
    } catch (e) {
        throw new ValidationError([
            {
                field,
                code: ValidationErrorCodes.ValueOutOfRange,
                reason: e.message,
            },
        ]);
    }
};

const parseStringArrForERC20BridgeSources = (excludedSources: string[]): ERC20BridgeSource[] => {
    return excludedSources.filter((source: string) => source in ERC20BridgeSource) as ERC20BridgeSource[];
};

const parseGetSwapQuoteRequestParams = (req: express.Request): GetSwapQuoteRequestParams => {
    // HACK typescript typing does not allow this valid json-schema
    schemaUtils.validateSchema(req.query, schemas.swapQuoteRequestSchema as any);
    const takerAddress = req.query.takerAddress;
    const sellToken = req.query.sellToken;
    const buyToken = req.query.buyToken;
    const sellAmount = req.query.sellAmount === undefined ? undefined : new BigNumber(req.query.sellAmount);
    const buyAmount = req.query.buyAmount === undefined ? undefined : new BigNumber(req.query.buyAmount);
    const gasPrice = req.query.gasPrice === undefined ? undefined : new BigNumber(req.query.gasPrice);
    const slippagePercentage = Number.parseFloat(req.query.slippagePercentage || DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE);
    const excludedSources = req.query.excludedSources === undefined ? undefined : parseStringArrForERC20BridgeSources(req.query.excludedSources.split(','));
    return { takerAddress, sellToken, buyToken, sellAmount, buyAmount, slippagePercentage, gasPrice, excludedSources };
};
