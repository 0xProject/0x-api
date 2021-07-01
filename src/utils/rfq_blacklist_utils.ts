import { Connection } from 'typeorm/connection/Connection';

import { BlockedAddressEntity } from '../entities/BlockedAddressEntity';

/**
 * RfqBlacklistUtils helps manage the RFQ blacklist
 */
export class RfqBlacklistUtils {
    private static _instance: RfqBlacklistUtils;
    private _blacklist: Set<string>;
    private readonly _intervalTimeout: NodeJS.Timeout;

    public static getInstance(
        connection: Connection,
        initialBlacklist: Set<string>,
        intervalMs: number,
    ): RfqBlacklistUtils {
        if (!RfqBlacklistUtils._instance) {
            this._instance = new RfqBlacklistUtils(connection, initialBlacklist, intervalMs);
            return this._instance;
        }

        return RfqBlacklistUtils._instance;
    }

    public isBlocked(address: string): boolean {
        return this._blacklist.has(address.toLowerCase());
    }

    public stopUpdating(): void {
        clearInterval(this._intervalTimeout);
    }

    private constructor(private readonly _connection: Connection, initialBlacklist: Set<string>, intervalMs: number) {
        this._blacklist = initialBlacklist;

        const intervalTimeout = setInterval(async () => {
            await this._updateBlacklistAsync();
        }, intervalMs);
        this._intervalTimeout = intervalTimeout;
    }

    private async _updateBlacklistAsync(): Promise<void> {
        const blockedAddresses = await this._connection.getRepository(BlockedAddressEntity).find();
        this._blacklist = new Set(blockedAddresses.map((entity) => entity.address));
    }
}
