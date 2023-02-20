"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contract_addresses_1 = require("@0x/contract-addresses");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const chai = require("chai");
const _ = require("lodash");
require("mocha");
const constants_1 = require("../../src/asset-swapper/constants");
const exchange_proxy_swap_quote_consumer_1 = require("../../src/asset-swapper/quote_consumers/exchange_proxy_swap_quote_consumer");
const types_1 = require("../../src/asset-swapper/types");
const types_2 = require("../../src/asset-swapper/utils/market_operation_utils/types");
const chai_setup_1 = require("./utils/chai_setup");
const utils_2 = require("./utils/utils");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
const { NULL_ADDRESS } = constants_1.constants;
const { MAX_UINT256, ZERO_AMOUNT } = contracts_test_utils_1.constants;
describe('ExchangeProxySwapQuoteConsumer', () => {
    const CHAIN_ID = 1;
    const TAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const MAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const INTERMEDIATE_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const TRANSFORMER_DEPLOYER = (0, contracts_test_utils_1.randomAddress)();
    const contractAddresses = {
        ...(0, contract_addresses_1.getContractAddressesForChainOrThrow)(CHAIN_ID),
        exchangeProxy: (0, contracts_test_utils_1.randomAddress)(),
        exchangeProxyAllowanceTarget: (0, contracts_test_utils_1.randomAddress)(),
        exchangeProxyTransformerDeployer: TRANSFORMER_DEPLOYER,
        transformers: {
            wethTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, 1),
            payTakerTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, 2),
            fillQuoteTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, 3),
            affiliateFeeTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, 4),
            positiveSlippageFeeTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, 5),
        },
    };
    let consumer;
    before(async () => {
        consumer = new exchange_proxy_swap_quote_consumer_1.ExchangeProxySwapQuoteConsumer(contractAddresses, { chainId: CHAIN_ID });
    });
    function getRandomOrder(orderFields) {
        return {
            chainId: CHAIN_ID,
            verifyingContract: contractAddresses.exchangeProxy,
            expiry: (0, contracts_test_utils_1.getRandomInteger)(1, 2e9),
            feeRecipient: (0, contracts_test_utils_1.randomAddress)(),
            sender: (0, contracts_test_utils_1.randomAddress)(),
            pool: utils_1.hexUtils.random(32),
            maker: (0, contracts_test_utils_1.randomAddress)(),
            makerAmount: (0, utils_2.getRandomAmount)(),
            takerAmount: (0, utils_2.getRandomAmount)(),
            takerTokenFeeAmount: (0, utils_2.getRandomAmount)(),
            salt: (0, utils_2.getRandomAmount)(2e9),
            taker: NULL_ADDRESS,
            makerToken: MAKER_TOKEN,
            takerToken: TAKER_TOKEN,
            ...orderFields,
        };
    }
    function getRandomOptimizedMarketOrder(optimizerFields, orderFields) {
        const order = getRandomOrder(orderFields);
        return {
            source: types_2.ERC20BridgeSource.Native,
            fillData: {
                order,
                signature: (0, utils_2.getRandomSignature)(),
                maxTakerTokenFillAmount: order.takerAmount,
            },
            type: protocol_utils_1.FillQuoteTransformerOrderType.Limit,
            makerToken: order.makerToken,
            takerToken: order.takerToken,
            makerAmount: order.makerAmount,
            takerAmount: order.takerAmount,
            fill: {},
            ...optimizerFields,
        };
    }
    function getRandomQuote(side) {
        const order = getRandomOptimizedMarketOrder();
        const makerTokenFillAmount = order.makerAmount;
        const takerTokenFillAmount = order.takerAmount;
        return {
            gasPrice: (0, contracts_test_utils_1.getRandomInteger)(1, 1e9),
            makerToken: MAKER_TOKEN,
            takerToken: TAKER_TOKEN,
            orders: [order],
            makerTokenDecimals: 18,
            takerTokenDecimals: 18,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
            sourceBreakdown: {},
            isTwoHop: false,
            bestCaseQuoteInfo: {
                makerAmount: makerTokenFillAmount,
                takerAmount: takerTokenFillAmount,
                totalTakerAmount: takerTokenFillAmount,
                gas: Math.floor(Math.random() * 8e6),
                protocolFeeInWeiAmount: (0, utils_2.getRandomAmount)(),
                feeTakerTokenAmount: (0, utils_2.getRandomAmount)(),
                slippage: 0,
            },
            worstCaseQuoteInfo: {
                makerAmount: makerTokenFillAmount,
                takerAmount: takerTokenFillAmount,
                totalTakerAmount: takerTokenFillAmount,
                gas: Math.floor(Math.random() * 8e6),
                protocolFeeInWeiAmount: (0, utils_2.getRandomAmount)(),
                feeTakerTokenAmount: (0, utils_2.getRandomAmount)(),
                slippage: 0,
            },
            makerAmountPerEth: (0, contracts_test_utils_1.getRandomInteger)(1, 1e9),
            takerAmountPerEth: (0, contracts_test_utils_1.getRandomInteger)(1, 1e9),
            ...(side === types_1.MarketOperation.Buy
                ? { type: types_1.MarketOperation.Buy, makerTokenFillAmount }
                : { type: types_1.MarketOperation.Sell, takerTokenFillAmount }),
            blockNumber: 1337420,
        };
    }
    function getRandomTwoHopQuote(side) {
        return {
            ...getRandomQuote(side),
            orders: [
                getRandomOptimizedMarketOrder({ makerToken: INTERMEDIATE_TOKEN }, { makerToken: INTERMEDIATE_TOKEN }),
                getRandomOptimizedMarketOrder({ takerToken: INTERMEDIATE_TOKEN }, { takerToken: INTERMEDIATE_TOKEN }),
            ],
            isTwoHop: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
        };
    }
    function getRandomSellQuote() {
        return getRandomQuote(types_1.MarketOperation.Sell);
    }
    function getRandomBuyQuote() {
        return getRandomQuote(types_1.MarketOperation.Buy);
    }
    function cleanOrders(orders) {
        return orders.map((o) => _.omit({
            ...o.fillData,
            order: _.omit(o.fillData.order, [
                'chainId',
                'verifyingContract',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
            ]),
        }, [
            'fillableMakerAssetAmount',
            'fillableTakerAssetAmount',
            'fillableTakerFeeAmount',
            'fills',
            'chainId',
            'verifyingContract',
        ]));
    }
    const transformERC20Encoder = utils_1.AbiEncoder.createMethod('transformERC20', [
        { type: 'address', name: 'inputToken' },
        { type: 'address', name: 'outputToken' },
        { type: 'uint256', name: 'inputTokenAmount' },
        { type: 'uint256', name: 'minOutputTokenAmount' },
        {
            type: 'tuple[]',
            name: 'transformations',
            components: [
                { type: 'uint32', name: 'deploymentNonce' },
                { type: 'bytes', name: 'data' },
            ],
        },
    ]);
    describe('getCalldataOrThrow()', () => {
        it('can produce a sell quote', async () => {
            const quote = getRandomSellQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote);
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.totalTakerAmount);
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.makerAmount);
            expect(callArgs.transformations).to.be.length(2);
            expect(callArgs.transformations[0].deploymentNonce.toNumber() ===
                consumer.transformerNonces.fillQuoteTransformer);
            expect(callArgs.transformations[1].deploymentNonce.toNumber() ===
                consumer.transformerNonces.payTakerTransformer);
            const fillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(fillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(fillQuoteTransformerData.fillAmount).to.bignumber.eq(quote.takerTokenFillAmount);
            expect(fillQuoteTransformerData.limitOrders).to.deep.eq(cleanOrders(quote.orders));
            expect(fillQuoteTransformerData.limitOrders.map((o) => o.signature)).to.deep.eq(quote.orders.map((o) => o.fillData.signature));
            expect(fillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(fillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            const payTakerTransformerData = (0, protocol_utils_1.decodePayTakerTransformerData)(callArgs.transformations[1].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, protocol_utils_1.ETH_TOKEN_ADDRESS]);
        });
        it('can produce a buy quote', async () => {
            const quote = getRandomBuyQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote);
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.totalTakerAmount);
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.makerAmount);
            expect(callArgs.transformations).to.be.length(2);
            expect(callArgs.transformations[0].deploymentNonce.toNumber() ===
                consumer.transformerNonces.fillQuoteTransformer);
            expect(callArgs.transformations[1].deploymentNonce.toNumber() ===
                consumer.transformerNonces.payTakerTransformer);
            const fillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(fillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Buy);
            expect(fillQuoteTransformerData.fillAmount).to.bignumber.eq(quote.makerTokenFillAmount);
            expect(fillQuoteTransformerData.limitOrders).to.deep.eq(cleanOrders(quote.orders));
            expect(fillQuoteTransformerData.limitOrders.map((o) => o.signature)).to.deep.eq(quote.orders.map((o) => o.fillData.signature));
            expect(fillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(fillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            const payTakerTransformerData = (0, protocol_utils_1.decodePayTakerTransformerData)(callArgs.transformations[1].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, protocol_utils_1.ETH_TOKEN_ADDRESS]);
        });
        it('ERC20 -> ERC20 does not have a WETH transformer', async () => {
            const quote = getRandomSellQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote);
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            const nonces = callArgs.transformations.map((t) => t.deploymentNonce);
            expect(nonces).to.not.include(consumer.transformerNonces.wethTransformer);
        });
        it('ETH -> ERC20 has a WETH transformer before the fill', async () => {
            const quote = getRandomSellQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { isFromETH: true },
            });
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.transformations[0].deploymentNonce.toNumber()).to.eq(consumer.transformerNonces.wethTransformer);
            const wethTransformerData = (0, protocol_utils_1.decodeWethTransformerData)(callArgs.transformations[0].data);
            expect(wethTransformerData.amount).to.bignumber.eq(quote.worstCaseQuoteInfo.totalTakerAmount);
            expect(wethTransformerData.token).to.eq(protocol_utils_1.ETH_TOKEN_ADDRESS);
        });
        it('ERC20 -> ETH has a WETH transformer after the fill', async () => {
            const quote = getRandomSellQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { isToETH: true },
            });
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.transformations[1].deploymentNonce.toNumber()).to.eq(consumer.transformerNonces.wethTransformer);
            const wethTransformerData = (0, protocol_utils_1.decodeWethTransformerData)(callArgs.transformations[1].data);
            expect(wethTransformerData.amount).to.bignumber.eq(MAX_UINT256);
            expect(wethTransformerData.token).to.eq(contractAddresses.etherToken);
        });
        it('Appends an affiliate fee transformer after the fill if a buy token affiliate fee is provided', async () => {
            const quote = getRandomSellQuote();
            const affiliateFee = {
                recipient: (0, contracts_test_utils_1.randomAddress)(),
                buyTokenFeeAmount: (0, utils_2.getRandomAmount)(),
                sellTokenFeeAmount: ZERO_AMOUNT,
                feeType: types_1.AffiliateFeeType.PercentageFee,
            };
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { affiliateFee },
            });
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.transformations[1].deploymentNonce.toNumber()).to.eq(consumer.transformerNonces.affiliateFeeTransformer);
            const affiliateFeeTransformerData = (0, protocol_utils_1.decodeAffiliateFeeTransformerData)(callArgs.transformations[1].data);
            expect(affiliateFeeTransformerData.fees).to.deep.equal([
                { token: MAKER_TOKEN, amount: affiliateFee.buyTokenFeeAmount, recipient: affiliateFee.recipient },
            ]);
        });
        it('Appends an affiliate fee transformer if conversion to native token is known', async () => {
            const quote = getRandomSellQuote();
            quote.takerAmountPerEth = new utils_1.BigNumber(0.5);
            const affiliateFee = {
                recipient: (0, contracts_test_utils_1.randomAddress)(),
                buyTokenFeeAmount: (0, utils_2.getRandomAmount)(),
                sellTokenFeeAmount: protocol_utils_1.ZERO,
                feeType: types_1.AffiliateFeeType.GaslessFee,
            };
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { affiliateFee },
            });
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.transformations[1].deploymentNonce.toNumber()).to.eq(consumer.transformerNonces.affiliateFeeTransformer);
            const affiliateFeeTransformerData = (0, protocol_utils_1.decodeAffiliateFeeTransformerData)(callArgs.transformations[1].data);
            expect(affiliateFeeTransformerData.fees).to.deep.equal([
                { token: MAKER_TOKEN, amount: affiliateFee.buyTokenFeeAmount, recipient: affiliateFee.recipient },
            ]);
        });
        it('Appends an affiliate fee transformer if conversion to native token is unknown of 0.1%', async () => {
            const quote = getRandomSellQuote();
            quote.takerAmountPerEth = new utils_1.BigNumber(0);
            const affiliateFee = {
                recipient: (0, contracts_test_utils_1.randomAddress)(),
                buyTokenFeeAmount: (0, utils_2.getRandomAmount)(),
                sellTokenFeeAmount: protocol_utils_1.ZERO,
                feeType: types_1.AffiliateFeeType.GaslessFee,
            };
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { affiliateFee },
            });
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.transformations[1].deploymentNonce.toNumber()).to.eq(consumer.transformerNonces.affiliateFeeTransformer);
            const affiliateFeeTransformerData = (0, protocol_utils_1.decodeAffiliateFeeTransformerData)(callArgs.transformations[1].data);
            expect(affiliateFeeTransformerData.fees).to.deep.equal([
                { token: MAKER_TOKEN, amount: affiliateFee.buyTokenFeeAmount, recipient: affiliateFee.recipient },
            ]);
        });
        it('Appends a positive slippage affiliate fee transformer after the fill if the positive slippage fee feeType is specified', async () => {
            const quote = getRandomSellQuote();
            const affiliateFee = {
                recipient: (0, contracts_test_utils_1.randomAddress)(),
                buyTokenFeeAmount: ZERO_AMOUNT,
                sellTokenFeeAmount: ZERO_AMOUNT,
                feeType: types_1.AffiliateFeeType.PositiveSlippageFee,
            };
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { affiliateFee },
            });
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.transformations[1].deploymentNonce.toNumber()).to.eq(consumer.transformerNonces.positiveSlippageFeeTransformer);
            const positiveSlippageFeeTransformerData = (0, protocol_utils_1.decodePositiveSlippageFeeTransformerData)(callArgs.transformations[1].data);
            const bestCaseAmount = quote.bestCaseQuoteInfo.makerAmount.plus(constants_1.POSITIVE_SLIPPAGE_FEE_TRANSFORMER_GAS.multipliedBy(quote.gasPrice).multipliedBy(quote.makerAmountPerEth));
            expect(positiveSlippageFeeTransformerData).to.deep.equal({
                token: MAKER_TOKEN,
                bestCaseAmount,
                recipient: affiliateFee.recipient,
            });
        });
        it('Throws if a sell token affiliate fee is provided', async () => {
            const quote = getRandomSellQuote();
            const affiliateFee = {
                recipient: (0, contracts_test_utils_1.randomAddress)(),
                buyTokenFeeAmount: ZERO_AMOUNT,
                sellTokenFeeAmount: (0, utils_2.getRandomAmount)(),
                feeType: types_1.AffiliateFeeType.PercentageFee,
            };
            expect(consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { affiliateFee },
            })).to.eventually.be.rejectedWith('Affiliate fees denominated in sell token are not yet supported');
        });
        it('Uses two `FillQuoteTransformer`s if given two-hop sell quote', async () => {
            const quote = getRandomTwoHopQuote(types_1.MarketOperation.Sell);
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { isTwoHop: true },
            });
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.totalTakerAmount);
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.makerAmount);
            expect(callArgs.transformations).to.be.length(3);
            expect(callArgs.transformations[0].deploymentNonce.toNumber() ===
                consumer.transformerNonces.fillQuoteTransformer);
            expect(callArgs.transformations[1].deploymentNonce.toNumber() ===
                consumer.transformerNonces.fillQuoteTransformer);
            expect(callArgs.transformations[2].deploymentNonce.toNumber() ===
                consumer.transformerNonces.payTakerTransformer);
            const [firstHopOrder, secondHopOrder] = quote.orders;
            const firstHopFillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(firstHopFillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(firstHopFillQuoteTransformerData.fillAmount).to.bignumber.eq(firstHopOrder.takerAmount);
            expect(firstHopFillQuoteTransformerData.limitOrders).to.deep.eq(cleanOrders([firstHopOrder]));
            expect(firstHopFillQuoteTransformerData.limitOrders.map((o) => o.signature)).to.deep.eq([
                firstHopOrder.fillData.signature,
            ]);
            expect(firstHopFillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(firstHopFillQuoteTransformerData.buyToken).to.eq(INTERMEDIATE_TOKEN);
            const secondHopFillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[1].data);
            expect(secondHopFillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(secondHopFillQuoteTransformerData.fillAmount).to.bignumber.eq(contracts_test_utils_1.constants.MAX_UINT256);
            expect(secondHopFillQuoteTransformerData.limitOrders).to.deep.eq(cleanOrders([secondHopOrder]));
            expect(secondHopFillQuoteTransformerData.limitOrders.map((o) => o.signature)).to.deep.eq([
                secondHopOrder.fillData.signature,
            ]);
            expect(secondHopFillQuoteTransformerData.sellToken).to.eq(INTERMEDIATE_TOKEN);
            expect(secondHopFillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            const payTakerTransformerData = (0, protocol_utils_1.decodePayTakerTransformerData)(callArgs.transformations[2].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, INTERMEDIATE_TOKEN, protocol_utils_1.ETH_TOKEN_ADDRESS]);
        });
        it('allows selling the entire balance for CFL', async () => {
            const quote = getRandomSellQuote();
            const callInfo = await consumer.getCalldataOrThrowAsync(quote, {
                extensionContractOpts: { shouldSellEntireBalance: true },
            });
            const callArgs = transformERC20Encoder.decode(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(MAX_UINT256);
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.makerAmount);
            expect(callArgs.transformations).to.be.length(2);
            expect(callArgs.transformations[0].deploymentNonce.toNumber() ===
                consumer.transformerNonces.fillQuoteTransformer);
            expect(callArgs.transformations[1].deploymentNonce.toNumber() ===
                consumer.transformerNonces.payTakerTransformer);
            const fillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(fillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(fillQuoteTransformerData.fillAmount).to.bignumber.eq(MAX_UINT256);
            expect(fillQuoteTransformerData.limitOrders).to.deep.eq(cleanOrders(quote.orders));
            expect(fillQuoteTransformerData.limitOrders.map((o) => o.signature)).to.deep.eq(quote.orders.map((o) => o.fillData.signature));
            expect(fillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(fillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            const payTakerTransformerData = (0, protocol_utils_1.decodePayTakerTransformerData)(callArgs.transformations[1].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, protocol_utils_1.ETH_TOKEN_ADDRESS]);
        });
    });
});
//# sourceMappingURL=exchange_proxy_swap_quote_consumer_test.js.map