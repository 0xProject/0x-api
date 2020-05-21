import { BigNumber } from '@0x/utils';

export interface TransactionEntityOpts {
    refHash: string;
    txHash?: string;
    to: string;
    data?: string;
    takerAddress?: string;
    status: string;
    expectedMinedInSec: number;
    nonce?: number;
    gasPrice?: BigNumber;
    value?: BigNumber;
    blockNumber?: number;
    from?: string;
}
