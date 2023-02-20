"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceFilters = void 0;
const _ = require("lodash");
const types_1 = require("../../types");
class SourceFilters {
    constructor(validSources = [], excludedSources = [], includedSources = []) {
        this._validSources = _.uniq(validSources);
        this._excludedSources = _.uniq(excludedSources);
        this._includedSources = _.uniq(includedSources);
    }
    static all() {
        return new SourceFilters(Object.values(types_1.ERC20BridgeSource));
    }
    isAllowed(source) {
        // Must be in list of valid sources.
        if (this._validSources.length > 0 && !this._validSources.includes(source)) {
            return false;
        }
        // Must not be excluded.
        if (this._excludedSources.includes(source)) {
            return false;
        }
        // If we have an inclusion list, it must be in that list.
        if (this._includedSources.length > 0 && !this._includedSources.includes(source)) {
            return false;
        }
        return true;
    }
    areAnyAllowed(sources) {
        return sources.some((s) => this.isAllowed(s));
    }
    areAllAllowed(sources) {
        return sources.every((s) => this.isAllowed(s));
    }
    getAllowed(sources = []) {
        return sources.filter((s) => this.isAllowed(s));
    }
    get sources() {
        return this._validSources.filter((s) => this.isAllowed(s));
    }
    exclude(sources) {
        return new SourceFilters(this._validSources, [...this._excludedSources, ...(Array.isArray(sources) ? sources : [sources])], this._includedSources);
    }
    validate(sources) {
        return new SourceFilters([...this._validSources, ...(Array.isArray(sources) ? sources : [sources])], this._excludedSources, this._includedSources);
    }
    include(sources) {
        return new SourceFilters(this._validSources, this._excludedSources, [
            ...this._includedSources,
            ...(Array.isArray(sources) ? sources : [sources]),
        ]);
    }
    merge(other) {
        let validSources = this._validSources;
        if (validSources.length === 0) {
            validSources = other._validSources;
        }
        else if (other._validSources.length !== 0) {
            validSources = validSources.filter((s) => other._validSources.includes(s));
        }
        return new SourceFilters(validSources, [...this._excludedSources, ...other._excludedSources], [...this._includedSources, ...other._includedSources]);
    }
}
exports.SourceFilters = SourceFilters;
//# sourceMappingURL=source_filters.js.map