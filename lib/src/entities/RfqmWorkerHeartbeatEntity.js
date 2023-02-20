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
exports.RfqmWorkerHeartbeatEntity = void 0;
const typeorm_1 = require("typeorm");
const asset_swapper_1 = require("../asset-swapper");
const transformers_1 = require("./transformers");
let RfqmWorkerHeartbeatEntity = class RfqmWorkerHeartbeatEntity {
    // TypeORM runs a validation check where it calls this initializer with no argument.
    // With no default `opts`, `opts` will be undefined and the validation will throw,
    // therefore, add this hacky default.
    constructor(opts = {}) {
        if (opts.timestamp) {
            this.timestamp = opts.timestamp;
        }
        this.address = opts.address;
        this.balance = opts.balance;
        this.index = opts.index;
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'address', type: 'varchar' }),
    __metadata("design:type", String)
], RfqmWorkerHeartbeatEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'timestamp', type: 'timestamptz', default: () => 'now()' }),
    __metadata("design:type", Date)
], RfqmWorkerHeartbeatEntity.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'balance', type: 'bigint', transformer: transformers_1.BigNumberTransformer }),
    __metadata("design:type", asset_swapper_1.BigNumber)
], RfqmWorkerHeartbeatEntity.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'index', type: 'int' }),
    __metadata("design:type", Number)
], RfqmWorkerHeartbeatEntity.prototype, "index", void 0);
RfqmWorkerHeartbeatEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'rfqm_worker_heartbeats' }),
    __metadata("design:paramtypes", [Object])
], RfqmWorkerHeartbeatEntity);
exports.RfqmWorkerHeartbeatEntity = RfqmWorkerHeartbeatEntity;
//# sourceMappingURL=RfqmWorkerHeartbeatEntity.js.map