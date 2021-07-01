import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'blocked_addresses' })
export class BlockedAddressEntity {
    @PrimaryColumn({ name: 'address', type: 'varchar' })
    public address: string;

    @Index()
    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
    public createdAt!: Date;

    constructor(address: string, createdAt?: Date) {
        // allow createdAt overrides for testing
        if (createdAt) {
            this.createdAt = createdAt;
        }
        this.address = address;
    }
}
