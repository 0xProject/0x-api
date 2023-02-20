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
exports.SignedOrderV4Entity = void 0;
const typeorm_1 = require("typeorm");
let ValidSignedOrderV4Entity = class ValidSignedOrderV4Entity {
    constructor(opts = {}) {
        Object.assign(this, opts);
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'hash' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "hash", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'maker_token' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "makerToken", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'taker_token' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "takerToken", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'maker_amount' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "makerAmount", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'taker_amount' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "takerAmount", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)(),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "maker", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)(),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "taker", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)(),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "pool", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)(),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "expiry", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)(),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "salt", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'verifying_contract' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "verifyingContract", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'taker_token_fee_amount' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "takerTokenFeeAmount", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)(),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'fee_recipient' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "feeRecipient", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)(),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "signature", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'remaining_fillable_taker_amount' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "remainingFillableTakerAmount", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'created_at' }),
    __metadata("design:type", String)
], ValidSignedOrderV4Entity.prototype, "createdAt", void 0);
ValidSignedOrderV4Entity = __decorate([
    (0, typeorm_1.ViewEntity)({
        name: 'valid_signed_orders_v4',
        materialized: true,
        synchronize: false,
    }),
    __metadata("design:paramtypes", [Object])
], ValidSignedOrderV4Entity);
exports.SignedOrderV4Entity = ValidSignedOrderV4Entity;
//# sourceMappingURL=SignedOrderV4Entity.js.map