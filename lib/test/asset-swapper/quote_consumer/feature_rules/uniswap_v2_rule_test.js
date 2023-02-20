"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai = require("chai");
const chai_setup_1 = require("../../utils/chai_setup");
const uniswap_v2_rule_1 = require("../../../../src/asset-swapper/quote_consumers/feature_rules/uniswap_v2_rule");
const contract_addresses_1 = require("@0x/contract-addresses");
const quote_consumer_utils_1 = require("../../../../src/asset-swapper/quote_consumers/quote_consumer_utils");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const test_data_1 = require("../../test_utils/test_data");
const asset_swapper_1 = require("../../../../src/asset-swapper");
const utils_1 = require("@0x/utils");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
const EXCHANGE_PROXY_ADDRESS = (0, contracts_test_utils_1.randomAddress)();
const TAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
const MAKER_TOKEN = (0, contracts_test_utils_1.randomAddress)();
const TAKER_ADDRESS = (0, contracts_test_utils_1.randomAddress)();
describe('UniswapV2Rule', () => {
    const exchangeProxy = (0, quote_consumer_utils_1.createExchangeProxyWithoutProvider)(EXCHANGE_PROXY_ADDRESS);
    const COMPATIBLE_UNI_V2_SWAP_QUOTE = (0, test_data_1.createSimpleSellSwapQuoteWithBridgeOrder)({
        source: asset_swapper_1.ERC20BridgeSource.UniswapV2,
        takerToken: TAKER_TOKEN,
        makerToken: MAKER_TOKEN,
        takerAmount: test_data_1.ONE_ETHER,
        makerAmount: test_data_1.ONE_ETHER.times(2),
        slippage: 0,
    });
    const COMPATIBLE_SUSHI_SWAP_SWAP_QUOTE = (0, test_data_1.createSimpleSellSwapQuoteWithBridgeOrder)({
        source: asset_swapper_1.ERC20BridgeSource.SushiSwap,
        takerToken: TAKER_TOKEN,
        makerToken: MAKER_TOKEN,
        takerAmount: test_data_1.ONE_ETHER,
        makerAmount: test_data_1.ONE_ETHER.times(2),
        slippage: 0,
    });
    describe('isCompatible', () => {
        it('Returns false for a meta transaction', () => {
            const uniswapV2Rule = uniswap_v2_rule_1.UniswapV2Rule.create(contract_addresses_1.ChainId.Mainnet, exchangeProxy);
            const isCompatible = uniswapV2Rule.isCompatible(COMPATIBLE_UNI_V2_SWAP_QUOTE, {
                isFromETH: false,
                isToETH: false,
                sellTokenAffiliateFees: [],
                buyTokenAffiliateFees: [test_data_1.NO_AFFILIATE_FEE],
                refundReceiver: TAKER_ADDRESS,
                metaTransactionVersion: 'v1',
                shouldSellEntireBalance: false,
            });
            expect(isCompatible).to.be.false();
        });
        it('Returns false when there is an affiliate fee', () => {
            const uniswapV2Rule = uniswap_v2_rule_1.UniswapV2Rule.create(contract_addresses_1.ChainId.Mainnet, exchangeProxy);
            const isCompatible = uniswapV2Rule.isCompatible(COMPATIBLE_UNI_V2_SWAP_QUOTE, {
                isFromETH: false,
                isToETH: false,
                sellTokenAffiliateFees: [],
                buyTokenAffiliateFees: [
                    {
                        feeType: asset_swapper_1.AffiliateFeeType.PositiveSlippageFee,
                        sellTokenFeeAmount: new utils_1.BigNumber(0),
                        buyTokenFeeAmount: new utils_1.BigNumber(4200),
                        recipient: TAKER_ADDRESS,
                    },
                ],
                refundReceiver: utils_1.NULL_ADDRESS,
                shouldSellEntireBalance: false,
            });
            expect(isCompatible).to.be.false();
        });
        it('Returns false when selling entire balance', () => {
            const uniswapV2Rule = uniswap_v2_rule_1.UniswapV2Rule.create(contract_addresses_1.ChainId.Mainnet, exchangeProxy);
            const isCompatible = uniswapV2Rule.isCompatible(COMPATIBLE_UNI_V2_SWAP_QUOTE, {
                isFromETH: false,
                isToETH: false,
                sellTokenAffiliateFees: [],
                buyTokenAffiliateFees: [test_data_1.NO_AFFILIATE_FEE],
                refundReceiver: TAKER_ADDRESS,
                shouldSellEntireBalance: true,
            });
            expect(isCompatible).to.be.false();
        });
        it('Returns false on non-mainnet (Ethereum)', () => {
            const uniswapV2Rule = uniswap_v2_rule_1.UniswapV2Rule.create(contract_addresses_1.ChainId.Polygon, exchangeProxy);
            const isCompatible = uniswapV2Rule.isCompatible(COMPATIBLE_UNI_V2_SWAP_QUOTE, {
                isFromETH: false,
                isToETH: false,
                sellTokenAffiliateFees: [],
                buyTokenAffiliateFees: [test_data_1.NO_AFFILIATE_FEE],
                refundReceiver: TAKER_ADDRESS,
                shouldSellEntireBalance: true,
            });
            expect(isCompatible).to.be.false();
        });
        it('Returns true for a UniswapV2 order on mainnet', () => {
            const uniswapV2Rule = uniswap_v2_rule_1.UniswapV2Rule.create(contract_addresses_1.ChainId.Mainnet, exchangeProxy);
            const isCompatible = uniswapV2Rule.isCompatible(COMPATIBLE_UNI_V2_SWAP_QUOTE, {
                isFromETH: false,
                isToETH: false,
                sellTokenAffiliateFees: [],
                buyTokenAffiliateFees: [test_data_1.NO_AFFILIATE_FEE],
                refundReceiver: TAKER_ADDRESS,
                shouldSellEntireBalance: false,
            });
            expect(isCompatible).to.be.true();
        });
        it('Returns true for a SushiSwap order on mainnet', () => {
            const uniswapV2Rule = uniswap_v2_rule_1.UniswapV2Rule.create(contract_addresses_1.ChainId.Mainnet, exchangeProxy);
            const isCompatible = uniswapV2Rule.isCompatible(COMPATIBLE_SUSHI_SWAP_SWAP_QUOTE, {
                isFromETH: false,
                isToETH: false,
                sellTokenAffiliateFees: [],
                buyTokenAffiliateFees: [test_data_1.NO_AFFILIATE_FEE],
                refundReceiver: TAKER_ADDRESS,
                shouldSellEntireBalance: false,
            });
            expect(isCompatible).to.be.true();
        });
        it('Returns false for non-compatible liquidity source', () => {
            const velodromeSwapQuote = (0, test_data_1.createSimpleSellSwapQuoteWithBridgeOrder)({
                source: asset_swapper_1.ERC20BridgeSource.Velodrome,
                takerToken: TAKER_TOKEN,
                makerToken: MAKER_TOKEN,
                takerAmount: test_data_1.ONE_ETHER,
                makerAmount: test_data_1.ONE_ETHER.times(2),
                slippage: 0,
            });
            const uniswapV2Rule = uniswap_v2_rule_1.UniswapV2Rule.create(contract_addresses_1.ChainId.Mainnet, exchangeProxy);
            const isCompatible = uniswapV2Rule.isCompatible(velodromeSwapQuote, {
                isFromETH: false,
                isToETH: false,
                sellTokenAffiliateFees: [],
                buyTokenAffiliateFees: [test_data_1.NO_AFFILIATE_FEE],
                refundReceiver: TAKER_ADDRESS,
                shouldSellEntireBalance: false,
            });
            expect(isCompatible).to.be.false();
        });
        // TODO: returns false on multiple orders.
    });
    describe('createCalldata', () => {
        const uniswapV2Rule = uniswap_v2_rule_1.UniswapV2Rule.create(contract_addresses_1.ChainId.Mainnet, exchangeProxy);
        it('Returns sellToUniswap calldata for Uniswap V2 (ERC20->ERC20)', () => {
            const calldataInfo = uniswapV2Rule.createCalldata(COMPATIBLE_UNI_V2_SWAP_QUOTE, {
                isFromETH: false,
                isToETH: false,
                sellTokenAffiliateFees: [],
                buyTokenAffiliateFees: [test_data_1.NO_AFFILIATE_FEE],
                refundReceiver: TAKER_ADDRESS,
                shouldSellEntireBalance: false,
            });
            expect(calldataInfo.allowanceTarget).to.eq(EXCHANGE_PROXY_ADDRESS);
            expect(calldataInfo.toAddress).to.eq(EXCHANGE_PROXY_ADDRESS);
            expect(calldataInfo.ethAmount).to.deep.eq(new utils_1.BigNumber(0));
            const args = decodeSellToUniswap(calldataInfo.calldataHexString);
            expect(args).to.deep.eq({
                tokens: [TAKER_TOKEN, MAKER_TOKEN],
                sellAmount: test_data_1.ONE_ETHER,
                minBuyAmount: test_data_1.ONE_ETHER.times(2),
                isSushi: false,
            });
        });
        it('Returns sellToUniswap calldata for SushiSwap (ERC20->ERC20)', () => {
            const calldataInfo = uniswapV2Rule.createCalldata(COMPATIBLE_SUSHI_SWAP_SWAP_QUOTE, {
                isFromETH: false,
                isToETH: false,
                sellTokenAffiliateFees: [],
                buyTokenAffiliateFees: [test_data_1.NO_AFFILIATE_FEE],
                refundReceiver: TAKER_ADDRESS,
                shouldSellEntireBalance: false,
            });
            expect(calldataInfo.allowanceTarget).to.eq(EXCHANGE_PROXY_ADDRESS);
            expect(calldataInfo.toAddress).to.eq(EXCHANGE_PROXY_ADDRESS);
            expect(calldataInfo.ethAmount).to.deep.eq(new utils_1.BigNumber(0));
            const args = decodeSellToUniswap(calldataInfo.calldataHexString);
            expect(args).to.deep.eq({
                tokens: [TAKER_TOKEN, MAKER_TOKEN],
                sellAmount: test_data_1.ONE_ETHER,
                minBuyAmount: test_data_1.ONE_ETHER.times(2),
                isSushi: true,
            });
        });
    });
    // TODO Add more test cases:
    // * ETH->ERC20
    // * ERC20->ETH
});
const sellToUniswapEncoder = utils_1.AbiEncoder.createMethod('sellToUniswap', [
    { type: 'address[]', name: 'tokens' },
    { type: 'uint256', name: 'sellAmount' },
    { type: 'uint256', name: 'minBuyAmount' },
    { type: 'bool', name: 'isSushi' },
]);
function decodeSellToUniswap(calldata) {
    return sellToUniswapEncoder.decode(calldata);
}
//# sourceMappingURL=uniswap_v2_rule_test.js.map