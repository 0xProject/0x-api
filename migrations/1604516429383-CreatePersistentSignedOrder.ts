import { OrderEventEndState } from '@0x/mesh-rpc-client';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const OrderEventEndStateStrings = Object.keys(OrderEventEndState).filter(x => isNaN(parseInt(x, 10)));

export class CreatePersistentSignedOrder1604516429383 implements MigrationInterface {
    // tslint:disable-next-line
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'persistent_signed_orders',
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
    }

    // tslint:disable-next-line
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('persistent_signed_orders');
    }
}
