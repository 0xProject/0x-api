// tslint:disable: max-classes-per-file
import {
    assetDataUtils,
    BigNumber,
    ChainId,
    generatePseudoRandomSalt,
    getContractAddressesForChainOrThrow,
    Order,
    RPCSubprovider,
    signatureUtils,
    SignedOrder,
    Web3ProviderEngine,
} from '0x.js';
import { DevUtilsContract, ERC20TokenContract, ExchangeContract } from '@0x/contract-wrappers'
import { isValidECSignature, parseSignatureHexAsVRS } from '@0x/order-utils/lib/src/signature_utils';
import { providerUtils } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as express from 'express';
import * as HttpStatus from 'http-status-codes';
import _ = require('lodash');
import { NULL_ADDRESS, ZERO } from '../constants';

interface Step1CreateOrderParams {
    myAddress: string;
    buy: string;
    sell: string;
    amountBuy: BigNumber;
    amountSell: BigNumber;
}

interface Step1CreateOrderResponse {
    help: string;
    payload: {
        order: Order;
        orderHash: string;
    };
    toSign: {
        payload: string;
        signatureOutput: string;
    };
}

interface Step1CancelOrderParams {
    orders: Order[];
}

interface TokenMeta {
    address: string;
    decimals: number;
}

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

const contractAddresses = getContractAddressesForChainOrThrow(ChainId.Mainnet);

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

abstract class BaseWizardHandlers {
    protected readonly _wrapper: Web3Wrapper;
    protected readonly _exchangeContract: ExchangeContract;
    protected readonly _devUtils: DevUtilsContract;
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
        this._devUtils = new DevUtilsContract(contractAddresses.devUtils, this._wrapper.getProvider());
    }
}

export class AllowanceWizardHandlers extends BaseWizardHandlers {
    public async constructStep1(req: express.Request, res: express.Response) {
        const token = req.query.token;
        const myAddress = req.query.myAddress;
        const tokenAddress = TOKENS[token].address;
        const erc20Token = new ERC20TokenContract(tokenAddress, this._wrapper.getProvider());
        const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1);
        const data = erc20Token.approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE_IN_BASE_UNITS).getABIEncodedTransactionData();
        const gasUsed = await erc20Token.approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE_IN_BASE_UNITS).estimateGasAsync({
            from: myAddress,
        });
        const response: TxData = {
            data,
            from: ethUtil.toChecksumAddress(myAddress),
            to: ethUtil.toChecksumAddress(tokenAddress),
            gas: gasUsed,
            gasPrice: 40000000000,
        };
        return res.send(response);
    }
}

export class CancelOrdersWizardHandlers extends BaseWizardHandlers {

    public async constructStep1(req: express.Request, res: express.Response) {
        const cancelParams = req.body as Step1CancelOrderParams;

        const makers = new Set();
        for (const cancel of cancelParams.orders) {
            makers.add(cancel.makerAddress);
        }
        if (makers.size !== 1) {
            return res.send({
                error: 'There is more than one maker',
            });
        }
        const frm = cancelParams.orders[0].makerAddress;

        let gasUsed: number;
        let data: string;
        if (cancelParams.orders.length === 1) {
            gasUsed = await this._exchangeContract.cancelOrder(cancelParams.orders[0]).estimateGasAsync({
                from: frm,
            });
            data = this._exchangeContract.cancelOrder(cancelParams.orders[0]).getABIEncodedTransactionData();
        } else {
            gasUsed = await this._exchangeContract.batchCancelOrders(cancelParams.orders).estimateGasAsync({
                from: frm,
            });
            data = this._exchangeContract.batchCancelOrders(cancelParams.orders).getABIEncodedTransactionData();
        }

        const response: TxData = {
            data,
            from: ethUtil.toChecksumAddress(frm),
            to: ethUtil.toChecksumAddress(contractAddresses.exchange),
            gas: gasUsed,
            gasPrice: 40000000000,
        };
        return res.send(response);
    }

}

export class CreateOrderWizardHandlers extends BaseWizardHandlers {

    public async constructStep2(req: express.Request, res: express.Response) {

        const body = req.body as Step1CreateOrderResponse;

        const refactoredSignature = parseSignature(body.toSign.signatureOutput, body.payload.orderHash, body.payload.order.makerAddress);

        const orderInfo = await this._exchangeContract.getOrderInfo(body.payload.order).callAsync();
        if (orderInfo.orderStatus !== 3) {
            res.status(400).send({
                error: `orderInfo is ${orderInfo.orderStatus}`,
            });
            return;
        }

        const signedOrder: SignedOrder = {
            ...body.payload.order,
            signature: refactoredSignature,
        };
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

        const params: Step1CreateOrderParams = {
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
        const orderHash = await this._devUtils.getOrderHash(order, new BigNumber(ChainId.Mainnet), order.exchangeAddress).callAsync();

        const response: Step1CreateOrderResponse = {
            help: "Please sign the '.toSign.payload' field and replace the '.toSign.signatureOutput' with the hex-encoded signature",
            payload: {
                order,
                orderHash,
            },
            toSign: {
                payload: signatureUtils.addSignedMessagePrefix(orderHash),
                signatureOutput: '',
            },
        };
        res.status(HttpStatus.OK).send(response);
    }
}

export class GetOrderInfoWizardHandlers extends BaseWizardHandlers {

    public async constructStep1(req: express.Request, res: express.Response) {
        const body = req.body as Step1CreateOrderResponse;
        const orderInfo = await this._exchangeContract.getOrderInfo(body.payload.order).callAsync();
        const [balance, proxyAllowance] = await this._devUtils.getBalanceAndAssetProxyAllowance(body.payload.order.makerAddress, body.payload.order.makerAssetData).callAsync();

        const tokenAddress = assetDataUtils.decodeERC20AssetData(body.payload.order.makerAssetData).tokenAddress;
        const token = Object.values(TOKENS).find(el => el.address.toLowerCase() === tokenAddress.toLowerCase());
        if (token === undefined) {
            return res.status(400).send({
                error: `Token ${tokenAddress} not found.`,
            });
        }

        res.status(200).send({
            orderInfo,
            balanceInUnit: Web3Wrapper.toUnitAmount(balance, token.decimals),
            allowanceInUnit: Web3Wrapper.toUnitAmount(proxyAllowance, token.decimals),
        });
    }
}
