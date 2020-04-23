import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { TransactionEntityOpts } from './types';

@Entity({ name: 'transactions' })
export class TransactionEntity {
    @PrimaryColumn({ name: 'ethereum_tx_hash', type: 'varchar' })
    public hash: string;

    @Column({ name: 'status', type: 'varchar' })
    public status: string;

    @Column({ name: 'expected_mined_in_sec', type: 'int' })
    public expectedMinedInSec?: number;

    @Column({ name: 'nonce', type: 'varchar' })
    public nonce: string;

    @Column({ name: 'gas_price', type: 'varchar' })
    public gasPrice: string;

    @Column({ name: 'meta_txn_relayer_address', type: 'varchar' })
    public metaTxnRelayerAddress: string;

    @CreateDateColumn({ name: 'created_at' })
    // tslint:ignore-next-line
    public createdAt?: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt?: Date;

    @Column({ name: 'expected_at', type: 'timestamptz' })
    public expectedAt: Date;

    // HACK(oskar) we want all fields to be set, otherwise we should not accept
    // a transaction entity, however because of this issue:
    // https://github.com/typeorm/typeorm/issues/1772 we cannot accept undefined
    // as an argument to the constructor, to not break migrations with serialize
    constructor(
        opts: TransactionEntityOpts = {
            hash: '',
            status: '',
            expectedMinedInSec: 120,
            nonce: '',
            gasPrice: '',
            metaTxnRelayerAddress: '',
        },
    ) {
        this.hash = opts.hash;
        this.status = opts.status;
        this.expectedMinedInSec = opts.expectedMinedInSec;
        this.nonce = opts.nonce;
        this.gasPrice = opts.gasPrice;
        this.metaTxnRelayerAddress = opts.metaTxnRelayerAddress;
        const now = new Date();
        this.expectedAt = new Date(now.getTime() + this.expectedMinedInSec * 1000);
    }
}
