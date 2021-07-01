import { Connection } from 'typeorm/connection/Connection';

import { BlockedAddressEntity } from '../entities/BlockedAddressEntity';

/**
 * RfqBlockedAddressUtils helps manage the RFQ blocked addresses
 */
export class RfqBlockedAddressUtils {
    private static _singleton: RfqBlockedAddressUtils;
    private _blocked: Set<string>;
    private _expiresAt: number;
    private _updatePromise: Promise<void> | undefined;
    private _updating: boolean;
    private readonly _ttlMs: number;

    /**
     * getOrCreate either gets the RfqBlockedAddressUtils singleton, or creates it
     */
    public static getOrCreate(
        connection: Connection,
        initialBlockedSet: Set<string>,
        ttlMs: number,
    ): RfqBlockedAddressUtils {
        if (!RfqBlockedAddressUtils._singleton) {
            this._singleton = new RfqBlockedAddressUtils(connection, initialBlockedSet, ttlMs);
            return this._singleton;
        }

        return RfqBlockedAddressUtils._singleton;
    }

    /**
     * isBlocked returns whether an address is blocked from the cache
     * NOTE: In the background, it also updates the blocked set if the cache is expired
     */
    public isBlocked(address: string): boolean {
        if (Date.now().valueOf() > this._expiresAt && !this._updating) {
            // If expired, update in the background
            this._updatePromise = this._updateBlockedSetAsync();
        }

        // Return cached value, even if stale
        return this._blocked.has(address.toLowerCase());
    }

    /**
     * isBlockedAsync returns whether an address is blocked. The value is as "fresh" as the TTL allows
     */
    public async isBlockedAsync(address: string): Promise<boolean> {
        // If already updating, await until done
        if (this._updating) {
            await this._updatePromise;
        }

        // Check if the TTL has been exceeded
        if (Date.now().valueOf() > this._expiresAt && !this._updating) {
            await this._updateBlockedSetAsync();
        }

        // Guaranteed to be a fresh value
        return this._blocked.has(address.toLowerCase());
    }

    /**
     * Private constructor - use getOrCreate instead
     */
    private constructor(private readonly _connection: Connection, initialBlacklist: Set<string>, ttlMs: number) {
        this._blocked = initialBlacklist;
        this._ttlMs = ttlMs;
        this._updating = false;
        this._expiresAt = Date.now().valueOf(); // cache expires immediately
    }

    /**
     * Updates the blocked set of addresses
     */
    private async _updateBlockedSetAsync(): Promise<void> {
        this._updating = true;
        const blockedAddresses = await this._connection.getRepository(BlockedAddressEntity).find();
        this._blocked = new Set(blockedAddresses.map((entity) => entity.address.toLowerCase()));
        this._expiresAt = Date.now().valueOf() + this._ttlMs;
        this._updating = false;
    }
}
