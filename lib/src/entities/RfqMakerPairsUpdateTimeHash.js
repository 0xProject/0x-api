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
exports.RfqMakerPairsUpdateTimeHash = void 0;
const typeorm_1 = require("typeorm");
/**
 * A materialized view for a hash of all makers' last update time for each chain.
 * The materialized view will be updated immidiately after table `rfq_maker_pairs` is updated.
 * The hashes (one per chain) are used by PairsManger to determine whether a refresh is needed.
 * The expression of ViewEntity is duplicated with the corresponding mirgation file, and is only used when
 * `synchronize` is set to `true` which is the case when running some test cases.
 */
let RfqMakerPairsUpdateTimeHash = class RfqMakerPairsUpdateTimeHash {
    // TypeORM runs a validation check where it calls this initializer with no argument.
    // With no default `opts`, `opts` will be undefined and the validation will throw,
    // therefore, add this hacky default.
    constructor(opts = {}) {
        this.chainId = opts.chainId;
        this.hash = opts.hash;
    }
};
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'chain_id' }),
    __metadata("design:type", Number)
], RfqMakerPairsUpdateTimeHash.prototype, "chainId", void 0);
__decorate([
    (0, typeorm_1.ViewColumn)({ name: 'hash' }),
    __metadata("design:type", String)
], RfqMakerPairsUpdateTimeHash.prototype, "hash", void 0);
RfqMakerPairsUpdateTimeHash = __decorate([
    (0, typeorm_1.ViewEntity)({
        name: 'rfq_maker_pairs_update_time_hashes',
        expression: `
        SELECT
            encode(
                digest(
                    array_agg(
                        updated_at ORDER BY updated_at NULLS FIRST
                    )::text,
                'sha256'),
            'hex') AS hash,
            chain_id
        FROM rfq_maker_pairs
        GROUP BY chain_id
    `,
    }),
    __metadata("design:paramtypes", [Object])
], RfqMakerPairsUpdateTimeHash);
exports.RfqMakerPairsUpdateTimeHash = RfqMakerPairsUpdateTimeHash;
//# sourceMappingURL=RfqMakerPairsUpdateTimeHash.js.map