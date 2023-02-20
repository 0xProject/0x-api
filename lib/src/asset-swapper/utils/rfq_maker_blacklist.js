"use strict";
/**
 * Tracks a maker's history of timely responses, and manages whether a given
 * maker should be avoided for being too latent.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfqMakerBlacklist = void 0;
const constants_1 = require("../constants");
class RfqMakerBlacklist {
    constructor(_blacklistDurationMinutes, _timeoutStreakThreshold, infoLogger = constants_1.constants.DEFAULT_INFO_LOGGER) {
        this._blacklistDurationMinutes = _blacklistDurationMinutes;
        this._timeoutStreakThreshold = _timeoutStreakThreshold;
        this.infoLogger = infoLogger;
        this._makerTimeoutStreakLength = {};
        this._makerBlacklistedUntilDate = {};
    }
    logTimeoutOrLackThereof(makerUrl, didTimeout) {
        if (!Object.prototype.hasOwnProperty.call(this._makerTimeoutStreakLength, makerUrl)) {
            this._makerTimeoutStreakLength[makerUrl] = 0;
        }
        if (didTimeout) {
            this._makerTimeoutStreakLength[makerUrl] += 1;
            if (this._makerTimeoutStreakLength[makerUrl] === this._timeoutStreakThreshold) {
                const blacklistEnd = Date.now() + this._blacklistDurationMinutes * constants_1.constants.ONE_MINUTE_MS;
                this._makerBlacklistedUntilDate[makerUrl] = blacklistEnd;
                this.infoLogger({ makerUrl, blacklistedUntil: new Date(blacklistEnd).toISOString() }, 'maker blacklisted');
            }
        }
        else {
            this._makerTimeoutStreakLength[makerUrl] = 0;
        }
    }
    isMakerBlacklisted(makerUrl) {
        const now = Date.now();
        if (now > this._makerBlacklistedUntilDate[makerUrl]) {
            delete this._makerBlacklistedUntilDate[makerUrl];
            this.infoLogger({ makerUrl }, 'maker unblacklisted');
        }
        return this._makerBlacklistedUntilDate[makerUrl] > now;
    }
}
exports.RfqMakerBlacklist = RfqMakerBlacklist;
//# sourceMappingURL=rfq_maker_blacklist.js.map