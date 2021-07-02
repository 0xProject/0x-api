import { Connection } from 'typeorm';

import { RfqBlockedAddressUtils } from './rfq_blocked_address_utils';

/**
 * Satisfies the Set<string> interface, but uses RfqBlockedAddressUtils under the hood.
 * Only implements the `has` method
 */
export class RfqDynamicBlacklist implements Set<string> {
    public size: number;
    public [Symbol.toStringTag]: string;
    private readonly _rfqBlockedAddressUtils: RfqBlockedAddressUtils;

    constructor(connection: Connection, initialBlockedSet: Set<string>, ttlMs: number) {
        this._rfqBlockedAddressUtils = new RfqBlockedAddressUtils(connection, initialBlockedSet, ttlMs);
        this.size = 0;
    }

    public has(value: string): boolean {
        return this._rfqBlockedAddressUtils.isBlocked(value);
    }

    /// Unimplemented methods
    // tslint:disable-next-line: prefer-function-over-method
    public add(value: string): this {
        throw new Error('Method not implemented.');
    }

    // tslint:disable-next-line: prefer-function-over-method
    public clear(): void {
        throw new Error('Method not implemented.');
    }

    // tslint:disable-next-line: prefer-function-over-method
    public delete(value: string): boolean {
        throw new Error('Method not implemented.');
    }

    // tslint:disable-next-line: prefer-function-over-method
    public forEach(callbackfn: (value: string, value2: string, set: Set<string>) => void, thisArg?: any): void {
        throw new Error('Method not implemented.');
    }

    // tslint:disable-next-line: prefer-function-over-method
    public entries(): IterableIterator<[string, string]> {
        throw new Error('Method not implemented.');
    }

    // tslint:disable-next-line: prefer-function-over-method
    public keys(): IterableIterator<string> {
        throw new Error('Method not implemented.');
    }

    // tslint:disable-next-line: prefer-function-over-method
    public values(): IterableIterator<string> {
        throw new Error('Method not implemented.');
    }

    // tslint:disable-next-line: prefer-function-over-method
    public [Symbol.iterator](): IterableIterator<string> {
        throw new Error('Method not implemented.');
    }
}
