import {MigrationInterface, QueryRunner} from "typeorm";

export class AddV4SignedOrdersAndPesistentSignedOrders1612211343823 implements MigrationInterface {
    name = 'AddV4SignedOrdersAndPesistentSignedOrders1612211343823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "maker_address_idx"`);
        await queryRunner.query(`DROP INDEX "taker_asset_data_idx"`);
        await queryRunner.query(`DROP INDEX "maker_asset_data_idx"`);
        await queryRunner.query(`DROP INDEX "maker_taker_asset_data_idx"`);
        await queryRunner.query(`DROP INDEX "persistent_signed_orders_maker_address"`);
        await queryRunner.query(`DROP INDEX "persistent_signed_orders_maker_asset_data"`);
        await queryRunner.query(`DROP INDEX "persistent_signed_orders_taker_asset_data"`);
        await queryRunner.query(`DROP INDEX "persistent_signed_orders_fee_recipient_address"`);
        await queryRunner.query(`CREATE TABLE "signed_orders_v4" ("hash" character varying NOT NULL, "maker_token" character varying NOT NULL, "taker_token" character varying NOT NULL, "maker_amount" character varying NOT NULL, "taker_amount" character varying NOT NULL, "maker" character varying NOT NULL, "taker" character varying NOT NULL, "pool" character varying NOT NULL, "expiry" character varying NOT NULL, "salt" character varying NOT NULL, "verifying_contract" character varying NOT NULL, "taker_token_fee_amount" character varying NOT NULL, "sender" character varying NOT NULL, "fee_recipient" character varying NOT NULL, "signature" character varying NOT NULL, "remaining_fillable_taker_asset_amount" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', CONSTRAINT "PK_714e263c3ab18702fd2b7dcc81d" PRIMARY KEY ("hash"))`);
        await queryRunner.query(`CREATE TYPE "persistent_signed_orders_v4_state_enum" AS ENUM('ADDED', 'FILLED', 'FULLY_FILLED', 'CANCELLED', 'EXPIRED', 'UNEXPIRED', 'UNFUNDED', 'FILLABILITY_INCREASED', 'STOPPED_WATCHING')`);
        await queryRunner.query(`CREATE TABLE "persistent_signed_orders_v4" ("hash" character varying NOT NULL, "sender_address" character varying NOT NULL, "maker_address" character varying NOT NULL, "taker_address" character varying NOT NULL, "maker_asset_data" character varying NOT NULL, "taker_asset_data" character varying NOT NULL, "exchange_address" character varying NOT NULL, "fee_recipient_address" character varying NOT NULL, "expiration_time_seconds" character varying NOT NULL, "maker_fee" character varying NOT NULL, "taker_fee" character varying NOT NULL, "maker_asset_amount" character varying NOT NULL, "taker_asset_amount" character varying NOT NULL, "salt" character varying NOT NULL, "signature" character varying NOT NULL, "remaining_fillable_taker_asset_amount" character varying NOT NULL, "maker_fee_asset_data" character varying NOT NULL, "taker_fee_asset_data" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "maker_token" character varying NOT NULL, "taker_token" character varying NOT NULL, "maker_amount" character varying NOT NULL, "taker_amount" character varying NOT NULL, "maker" character varying NOT NULL, "taker" character varying NOT NULL, "pool" character varying NOT NULL, "expiry" character varying NOT NULL, "verifying_contract" character varying NOT NULL, "taker_token_fee_amount" character varying NOT NULL, "sender" character varying NOT NULL, "fee_recipient" character varying NOT NULL, "state" "persistent_signed_orders_v4_state_enum" NOT NULL DEFAULT 'ADDED', CONSTRAINT "PK_e4d7a1964eb56734463b19681fa" PRIMARY KEY ("hash"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3bd8111c0502847f405082b582" ON "persistent_signed_orders_v4" ("maker_token") `);
        await queryRunner.query(`CREATE INDEX "IDX_d611fdbc7da0effe48c103ac77" ON "persistent_signed_orders_v4" ("taker_token") `);
        await queryRunner.query(`CREATE INDEX "IDX_7648bdf4a96ddc5cc7cfbc0135" ON "persistent_signed_orders_v4" ("maker") `);
        await queryRunner.query(`COMMENT ON COLUMN "signed_orders"."created_at" IS NULL`);
        await queryRunner.query(`ALTER TABLE "signed_orders" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`COMMENT ON COLUMN "persistent_signed_orders"."created_at" IS NULL`);
        await queryRunner.query(`ALTER TABLE "persistent_signed_orders" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TYPE "public"."persistent_signed_orders_state_enum" RENAME TO "persistent_signed_orders_state_enum_old"`);
        await queryRunner.query(`CREATE TYPE "persistent_signed_orders_state_enum" AS ENUM('ADDED', 'FILLED', 'FULLY_FILLED', 'CANCELLED', 'EXPIRED', 'UNEXPIRED', 'UNFUNDED', 'FILLABILITY_INCREASED', 'STOPPED_WATCHING')`);
        await queryRunner.query(`ALTER TABLE "persistent_signed_orders" ALTER COLUMN "state" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "persistent_signed_orders" ALTER COLUMN "state" TYPE "persistent_signed_orders_state_enum" USING "state"::"text"::"persistent_signed_orders_state_enum"`);
        await queryRunner.query(`ALTER TABLE "persistent_signed_orders" ALTER COLUMN "state" SET DEFAULT 'ADDED'`);
        await queryRunner.query(`DROP TYPE "persistent_signed_orders_state_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "persistent_signed_orders"."state" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_485f18e568ea778cd2dd88c3af" ON "persistent_signed_orders" ("maker_address") `);
        await queryRunner.query(`CREATE INDEX "IDX_9854d3181abb2b9fd643f1417d" ON "persistent_signed_orders" ("maker_asset_data") `);
        await queryRunner.query(`CREATE INDEX "IDX_09def10d6cc38e4d31a9e0b5db" ON "persistent_signed_orders" ("taker_asset_data") `);
        await queryRunner.query(`CREATE INDEX "IDX_f181036ca90bfe6d7507447b33" ON "persistent_signed_orders" ("fee_recipient_address") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_f181036ca90bfe6d7507447b33"`);
        await queryRunner.query(`DROP INDEX "IDX_09def10d6cc38e4d31a9e0b5db"`);
        await queryRunner.query(`DROP INDEX "IDX_9854d3181abb2b9fd643f1417d"`);
        await queryRunner.query(`DROP INDEX "IDX_485f18e568ea778cd2dd88c3af"`);
        await queryRunner.query(`COMMENT ON COLUMN "persistent_signed_orders"."state" IS NULL`);
        await queryRunner.query(`CREATE TYPE "persistent_signed_orders_state_enum_old" AS ENUM('INVALID', 'ADDED', 'FILLED', 'FULLYFILLED', 'CANCELLED', 'EXPIRED', 'UNEXPIRED', 'STOPPEDWATCHING', 'UNFUNDED', 'FILLABILITYINCREASED')`);
        await queryRunner.query(`ALTER TABLE "persistent_signed_orders" ALTER COLUMN "state" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "persistent_signed_orders" ALTER COLUMN "state" TYPE "persistent_signed_orders_state_enum_old" USING "state"::"text"::"persistent_signed_orders_state_enum_old"`);
        await queryRunner.query(`ALTER TABLE "persistent_signed_orders" ALTER COLUMN "state" SET DEFAULT 'ADDED'`);
        await queryRunner.query(`DROP TYPE "persistent_signed_orders_state_enum"`);
        await queryRunner.query(`ALTER TYPE "persistent_signed_orders_state_enum_old" RENAME TO  "persistent_signed_orders_state_enum"`);
        await queryRunner.query(`ALTER TABLE "persistent_signed_orders" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`COMMENT ON COLUMN "persistent_signed_orders"."created_at" IS NULL`);
        await queryRunner.query(`ALTER TABLE "signed_orders" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`COMMENT ON COLUMN "signed_orders"."created_at" IS NULL`);
        await queryRunner.query(`DROP INDEX "IDX_7648bdf4a96ddc5cc7cfbc0135"`);
        await queryRunner.query(`DROP INDEX "IDX_d611fdbc7da0effe48c103ac77"`);
        await queryRunner.query(`DROP INDEX "IDX_3bd8111c0502847f405082b582"`);
        await queryRunner.query(`DROP TABLE "persistent_signed_orders_v4"`);
        await queryRunner.query(`DROP TYPE "persistent_signed_orders_v4_state_enum"`);
        await queryRunner.query(`DROP TABLE "signed_orders_v4"`);
        await queryRunner.query(`CREATE INDEX "persistent_signed_orders_fee_recipient_address" ON "persistent_signed_orders" ("fee_recipient_address") `);
        await queryRunner.query(`CREATE INDEX "persistent_signed_orders_taker_asset_data" ON "persistent_signed_orders" ("taker_asset_data") `);
        await queryRunner.query(`CREATE INDEX "persistent_signed_orders_maker_asset_data" ON "persistent_signed_orders" ("maker_asset_data") `);
        await queryRunner.query(`CREATE INDEX "persistent_signed_orders_maker_address" ON "persistent_signed_orders" ("maker_address") `);
        await queryRunner.query(`CREATE INDEX "maker_taker_asset_data_idx" ON "signed_orders" ("maker_asset_data", "taker_asset_data") `);
        await queryRunner.query(`CREATE INDEX "maker_asset_data_idx" ON "signed_orders" ("maker_asset_data") `);
        await queryRunner.query(`CREATE INDEX "taker_asset_data_idx" ON "signed_orders" ("taker_asset_data") `);
        await queryRunner.query(`CREATE INDEX "maker_address_idx" ON "signed_orders" ("maker_address") `);
    }

}
