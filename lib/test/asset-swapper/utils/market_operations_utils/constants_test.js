"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
require("mocha");
const asset_swapper_1 = require("../../../../src/asset-swapper");
const chai_setup_1 = require("../chai_setup");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
describe('Constants', () => {
    describe('Liquidity Sources', () => {
        const allChainIds = Object.values(asset_swapper_1.ChainId).filter((chainId) => !isNaN(Number(chainId)));
        allChainIds.forEach((chainId) => {
            it(`Supports MultiHop (chainId: ${chainId})`, async () => {
                expect(asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[chainId].isAllowed(asset_swapper_1.ERC20BridgeSource.MultiHop));
                expect(asset_swapper_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[chainId].isAllowed(asset_swapper_1.ERC20BridgeSource.MultiHop));
            });
        });
    });
});
//# sourceMappingURL=constants_test.js.map