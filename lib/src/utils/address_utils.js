"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTokenAddressOrThrowApiError = exports.objectETHAddressNormalizer = void 0;
const api_utils_1 = require("@0x/api-utils");
const token_metadata_1 = require("@0x/token-metadata");
const utils_1 = require("@0x/utils");
/**
 * Checks top level attributes of an object for values matching an ETH address
 * and normalizes the address by turning it to lowercase
 */
const objectETHAddressNormalizer = (obj) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
    const normalized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value && utils_1.addressUtils.isAddress(value)) {
            normalized[key] = value.toLowerCase();
        }
    }
    return {
        ...obj,
        ...normalized,
    };
};
exports.objectETHAddressNormalizer = objectETHAddressNormalizer;
/**
 * Attempts to find the address of the token and throws if not found
 *
 * @param address the uppercase symbol of the token (ex. `REP`) or the address of the contract
 * @param chainId the Network where the address should be hosted on.
 */
function findTokenAddressOrThrowApiError(address, field, chainId) {
    try {
        return (0, token_metadata_1.findTokenAddressOrThrow)(address, chainId);
    }
    catch (e) {
        throw new api_utils_1.ValidationError([
            {
                field,
                code: api_utils_1.ValidationErrorCodes.ValueOutOfRange,
                reason: e.message,
            },
        ]);
    }
}
exports.findTokenAddressOrThrowApiError = findTokenAddressOrThrowApiError;
//# sourceMappingURL=address_utils.js.map