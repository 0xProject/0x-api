import { BigNumber } from '@0x/utils';

export interface TransactionEntityOpts {
    refHash: string;
    takerAddress?: string;
    status: string;
    expectedMinedInSec: number;
    to: string;
    data?: string;
    value?: BigNumber;
    from?: string;
    nonce?: number;
    gasPrice?: BigNumber;
    gas?: number;
    txHash?: string;
    gasUsed?: number;
    blockNumber?: number;
    // Ethereum tx status, 1 == success, 0 == failure
    txStatus?: number;
}
