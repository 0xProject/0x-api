import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

const blockedAddressesTable = new Table({
    name: 'blocked_addresses',
    columns: [
        { name: 'address', type: 'varchar', isPrimary: true },
        { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
    ],
});

const createdAtIndex = new TableIndex({ name: `blocked_addresses_created_at_index`, columnNames: ['created_at'] });

export class CreateBlockedAddressesTable1625095491619 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(blockedAddressesTable);
        await queryRunner.createIndex('blocked_addresses', createdAtIndex);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('blocked_addresses', createdAtIndex);
        await queryRunner.dropTable(blockedAddressesTable);
    }
}
