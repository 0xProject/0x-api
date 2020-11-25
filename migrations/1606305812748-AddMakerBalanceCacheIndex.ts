import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMakerBalanceCacheIndex1606305812748 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `CREATE INDEX "maker_balance_chain_cache_idx" ON "maker_balance_chain_cache" ("token_address", "maker_address")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "maker_balance_chain_cache_idx"`);
    }
}
