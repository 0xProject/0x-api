import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialTables1604516429083 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "signed_orders" (
                "hash" character varying NOT NULL,
                "sender_address" character varying NOT NULL,
                "maker_address" character varying NOT NULL,
                "taker_address" character varying NOT NULL,
                "maker_asset_data" character varying NOT NULL,
                "taker_asset_data" character varying NOT NULL,
                "exchange_address" character varying NOT NULL,
                "fee_recipient_address" character varying NOT NULL,
                "expiration_time_seconds" character varying NOT NULL,
                "maker_fee" character varying NOT NULL,
                "taker_fee" character varying NOT NULL,
                "maker_asset_amount" character varying NOT NULL,
                "taker_asset_amount" character varying NOT NULL,
                "salt" character varying NOT NULL,
                "signature" character varying NOT NULL,
                "remaining_fillable_taker_asset_amount" character varying NOT NULL,
                "maker_fee_asset_data" character varying NOT NULL,
                "taker_fee_asset_data" character varying NOT NULL,
                CONSTRAINT "PK_a3cad7b4fbb8b4111368a152d8f" PRIMARY KEY ("hash"))`,
        );
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "offer_create_contingent_pools" (
                "offer_hash" character varying NOT NULL,
                "maker" character varying NOT NULL,
                "taker" character varying NOT NULL,
                "maker_collateral_amount" character varying NOT NULL,
                "taker_collateral_amount" character varying NOT NULL,
                "maker_direction" character varying NOT NULL,
                "offer_expiry" character varying NOT NULL,
                "minimum_taker_fill_amount" character varying NOT NULL,
                "reference_asset" character varying NOT NULL,
                "expiry_time" character varying NOT NULL,
                "floor" character varying NOT NULL,
                "inflection" character varying NOT NULL,
                "cap" character varying NOT NULL,
                "gradient" character varying NOT NULL,
                "collateral_token" character varying NOT NULL,
                "data_provider" character varying NOT NULL,
                "capacity" character varying NOT NULL,
                "permissioned_token" character varying NOT NULL,
                "salt" character varying NOT NULL,
                "chain_id" integer,
                "verifying_contract" character varying NOT NULL,
                "signature" character varying NOT NULL,
                CONSTRAINT "PK_9dwmad8elvup9wognw95fhqa48h" PRIMARY KEY ("offer_hash"))`,
        );
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "offer_add_liquidity" (
                "offer_hash" character varying NOT NULL,
                "maker" character varying NOT NULL,
                "taker" character varying NOT NULL,
                "maker_collateral_amount" character varying NOT NULL,
                "taker_collateral_amount" character varying NOT NULL,
                "maker_direction" character varying NOT NULL,
                "offer_expiry" character varying NOT NULL,
                "minimum_taker_fill_amount" character varying NOT NULL,
                "pool_id" character varying NOT NULL,
                "salt" character varying NOT NULL,
                "chain_id" integer NOT NULL,
                "verifying_contract" character varying NOT NULL,
                "actual_taker_fillable_amount" character varying NOT NULL,
                "reference_asset" character varying NOT NULL,
                "collateral_token" character varying NOT NULL,
                "data_provider" character varying NOT NULL,
                "signature" character varying NOT NULL,
                CONSTRAINT "PK_2nhf194jgyh71jh48sl34u7k492" PRIMARY KEY ("offer_hash"))`,
        );
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "transactions" (
                "ref_hash" character varying NOT NULL,
                "data" character varying,
                "to" character varying NOT NULL,
                "tx_hash" character varying,
                "status" character varying NOT NULL,
                "taker_address" character varying,
                "expected_mined_in_sec" integer NOT NULL,
                "gas_price" bigint,
                "value" bigint,
                "gas" integer,
                "from" character varying,
                "nonce" bigint,
                "gas_used" integer,
                "block_number" bigint,
                "tx_status" integer,
                "api_key" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "expected_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "UQ_0deaa0ee5092d45fac99139de7c" UNIQUE ("tx_hash"),
                CONSTRAINT "PK_32e851f3e63df13fdcc61545423" PRIMARY KEY ("ref_hash"))`,
        );
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "kv_store" (
                "key" character varying NOT NULL,
                "value" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a9c11644aa565bf7675e6bd23ef" PRIMARY KEY ("key"))`,
        );
        await queryRunner.query(`CREATE INDEX "maker_address_idx" ON "signed_orders" ("maker_address") `);
        await queryRunner.query(`CREATE INDEX "taker_asset_data_idx" ON "signed_orders" ("taker_asset_data") `);
        await queryRunner.query(`CREATE INDEX "maker_asset_data_idx" ON "signed_orders" ("maker_asset_data") `);
        await queryRunner.query(
            `CREATE INDEX "maker_taker_asset_data_idx" ON "signed_orders" ("maker_asset_data", "taker_asset_data") `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "maker_taker_asset_data_idx"`);
        await queryRunner.query(`DROP INDEX "maker_asset_data_idx"`);
        await queryRunner.query(`DROP INDEX "taker_asset_data_idx"`);
        await queryRunner.query(`DROP INDEX "maker_address_idx"`);
        await queryRunner.query(`DROP TABLE "kv_store"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "signed_orders"`);
    }
}
