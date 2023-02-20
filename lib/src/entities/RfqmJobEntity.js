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
exports.RfqmJobEntity = exports.RfqmOrderTypes = void 0;
const typeorm_1 = require("typeorm");
const asset_swapper_1 = require("../asset-swapper");
const transformers_1 = require("./transformers");
/**
 * @deprecated
 * Kept here to ensure existing migrations type check
 */
var RfqmJobStatus;
(function (RfqmJobStatus) {
    // Transaction has been enqueued and will be processed once a worker is available
    RfqmJobStatus["PendingEnqueued"] = "pending_enqueued";
    // Transaction has passed initial validation. Last look will be executed and transaction will be submitted if last look is accepted.
    RfqmJobStatus["PendingProcessing"] = "pending_processing";
    // Last look has been accepted, awaiting submission
    RfqmJobStatus["PendingLastLookAccepted"] = "pending_last_look_accepted";
    // Transaction has passed initial verification and has been submitted to the mem pool
    RfqmJobStatus["PendingSubmitted"] = "pending_submitted";
    // Eth Call made before transaction submission was unsuccessful
    RfqmJobStatus["FailedEthCallFailed"] = "failed_eth_call_failed";
    // Transaction has expired prior to eth call or worker is not available to make an eth call
    RfqmJobStatus["FailedExpired"] = "failed_expired";
    // Market Maker declined the last look
    RfqmJobStatus["FailedLastLookDeclined"] = "failed_last_look_declined";
    // Transaction was reverted more than 3 blocks ago
    RfqmJobStatus["FailedRevertedConfirmed"] = "failed_reverted_confirmed";
    // Transaction was reverted less than 3 blocks ago
    RfqmJobStatus["FailedRevertedUnconfirmed"] = "failed_reverted_unconfirmed";
    // Submitting the transaction to the network was unsuccessful
    RfqmJobStatus["FailedSubmitFailed"] = "failed_submit_failed";
    // Transaction does not contain call data
    RfqmJobStatus["FailedValidationNoCallData"] = "failed_validation_no_call_data";
    // Transaction does not include a maker URI
    RfqmJobStatus["FailedValidationNoMakerUri"] = "failed_validation_no_maker_uri";
    // Transaction does not contain an order
    RfqmJobStatus["FailedValidationNoOrder"] = "failed_validation_no_order";
    // Transaction does not contain a fee
    RfqmJobStatus["FailedValidationNoFee"] = "failed_validation_no_fee";
    // Transaction has succeeded with 3 subsequent blocks
    RfqmJobStatus["SucceededConfirmed"] = "succeeded_confirmed";
    // Transaction was successfully mined and filled
    RfqmJobStatus["SucceededUnconfirmed"] = "succeeded_unconfirmed";
})(RfqmJobStatus || (RfqmJobStatus = {}));
/**
 * @deprecated
 * Kept here to ensure existing migrations type check
 */
var RfqmOrderTypes;
(function (RfqmOrderTypes) {
    RfqmOrderTypes["V4Rfq"] = "v4Rfq";
})(RfqmOrderTypes = exports.RfqmOrderTypes || (exports.RfqmOrderTypes = {}));
/**
 * @deprecated
 * Kept here to ensure existing migrations type check
 */
let RfqmJobEntity = class RfqmJobEntity {
    // TypeORM runs a validation check where it calls this initializer with no argument.
    // With no default `opts`, `opts` will be undefined and the validation will throw,
    // therefore, add this hacky default.
    constructor(opts = {}) {
        // allow createdAt overrides for testing
        if (opts.createdAt) {
            this.createdAt = opts.createdAt;
        }
        this.affiliateAddress = opts.affiliateAddress || null;
        this.calldata = opts.calldata;
        this.chainId = opts.chainId;
        this.expiry = opts.expiry;
        this.fee = opts.fee || null;
        this.integratorId = opts.integratorId || null;
        this.isCompleted = opts.isCompleted || false;
        this.lastLookResult = opts.lastLookResult || null;
        this.makerUri = opts.makerUri;
        this.metadata = opts.metadata || null;
        this.metaTransactionHash = opts.metaTransactionHash || null;
        this.order = opts.order || null;
        this.orderHash = opts.orderHash;
        this.status = opts.status || RfqmJobStatus.PendingEnqueued;
        this.updatedAt = opts.updatedAt || null;
        this.workerAddress = opts.workerAddress || null;
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'order_hash', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmJobEntity.prototype, "orderHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metatransaction_hash', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", Object)
], RfqmJobEntity.prototype, "metaTransactionHash", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamptz', default: () => 'now()' }),
    __metadata("design:type", Date)
], RfqmJobEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], RfqmJobEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry', type: 'numeric', transformer: transformers_1.BigNumberTransformer }),
    __metadata("design:type", asset_swapper_1.BigNumber)
], RfqmJobEntity.prototype, "expiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chain_id', type: 'integer' }),
    __metadata("design:type", Number)
], RfqmJobEntity.prototype, "chainId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'integrator_id', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], RfqmJobEntity.prototype, "integratorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'maker_uri', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmJobEntity.prototype, "makerUri", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmJobEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'calldata', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmJobEntity.prototype, "calldata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fee', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RfqmJobEntity.prototype, "fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RfqmJobEntity.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RfqmJobEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_completed', type: 'boolean', nullable: false, default: () => false }),
    __metadata("design:type", Boolean)
], RfqmJobEntity.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'worker_address', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], RfqmJobEntity.prototype, "workerAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_look_result', type: 'boolean', nullable: true }),
    __metadata("design:type", Object)
], RfqmJobEntity.prototype, "lastLookResult", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'affiliate_address', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], RfqmJobEntity.prototype, "affiliateAddress", void 0);
RfqmJobEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'rfqm_jobs' }),
    __metadata("design:paramtypes", [Object])
], RfqmJobEntity);
exports.RfqmJobEntity = RfqmJobEntity;
//# sourceMappingURL=RfqmJobEntity.js.map