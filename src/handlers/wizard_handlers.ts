import {
    BigNumber,
    Order,
    generatePseudoRandomSalt,
    getContractAddressesForChainOrThrow,
    ChainId,
    assetDataUtils,
    RPCSubprovider,
    Web3ProviderEngine,
    signatureUtils,
    SignedOrder,
} from '0x.js';
import { DevUtilsContract, ExchangeContract } from '@0x/contract-wrappers'
import { ExchangeRevertErrors } from '@0x/contracts-exchange'
import { Web3Wrapper, SupportedProvider } from '@0x/web3-wrapper';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';
import { NULL_ADDRESS, ZERO } from '../constants';
import { CHAIN_ID } from '../config';
import { providerUtils } from '@0x/utils';
import P = require('pino');
import _ = require('lodash');
import { isValidECSignature, parseSignatureHexAsVRS } from '@0x/order-utils/lib/src/signature_utils';
import * as ethUtil from 'ethereumjs-util';

interface Step1Params {
    myAddress: string;
    buy: string;
    sell: string;
    amountBuy: BigNumber;
    amountSell: BigNumber;
}

interface Step1Response {
    help: string;
    payload: {
        order: Order;
        orderHash: string;
    },
    toSign: {
        payload: string;
        signatureOutput: string;
    },
}

interface TokenMeta {
    address: string;
    decimals: number;
}

const devUtils = new DevUtilsContract(NULL_ADDRESS, { isEIP1193: true } as SupportedProvider);

const TOKENS: {[key: string]: TokenMeta} = {
    'DAI': {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18,
    },
    'USDC': {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
    },
    'WETH': {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        decimals: 18,
    },
};
const isValidToken = (token: string): [boolean, string | null] => {
    if (TOKENS[token] === undefined) {
        return [false, `Token ${token} is not supported.`];
    } else {
        return [true, null];
    }
};

const isValidAddress = (address: string): [boolean, string | null] => {
    return Web3Wrapper.isAddress(address) ?
        [true, null] :
        [false, `String ${address} is not a valid address`];
};

const isValidNumber = (number: string): [boolean, string | null] => {
    if (!isNaN(parseInt(number))) {
        return [true, null];
    } else {
        return [false, `Value ${number} is not a valid number.`];
    }
};

const STEP_1_FIELDS = ['myAddress', 'buy', 'sell', 'amountBuy', 'amountSell'];
const VALIDATORS: {[key: string]: (s: string) => [boolean, string | null]} = {
    'buy': isValidToken,
    'sell': isValidToken,
    'amountBuy': isValidNumber,
    'amountSell': isValidNumber,
    'myAddress': isValidAddress,
};

const contractAddresses = getContractAddressesForChainOrThrow(ChainId.Mainnet)

function parseSignatureHexAsRSV(signatureHex: string): ECSignature {
    const { v, r, s } = ethUtil.fromRpcSig(signatureHex);
    const ecSignature: ECSignature = {
        v,
        r: ethUtil.bufferToHex(r),
        s: ethUtil.bufferToHex(s),
    };
    return ecSignature;
}


function parseSignature(signature: string, msgHash: string, signerAddress: string): string {
    console.log(signature)
    console.log(msgHash)
    console.log(signerAddress)
    const normalizedSignerAddress = signerAddress.toLowerCase();
    const prefixedMsgHashHex = signatureUtils.addSignedMessagePrefix(msgHash);
    // const prefixedMsgHashHex = msgHash;

    // HACK: There is no consensus on whether the signatureHex string should be formatted as
    // v + r + s OR r + s + v, and different clients (even different versions of the same client)
    // return the signature params in different orders. In order to support all client implementations,
    // we parse the signature in both ways, and evaluate if either one is a valid signature.
    // r + s + v is the most prevalent format from eth_sign, so we attempt this first.
    // tslint:disable-next-line:custom-no-magic-numbers
    const validVParamValues = [27, 28];
    const ecSignatureRSV = parseSignatureHexAsRSV(signature);
    if (_.includes(validVParamValues, ecSignatureRSV.v)) {
        const isValidRSVSignature = isValidECSignature(prefixedMsgHashHex, ecSignatureRSV, normalizedSignerAddress);
        if (isValidRSVSignature) {
            const convertedSignatureHex = signatureUtils.convertECSignatureToSignatureHex(ecSignatureRSV);
            return convertedSignatureHex;
        }
    }
    const ecSignatureVRS = parseSignatureHexAsVRS(signature);
    if (_.includes(validVParamValues, ecSignatureVRS.v)) {
        const isValidVRSSignature = isValidECSignature(prefixedMsgHashHex, ecSignatureVRS, normalizedSignerAddress);
        if (isValidVRSSignature) {
            const convertedSignatureHex = signatureUtils.convertECSignatureToSignatureHex(ecSignatureVRS);
            return convertedSignatureHex;
        }
    }

    throw new Error('Signaure is invalid');
}

