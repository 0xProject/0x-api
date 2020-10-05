import { QuoteReport } from '@0x/asset-swapper';
import { ContractTxFunctionObj } from '@0x/base-contract';
import { ContractWrappers } from '@0x/contract-wrappers';
import {
    assetDataUtils,
    generatePseudoRandomSalt,
    getExchangeMetaTransactionHash,
    getExchangeProxyMetaTransactionHash,
    SupportedProvider,
    ZeroExTransaction,
} from '@0x/order-utils';
import { PartialTxParams } from '@0x/subproviders';
import { ExchangeProxyMetaTransaction, SignedOrder } from '@0x/types';
import { BigNumber, RevertError } from '@0x/utils';
import { utils as web3WrapperUtils } from '@0x/web3-wrapper/lib/src/utils';
import { Connection, Repository } from 'typeorm';

import { CHAIN_ID, META_TXN_RELAY_EXPECTED_MINED_SEC, META_TXN_SUBMIT_WHITELISTED_API_KEYS } from '../config';
import {
    DEFAULT_VALIDATION_GAS_LIMIT,
    NULL_ADDRESS,
    ONE_GWEI,
    ONE_MINUTE_MS,
    ONE_SECOND_MS,
    PROTOCOL_FEE,
    PUBLIC_ADDRESS_FOR_ETH_CALLS,
    SIGNER_STATUS_DB_KEY,
    SUBMITTED_TX_DB_POLLING_INTERVAL_MS,
    TEN_MINUTES_MS,
    TX_HASH_RESPONSE_WAIT_TIME_MS,
} from '../constants';
import { KeyValueEntity, TransactionEntity } from '../entities';
import { logger } from '../logger';
import {
    CalculateMetaTransactionQuoteParams,
    CalculateMetaTransactionQuoteResponse,
    CalculateSwapQuoteParams,
    ExchangeProxyMetaTransactionWithoutDomain,
    GetMetaTransactionQuoteResponseV0,
    GetMetaTransactionQuoteResponseV1,
    GetSwapQuoteResponse,
    PostTransactionResponseV0,
    PostTransactionResponseV1,
    SwapVersion,
    TransactionStates,
    TransactionWatcherSignerStatus,
    ZeroExTransactionWithoutDomain,
} from '../types';
import { ethGasStationUtils } from '../utils/gas_station_utils';
import { quoteReportUtils } from '../utils/quote_report_utils';
import { serviceUtils } from '../utils/service_utils';
import { utils } from '../utils/utils';

interface SwapService {
    calculateSwapQuoteAsync(params: CalculateSwapQuoteParams): Promise<GetSwapQuoteResponse>;
}

export class MetaTransactionService {
    private readonly _provider: SupportedProvider;
    private readonly _contractWrappers: ContractWrappers;
    private readonly _connection: Connection;
    private readonly _transactionEntityRepository: Repository<TransactionEntity>;
    private readonly _kvRepository: Repository<KeyValueEntity>;
    private readonly _swapService: SwapService;

    public static isEligibleForFreeMetaTxn(apiKey: string): boolean {
        return META_TXN_SUBMIT_WHITELISTED_API_KEYS.includes(apiKey);
    }

    constructor(provider: SupportedProvider, dbConnection: Connection, swapService: SwapService) {
        this._provider = provider;
        this._contractWrappers = new ContractWrappers(this._provider, { chainId: CHAIN_ID });
        this._connection = dbConnection;
        this._transactionEntityRepository = this._connection.getRepository(TransactionEntity);
        this._kvRepository = this._connection.getRepository(KeyValueEntity);
        this._swapService = swapService;
    }

    public async calculateMetaTransactionPriceAsync(
        params: CalculateMetaTransactionQuoteParams,
    ): Promise<CalculateMetaTransactionQuoteResponse> {
        return this._calculateMetaTransactionQuoteAsync(params, false);
    }

