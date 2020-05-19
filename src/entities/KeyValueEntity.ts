import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'kv_store' })
export class KeyValueEntity {
    @PrimaryColumn({ name: 'key', type: 'varchar' })
    public key: string;

    @Column({ name: 'value', type: 'varchar', nullable: true })
    public value?: string;

    @CreateDateColumn({ name: 'created_at' })
    public createdAt?: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt?: Date;

    constructor(key: string, value?: string) {
        this.key = key;
        this.value = value;
    }
}
