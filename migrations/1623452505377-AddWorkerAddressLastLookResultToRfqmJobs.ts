import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const targetTable = 'rfqm_jobs';
const isCompletedColumn = new TableColumn({
    name: 'is_completed',
    type: 'boolean',
    isNullable: false,
});
const workerAddressColumn = new TableColumn({
    name: 'worker_address',
    type: 'varchar',
    isNullable: true,
});
const lastLookResultColumn = new TableColumn({
    name: 'last_look_result',
    type: 'boolean',
    isNullable: true,
});

export class AddWorkerAddressLastLookResultToRfqmJobs1623452505377 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(targetTable, isCompletedColumn);
        await queryRunner.addColumn(targetTable, workerAddressColumn);
        await queryRunner.addColumn(targetTable, lastLookResultColumn);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn(targetTable, isCompletedColumn);
        await queryRunner.dropColumn(targetTable, workerAddressColumn);
        await queryRunner.dropColumn(targetTable, lastLookResultColumn);
    }
}
