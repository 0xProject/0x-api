import { OrderEventEndState } from '@0x/mesh-rpc-client';
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

const OrderEventEndStateStrings = Object.keys(OrderEventEndState).filter(x => isNaN(parseInt(x, 10)));

export class CreatePersistentSignedOrder1604516429383 implements MigrationInterface {
    public indices = ['maker_address', 'maker_asset_data', 'taker_asset_data', 'fee_recipient_address'].map(
        colName => new TableIndex({ columnNames: [colName] }),
    );
    public tableName = 'persistent_signed_orders';

    // tslint:disable-next-line
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: this.tableName,
                columns: [
                    { name: 'hash', type: 'varchar', isPrimary: true },
                    { name: 'sender_address', type: 'varchar' },
                    { name: 'maker_address', type: 'varchar' },
                    { name: 'taker_address', type: 'varchar' },
                    { name: 'maker_asset_data', type: 'varchar' },
                    { name: 'taker_asset_data', type: 'varchar' },
                    { name: 'exchange_address', type: 'varchar' },
                    { name: 'fee_recipient_address', type: 'varchar' },
                    { name: 'expiration_time_seconds', type: 'varchar' },
                    { name: 'maker_fee', type: 'varchar' },
                    { name: 'taker_fee', type: 'varchar' },
                    { name: 'maker_asset_amount', type: 'varchar' },
                    { name: 'taker_asset_amount', type: 'varchar' },
                    { name: 'salt', type: 'varchar' },
                    { name: 'signature', type: 'varchar' },
                    { name: 'remaining_fillable_taker_asset_amount', type: 'varchar' },
                    { name: 'maker_fee_asset_data', type: 'varchar' },
                    { name: 'taker_fee_asset_data', type: 'varchar' },
                    { name: 'state', type: 'enum', enum: OrderEventEndStateStrings, default: OrderEventEndState.Added },
                ],
            }),
            true,
        );
        await queryRunner.createIndices(this.tableName, this.indices);
    }

    // tslint:disable-next-line
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndices(this.tableName, this.indices);
        await queryRunner.dropTable(this.tableName);
    }
}
