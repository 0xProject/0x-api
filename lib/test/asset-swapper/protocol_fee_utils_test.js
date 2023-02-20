"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
require("mocha");
const msw_1 = require("msw");
const node_1 = require("msw/node");
const asset_swapper_1 = require("../../src/asset-swapper");
const chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
const server = (0, node_1.setupServer)(msw_1.rest.get('https://mock-0x-gas-api.org/median', (_req, res, ctx) => {
    return res(ctx.json({
        result: {
            source: 'MEDIAN',
            timestamp: 1659386474,
            instant: 22000000000,
            fast: 18848500000,
            standard: 14765010000,
            low: 13265000000,
        },
    }));
}));
describe('ProtocolFeeUtils', () => {
    describe('getGasPriceEstimationOrThrowAsync', () => {
        beforeEach(() => {
            server.listen();
        });
        afterEach(() => {
            server.close();
        });
        it('parses fast gas price response correctly', async () => {
            const utils = asset_swapper_1.ProtocolFeeUtils.getInstance(420000, 'https://mock-0x-gas-api.org/median');
            const gasPrice = await utils.getGasPriceEstimationOrThrowAsync();
            expect(gasPrice.toNumber()).to.eq(18848500000);
        });
    });
});
//# sourceMappingURL=protocol_fee_utils_test.js.map