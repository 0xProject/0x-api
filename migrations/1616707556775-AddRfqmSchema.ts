import {MigrationInterface, QueryRunner} from "typeorm";

const upQuery = `
    ALTER TABLE transactions
        ADD COLUMN last_look_config JSONB;
`;

const downQuery = `
    ALTER TABLE transactions
        DROP COLUMN last_look_config JSONB;
`;

export class AddRfqmSchema1616707556775 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(upQuery);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(downQuery);
    }

}
