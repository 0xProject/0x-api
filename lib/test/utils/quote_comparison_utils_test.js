"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const asset_swapper_1 = require("../../src/asset-swapper");
const constants_1 = require("../../src/asset-swapper/utils/market_operation_utils/constants");
const constants_2 = require("../../src/constants");
const quote_comparison_utils_1 = require("../../src/utils/quote_comparison_utils");
const NEVER_EXPIRES = new utils_1.BigNumber('9999999999999999');
function createBaseOrder() {
    return {
        type: asset_swapper_1.FillQuoteTransformerOrderType.Rfq,
        order: {
            ...new asset_swapper_1.RfqOrder({
                makerAmount: constants_2.ZERO,
                takerAmount: constants_2.ZERO,
            }),
        },
        signature: {
            signatureType: asset_swapper_1.SignatureType.Invalid,
            v: 0,
            r: '0x1',
            s: '0x2',
        },
    };
}
describe('getBestQuote', () => {
    const makerToken = 'DAI';
    const takerToken = 'SUSD';
    const assetFillAmount = new utils_1.BigNumber(100);
    const validityWindowMs = constants_2.RFQM_MINIMUM_EXPIRY_DURATION_MS;
    const inOneMinute = new utils_1.BigNumber((Date.now() + constants_2.ONE_MINUTE_MS) / constants_1.ONE_SECOND_MS);
    describe('IndicativeQuotes when selling', () => {
        // Given
        const BASE_INDICATIVE_QUOTE = {
            makerToken,
            takerToken,
            expiry: NEVER_EXPIRES,
        };
        describe('sells', () => {
            const isSelling = true;
            const partialFillQuote = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(55),
                takerAmount: new utils_1.BigNumber(50),
            };
            const fullQuoteBadPricing = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(99),
                takerAmount: new utils_1.BigNumber(100),
            };
            const fullQuoteOkPricing = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(105),
                takerAmount: new utils_1.BigNumber(100),
            };
            const fullQuoteGreatPricing = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(125),
                takerAmount: new utils_1.BigNumber(100),
            };
            const wrongPair = {
                makerToken: takerToken,
                takerToken: makerToken,
                expiry: NEVER_EXPIRES,
                makerAmount: new utils_1.BigNumber(125),
                takerAmount: new utils_1.BigNumber(100),
            };
            const expiresInOneMinute = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(125),
                takerAmount: new utils_1.BigNumber(100),
                expiry: inOneMinute,
            };
            const tests = [
                {
                    name: 'should return null when no quotes valid',
                    quotes: [partialFillQuote],
                    expectations: {
                        isNull: true,
                        makerAmount: undefined,
                        takerAmount: undefined,
                    },
                },
                {
                    name: 'should only select quotes that are 100% filled',
                    quotes: [partialFillQuote, fullQuoteBadPricing],
                    expectations: {
                        isNull: false,
                        makerAmount: 99,
                        takerAmount: 100,
                    },
                },
                {
                    name: 'should select quote with best pricing',
                    quotes: [fullQuoteBadPricing, fullQuoteGreatPricing, fullQuoteOkPricing],
                    expectations: {
                        isNull: false,
                        makerAmount: 125,
                        takerAmount: 100,
                    },
                },
                {
                    name: 'should ignore quotes with the wrong pair',
                    quotes: [fullQuoteBadPricing, wrongPair],
                    expectations: {
                        isNull: false,
                        makerAmount: 99,
                        takerAmount: 100,
                    },
                },
                {
                    name: 'should ignore quotes that expire too soon',
                    quotes: [fullQuoteBadPricing, expiresInOneMinute],
                    expectations: {
                        isNull: false,
                        makerAmount: 99,
                        takerAmount: 100,
                    },
                },
            ];
            tests.forEach(({ name, quotes, expectations }) => {
                it(name, () => {
                    const bestQuote = (0, quote_comparison_utils_1.getBestQuote)(quotes, isSelling, takerToken, makerToken, assetFillAmount, validityWindowMs);
                    if (bestQuote === null) {
                        (0, contracts_test_utils_1.expect)(expectations === null || expectations === void 0 ? void 0 : expectations.isNull).to.be.true();
                        return;
                    }
                    (0, contracts_test_utils_1.expect)(expectations === null || expectations === void 0 ? void 0 : expectations.isNull).to.be.false();
                    (0, contracts_test_utils_1.expect)(bestQuote.makerAmount.toNumber()).to.be.eq(expectations === null || expectations === void 0 ? void 0 : expectations.makerAmount);
                    (0, contracts_test_utils_1.expect)(bestQuote.takerAmount.toNumber()).to.be.eq(expectations === null || expectations === void 0 ? void 0 : expectations.takerAmount);
                });
            });
        });
        describe('buys', () => {
            const isSelling = false;
            const partialFillQuote = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(55),
                takerAmount: new utils_1.BigNumber(50),
            };
            const fullQuoteBadPricing = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(100),
                takerAmount: new utils_1.BigNumber(125),
            };
            const fullQuoteOkPricing = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(100),
                takerAmount: new utils_1.BigNumber(120),
            };
            const fullQuoteGreatPricing = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(100),
                takerAmount: new utils_1.BigNumber(80),
            };
            const wrongPair = {
                makerToken: takerToken,
                takerToken: makerToken,
                expiry: NEVER_EXPIRES,
                makerAmount: new utils_1.BigNumber(100),
                takerAmount: new utils_1.BigNumber(80),
            };
            const expiresInOneMinute = {
                ...BASE_INDICATIVE_QUOTE,
                makerAmount: new utils_1.BigNumber(100),
                takerAmount: new utils_1.BigNumber(80),
                expiry: inOneMinute,
            };
            const tests = [
                {
                    name: 'should return null when no quotes valid',
                    quotes: [partialFillQuote],
                    expectations: {
                        isNull: true,
                        makerAmount: undefined,
                        takerAmount: undefined,
                    },
                },
                {
                    name: 'should only select quotes that are 100% filled',
                    quotes: [partialFillQuote, fullQuoteBadPricing],
                    expectations: {
                        isNull: false,
                        makerAmount: 100,
                        takerAmount: 125,
                    },
                },
                {
                    name: 'should select quote with best pricing',
                    quotes: [fullQuoteBadPricing, fullQuoteGreatPricing, fullQuoteOkPricing],
                    expectations: {
                        isNull: false,
                        makerAmount: 100,
                        takerAmount: 80,
                    },
                },
                {
                    name: 'should ignore quotes with the wrong pair',
                    quotes: [fullQuoteBadPricing, wrongPair],
                    expectations: {
                        isNull: false,
                        makerAmount: 100,
                        takerAmount: 125,
                    },
                },
                {
                    name: 'should ignore quotes that expire too soon',
                    quotes: [fullQuoteBadPricing, expiresInOneMinute],
                    expectations: {
                        isNull: false,
                        makerAmount: 100,
                        takerAmount: 125,
                    },
                },
            ];
            tests.forEach(({ name, quotes, expectations }) => {
                it(name, () => {
                    const bestQuote = (0, quote_comparison_utils_1.getBestQuote)(quotes, isSelling, takerToken, makerToken, assetFillAmount, validityWindowMs);
                    if (bestQuote === null) {
                        (0, contracts_test_utils_1.expect)(expectations === null || expectations === void 0 ? void 0 : expectations.isNull).to.be.true();
                        return;
                    }
                    (0, contracts_test_utils_1.expect)(expectations === null || expectations === void 0 ? void 0 : expectations.isNull).to.be.false();
                    (0, contracts_test_utils_1.expect)(bestQuote.makerAmount.toNumber()).to.be.eq(expectations === null || expectations === void 0 ? void 0 : expectations.makerAmount);
                    (0, contracts_test_utils_1.expect)(bestQuote.takerAmount.toNumber()).to.be.eq(expectations === null || expectations === void 0 ? void 0 : expectations.takerAmount);
                });
            });
        });
    });
    describe('FirmQuotes', () => {
        // Given
        const BASE_QUOTE = createBaseOrder();
        const BASE_ORDER = new asset_swapper_1.RfqOrder({
            makerToken,
            takerToken,
            expiry: NEVER_EXPIRES,
        });
        describe('sells', () => {
            const isSelling = true;
            const partialFillQuote = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(55),
                    takerAmount: new utils_1.BigNumber(50),
                },
            };
            const fullQuoteBadPricing = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(99),
                    takerAmount: new utils_1.BigNumber(100),
                },
            };
            const fullQuoteOkPricing = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(105),
                    takerAmount: new utils_1.BigNumber(100),
                },
            };
            const fullQuoteGreatPricing = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(125),
                    takerAmount: new utils_1.BigNumber(100),
                },
            };
            const wrongPair = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerToken: takerToken,
                    takerToken: makerToken,
                    expiry: NEVER_EXPIRES,
                    makerAmount: new utils_1.BigNumber(125),
                    takerAmount: new utils_1.BigNumber(100),
                },
            };
            const expiresInOneMinute = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(125),
                    takerAmount: new utils_1.BigNumber(100),
                    expiry: inOneMinute,
                },
            };
            const tests = [
                {
                    name: 'should return null when no quotes valid',
                    quotes: [partialFillQuote],
                    expectations: {
                        isNull: true,
                        makerAmount: undefined,
                        takerAmount: undefined,
                    },
                },
                {
                    name: 'should only select quotes that are 100% filled',
                    quotes: [partialFillQuote, fullQuoteBadPricing],
                    expectations: {
                        isNull: false,
                        makerAmount: 99,
                        takerAmount: 100,
                    },
                },
                {
                    name: 'should select quote with best pricing',
                    quotes: [fullQuoteBadPricing, fullQuoteGreatPricing, fullQuoteOkPricing],
                    expectations: {
                        isNull: false,
                        makerAmount: 125,
                        takerAmount: 100,
                    },
                },
                {
                    name: 'should ignore quotes with the wrong pair',
                    quotes: [fullQuoteBadPricing, wrongPair],
                    expectations: {
                        isNull: false,
                        makerAmount: 99,
                        takerAmount: 100,
                    },
                },
                {
                    name: 'should ignore quotes that expire too soon',
                    quotes: [fullQuoteBadPricing, expiresInOneMinute],
                    expectations: {
                        isNull: false,
                        makerAmount: 99,
                        takerAmount: 100,
                    },
                },
            ];
            tests.forEach(({ name, quotes, expectations }) => {
                it(name, () => {
                    const bestQuote = (0, quote_comparison_utils_1.getBestQuote)(quotes, isSelling, takerToken, makerToken, assetFillAmount, validityWindowMs);
                    if (bestQuote === null) {
                        (0, contracts_test_utils_1.expect)(expectations === null || expectations === void 0 ? void 0 : expectations.isNull).to.be.true();
                        return;
                    }
                    (0, contracts_test_utils_1.expect)(expectations === null || expectations === void 0 ? void 0 : expectations.isNull).to.be.false();
                    (0, contracts_test_utils_1.expect)(bestQuote.order.makerAmount.toNumber()).to.be.eq(expectations === null || expectations === void 0 ? void 0 : expectations.makerAmount);
                    (0, contracts_test_utils_1.expect)(bestQuote.order.takerAmount.toNumber()).to.be.eq(expectations === null || expectations === void 0 ? void 0 : expectations.takerAmount);
                });
            });
        });
        describe('buys', () => {
            const isSelling = false;
            const partialFillQuote = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(55),
                    takerAmount: new utils_1.BigNumber(50),
                },
            };
            const fullQuoteBadPricing = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(100),
                    takerAmount: new utils_1.BigNumber(125),
                },
            };
            const fullQuoteOkPricing = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(100),
                    takerAmount: new utils_1.BigNumber(120),
                },
            };
            const fullQuoteGreatPricing = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(100),
                    takerAmount: new utils_1.BigNumber(80),
                },
            };
            const wrongPair = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerToken: takerToken,
                    takerToken: makerToken,
                    expiry: NEVER_EXPIRES,
                    makerAmount: new utils_1.BigNumber(100),
                    takerAmount: new utils_1.BigNumber(80),
                },
            };
            const expiresInOneMinute = {
                ...BASE_QUOTE,
                order: {
                    ...BASE_ORDER,
                    makerAmount: new utils_1.BigNumber(100),
                    takerAmount: new utils_1.BigNumber(80),
                    expiry: inOneMinute,
                },
            };
            const tests = [
                {
                    name: 'should return null when no quotes valid',
                    quotes: [partialFillQuote],
                    expectations: {
                        isNull: true,
                        makerAmount: undefined,
                        takerAmount: undefined,
                    },
                },
                {
                    name: 'should only select quotes that are 100% filled',
                    quotes: [partialFillQuote, fullQuoteBadPricing],
                    expectations: {
                        isNull: false,
                        makerAmount: 100,
                        takerAmount: 125,
                    },
                },
                {
                    name: 'should select quote with best pricing',
                    quotes: [fullQuoteBadPricing, fullQuoteGreatPricing, fullQuoteOkPricing],
                    expectations: {
                        isNull: false,
                        makerAmount: 100,
                        takerAmount: 80,
                    },
                },
                {
                    name: 'should ignore quotes with the wrong pair',
                    quotes: [fullQuoteBadPricing, wrongPair],
                    expectations: {
                        isNull: false,
                        makerAmount: 100,
                        takerAmount: 125,
                    },
                },
                {
                    name: 'should ignore quotes that expire too soon',
                    quotes: [fullQuoteBadPricing, expiresInOneMinute],
                    expectations: {
                        isNull: false,
                        makerAmount: 100,
                        takerAmount: 125,
                    },
                },
            ];
            tests.forEach(({ name, quotes, expectations }) => {
                it(name, () => {
                    const bestQuote = (0, quote_comparison_utils_1.getBestQuote)(quotes, isSelling, takerToken, makerToken, assetFillAmount, validityWindowMs);
                    if (bestQuote === null) {
                        (0, contracts_test_utils_1.expect)(expectations === null || expectations === void 0 ? void 0 : expectations.isNull).to.be.true();
                        return;
                    }
                    (0, contracts_test_utils_1.expect)(expectations === null || expectations === void 0 ? void 0 : expectations.isNull).to.be.false();
                    (0, contracts_test_utils_1.expect)(bestQuote.order.makerAmount.toNumber()).to.be.eq(expectations === null || expectations === void 0 ? void 0 : expectations.makerAmount);
                    (0, contracts_test_utils_1.expect)(bestQuote.order.takerAmount.toNumber()).to.be.eq(expectations === null || expectations === void 0 ? void 0 : expectations.takerAmount);
                });
            });
        });
    });
});
//# sourceMappingURL=quote_comparison_utils_test.js.map