import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateRfqMakerPairsTable1639527388617 implements MigrationInterface {
    name = 'PopulateRfqMakerPairsTable1639527388617';

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