    public async calculateMetaTransactionQuoteAsync(
        params: CalculateMetaTransactionQuoteParams,
    ): Promise<
        (GetMetaTransactionQuoteResponseV0 | GetMetaTransactionQuoteResponseV1) & { quoteReport?: QuoteReport }
    > {
        const { swapVersion } = params;
        const quote = await this._calculateMetaTransactionQuoteAsync(params, true);
        const commonQuoteFields = {
            price: quote.price,
            sellTokenAddress: params.sellTokenAddress,
            buyTokenAddress: params.buyTokenAddress,
            buyAmount: quote.buyAmount,
            sellAmount: quote.sellAmount,
            orders: quote.orders,
            sources: quote.sources,
            gasPrice: quote.gasPrice,
            estimatedGas: quote.estimatedGas,
            gas: quote.estimatedGas,
            protocolFee: quote.protocolFee,
            minimumProtocolFee: quote.minimumProtocolFee,
            estimatedGasTokenRefund: ZERO,
            value: quote.protocolFee,
            allowanceTarget: quote.allowanceTarget,
            quoteReport: quote.quoteReport,
        };

        const shouldLogQuoteReport = quote.quoteReport && params.apiKey !== undefined;

        if (swapVersion === SwapVersion.V0) {
            // Go through the Exchange.
            const emtx = this._generateExchangeMetaTransaction(
                quote.orders,
                quote.sellAmount,
                quote.buyAmount,
                quote.orders.map(order => order.signature),
                quote.takerAddress,
                normalizeGasPrice(quote.gasPrice),
            );

            const emtxHash = getExchangeMetaTransactionHash(emtx);
            // log quote report and associate with txn hash if this is an RFQT firm quote
            if (shouldLogQuoteReport) {
                quoteReportUtils.logQuoteReport({
                    submissionBy: 'metaTxn',
                    quoteReport: quote.quoteReport,
                    zeroExTransactionHash: emtxHash,
                });
            }
            return {
                ...commonQuoteFields,
                zeroExTransaction: emtx,
                zeroExTransactionHash: emtxHash,
            };
        }
        // Go through the Exchange Proxy.
        const epmtx = this._generateExchangeProxyMetaTransaction(
            quote.callData,
            quote.takerAddress,
            normalizeGasPrice(quote.gasPrice),
            calculateProtocolFeeRequiredForOrders(swapVersion, normalizeGasPrice(quote.gasPrice), quote.orders),
        );

        const mtxHash = getExchangeProxyMetaTransactionHash(epmtx);

        // log quote report and associate with txn hash if this is an RFQT firm quote
        if (shouldLogQuoteReport) {
            quoteReportUtils.logQuoteReport({
                submissionBy: 'metaTxn',
                quoteReport: quote.quoteReport,
                zeroExTransactionHash: mtxHash,
            });
        }
        return {
            ...commonQuoteFields,
            mtx: epmtx,
            mtxHash,
        };
    }

    public async findTransactionByHashAsync(refHash: string): Promise<TransactionEntity | undefined> {
        return this._transactionEntityRepository.findOne({
            where: [{ refHash }, { txHash: refHash }],
        });
    }

    public async validateTransactionFillAsync(
        swapVersion: SwapVersion,
        mtx: ZeroExTransactionWithoutDomain | ExchangeProxyMetaTransactionWithoutDomain,
        signature: string,
    ): Promise<void> {
        const { executeCall, protocolFee, gasPrice } = this._getMetaTransactionExecutionDetails(
            swapVersion,
            mtx,
            signature,
        );

        if (!isExchangeProxyMetaTransaction(swapVersion, mtx)) {
            if (!mtx.gasPrice.eq(gasPrice)) {
                throw new Error('mtx gas price mismatch');
            }
        } else {
            if (mtx.maxGasPrice.lt(gasPrice) || mtx.minGasPrice.gt(gasPrice)) {
                throw new Error('mtx gas price out of range');
            }
            if (!mtx.value.eq(protocolFee)) {
                throw new Error('mtx value mismatch');
            }
            if (mtx.sender !== NULL_ADDRESS) {
                throw new Error('mtx sender mismatch');
            }
        }

        // Must not expire in the next 60 seconds.
        const sixtySecondsFromNow = (Date.now() + ONE_MINUTE_MS) / ONE_SECOND_MS;
        if (mtx.expirationTimeSeconds.lte(sixtySecondsFromNow)) {
            throw new Error('mtx expirationTimeSeconds in less than 60 seconds from now');
        }

        // Make sure gasPrice is not 3X the current fast EthGasStation gas price
        const currentFastGasPrice = await ethGasStationUtils.getGasPriceOrThrowAsync();
        // tslint:disable-next-line:custom-no-magic-numbers
        if (currentFastGasPrice.lt(gasPrice) && gasPrice.minus(currentFastGasPrice).gte(currentFastGasPrice.times(3))) {
            throw new Error('Gas price too high');
        }

        try {
            executeCall.callAsync({
                gasPrice,
                from: PUBLIC_ADDRESS_FOR_ETH_CALLS,
                value: protocolFee,
                gas: DEFAULT_VALIDATION_GAS_LIMIT,
            });
        } catch (err) {
            // we reach into the underlying revert and throw it instead of
            // catching it at the MetaTransactionHandler level to provide more
            // information.
            if (err.values && err.values.errorData && err.values.errorData !== '0x') {
                throw RevertError.decode(err.values.errorData, false);
            }
            throw err;
        }
    }

