"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contract_addresses_1 = require("@0x/contract-addresses");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const protocol_utils_1 = require("@0x/protocol-utils");
const utils_1 = require("@0x/utils");
const chai = require("chai");
require("mocha");
const constants_1 = require("../../../../src/asset-swapper/constants");
const transform_erc20_rule_1 = require("../../../../src/asset-swapper/quote_consumers/feature_rules/transform_erc20_rule");
const types_1 = require("../../../../src/asset-swapper/types");
const decoders_1 = require("../../test_utils/decoders");
const test_data_1 = require("../../test_utils/test_data");
const chai_setup_1 = require("../../utils/chai_setup");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
const { MAX_UINT256, ZERO_AMOUNT } = contracts_test_utils_1.constants;
describe('TransformERC20Rule', () => {
    const CHAIN_ID = 1;
    const TAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const MAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const INTERMEDIATE_TOKEN = (0, contracts_test_utils_1.randomAddress)();
    const TRANSFORMER_DEPLOYER = (0, contracts_test_utils_1.randomAddress)();
    const NONCES = {
        wethTransformer: 1,
        payTakerTransformer: 2,
        fillQuoteTransformer: 3,
        affiliateFeeTransformer: 4,
        positiveSlippageFeeTransformer: 5,
    };
    const contractAddresses = {
        ...(0, contract_addresses_1.getContractAddressesForChainOrThrow)(CHAIN_ID),
        exchangeProxy: (0, contracts_test_utils_1.randomAddress)(),
        exchangeProxyTransformerDeployer: TRANSFORMER_DEPLOYER,
        transformers: {
            wethTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, NONCES.wethTransformer),
            payTakerTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, NONCES.payTakerTransformer),
            fillQuoteTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, NONCES.fillQuoteTransformer),
            affiliateFeeTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, NONCES.affiliateFeeTransformer),
            positiveSlippageFeeTransformer: (0, protocol_utils_1.getTransformerAddress)(TRANSFORMER_DEPLOYER, NONCES.positiveSlippageFeeTransformer),
        },
    };
    const rule = transform_erc20_rule_1.TransformERC20Rule.create(CHAIN_ID, contractAddresses);
    describe('createCalldata()', () => {
        const UNI_V2_SELL_QUOTE = (0, test_data_1.createSimpleSellSwapQuoteWithBridgeOrder)({
            source: types_1.ERC20BridgeSource.UniswapV2,
            takerToken: TAKER_TOKEN,
            makerToken: MAKER_TOKEN,
            takerAmount: test_data_1.ONE_ETHER,
            makerAmount: test_data_1.ONE_ETHER.times(2),
            slippage: 0,
        });
        it('can produce a sell calldata', () => {
            const callInfo = rule.createCalldata(UNI_V2_SELL_QUOTE, constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS);
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(UNI_V2_SELL_QUOTE.worstCaseQuoteInfo.totalTakerAmount);
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(UNI_V2_SELL_QUOTE.worstCaseQuoteInfo.makerAmount);
            expect(callArgs.transformations).to.be.length(2);
            expect(callArgs.transformations[0].deploymentNonce.toNumber()).to.be.eq(NONCES.fillQuoteTransformer);
            expect(callArgs.transformations[1].deploymentNonce.toNumber()).to.be.eq(NONCES.payTakerTransformer);
            const fillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(fillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(fillQuoteTransformerData.fillAmount).to.bignumber.eq(UNI_V2_SELL_QUOTE.takerTokenFillAmount);
            expect(fillQuoteTransformerData.bridgeOrders).to.be.lengthOf(1);
            const bridgeOrder = fillQuoteTransformerData.bridgeOrders[0];
            expect(bridgeOrder.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'UniswapV2'));
            expect(fillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(fillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            const payTakerTransformerData = (0, protocol_utils_1.decodePayTakerTransformerData)(callArgs.transformations[1].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, protocol_utils_1.ETH_TOKEN_ADDRESS]);
        });
        it('can produce a buy calldata', () => {
            const quote = (0, test_data_1.createSimpleBuySwapQuoteWithBridgeOrder)({
                source: types_1.ERC20BridgeSource.UniswapV2,
                takerToken: TAKER_TOKEN,
                makerToken: MAKER_TOKEN,
                takerAmount: test_data_1.ONE_ETHER,
                makerAmount: test_data_1.ONE_ETHER.times(2),
                slippage: 0,
            });
            const callInfo = rule.createCalldata(quote, constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS);
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.totalTakerAmount);
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(quote.worstCaseQuoteInfo.makerAmount);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.payTakerTransformer,
            ]);
            const fillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(fillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Buy);
            expect(fillQuoteTransformerData.fillAmount).to.bignumber.eq(quote.makerTokenFillAmount);
            const bridgeOrder = fillQuoteTransformerData.bridgeOrders[0];
            expect(bridgeOrder.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'UniswapV2'));
            expect(fillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(fillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            const payTakerTransformerData = (0, protocol_utils_1.decodePayTakerTransformerData)(callArgs.transformations[1].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, protocol_utils_1.ETH_TOKEN_ADDRESS]);
        });
        it('ERC20 -> ERC20 does not have a WETH transformer', () => {
            const callInfo = rule.createCalldata(UNI_V2_SELL_QUOTE, constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS);
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            const nonces = callArgs.transformations.map((t) => t.deploymentNonce.toNumber());
            expect(nonces).to.not.include(NONCES.wethTransformer);
        });
        it('ETH -> ERC20 has the correct ethAmount`', () => {
            const callInfo = rule.createCalldata(UNI_V2_SELL_QUOTE, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                isFromETH: true,
            });
            expect(callInfo.ethAmount).to.bignumber.eq(UNI_V2_SELL_QUOTE.takerTokenFillAmount);
        });
        it('ETH -> ERC20 has a WETH transformer before the fill', () => {
            const callInfo = rule.createCalldata(UNI_V2_SELL_QUOTE, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                isFromETH: true,
            });
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.wethTransformer,
                NONCES.fillQuoteTransformer,
                NONCES.payTakerTransformer,
            ]);
            const wethTransformerData = (0, protocol_utils_1.decodeWethTransformerData)(callArgs.transformations[0].data);
            expect(wethTransformerData.amount).to.bignumber.eq(UNI_V2_SELL_QUOTE.worstCaseQuoteInfo.totalTakerAmount);
            expect(wethTransformerData.token).to.eq(protocol_utils_1.ETH_TOKEN_ADDRESS);
        });
        it('ERC20 -> ETH has a WETH transformer after the fill', () => {
            const callInfo = rule.createCalldata(UNI_V2_SELL_QUOTE, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                isToETH: true,
            });
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.wethTransformer,
                NONCES.payTakerTransformer,
            ]);
            const wethTransformerData = (0, protocol_utils_1.decodeWethTransformerData)(callArgs.transformations[1].data);
            expect(wethTransformerData.amount).to.bignumber.eq(MAX_UINT256);
            expect(wethTransformerData.token).to.eq(contractAddresses.etherToken);
        });
        it('Appends an affiliate fee transformer before the FQT if sell token fees are specified', () => {
            const gasPrice = 20000000000;
            const makerAmountPerEth = new utils_1.BigNumber(2);
            const quote = (0, test_data_1.createSimpleSellSwapQuoteWithBridgeOrder)({
                source: types_1.ERC20BridgeSource.UniswapV2,
                takerToken: TAKER_TOKEN,
                makerToken: MAKER_TOKEN,
                takerAmount: test_data_1.ONE_ETHER,
                makerAmount: test_data_1.ONE_ETHER.times(2),
                makerAmountPerEth,
                gasPrice,
                slippage: 0,
            });
            const integratorRecipient = (0, contracts_test_utils_1.randomAddress)();
            const sellTokenFeeAmount = test_data_1.ONE_ETHER.times(0.01);
            const callInfo = rule.createCalldata(quote, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                sellTokenAffiliateFees: [
                    {
                        recipient: integratorRecipient,
                        buyTokenFeeAmount: ZERO_AMOUNT,
                        sellTokenFeeAmount,
                        feeType: types_1.AffiliateFeeType.PercentageFee,
                    },
                ],
            });
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([NONCES.affiliateFeeTransformer, NONCES.fillQuoteTransformer, NONCES.payTakerTransformer], 'Correct ordering of the transformers');
            const affiliateFeeTransformerData = (0, protocol_utils_1.decodeAffiliateFeeTransformerData)(callArgs.transformations[0].data);
            expect(affiliateFeeTransformerData.fees).to.deep.equal([{ token: TAKER_TOKEN, amount: sellTokenFeeAmount, recipient: integratorRecipient }], 'Affiliate Fee');
        });
        it('Appends an AffiliateFeeTransformer before the WETH transformer and FQT and prefers ETH_TOKEN fee if isFromETH when sell token fees are present', () => {
            const gasPrice = 20000000000;
            const makerAmountPerEth = new utils_1.BigNumber(2);
            const quote = (0, test_data_1.createSimpleSellSwapQuoteWithBridgeOrder)({
                source: types_1.ERC20BridgeSource.UniswapV2,
                takerToken: TAKER_TOKEN,
                makerToken: MAKER_TOKEN,
                takerAmount: test_data_1.ONE_ETHER,
                makerAmount: test_data_1.ONE_ETHER.times(2),
                makerAmountPerEth,
                gasPrice,
                slippage: 0,
            });
            const integratorRecipient = (0, contracts_test_utils_1.randomAddress)();
            const sellTokenFeeAmount = test_data_1.ONE_ETHER.times(0.01);
            const callInfo = rule.createCalldata(quote, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                sellTokenAffiliateFees: [
                    {
                        recipient: integratorRecipient,
                        buyTokenFeeAmount: ZERO_AMOUNT,
                        sellTokenFeeAmount,
                        feeType: types_1.AffiliateFeeType.PercentageFee,
                    },
                ],
                isFromETH: true,
            });
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.affiliateFeeTransformer,
                NONCES.wethTransformer,
                NONCES.fillQuoteTransformer,
                NONCES.payTakerTransformer,
            ], 'Correct ordering of the transformers');
            const affiliateFeeTransformerData = (0, protocol_utils_1.decodeAffiliateFeeTransformerData)(callArgs.transformations[0].data);
            expect(affiliateFeeTransformerData.fees).to.deep.equal([{ token: protocol_utils_1.ETH_TOKEN_ADDRESS, amount: sellTokenFeeAmount, recipient: integratorRecipient }], 'Affiliate Fee');
            const wethTransformerData = (0, protocol_utils_1.decodeWethTransformerData)(callArgs.transformations[1].data);
            expect(wethTransformerData.amount).to.bignumber.eq(quote.worstCaseQuoteInfo.totalTakerAmount);
            expect(wethTransformerData.token).to.eq(protocol_utils_1.ETH_TOKEN_ADDRESS);
        });
        it('Appends an affiliate fee transformer when buyTokenFeeAmount is provided (Gasless)', () => {
            const recipient = (0, contracts_test_utils_1.randomAddress)();
            const buyTokenFeeAmount = test_data_1.ONE_ETHER.times(0.01);
            const callInfo = rule.createCalldata(UNI_V2_SELL_QUOTE, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                buyTokenAffiliateFees: [
                    {
                        recipient,
                        buyTokenFeeAmount,
                        sellTokenFeeAmount: ZERO_AMOUNT,
                        feeType: types_1.AffiliateFeeType.PercentageFee,
                    },
                ],
            });
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.affiliateFeeTransformer,
                NONCES.payTakerTransformer,
            ]);
            const affiliateFeeTransformerData = (0, protocol_utils_1.decodeAffiliateFeeTransformerData)(callArgs.transformations[1].data);
            expect(affiliateFeeTransformerData.fees).to.deep.equal([
                { token: MAKER_TOKEN, amount: buyTokenFeeAmount, recipient },
            ]);
        });
        it('Appends an affiliate fee transformer when buyTokenFeeAmount is provided (Gasless) ', () => {
            const recipient = (0, contracts_test_utils_1.randomAddress)();
            const buyTokenFeeAmount = test_data_1.ONE_ETHER.times(0.01);
            const quote = { ...UNI_V2_SELL_QUOTE, takerAmountPerEth: new utils_1.BigNumber(0.5) };
            const callInfo = rule.createCalldata(quote, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                buyTokenAffiliateFees: [
                    {
                        recipient,
                        buyTokenFeeAmount,
                        sellTokenFeeAmount: protocol_utils_1.ZERO,
                        feeType: types_1.AffiliateFeeType.GaslessFee,
                    },
                ],
            });
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.affiliateFeeTransformer,
                NONCES.payTakerTransformer,
            ]);
            const affiliateFeeTransformerData = (0, protocol_utils_1.decodeAffiliateFeeTransformerData)(callArgs.transformations[1].data);
            expect(affiliateFeeTransformerData.fees).to.deep.equal([
                { token: MAKER_TOKEN, amount: buyTokenFeeAmount, recipient },
            ]);
        });
        it('Appends a positive slippage affiliate fee transformer after the fill if the positive slippage fee feeType is specified', () => {
            const gasPrice = 20000000000;
            const makerAmountPerEth = new utils_1.BigNumber(2);
            const quote = (0, test_data_1.createSimpleSellSwapQuoteWithBridgeOrder)({
                source: types_1.ERC20BridgeSource.UniswapV2,
                takerToken: TAKER_TOKEN,
                makerToken: MAKER_TOKEN,
                takerAmount: test_data_1.ONE_ETHER,
                makerAmount: test_data_1.ONE_ETHER.times(2),
                makerAmountPerEth,
                gasPrice,
                slippage: 0,
            });
            const recipient = (0, contracts_test_utils_1.randomAddress)();
            const callInfo = rule.createCalldata(quote, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                buyTokenAffiliateFees: [
                    {
                        recipient,
                        buyTokenFeeAmount: ZERO_AMOUNT,
                        sellTokenFeeAmount: ZERO_AMOUNT,
                        feeType: types_1.AffiliateFeeType.PositiveSlippageFee,
                    },
                ],
            });
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.positiveSlippageFeeTransformer,
                NONCES.payTakerTransformer,
            ]);
            const positiveSlippageFeeTransformerData = (0, protocol_utils_1.decodePositiveSlippageFeeTransformerData)(callArgs.transformations[1].data);
            const gasOverhead = constants_1.POSITIVE_SLIPPAGE_FEE_TRANSFORMER_GAS.multipliedBy(gasPrice).multipliedBy(quote.makerAmountPerEth);
            expect(positiveSlippageFeeTransformerData).to.deep.equal({
                token: MAKER_TOKEN,
                bestCaseAmount: test_data_1.ONE_ETHER.times(2).plus(gasOverhead),
                recipient,
            });
        });
        it('Appends an affiliate fee and positive slippage fee transformer if both are specified', () => {
            const gasPrice = 20000000000;
            const makerAmountPerEth = new utils_1.BigNumber(2);
            const quote = (0, test_data_1.createSimpleSellSwapQuoteWithBridgeOrder)({
                source: types_1.ERC20BridgeSource.UniswapV2,
                takerToken: TAKER_TOKEN,
                makerToken: MAKER_TOKEN,
                takerAmount: test_data_1.ONE_ETHER,
                makerAmount: test_data_1.ONE_ETHER.times(2),
                makerAmountPerEth,
                gasPrice,
                slippage: 0,
            });
            const integratorRecipient = (0, contracts_test_utils_1.randomAddress)();
            const zeroExRecipient = (0, contracts_test_utils_1.randomAddress)();
            const buyTokenFeeAmount = test_data_1.ONE_ETHER.times(0.01);
            const callInfo = rule.createCalldata(quote, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                buyTokenAffiliateFees: [
                    {
                        recipient: integratorRecipient,
                        buyTokenFeeAmount,
                        sellTokenFeeAmount: ZERO_AMOUNT,
                        feeType: types_1.AffiliateFeeType.PercentageFee,
                    },
                ],
                positiveSlippageFee: {
                    recipient: zeroExRecipient,
                    buyTokenFeeAmount: ZERO_AMOUNT,
                    sellTokenFeeAmount: ZERO_AMOUNT,
                    feeType: types_1.AffiliateFeeType.PositiveSlippageFee,
                },
            });
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.affiliateFeeTransformer,
                NONCES.positiveSlippageFeeTransformer,
                NONCES.payTakerTransformer,
            ], 'Correct ordering of the transformers');
            const positiveSlippageFeeTransformerData = (0, protocol_utils_1.decodePositiveSlippageFeeTransformerData)(callArgs.transformations[2].data);
            const gasOverhead = constants_1.POSITIVE_SLIPPAGE_FEE_TRANSFORMER_GAS.multipliedBy(gasPrice).multipliedBy(quote.makerAmountPerEth);
            const affiliateFeeTransformerData = (0, protocol_utils_1.decodeAffiliateFeeTransformerData)(callArgs.transformations[1].data);
            expect(affiliateFeeTransformerData.fees).to.deep.equal([{ token: MAKER_TOKEN, amount: buyTokenFeeAmount, recipient: integratorRecipient }], 'Affiliate Fee');
            expect(positiveSlippageFeeTransformerData).to.deep.equal({
                token: MAKER_TOKEN,
                bestCaseAmount: test_data_1.ONE_ETHER.times(2).plus(gasOverhead),
                recipient: zeroExRecipient,
            }, 'Positive Slippage Fee');
        });
        it('Uses two `FillQuoteTransformer`s when given a two-hop sell quote', () => {
            const quote = (0, test_data_1.createTwoHopSellQuote)({
                takerToken: TAKER_TOKEN,
                intermediateToken: INTERMEDIATE_TOKEN,
                makerToken: MAKER_TOKEN,
                firstHopSource: types_1.ERC20BridgeSource.UniswapV2,
                secondHopSource: types_1.ERC20BridgeSource.SushiSwap,
                takerAmount: test_data_1.ONE_ETHER,
                makerAmount: test_data_1.ONE_ETHER.times(2),
            });
            const callInfo = rule.createCalldata(quote, constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS);
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(test_data_1.ONE_ETHER);
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(test_data_1.ONE_ETHER.times(2));
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.fillQuoteTransformer,
                NONCES.payTakerTransformer,
            ]);
            const firstHopFillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(firstHopFillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(firstHopFillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(firstHopFillQuoteTransformerData.buyToken).to.eq(INTERMEDIATE_TOKEN);
            expect(firstHopFillQuoteTransformerData.fillAmount).to.bignumber.eq(test_data_1.ONE_ETHER);
            expect(firstHopFillQuoteTransformerData.bridgeOrders).to.be.lengthOf(1);
            const firstHopOrder = firstHopFillQuoteTransformerData.bridgeOrders[0];
            expect(firstHopOrder.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'UniswapV2'));
            const secondHopFillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[1].data);
            expect(secondHopFillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(secondHopFillQuoteTransformerData.sellToken).to.eq(INTERMEDIATE_TOKEN);
            expect(secondHopFillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            expect(secondHopFillQuoteTransformerData.fillAmount).to.bignumber.eq(MAX_UINT256);
            expect(secondHopFillQuoteTransformerData.bridgeOrders).to.be.lengthOf(1);
            const secondHopOrder = secondHopFillQuoteTransformerData.bridgeOrders[0];
            expect(secondHopOrder.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'SushiSwap'));
            const payTakerTransformerData = (0, protocol_utils_1.decodePayTakerTransformerData)(callArgs.transformations[2].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, INTERMEDIATE_TOKEN, protocol_utils_1.ETH_TOKEN_ADDRESS]);
        });
        it('Returns calldata for a quote with a mix of single hop order and a two hop order', () => {
            // 70% single-hop and 3o% two-hop
            const quote = (0, test_data_1.createSwapQuote)({
                side: types_1.MarketOperation.Sell,
                takerToken: TAKER_TOKEN,
                makerToken: MAKER_TOKEN,
                takerAmount: test_data_1.ONE_ETHER.times(100),
                makerAmount: test_data_1.ONE_ETHER.times(200),
                createPathParams: {
                    bridgeOrderParams: [
                        {
                            takerToken: TAKER_TOKEN,
                            makerToken: MAKER_TOKEN,
                            source: types_1.ERC20BridgeSource.UniswapV2,
                            takerAmount: test_data_1.ONE_ETHER.times(70),
                            makerAmount: test_data_1.ONE_ETHER.times(140),
                        },
                    ],
                    twoHopOrderParams: [
                        {
                            takerToken: TAKER_TOKEN,
                            intermediateToken: INTERMEDIATE_TOKEN,
                            makerToken: MAKER_TOKEN,
                            takerAmount: test_data_1.ONE_ETHER.times(30),
                            makerAmount: test_data_1.ONE_ETHER.times(60),
                            firstHopSource: types_1.ERC20BridgeSource.UniswapV2,
                            secondHopSource: types_1.ERC20BridgeSource.SushiSwap,
                        },
                    ],
                },
            });
            const callInfo = rule.createCalldata(quote, constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS);
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(test_data_1.ONE_ETHER.times(100));
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(test_data_1.ONE_ETHER.times(200));
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.fillQuoteTransformer,
                NONCES.fillQuoteTransformer,
                NONCES.payTakerTransformer,
            ]);
            const firstHopFqtData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(firstHopFqtData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(firstHopFqtData.sellToken).to.eq(TAKER_TOKEN);
            expect(firstHopFqtData.buyToken).to.eq(INTERMEDIATE_TOKEN);
            expect(firstHopFqtData.fillAmount).to.bignumber.eq(test_data_1.ONE_ETHER.times(30));
            expect(firstHopFqtData.bridgeOrders).to.be.lengthOf(1);
            const firstHopOrder = firstHopFqtData.bridgeOrders[0];
            expect(firstHopOrder.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'UniswapV2'));
            const secondHopFqtData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[1].data);
            expect(secondHopFqtData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(secondHopFqtData.sellToken).to.eq(INTERMEDIATE_TOKEN);
            expect(secondHopFqtData.buyToken).to.eq(MAKER_TOKEN);
            expect(secondHopFqtData.fillAmount).to.bignumber.eq(MAX_UINT256);
            expect(secondHopFqtData.bridgeOrders).to.be.lengthOf(1);
            const secondHopOrder = secondHopFqtData.bridgeOrders[0];
            expect(secondHopOrder.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'SushiSwap'));
            const singeHopFqtData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[2].data);
            expect(singeHopFqtData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(singeHopFqtData.fillAmount).to.bignumber.eq(test_data_1.ONE_ETHER.times(70));
            expect(singeHopFqtData.bridgeOrders).to.be.lengthOf(1);
            const bridgeOrder = singeHopFqtData.bridgeOrders[0];
            expect(bridgeOrder.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'UniswapV2'));
            expect(singeHopFqtData.sellToken).to.eq(TAKER_TOKEN);
            expect(singeHopFqtData.buyToken).to.eq(MAKER_TOKEN);
            const payTakerTransformerData = (0, protocol_utils_1.decodePayTakerTransformerData)(callArgs.transformations[3].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([TAKER_TOKEN, INTERMEDIATE_TOKEN, protocol_utils_1.ETH_TOKEN_ADDRESS]);
        });
        it('Returns calldata for a quote with two two-hop orders', () => {
            const INTERMEDIATE_TOKEN_A = (0, contracts_test_utils_1.randomAddress)();
            const INTERMEDIATE_TOKEN_B = (0, contracts_test_utils_1.randomAddress)();
            // 60% two-hop A, 4o% two-hop B
            const quote = (0, test_data_1.createSwapQuote)({
                side: types_1.MarketOperation.Sell,
                takerToken: TAKER_TOKEN,
                makerToken: MAKER_TOKEN,
                takerAmount: test_data_1.ONE_ETHER.times(100),
                makerAmount: test_data_1.ONE_ETHER.times(200),
                createPathParams: {
                    twoHopOrderParams: [
                        {
                            takerToken: TAKER_TOKEN,
                            intermediateToken: INTERMEDIATE_TOKEN_A,
                            makerToken: MAKER_TOKEN,
                            takerAmount: test_data_1.ONE_ETHER.times(60),
                            makerAmount: test_data_1.ONE_ETHER.times(120),
                            firstHopSource: types_1.ERC20BridgeSource.UniswapV2,
                            secondHopSource: types_1.ERC20BridgeSource.SushiSwap,
                        },
                        {
                            takerToken: TAKER_TOKEN,
                            intermediateToken: INTERMEDIATE_TOKEN_B,
                            makerToken: MAKER_TOKEN,
                            takerAmount: test_data_1.ONE_ETHER.times(40),
                            makerAmount: test_data_1.ONE_ETHER.times(80),
                            firstHopSource: types_1.ERC20BridgeSource.Dodo,
                            secondHopSource: types_1.ERC20BridgeSource.SushiSwap,
                        },
                    ],
                },
            });
            const callInfo = rule.createCalldata(quote, constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS);
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(test_data_1.ONE_ETHER.times(100));
            expect(callArgs.minOutputTokenAmount).to.bignumber.eq(test_data_1.ONE_ETHER.times(200));
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.fillQuoteTransformer,
                NONCES.fillQuoteTransformer,
                NONCES.fillQuoteTransformer,
                NONCES.payTakerTransformer,
            ]);
            // Two-Hop A
            const firstHopFqtDataA = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(firstHopFqtDataA.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(firstHopFqtDataA.sellToken).to.eq(TAKER_TOKEN);
            expect(firstHopFqtDataA.buyToken).to.eq(INTERMEDIATE_TOKEN_A);
            expect(firstHopFqtDataA.fillAmount).to.bignumber.eq(test_data_1.ONE_ETHER.times(60));
            expect(firstHopFqtDataA.bridgeOrders).to.be.lengthOf(1);
            const firstHopOrderA = firstHopFqtDataA.bridgeOrders[0];
            expect(firstHopOrderA.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'UniswapV2'));
            const secondHopFqtDataA = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[1].data);
            expect(secondHopFqtDataA.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(secondHopFqtDataA.sellToken).to.eq(INTERMEDIATE_TOKEN_A);
            expect(secondHopFqtDataA.buyToken).to.eq(MAKER_TOKEN);
            expect(secondHopFqtDataA.fillAmount).to.bignumber.eq(MAX_UINT256);
            expect(secondHopFqtDataA.bridgeOrders).to.be.lengthOf(1);
            const secondHopOrderA = secondHopFqtDataA.bridgeOrders[0];
            expect(secondHopOrderA.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'SushiSwap'));
            // Two-Hop B
            const firstHopFqtDataB = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[2].data);
            expect(firstHopFqtDataB.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(firstHopFqtDataB.sellToken).to.eq(TAKER_TOKEN);
            expect(firstHopFqtDataB.buyToken).to.eq(INTERMEDIATE_TOKEN_B);
            expect(firstHopFqtDataB.fillAmount).to.bignumber.eq(test_data_1.ONE_ETHER.times(40));
            expect(firstHopFqtDataB.bridgeOrders).to.be.lengthOf(1);
            const firstHopOrderB = firstHopFqtDataB.bridgeOrders[0];
            expect(firstHopOrderB.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.Dodo, 'Dodo'));
            const secondHopFqtDataB = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[3].data);
            expect(secondHopFqtDataB.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(secondHopFqtDataB.sellToken).to.eq(INTERMEDIATE_TOKEN_B);
            expect(secondHopFqtDataB.buyToken).to.eq(MAKER_TOKEN);
            expect(secondHopFqtDataB.fillAmount).to.bignumber.eq(MAX_UINT256);
            expect(secondHopFqtDataB.bridgeOrders).to.be.lengthOf(1);
            const secondHopOrderB = secondHopFqtDataB.bridgeOrders[0];
            expect(secondHopOrderB.source).to.eq((0, protocol_utils_1.encodeBridgeSourceId)(protocol_utils_1.BridgeProtocol.UniswapV2, 'SushiSwap'));
            const payTakerTransformerData = (0, protocol_utils_1.decodePayTakerTransformerData)(callArgs.transformations[4].data);
            expect(payTakerTransformerData.amounts).to.deep.eq([]);
            expect(payTakerTransformerData.tokens).to.deep.eq([
                TAKER_TOKEN,
                INTERMEDIATE_TOKEN_A,
                INTERMEDIATE_TOKEN_B,
                protocol_utils_1.ETH_TOKEN_ADDRESS,
            ]);
        });
        it('Uses max amount for when shouldSellEntireBalance is true (single hop)', () => {
            const quote = (0, test_data_1.createSimpleSellSwapQuoteWithBridgeOrder)({
                source: types_1.ERC20BridgeSource.UniswapV2,
                takerToken: TAKER_TOKEN,
                makerToken: MAKER_TOKEN,
                takerAmount: test_data_1.ONE_ETHER,
                makerAmount: test_data_1.ONE_ETHER.times(2),
                slippage: 0,
            });
            const callInfo = rule.createCalldata(quote, {
                ...constants_1.constants.DEFAULT_EXCHANGE_PROXY_EXTENSION_CONTRACT_OPTS,
                shouldSellEntireBalance: true,
            });
            const callArgs = (0, decoders_1.decodeTransformERC20)(callInfo.calldataHexString);
            expect(callArgs.inputToken).to.eq(TAKER_TOKEN);
            expect(callArgs.outputToken).to.eq(MAKER_TOKEN);
            expect(callArgs.inputTokenAmount).to.bignumber.eq(MAX_UINT256);
            expect((0, decoders_1.getTransformerNonces)(callArgs)).to.deep.eq([
                NONCES.fillQuoteTransformer,
                NONCES.payTakerTransformer,
            ]);
            const fillQuoteTransformerData = (0, protocol_utils_1.decodeFillQuoteTransformerData)(callArgs.transformations[0].data);
            expect(fillQuoteTransformerData.side).to.eq(protocol_utils_1.FillQuoteTransformerSide.Sell);
            expect(fillQuoteTransformerData.sellToken).to.eq(TAKER_TOKEN);
            expect(fillQuoteTransformerData.buyToken).to.eq(MAKER_TOKEN);
            expect(fillQuoteTransformerData.fillAmount).to.bignumber.eq(MAX_UINT256);
        });
    });
});
//# sourceMappingURL=transform_erc20_rule_test.js.map