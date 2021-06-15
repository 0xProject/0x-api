import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropRfqmStatusReasonColumn1623716682037 implements MigrationInterface {
    name = 'DropRfqmStatusReasonColumn1623716682037';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfqm_jobs" DROP COLUMN "status_reason"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfqm_jobs" ADD "status_reason" character varying`);
    }
}