    public getTransactionHash(
        swapVersion: SwapVersion,
        mtx: ZeroExTransactionWithoutDomain | ExchangeProxyMetaTransactionWithoutDomain,
    ): string {
        if (!isExchangeProxyMetaTransaction(swapVersion, mtx)) {
            return getExchangeMetaTransactionHash({
                ...mtx,
                domain: {
                    chainId: CHAIN_ID,
                    verifyingContract: this._contractWrappers.exchange.address,
                },
            });
        }
        return getExchangeProxyMetaTransactionHash({
            ...mtx,
            domain: {
                chainId: CHAIN_ID,
                verifyingContract: this._contractWrappers.exchangeProxy.address,
            },
        });
    }

    public async generatePartialExecuteTransactionEthereumTransactionAsync(
        swapVersion: SwapVersion,
        mtx: ZeroExTransactionWithoutDomain | ExchangeProxyMetaTransactionWithoutDomain,
        signature: string,
    ): Promise<PartialTxParams> {
        const { callTarget, gasPrice, protocolFee, executeCall } = this._getMetaTransactionExecutionDetails(
            swapVersion,
            mtx,
            signature,
        );
        const gas = await executeCall.estimateGasAsync({
            from: PUBLIC_ADDRESS_FOR_ETH_CALLS,
            gasPrice,
            value: protocolFee,
        });
        const executeTxnCalldata = executeCall.getABIEncodedTransactionData();

        const ethereumTxnParams: PartialTxParams = {
            data: executeTxnCalldata,
            gas: web3WrapperUtils.encodeAmountAsHexString(gas),
            gasPrice: web3WrapperUtils.encodeAmountAsHexString(gasPrice),
            value: web3WrapperUtils.encodeAmountAsHexString(protocolFee),
            to: callTarget,
            chainId: CHAIN_ID,
            // NOTE we arent returning nonce and from fields back to the user
            nonce: '',
            from: '',
        };

        return ethereumTxnParams;
    }

    public async submitTransactionAsync(
        swapVersion: SwapVersion,
        mtxHash: string,
        mtx: ZeroExTransactionWithoutDomain | ExchangeProxyMetaTransactionWithoutDomain,
        signature: string,
        apiKey: string,
        affiliateAddress?: string,
    ): Promise<PostTransactionResponseV0 | PostTransactionResponseV1> {
        const { callTarget, gasPrice, protocolFee, executeCall, signer } = this._getMetaTransactionExecutionDetails(
            swapVersion,
            mtx,
            signature,
        );

        const txCalldata = serviceUtils.attributeCallData(executeCall.getABIEncodedTransactionData(), affiliateAddress);
        const transactionEntity = TransactionEntity.make({
            apiKey,
            gasPrice,
            data: txCalldata.affiliatedData,
            refHash: mtxHash,
            status: TransactionStates.Unsubmitted,
            takerAddress: signer,
            to: callTarget,
            value: protocolFee,
            expectedMinedInSec: META_TXN_RELAY_EXPECTED_MINED_SEC,
        });
        await this._transactionEntityRepository.save(transactionEntity);
        const { txHash } = await this._waitUntilTxHashAsync(transactionEntity);
        if (swapVersion === SwapVersion.V0) {
            return {
                ethereumTransactionHash: txHash,
                zeroExTransactionHash: mtxHash,
            };
        }
        return { txHash, mtxHash };
    }

