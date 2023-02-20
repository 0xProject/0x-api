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
exports.KeyValueEntity = void 0;
const typeorm_1 = require("typeorm");
let KeyValueEntity = class KeyValueEntity {
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'key', type: 'varchar' }),
    __metadata("design:type", String)
], KeyValueEntity.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'value', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], KeyValueEntity.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], KeyValueEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], KeyValueEntity.prototype, "updatedAt", void 0);
KeyValueEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'kv_store' }),
    __metadata("design:paramtypes", [String, String])
], KeyValueEntity);
exports.KeyValueEntity = KeyValueEntity;
//# sourceMappingURL=KeyValueEntity.js.map