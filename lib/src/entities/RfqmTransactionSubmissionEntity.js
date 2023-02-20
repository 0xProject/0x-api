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
exports.RfqmTransactionSubmissionEntity = void 0;
const typeorm_1 = require("typeorm");
const transformers_1 = require("./transformers");
var RfqmTransactionSubmissionStatus;
(function (RfqmTransactionSubmissionStatus) {
    RfqmTransactionSubmissionStatus["DroppedAndReplaced"] = "dropped_and_replaced";
    RfqmTransactionSubmissionStatus["Presubmit"] = "presubmit";
    RfqmTransactionSubmissionStatus["RevertedConfirmed"] = "reverted_confirmed";
    RfqmTransactionSubmissionStatus["RevertedUnconfirmed"] = "reverted_unconfirmed";
    RfqmTransactionSubmissionStatus["Submitted"] = "submitted";
    RfqmTransactionSubmissionStatus["SucceededConfirmed"] = "succeeded_confirmed";
    RfqmTransactionSubmissionStatus["SucceededUnconfirmed"] = "succeeded_unconfirmed";
})(RfqmTransactionSubmissionStatus || (RfqmTransactionSubmissionStatus = {}));
let RfqmTransactionSubmissionEntity = class RfqmTransactionSubmissionEntity {
    constructor(opts = {}) {
        // allow createdAt overrides for testing
        if (opts.createdAt) {
            this.createdAt = opts.createdAt;
        }
        this.blockMined = opts.blockMined || null;
        this.from = opts.from || null;
        this.gasPrice = opts.gasPrice || null;
        this.gasUsed = opts.gasUsed || null;
        this.metadata = opts.metadata || null;
        this.nonce = opts.nonce !== undefined ? opts.nonce : null;
        this.orderHash = opts.orderHash;
        this.status = opts.status || RfqmTransactionSubmissionStatus.Submitted;
        this.statusReason = opts.statusReason || null;
        this.to = opts.to || null;
        this.transactionHash = opts.transactionHash;
        this.updatedAt = opts.updatedAt || null;
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'transaction_hash', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmTransactionSubmissionEntity.prototype, "transactionHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_hash', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmTransactionSubmissionEntity.prototype, "orderHash", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamptz', default: () => 'now()' }),
    __metadata("design:type", Date)
], RfqmTransactionSubmissionEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], RfqmTransactionSubmissionEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], RfqmTransactionSubmissionEntity.prototype, "from", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], RfqmTransactionSubmissionEntity.prototype, "to", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nonce', type: 'bigint', nullable: true, transformer: transformers_1.BigIntTransformer }),
    __metadata("design:type", Object)
], RfqmTransactionSubmissionEntity.prototype, "nonce", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gas_price', type: 'numeric', nullable: true, transformer: transformers_1.BigNumberTransformer }),
    __metadata("design:type", Object)
], RfqmTransactionSubmissionEntity.prototype, "gasPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gas_used', type: 'numeric', nullable: true, transformer: transformers_1.BigNumberTransformer }),
    __metadata("design:type", Object)
], RfqmTransactionSubmissionEntity.prototype, "gasUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'block_mined', type: 'numeric', nullable: true, transformer: transformers_1.BigNumberTransformer }),
    __metadata("design:type", Object)
], RfqmTransactionSubmissionEntity.prototype, "blockMined", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmTransactionSubmissionEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status_reason', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], RfqmTransactionSubmissionEntity.prototype, "statusReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RfqmTransactionSubmissionEntity.prototype, "metadata", void 0);
RfqmTransactionSubmissionEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'rfqm_transaction_submissions' }),
    __metadata("design:paramtypes", [Object])
], RfqmTransactionSubmissionEntity);
exports.RfqmTransactionSubmissionEntity = RfqmTransactionSubmissionEntity;
//# sourceMappingURL=RfqmTransactionSubmissionEntity.js.map