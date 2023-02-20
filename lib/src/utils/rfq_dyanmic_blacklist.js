"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfqDynamicBlacklist = void 0;
const config_1 = require("../config");
const constants_1 = require("../constants");
const rfq_blocked_address_utils_1 = require("./rfq_blocked_address_utils");
/**
 * Satisfies the Set<string> interface, but uses RfqBlockedAddressUtils under the hood.
 * Only implements the `has` method
 */
class RfqDynamicBlacklist {
    constructor(connection, initialBlockedSet, ttlMs) {
        this._rfqBlockedAddressUtils = new rfq_blocked_address_utils_1.RfqBlockedAddressUtils(connection, initialBlockedSet, ttlMs);
        this.size = 0;
    }
    static create(connection) {
        if (!config_1.ENABLE_RFQT_TX_ORIGIN_BLACKLIST || connection === undefined) {
            return undefined;
        }
        return new RfqDynamicBlacklist(connection, config_1.RFQT_TX_ORIGIN_BLACKLIST, constants_1.RFQ_DYNAMIC_BLACKLIST_TTL);
    }
    get [Symbol.toStringTag]() {
        return 'RfqDynamicBlacklist';
    }
    has(value) {
        return this._rfqBlockedAddressUtils.isBlocked(value);
    }
    /// Pass through methods
    add(value) {
        this._rfqBlockedAddressUtils._blocked.add(value);
        return this;
    }
    clear() {
        this._rfqBlockedAddressUtils._blocked.clear();
    }
    delete(value) {
        return this._rfqBlockedAddressUtils._blocked.delete(value);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forEach(callbackfn, _thisArg) {
        this._rfqBlockedAddressUtils._blocked.forEach(callbackfn);
    }
    entries() {
        return this._rfqBlockedAddressUtils._blocked.entries();
    }
    keys() {
        return this._rfqBlockedAddressUtils._blocked.keys();
    }
    values() {
        return this._rfqBlockedAddressUtils._blocked.values();
    }
    [Symbol.iterator]() {
        return this._rfqBlockedAddressUtils._blocked.values();
    }
}
exports.RfqDynamicBlacklist = RfqDynamicBlacklist;
//# sourceMappingURL=rfq_dyanmic_blacklist.js.map