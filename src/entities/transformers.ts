import { BigNumber } from '@0x/utils';
import { ValueTransformer } from 'typeorm';

export const BigNumberTransformer: ValueTransformer = {
    from: (value: string): BigNumber => new BigNumber(value),
    to: (value: BigNumber | undefined): string | null => {
        if (value === undefined) {
            return null;
        }
        return value.toString();
    },
};
