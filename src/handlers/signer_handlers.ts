import { BigNumber } from '@0x/utils';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';
import * as _ from 'lodash';

import { InternalServerError, RevertAPIError } from '../errors';
import { logger } from '../logger';
import { isAPIError, isRevertError } from '../middleware/error_handling';
import { schemas } from '../schemas/schemas';
import { SignerService } from '../services/signer_service';
import { ZeroExTransactionWithoutDomain } from '../types';
import { schemaUtils } from '../utils/schema_utils';

export class SignerHandlers {
    private readonly _signerService: SignerService;
    public static rootAsync(_req: express.Request, res: express.Response): void {
        const message = `This is the root of the Signer API.`;
        res.status(HttpStatus.OK).send({ message });
    }
    constructor(signerService: SignerService) {
        this._signerService = signerService;
    }
    public async signAndSubmitZeroExTransactionAsync(req: express.Request, res: express.Response): Promise<void> {
        schemaUtils.validateSchema(req.body, schemas.metaTransactionFillRequestSchema);

        // parse the request body
        const { zeroExTransaction, signature } = parsePostTransactionRequestBody(req);
        try {
            const {
                transactionHash,
                signedEthereumTransaction,
            } = await this._signerService.signAndSubmitZeroExTransactionAsync(zeroExTransaction, signature);
            // return the transactionReceipt
            res.status(HttpStatus.OK).send({
                transactionHash,
                signedEthereumTransaction,
            });
        } catch (e) {
            // If this is already a transformed error then just re-throw
            if (isAPIError(e)) {
                throw e;
            }
            // Wrap a Revert error as an API revert error
            if (isRevertError(e)) {
                throw new RevertAPIError(e);
            }
            logger.info('Uncaught error', e);
            throw new InternalServerError(e.message);
        }
    }
}

interface PostTransactionRequestBody {
    zeroExTransaction: ZeroExTransactionWithoutDomain;
    signature: string;
}

const parsePostTransactionRequestBody = (req: any): PostTransactionRequestBody => {
    const requestBody = req.body;
    const signature = requestBody.signature;
    const zeroExTransaction: ZeroExTransactionWithoutDomain = {
        salt: new BigNumber(requestBody.zeroExTransaction.salt),
        expirationTimeSeconds: new BigNumber(requestBody.zeroExTransaction.expirationTimeSeconds),
        gasPrice: new BigNumber(requestBody.zeroExTransaction.gasPrice),
        signerAddress: requestBody.zeroExTransaction.signerAddress,
        data: requestBody.zeroExTransaction.data,
    };
    return {
        zeroExTransaction,
        signature,
    };
};