export class WizardHandlers {

    private readonly _wrapper: Web3Wrapper;
    private readonly _exchangeContract: ExchangeContract;
    public constructor() {
        if (process.env.ETHEREUM_RPC_URL === undefined) {
            throw new Error(`ETHEREUM_RPC_URL does not exist`);
        }
        const providerEngine = new Web3ProviderEngine();
        const rpcSubprovider = new RPCSubprovider(process.env.ETHEREUM_RPC_URL);
        providerEngine.addProvider(rpcSubprovider);
        providerUtils.startProviderEngine(providerEngine);
        this._wrapper = new Web3Wrapper(providerEngine);
        this._exchangeContract = new ExchangeContract(contractAddresses.exchange, this._wrapper.getProvider());
    }

    public async constructStep2(req: express.Request, res: express.Response) {
        const body = req.body as Step1Response;

        const refactoredSignature = parseSignature(body.toSign.signatureOutput, body.payload.orderHash, body.payload.order.makerAddress);

        const orderInfo = await this._exchangeContract.getOrderInfo(body.payload.order).callAsync();
        if (orderInfo.orderStatus !== 3) {
            res.status(400).send({
                error: `orderInfo is ${orderInfo.orderStatus}`,
            });
            return
        }
        let isValidOrder = false;
        try {
            isValidOrder = await this._exchangeContract.isValidOrderSignature(body.payload.order, refactoredSignature).callAsync()
        } catch (e) {
            const eSig: ExchangeRevertErrors.SignatureError = e;
            res.status(400).send({
                error: eSig,
            });
            return;
        }

        const signedOrder: SignedOrder = {
            ...body.payload.order,
            signature: refactoredSignature,
        }
        res.status(200).send({
            order: signedOrder,
        });
    }

    public async constructStep1(req: express.Request, res: express.Response) {
        const paramsKeys = Object.keys(req.query);
        for (const field of STEP_1_FIELDS) {

            if (paramsKeys.indexOf(field) === -1) {
                res.status(400).send({
                    error: `Missing field '${field}'`,
                });
                return;
            }

            const [isValid, errorMsg] = VALIDATORS[field](req.query[field]);
            if (!isValid) {
                res.status(400).send({
                    error: errorMsg,
                });
                return;
            }
        }

        const params: Step1Params = {
            myAddress: req.query.myAddress,
            buy: req.query.buy,
            sell: req.query.sell,
            amountBuy: new BigNumber(req.query.amountBuy),
            amountSell: new BigNumber(req.query.amountSell),
        };

        // Construct expiration time
        const now = new Date();
        const secondsSinceEpoch = Math.round(now.getTime() / 1000);
        const expirationTimeSeconds = new BigNumber(secondsSinceEpoch + (60 * 5));

        // Construct asset amounts
        const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(params.amountSell, TOKENS[params.sell].decimals);
        const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(params.amountBuy, TOKENS[params.buy].decimals);
        const makerAssetData = assetDataUtils.encodeERC20AssetData(TOKENS[params.sell].address);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(TOKENS[params.buy].address);

        // Construct order
        const order: Order = {
            exchangeAddress: contractAddresses.exchange,
            makerAddress: params.myAddress,
            takerAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            feeRecipientAddress: NULL_ADDRESS,
            expirationTimeSeconds,
            salt: generatePseudoRandomSalt(),
            makerAssetAmount,
            takerAssetAmount,
            makerAssetData,
            takerAssetData,
            makerFee: ZERO,
            takerFee: ZERO,
            chainId: 1,
            makerFeeAssetData: '0x',
            takerFeeAssetData: '0x',
        };

        // Compute the order hash
        const orderHash = await devUtils.getOrderHash(order, new BigNumber(ChainId.Mainnet), order.exchangeAddress).callAsync();

        const response: Step1Response = {
            help: "Please sign the '.toSign.payload' field and replace the '.toSign.signatureOutput' with the hex-encoded signature",
            payload: {
                order,
                orderHash,
            },
            toSign: {
                payload: signatureUtils.addSignedMessagePrefix(orderHash),
                signatureOutput: '',
            }
        };
        res.status(HttpStatus.OK).send(response);
    }
}
