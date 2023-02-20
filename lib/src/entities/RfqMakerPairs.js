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
exports.RfqMakerPairs = void 0;
const typeorm_1 = require("typeorm");
/**
 * A representation of the pairs a market maker is active on for a given chain ID
 */
let RfqMakerPairs = class RfqMakerPairs {
    // TypeORM runs a validation check where it calls this initializer with no argument.
    // With no default `opts`, `opts` will be undefined and the validation will throw,
    // therefore, add this hacky default.
    constructor(opts = {}) {
        var _a;
        this.makerId = opts.makerId;
        this.chainId = opts.chainId;
        this.pairs = opts.pairs;
        this.updatedAt = (_a = opts.updatedAt) !== null && _a !== void 0 ? _a : null;
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'maker_id', type: 'varchar' }),
    __metadata("design:type", String)
], RfqMakerPairs.prototype, "makerId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'chain_id', type: 'integer' }),
    __metadata("design:type", Number)
], RfqMakerPairs.prototype, "chainId", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], RfqMakerPairs.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pairs', type: 'jsonb' }),
    __metadata("design:type", Array)
], RfqMakerPairs.prototype, "pairs", void 0);
RfqMakerPairs = __decorate([
    (0, typeorm_1.Entity)({ name: 'rfq_maker_pairs' }),
    __metadata("design:paramtypes", [Object])
], RfqMakerPairs);
exports.RfqMakerPairs = RfqMakerPairs;
//# sourceMappingURL=RfqMakerPairs.js.map