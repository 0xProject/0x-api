"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakerBalanceChainCacheEntity = void 0;
const typeorm_1 = require("typeorm");
const transformers_1 = require("./transformers");
// A table of cached erc20 balances for RFQT market makers
let MakerBalanceChainCacheEntity = class MakerBalanceChainCacheEntity {
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'token_address', type: 'varchar' }),
    __metadata("design:type", String)
], MakerBalanceChainCacheEntity.prototype, "tokenAddress", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'maker_address', type: 'varchar' }),
    __metadata("design:type", String)
], MakerBalanceChainCacheEntity.prototype, "makerAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'time_first_seen', type: 'timestamptz' }),
    __metadata("design:type", Date)
], MakerBalanceChainCacheEntity.prototype, "timeFirstSeen", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'balance', type: 'varchar', nullable: true, transformer: transformers_1.BigNumberTransformer }),
    __metadata("design:type", Object)
], MakerBalanceChainCacheEntity.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'time_of_sample', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], MakerBalanceChainCacheEntity.prototype, "timeOfSample", void 0);
MakerBalanceChainCacheEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'maker_balance_chain_cache' })
], MakerBalanceChainCacheEntity);
exports.MakerBalanceChainCacheEntity = MakerBalanceChainCacheEntity;
//# sourceMappingURL=MakerBalanceChainCacheEntity.js.map