    public async isSignerLiveAsync(): Promise<boolean> {
        const statusKV = await this._kvRepository.findOne(SIGNER_STATUS_DB_KEY);
        if (utils.isNil(statusKV) || utils.isNil(statusKV.value)) {
            logger.error({
                message: `signer status entry is not present in the database`,
            });
            return false;
        }
        const signerStatus: TransactionWatcherSignerStatus = JSON.parse(statusKV.value);
        const hasUpdatedRecently =
            !utils.isNil(statusKV.updatedAt) && statusKV.updatedAt.getTime() > Date.now() - TEN_MINUTES_MS;
        // tslint:disable-next-line:no-boolean-literal-compare
        return signerStatus.live === true && hasUpdatedRecently;
    }

    private async _waitUntilTxHashAsync(txEntity: TransactionEntity): Promise<{ txHash: string }> {
        return utils.runWithTimeout(async () => {
            while (true) {
                const tx = await this._transactionEntityRepository.findOne(txEntity.refHash);
                if (!utils.isNil(tx) && !utils.isNil(tx.txHash) && !utils.isNil(tx.data)) {
                    return { ethereumTransactionHash: tx.txHash };
                }

                await utils.delayAsync(SUBMITTED_TX_DB_POLLING_INTERVAL_MS);
            }
        }, TX_HASH_RESPONSE_WAIT_TIME_MS);
    }

    private _generateExchangeMetaTransaction(
        orders: SignedOrder[],
        sellAmount: BigNumber | undefined,
        buyAmount: BigNumber | undefined,
        signatures: string[],
        takerAddress: string,
        gasPrice: BigNumber,
    ): ZeroExTransaction {
        // generate txData for marketSellOrdersFillOrKill or marketBuyOrdersFillOrKill
        let txData: string;
        if (sellAmount !== undefined) {
            txData = this._contractWrappers.exchange
                .marketSellOrdersFillOrKill(orders, sellAmount, signatures)
                .getABIEncodedTransactionData();
        } else if (buyAmount !== undefined) {
            txData = this._contractWrappers.exchange
                .marketBuyOrdersFillOrKill(orders, buyAmount, signatures)
                .getABIEncodedTransactionData();
        } else {
            throw new Error('sellAmount or buyAmount required');
        }

        // generate the zeroExTransaction object
        return {
            gasPrice,
            expirationTimeSeconds: createExpirationTime(),
            data: txData,
            salt: generatePseudoRandomSalt(),
            signerAddress: takerAddress,
            domain: {
                chainId: CHAIN_ID,
                verifyingContract: this._contractWrappers.exchange.address,
            },
        };
    }

    private _generateExchangeProxyMetaTransaction(
        callData: string,
        takerAddress: string,
        gasPrice: BigNumber,
        protocolFee: BigNumber,
    ): ExchangeProxyMetaTransaction {
        return {
            callData,
            minGasPrice: gasPrice,
            maxGasPrice: gasPrice,
            expirationTimeSeconds: createExpirationTime(),
            salt: generatePseudoRandomSalt(),
            signer: takerAddress,
            sender: NULL_ADDRESS,
            feeAmount: ZERO,
            feeToken: NULL_ADDRESS,
            value: protocolFee,
            domain: {
                chainId: CHAIN_ID,
                verifyingContract: this._contractWrappers.exchangeProxy.address,
            },
        };
    }

    private async _calculateMetaTransactionQuoteAsync(
        params: CalculateMetaTransactionQuoteParams,
        isQuote: boolean = true,
    ): Promise<CalculateMetaTransactionQuoteResponse> {
        const quoteParams = {
            skipValidation: true,
            rfqt: {
                apiKey: params.apiKey,
                takerAddress: params.takerAddress,
                intentOnFilling: isQuote,
                isIndicative: !isQuote,
            },
            isMetaTransaction: true,
            ...params,
        };

        const quote = await this._swapService.calculateSwapQuoteAsync(quoteParams);
        return {
            takerAddress: params.takerAddress,
            price: quote.price,
            gasPrice: quote.gasPrice,
            protocolFee: quote.protocolFee,
            minimumProtocolFee: quote.protocolFee,
            sources: quote.sources,
            buyAmount: quote.buyAmount,
            sellAmount: quote.sellAmount,
            estimatedGas: quote.estimatedGas,
            allowanceTarget: quote.allowanceTarget,
            orders: quote.orders,
            callData: quote.data,
            quoteReport: quote.quoteReport,
        };
    }

