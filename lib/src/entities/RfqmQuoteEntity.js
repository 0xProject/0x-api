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
exports.RfqmQuoteEntity = void 0;
const typeorm_1 = require("typeorm");
/**
 * @deprecated
 * Kept here to ensure existing migrations type check
 */
let RfqmQuoteEntity = class RfqmQuoteEntity {
    constructor(opts = {}) {
        // allow createdAt overrides for testing
        if (opts.createdAt) {
            this.createdAt = opts.createdAt;
        }
        this.affiliateAddress = opts.affiliateAddress || null;
        this.chainId = opts.chainId;
        this.fee = opts.fee || null;
        this.integratorId = opts.integratorId || null;
        this.makerUri = opts.makerUri;
        this.metaTransactionHash = opts.metaTransactionHash || null;
        this.order = opts.order || null;
        this.orderHash = opts.orderHash;
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'order_hash', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmQuoteEntity.prototype, "orderHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metatransaction_hash', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", Object)
], RfqmQuoteEntity.prototype, "metaTransactionHash", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamptz', default: () => 'now()' }),
    __metadata("design:type", Date)
], RfqmQuoteEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chain_id', type: 'integer' }),
    __metadata("design:type", Number)
], RfqmQuoteEntity.prototype, "chainId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'integrator_id', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], RfqmQuoteEntity.prototype, "integratorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'maker_uri', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmQuoteEntity.prototype, "makerUri", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fee', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RfqmQuoteEntity.prototype, "fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RfqmQuoteEntity.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'affiliate_address', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], RfqmQuoteEntity.prototype, "affiliateAddress", void 0);
RfqmQuoteEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'rfqm_quotes' }),
    __metadata("design:paramtypes", [Object])
], RfqmQuoteEntity);
exports.RfqmQuoteEntity = RfqmQuoteEntity;
//# sourceMappingURL=RfqmQuoteEntity.js.map