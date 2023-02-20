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
exports.BlockedAddressEntity = void 0;
const typeorm_1 = require("typeorm");
let BlockedAddressEntity = class BlockedAddressEntity {
    constructor(opts = {}) {
        // allow createdAt overrides for testing
        if (opts.createdAt) {
            this.createdAt = opts.createdAt;
        }
        this.address = opts.address;
        this.parent = opts.parent || null;
        this.lastSeenNonce = opts.lastSeenNonce || null;
        this.ignore = opts.ignore || false;
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'address', type: 'varchar' }),
    (0, typeorm_1.Check)('address = lower(address)'),
    __metadata("design:type", String)
], BlockedAddressEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamptz', default: () => 'now()' }),
    __metadata("design:type", Date)
], BlockedAddressEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], BlockedAddressEntity.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_seen_nonce', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], BlockedAddressEntity.prototype, "lastSeenNonce", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ignore', type: 'boolean', default: () => false }),
    __metadata("design:type", Boolean)
], BlockedAddressEntity.prototype, "ignore", void 0);
BlockedAddressEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'blocked_addresses' }),
    __metadata("design:paramtypes", [Object])
], BlockedAddressEntity);
exports.BlockedAddressEntity = BlockedAddressEntity;
//# sourceMappingURL=BlockedAddressEntity.js.map