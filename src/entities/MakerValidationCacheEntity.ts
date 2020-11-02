import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'maker_valiation_cache' })
export class MakerValidationCacheEntity {
    @PrimaryColumn({ name: 'token_address', type: 'varchar' })
    public tokenAddress: string;

    @PrimaryColumn({ name: 'maker_address', type: 'varchar' })
    public makerAddress: string;

    @Column({ name: 'balance', type: 'bigint' })
    public balance: BigNumber;

    constructor(tokenAddress: string, makerAddress: string, balance: BigNumber) {
        this.tokenAddress = tokenAddress;
        this.makerAddress = makerAddress;
        this.balance = balance;
    }
}
