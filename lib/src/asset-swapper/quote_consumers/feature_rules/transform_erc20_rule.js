"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformERC20Rule = void 0;
const contract_addresses_1 = require("@0x/contract-addresses");
const protocol_utils_1 = require("@0x/protocol-utils");
const types_1 = require("../../types");
const constants_1 = require("../../constants");
const utils_1 = require("@0x/utils");
const quote_consumer_utils_1 = require("../quote_consumer_utils");
const constants_2 = require("../../utils/market_operation_utils/constants");
const abstract_feature_rule_1 = require("./abstract_feature_rule");
const _ = require("lodash");
const { NULL_ADDRESS, ZERO_AMOUNT } = constants_1.constants;
const MAX_UINT256 = new utils_1.BigNumber(2).pow(256).minus(1);
class TransformERC20Rule extends abstract_feature_rule_1.AbstractFeatureRule {
    constructor(chainId, contractAddresses, exchangeProxy, transformerNonces) {
        super();
        this.chainId = chainId;
        this.contractAddresses = contractAddresses;
        this.exchangeProxy = exchangeProxy;
        this.transformerNonces = transformerNonces;
    }
    static create(chainId, contractAddresses) {
        return new TransformERC20Rule(chainId, contractAddresses, (0, quote_consumer_utils_1.createExchangeProxyWithoutProvider)(contractAddresses.exchangeProxy), (0, quote_consumer_utils_1.getTransformerNonces)(contractAddresses));
    }
    // TransformERC20 is the most generic feature that is compatible with all kinds of swaps.
    isCompatible() {
        return true;
    }
    createCalldata(quote, opts) {
        // TODO(kyu-c): further breakdown calldata creation logic.
        const { sellTokenAffiliateFees, buyTokenAffiliateFees, positiveSlippageFee, isFromETH, isToETH, shouldSellEntireBalance, } = opts;
        const swapContext = this.getSwapContext(quote, opts);
        const { sellToken, buyToken, sellAmount, ethAmount } = swapContext;
        let minBuyAmount = swapContext.minBuyAmount;
        // Build up the transformations.
        const transformations = [];
        // Create an AffiliateFeeTransformer if there are fees in sell token.
        // Must be before the FillQuoteTransformer.
        // Also prefer to take fees in ETH if possible, so must be before the WETH transformer.
        if (sellTokenAffiliateFees.length > 0) {
            transformations.push({
                deploymentNonce: this.transformerNonces.affiliateFeeTransformer,
                data: (0, protocol_utils_1.encodeAffiliateFeeTransformerData)({
                    fees: sellTokenAffiliateFees
                        .filter((fee) => fee.sellTokenFeeAmount.gt(0))
                        .map((fee) => ({
                        token: isFromETH ? protocol_utils_1.ETH_TOKEN_ADDRESS : sellToken,
                        amount: fee.sellTokenFeeAmount,
                        recipient: fee.recipient,
                    })),
                }),
            });
        }
        // Create a WETH wrapper if coming from ETH.
        // Don't add the wethTransformer to CELO. There is no wrap/unwrap logic for CELO.
        if (isFromETH && this.chainId !== contract_addresses_1.ChainId.Celo) {
            transformations.push({
                deploymentNonce: this.transformerNonces.wethTransformer,
                data: (0, protocol_utils_1.encodeWethTransformerData)({
                    token: protocol_utils_1.ETH_TOKEN_ADDRESS,
                    amount: shouldSellEntireBalance ? MAX_UINT256 : sellAmount,
                }),
            });
        }
        // Add the FillQuoteTransformer (FQT), which will convert the sell token to the buy token.
        transformations.push(...this.createFillQuoteTransformations(quote, opts));
        // Create a WETH unwrapper if going to ETH.
        // Dont add the wethTransformer on CELO. There is no wrap/unwrap logic for CELO.
        if (isToETH && this.chainId !== contract_addresses_1.ChainId.Celo) {
            transformations.push({
                deploymentNonce: this.transformerNonces.wethTransformer,
                data: (0, protocol_utils_1.encodeWethTransformerData)({
                    token: constants_2.NATIVE_FEE_TOKEN_BY_CHAIN_ID[this.chainId],
                    amount: MAX_UINT256,
                }),
            });
        }
        let gasOverhead = ZERO_AMOUNT;
        const buyTokenFees = [...buyTokenAffiliateFees];
        positiveSlippageFee && buyTokenFees.push(positiveSlippageFee); // Append positive slippage fee if present
        buyTokenFees.forEach((fee) => {
            const { feeType, buyTokenFeeAmount, recipient: feeRecipient } = fee;
            if (feeRecipient === NULL_ADDRESS) {
                return;
            }
            else if (feeType === types_1.AffiliateFeeType.None) {
                return;
            }
            else if (feeType === types_1.AffiliateFeeType.PositiveSlippageFee) {
                // bestCaseAmountWithSurplus is used to cover gas cost of sending positive slipapge fee to fee recipient
                // this helps avoid sending dust amounts which are not worth the gas cost to transfer
                let bestCaseAmountWithSurplus = quote.bestCaseQuoteInfo.makerAmount
                    .plus(constants_1.POSITIVE_SLIPPAGE_FEE_TRANSFORMER_GAS.multipliedBy(quote.gasPrice).multipliedBy(quote.makerAmountPerEth))
                    .integerValue();
                // In the event makerAmountPerEth is unknown, we only allow for positive slippage which is greater than
                // the best case amount
                bestCaseAmountWithSurplus = utils_1.BigNumber.max(bestCaseAmountWithSurplus, quote.bestCaseQuoteInfo.makerAmount);
                transformations.push({
                    deploymentNonce: this.transformerNonces.positiveSlippageFeeTransformer,
                    data: (0, protocol_utils_1.encodePositiveSlippageFeeTransformerData)({
                        token: isToETH ? protocol_utils_1.ETH_TOKEN_ADDRESS : buyToken,
                        bestCaseAmount: bestCaseAmountWithSurplus,
                        recipient: feeRecipient,
                    }),
                });
                // This may not be visible at eth_estimateGas time, so we explicitly add overhead
                gasOverhead = constants_1.POSITIVE_SLIPPAGE_FEE_TRANSFORMER_GAS.plus(gasOverhead);
            }
            else if (feeType === types_1.AffiliateFeeType.PercentageFee) {
                // This transformer pays affiliate fees.
                if (buyTokenFeeAmount.isGreaterThan(0)) {
                    transformations.push({
                        deploymentNonce: this.transformerNonces.affiliateFeeTransformer,
                        data: (0, protocol_utils_1.encodeAffiliateFeeTransformerData)({
                            fees: [
                                {
                                    token: isToETH ? protocol_utils_1.ETH_TOKEN_ADDRESS : buyToken,
                                    amount: buyTokenFeeAmount,
                                    recipient: feeRecipient,
                                },
                            ],
                        }),
                    });
                    // Adjust the minimum buy amount by the fee.
                    minBuyAmount = utils_1.BigNumber.max(0, minBuyAmount.minus(buyTokenFeeAmount));
                }
            }
            else if (feeType === types_1.AffiliateFeeType.GaslessFee) {
                if (buyTokenFeeAmount.isGreaterThan(0)) {
                    transformations.push({
                        deploymentNonce: this.transformerNonces.affiliateFeeTransformer,
                        data: (0, protocol_utils_1.encodeAffiliateFeeTransformerData)({
                            fees: [
                                {
                                    token: isToETH ? protocol_utils_1.ETH_TOKEN_ADDRESS : buyToken,
                                    amount: buyTokenFeeAmount,
                                    recipient: feeRecipient,
                                },
                            ],
                        }),
                    });
                    // Adjust the minimum buy amount by the fee.
                    minBuyAmount = utils_1.BigNumber.max(0, minBuyAmount.minus(buyTokenFeeAmount));
                }
            }
            else {
                // A compile time check that we've handled all cases of feeType
                ((_) => {
                    throw new Error('unreachable');
                })(feeType);
            }
        });
        transformations.push(this.createPayTakerTransformation(quote, opts));
        const TO_ETH_ADDRESS = this.chainId === contract_addresses_1.ChainId.Celo ? this.contractAddresses.etherToken : protocol_utils_1.ETH_TOKEN_ADDRESS;
        const calldataHexString = this.exchangeProxy
            .transformERC20(isFromETH ? protocol_utils_1.ETH_TOKEN_ADDRESS : sellToken, isToETH ? TO_ETH_ADDRESS : buyToken, shouldSellEntireBalance ? MAX_UINT256 : sellAmount, minBuyAmount, transformations)
            .getABIEncodedTransactionData();
        return {
            calldataHexString,
            ethAmount,
            toAddress: this.exchangeProxy.address,
            allowanceTarget: this.exchangeProxy.address,
            gasOverhead,
        };
    }
    createFillQuoteTransformations(quote, opts) {
        const transformations = [...this.createTwoHopTransformations(quote, opts)];
        const nonTwoHopTransformation = this.createNonTwoHopTransformation(quote, opts);
        if (nonTwoHopTransformation !== undefined) {
            transformations.push(nonTwoHopTransformation);
        }
        return transformations;
    }
    createTwoHopTransformations(quote, opts) {
        // This transformer will fill the quote.
        // TODO: handle `shouldSellEntireBalance` outside.
        const { refundReceiver, shouldSellEntireBalance } = opts;
        const { sellToken, buyToken, maxSlippage } = this.getSwapContext(quote, opts);
        const slippedTwoHopOrders = quote.path.getSlippedOrdersByType(maxSlippage).twoHopOrders;
        return _.flatMap(slippedTwoHopOrders, ({ firstHopOrder, secondHopOrder }) => {
            const intermediateToken = firstHopOrder.makerToken;
            return [
                {
                    deploymentNonce: this.transformerNonces.fillQuoteTransformer,
                    data: (0, protocol_utils_1.encodeFillQuoteTransformerData)({
                        side: protocol_utils_1.FillQuoteTransformerSide.Sell,
                        sellToken,
                        buyToken: intermediateToken,
                        ...(0, quote_consumer_utils_1.getFQTTransformerDataFromOptimizedOrders)([firstHopOrder]),
                        refundReceiver: refundReceiver || NULL_ADDRESS,
                        fillAmount: !(0, quote_consumer_utils_1.isBuyQuote)(quote) && shouldSellEntireBalance ? MAX_UINT256 : firstHopOrder.takerAmount,
                    }),
                },
                {
                    deploymentNonce: this.transformerNonces.fillQuoteTransformer,
                    data: (0, protocol_utils_1.encodeFillQuoteTransformerData)({
                        side: protocol_utils_1.FillQuoteTransformerSide.Sell,
                        buyToken,
                        sellToken: intermediateToken,
                        ...(0, quote_consumer_utils_1.getFQTTransformerDataFromOptimizedOrders)([secondHopOrder]),
                        refundReceiver: refundReceiver || NULL_ADDRESS,
                        fillAmount: MAX_UINT256,
                    }),
                },
            ];
        });
    }
    createNonTwoHopTransformation(quote, opts) {
        const { refundReceiver, shouldSellEntireBalance } = opts;
        const { sellToken, buyToken, maxSlippage } = this.getSwapContext(quote, opts);
        const slippedOrdersByType = quote.path.getSlippedOrdersByType(maxSlippage);
        const fillAmount = getNonTwoHopFillAmount(quote);
        const nonTwoHopOrders = [...slippedOrdersByType.nativeOrders, ...slippedOrdersByType.bridgeOrders];
        if (nonTwoHopOrders.length === 0) {
            return undefined;
        }
        // TODO: handle `shouldSellEntireBalance` outside.
        return {
            deploymentNonce: this.transformerNonces.fillQuoteTransformer,
            data: (0, protocol_utils_1.encodeFillQuoteTransformerData)({
                side: (0, quote_consumer_utils_1.isBuyQuote)(quote) ? protocol_utils_1.FillQuoteTransformerSide.Buy : protocol_utils_1.FillQuoteTransformerSide.Sell,
                sellToken,
                buyToken,
                ...(0, quote_consumer_utils_1.getFQTTransformerDataFromOptimizedOrders)(nonTwoHopOrders),
                refundReceiver: refundReceiver || NULL_ADDRESS,
                fillAmount: !(0, quote_consumer_utils_1.isBuyQuote)(quote) && shouldSellEntireBalance ? MAX_UINT256 : fillAmount,
            }),
        };
    }
    createPayTakerTransformation(quote, opts) {
        const { sellToken } = this.getSwapContext(quote, opts);
        // Return any unspent sell tokens (including intermediate tokens from two hops if any).
        const payTakerTokens = [sellToken, ...getIntermediateTokens(quote.path.getOrdersByType().twoHopOrders)];
        // Return any unspent ETH. If ETH is the buy token, it will
        // be returned in TransformERC20Feature rather than PayTakerTransformer.
        if (!opts.isToETH) {
            payTakerTokens.push(protocol_utils_1.ETH_TOKEN_ADDRESS);
        }
        // The final transformer will send all funds to the taker.
        return {
            deploymentNonce: this.transformerNonces.payTakerTransformer,
            data: (0, protocol_utils_1.encodePayTakerTransformerData)({
                tokens: payTakerTokens,
                amounts: [],
            }),
        };
    }
}
exports.TransformERC20Rule = TransformERC20Rule;
function getIntermediateTokens(twoHopOrders) {
    return twoHopOrders.map((twoHopOrder) => twoHopOrder.firstHopOrder.makerToken);
}
function getNonTwoHopFillAmount(quote) {
    const twoHopFillAmount = getTwoHopFillAmount(quote.type, quote.path.getOrdersByType().twoHopOrders);
    if ((0, quote_consumer_utils_1.isBuyQuote)(quote)) {
        return quote.makerTokenFillAmount.minus(twoHopFillAmount);
    }
    return quote.takerTokenFillAmount.minus(twoHopFillAmount);
}
function getTwoHopFillAmount(side, twoHopOrders) {
    // BigNumber.sum() is NaN...
    if (side === types_1.MarketOperation.Sell) {
        return utils_1.BigNumber.sum(new utils_1.BigNumber(0), ...twoHopOrders.map(({ firstHopOrder }) => firstHopOrder.takerAmount));
    }
    return utils_1.BigNumber.sum(new utils_1.BigNumber(0), ...twoHopOrders.map(({ secondHopOrder }) => secondHopOrder.makerAmount));
}
//# sourceMappingURL=transform_erc20_rule.js.map