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
exports.OrderWatcherSignedOrderEntity = void 0;
const typeorm_1 = require("typeorm");
// This should only be used in tests to set the state of `signed_orders_v4`.
// In production, we only care about valid orders, so use
// `ValidSignedOrderV4Entity` instead.
let OrderWatcherSignedOrderEntity = class OrderWatcherSignedOrderEntity {
    constructor(opts = {}) {
        this.hash = opts.hash;
        this.makerToken = opts.makerToken;
        this.takerToken = opts.takerToken;
        this.makerAmount = opts.makerAmount;
        this.takerAmount = opts.takerAmount;
        this.maker = opts.maker;
        this.taker = opts.taker;
        this.pool = opts.pool;
        this.expiry = opts.expiry;
        this.salt = opts.salt;
        this.verifyingContract = opts.verifyingContract;
        this.takerTokenFeeAmount = opts.takerTokenFeeAmount;
        this.sender = opts.sender;
        this.feeRecipient = opts.feeRecipient;
        this.signature = opts.signature;
        this.remainingFillableTakerAmount = opts.remainingFillableTakerAmount;
        this.signature = opts.signature;
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'hash', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "hash", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'maker_token', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "makerToken", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'taker_token', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "takerToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'maker_amount', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "makerAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taker_amount', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "takerAmount", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'maker', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "maker", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taker', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "taker", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pool', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "pool", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "expiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'salt', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "salt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verifying_contract', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "verifyingContract", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taker_token_fee_amount', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "takerTokenFeeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'fee_recipient', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "feeRecipient", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'signature', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "signature", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'remaining_fillable_taker_amount', type: 'varchar' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "remainingFillableTakerAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamptz', default: () => 'now()' }),
    __metadata("design:type", String)
], OrderWatcherSignedOrderEntity.prototype, "createdAt", void 0);
OrderWatcherSignedOrderEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'signed_orders_v4' }),
    __metadata("design:paramtypes", [Object])
], OrderWatcherSignedOrderEntity);
exports.OrderWatcherSignedOrderEntity = OrderWatcherSignedOrderEntity;
//# sourceMappingURL=OrderWatcherSignedOrderEntity.js.map