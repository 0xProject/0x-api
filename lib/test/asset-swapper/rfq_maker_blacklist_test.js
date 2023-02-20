"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
require("mocha");
const constants_1 = require("../../src/asset-swapper/constants");
const rfq_maker_blacklist_1 = require("../../src/asset-swapper/utils/rfq_maker_blacklist");
const chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
describe('RfqMakerBlacklist', () => {
    it('does blacklist', async () => {
        const blacklistDurationMinutes = 1;
        const timeoutStreakThreshold = 3;
        const blacklist = new rfq_maker_blacklist_1.RfqMakerBlacklist(blacklistDurationMinutes, timeoutStreakThreshold);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        expect(blacklist.isMakerBlacklisted('makerA')).to.be.false();
        blacklist.logTimeoutOrLackThereof('makerA', true);
        const sleepTimeMs = 10;
        await new Promise((r) => {
            setTimeout(r, sleepTimeMs);
        });
        expect(blacklist.isMakerBlacklisted('makerA')).to.be.true();
    });
    it('does unblacklist', async () => {
        const blacklistDurationMinutes = 0.1;
        const timeoutStreakThreshold = 3;
        const blacklist = new rfq_maker_blacklist_1.RfqMakerBlacklist(blacklistDurationMinutes, timeoutStreakThreshold);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        expect(blacklist.isMakerBlacklisted('makerA')).to.be.true();
        await new Promise((r) => {
            setTimeout(r, blacklistDurationMinutes * constants_1.constants.ONE_MINUTE_MS);
        });
        expect(blacklist.isMakerBlacklisted('makerA')).to.be.false();
    });
});
//# sourceMappingURL=rfq_maker_blacklist_test.js.map