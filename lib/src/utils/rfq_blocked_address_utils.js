"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfqBlockedAddressUtils = void 0;
const prom_client_1 = require("prom-client");
const BlockedAddressEntity_1 = require("../entities/BlockedAddressEntity");
const logger_1 = require("../logger");
const MAX_SET_SIZE = 5000;
const RFQ_BLOCKED_ADDRESS_SET_SIZE = new prom_client_1.Gauge({
    name: 'rfq_blocked_address_set_size',
    help: 'The number of blocked addresses',
});
/**
 * RfqBlockedAddressUtils helps manage the RFQ blocked addresses
 */
class RfqBlockedAddressUtils {
    constructor(_connection, initialBlockedSet, ttlMs) {
        this._connection = _connection;
        this._blocked = initialBlockedSet;
        this._ttlMs = ttlMs;
        this._updating = false;
        this._expiresAt = Date.now().valueOf(); // cache expires immediately
    }
    /**
     * isBlocked returns whether an address is blocked from the cache
     * NOTE: In the background, it also updates the blocked set if the cache is expired
     */
    isBlocked(address) {
        if (Date.now().valueOf() > this._expiresAt && !this._updating) {
            // If expired, update in the background
            this._updatePromise = this._updateBlockedSetAsync();
        }
        // Return cached value, even if stale
        return this._blocked.has(address.toLowerCase());
    }
    /**
     * completeUpdateAsync returns a Promise that resolves when the blocked address cache is updated
     */
    async completeUpdateAsync() {
        if (this._updatePromise) {
            return this._updatePromise;
        }
    }
    /**
     * Updates the blocked set of addresses
     */
    async _updateBlockedSetAsync() {
        this._updating = true;
        const blockedAddresses = await this._connection
            .getRepository(BlockedAddressEntity_1.BlockedAddressEntity)
            .find({ take: MAX_SET_SIZE });
        RFQ_BLOCKED_ADDRESS_SET_SIZE.set(blockedAddresses.length);
        if (blockedAddresses.length >= MAX_SET_SIZE) {
            logger_1.logger.warn('Blocked address table has hit or exceeded the limit');
        }
        this._blocked = new Set(blockedAddresses.map((entity) => entity.address.toLowerCase()));
        this._expiresAt = Date.now().valueOf() + this._ttlMs;
        this._updating = false;
    }
}
exports.RfqBlockedAddressUtils = RfqBlockedAddressUtils;
//# sourceMappingURL=rfq_blocked_address_utils.js.map