"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
require("mocha");
const asset_swapper_1 = require("../../src/asset-swapper");
const chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
describe('DEFAULT_GAS_SCHEDULE', () => {
    it('ERC20BridgeSource.Native but missing type', () => {
        const fillData = {};
        const gasSchedule = asset_swapper_1.DEFAULT_GAS_SCHEDULE[asset_swapper_1.ERC20BridgeSource.Native](fillData);
        expect(gasSchedule).to.eq(100e3);
    });
    it('ERC20BridgeSource.Native but fillData is incorrect type', () => {
        const fillData = 'garbage';
        const gasSchedule = asset_swapper_1.DEFAULT_GAS_SCHEDULE[asset_swapper_1.ERC20BridgeSource.Native](fillData);
        expect(gasSchedule).to.eq(100e3);
    });
    it('ERC20BridgeSource.Native LimitOrder', () => {
        const fillData = { type: asset_swapper_1.FillQuoteTransformerOrderType.Limit };
        const gasSchedule = asset_swapper_1.DEFAULT_GAS_SCHEDULE[asset_swapper_1.ERC20BridgeSource.Native](fillData);
        expect(gasSchedule).to.eq(100e3);
    });
    it('ERC20BridgeSource.Native RfqOrder', () => {
        const fillData = { type: asset_swapper_1.FillQuoteTransformerOrderType.Rfq };
        const gasSchedule = asset_swapper_1.DEFAULT_GAS_SCHEDULE[asset_swapper_1.ERC20BridgeSource.Native](fillData);
        expect(gasSchedule).to.eq(100e3);
    });
    it('ERC20BridgeSource.Native OtcOrder', () => {
        const fillData = { type: asset_swapper_1.FillQuoteTransformerOrderType.Otc };
        const gasSchedule = asset_swapper_1.DEFAULT_GAS_SCHEDULE[asset_swapper_1.ERC20BridgeSource.Native](fillData);
        expect(gasSchedule).to.eq(85e3);
    });
    it('ERC20BridgeSource.Native BridgeOrder', () => {
        const fillData = { type: asset_swapper_1.FillQuoteTransformerOrderType.Bridge };
        const gasSchedule = asset_swapper_1.DEFAULT_GAS_SCHEDULE[asset_swapper_1.ERC20BridgeSource.Native](fillData);
        expect(gasSchedule).to.eq(100e3);
    });
});
//# sourceMappingURL=gas_schedule_test.js.map