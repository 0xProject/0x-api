"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMakerBalanceChainCache1605637330716 = void 0;
const typeorm_1 = require("typeorm");
const makerBalanceChainCacheTable = new typeorm_1.Table({
    name: 'maker_balance_chain_cache',
    columns: [
        { name: 'token_address', type: 'varchar', isPrimary: true },
        { name: 'maker_address', type: 'varchar', isPrimary: true },
        { name: 'time_first_seen', type: 'timestamptz' },
        // fields are nullable for the job that adds new rows upon
        // discovery of a new maker address
        { name: 'balance', type: 'varchar', isNullable: true },
        { name: 'time_of_sample', type: 'timestamptz', isNullable: true },
    ],
});
class CreateMakerBalanceChainCache1605637330716 {
    async up(queryRunner) {
        queryRunner.createTable(makerBalanceChainCacheTable);
    }
    async down(queryRunner) {
        queryRunner.dropTable(makerBalanceChainCacheTable);
    }
}
exports.CreateMakerBalanceChainCache1605637330716 = CreateMakerBalanceChainCache1605637330716;
//# sourceMappingURL=1605637330716-CreateMakerBalanceChainCache.js.map