    private _calculateProtocolFeeRequiredForMetaTransaction(
        swapVersion: SwapVersion,
        mtx: ZeroExTransactionWithoutDomain | ExchangeProxyMetaTransactionWithoutDomain,
    ): BigNumber {
        if (!isExchangeProxyMetaTransaction(swapVersion, mtx)) {
            const decoded = this._contractWrappers.getAbiDecoder().decodeCalldataOrThrow(mtx.data, 'Exchange');
            const supportedFunctions = ['marketSellOrdersFillOrKill', 'marketBuyOrdersFillOrKill'];
            if (!supportedFunctions.includes(decoded.functionName)) {
                throw new Error('unsupported meta-transaction function');
            }
            return calculateProtocolFeeRequiredForOrders(swapVersion, mtx.gasPrice, decoded.functionArguments.orders);
        } else {
            const decoded = this._contractWrappers.getAbiDecoder().decodeCalldataOrThrow(mtx.callData, 'ExchangeProxy');
            const supportedFunctions = ['transformERC20'];
            if (!supportedFunctions.includes(decoded.functionName)) {
                throw new Error('unsupported meta-transaction function');
            }
            return calculateProtocolFeeRequiredForOrders(
                swapVersion,
                mtx.minGasPrice,
                decoded.functionArguments.orders,
            );
        }
    }

    private _getMetaTransactionExecutionDetails(
        swapVersion: SwapVersion,
        mtx: ZeroExTransactionWithoutDomain | ExchangeProxyMetaTransactionWithoutDomain,
        signature: string,
    ): {
        callTarget: string;
        executeCall: ContractTxFunctionObj<string>;
        protocolFee: BigNumber;
        gasPrice: BigNumber;
        signer: string;
    } {
        if (isExchangeProxyMetaTransaction(swapVersion, mtx)) {
            return {
                callTarget: this._contractWrappers.exchangeProxy.address,
                executeCall: this._contractWrappers.exchangeProxy.executeMetaTransaction(mtx, signature),
                protocolFee: this._calculateProtocolFeeRequiredForMetaTransaction(swapVersion, mtx),
                gasPrice: mtx.minGasPrice,
                signer: mtx.signer,
            };
        }
        return {
            callTarget: this._contractWrappers.exchange.address,
            executeCall: this._contractWrappers.exchange.executeTransaction(mtx, signature),
            protocolFee: this._calculateProtocolFeeRequiredForMetaTransaction(swapVersion, mtx),
            gasPrice: mtx.gasPrice,
            signer: mtx.signerAddress,
        };
    }
}

/**
 * Check if `_mtx` is of a `ZeroExTransactionWithoutDomain` or a `ExchangeProxyMetaTransactionWithoutDomain`
 * depending on `swapVersion`.
 */
export function isExchangeProxyMetaTransaction(
    swapVersion: SwapVersion,
    _mtx: ZeroExTransactionWithoutDomain | ExchangeProxyMetaTransactionWithoutDomain,
): _mtx is ExchangeProxyMetaTransactionWithoutDomain {
    return swapVersion === SwapVersion.V1;
}

function normalizeGasPrice(gasPrice: BigNumber): BigNumber {
    return gasPrice
        .div(ONE_GWEI)
        .integerValue(BigNumber.ROUND_UP)
        .times(ONE_GWEI);
}

function createExpirationTime(): BigNumber {
    return new BigNumber(Date.now() + TEN_MINUTES_MS).div(ONE_SECOND_MS).integerValue(BigNumber.ROUND_CEIL);
}

function calculateProtocolFeeRequiredForOrders(
    swapVersion: SwapVersion,
    gasPrice: BigNumber,
    orders: SignedOrder[],
): BigNumber {
    if (swapVersion === SwapVersion.V0) {
        return gasPrice.times(PROTOCOL_FEE).times(orders.length);
    }
    const nativeOrderCount = orders.filter(o =>
        assetDataUtils.isERC20BridgeAssetData(assetDataUtils.decodeAssetDataOrThrow(o.makerAssetData)),
    ).length;
    return gasPrice.times(nativeOrderCount);
}
// tslint:disable-next-line: max-file-line-count
