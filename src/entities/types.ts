import { BigNumber } from '@0x/utils';

export interface TransactionEntityOpts {
    hash: string;
    status: string;
    expectedMinedInSec: number;
    nonce: number;
    gasPrice: BigNumber;
    blockNumber?: number;
    from: string;
}
