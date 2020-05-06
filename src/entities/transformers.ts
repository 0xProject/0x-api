import { BigNumber } from '@0x/utils';
import { ValueTransformer } from 'typeorm';

import { ZeroExTransactionWithoutDomain } from '../types';

export const ZeroExTransactionWithoutDomainTransformer: ValueTransformer = {
    from: (value: string): ZeroExTransactionWithoutDomain => {
        const obj = JSON.parse(value);
        obj.salt = new BigNumber(obj.salt);
        obj.expirationTimeSeconds = new BigNumber(obj.expirationTimeSeconds);
        obj.gasPrice = new BigNumber(obj.gasPrice);
        return obj;
    },
    to: (value: ZeroExTransactionWithoutDomain): string => {
        const objToStore = {
            ...value,
            salt: value.salt.toString(),
            expirationTimeSeconds: value.expirationTimeSeconds.toString(),
            gasPrice: value.gasPrice.toString(),
        };
        return JSON.stringify(objToStore);
    },
};

export const BigNumberTransformer: ValueTransformer = {
    from: (value: string | null): BigNumber | null => {
        return value === null ? null : new BigNumber(value);
    },
    to: (value: BigNumber | null | undefined): string | null => {
        return value === null || value === undefined ? null : value.toString();
    },
};
