export interface TransactionEntityOpts {
    hash: string;
    status: string;
    expectedMinedInSec: number;
    nonce: string;
    gasPrice: string;
    metaTxnRelayerAddress: string;
}
