"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubproviderAdapter = void 0;
const subproviders_1 = require("@0x/subproviders");
const utils_1 = require("@0x/utils");
const utils_2 = require("./utils");
class SubproviderAdapter extends subproviders_1.Subprovider {
    constructor(provider) {
        super();
        this._provider = utils_1.providerUtils.standardizeOrThrow(provider);
    }
    async handleRequest(payload, _next, end) {
        this._provider.sendAsync(payload, (err, result) => {
            var _a;
            !utils_2.utils.isNil(result) && !utils_2.utils.isNil(result.result)
                ? end(null, result.result)
                : end(err || new Error((_a = result.error) === null || _a === void 0 ? void 0 : _a.message));
        });
    }
}
exports.SubproviderAdapter = SubproviderAdapter;
//# sourceMappingURL=subprovider_adapter.js.map