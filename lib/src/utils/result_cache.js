"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResultCache = void 0;
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const createResultCache = (
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
fn, cacheExpiryMs = constants_1.TEN_MINUTES_MS) => {
    const resultCache = {};
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
        getResultAsync: async (getArgs) => {
            let timestamp = resultCache[getArgs] && resultCache[getArgs].timestamp;
            let result = resultCache[getArgs] && resultCache[getArgs].result;
            if (!result || !timestamp || timestamp < Date.now() - cacheExpiryMs) {
                try {
                    result = await fn(getArgs);
                    timestamp = Date.now();
                    resultCache[getArgs] = { timestamp, result };
                }
                catch (e) {
                    if (!result) {
                        // Throw if we've never received a result
                        throw e;
                    }
                    logger_1.logger.warn(`Error performing cache miss update: ${e}`);
                }
            }
            return { timestamp, result };
        },
    };
};
exports.createResultCache = createResultCache;
//# sourceMappingURL=result_cache.js.map