"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressNormalizer = void 0;
const address_utils_1 = require("../utils/address_utils");
/**
 * Searches for query param values that match the ETH address format, and transforms them to lowercase
 */
function addressNormalizer(req, _, next) {
    const normalizedQuery = (0, address_utils_1.objectETHAddressNormalizer)(req.query);
    req.query = normalizedQuery;
    next();
}
exports.addressNormalizer = addressNormalizer;
//# sourceMappingURL=address_normalizer.js.map