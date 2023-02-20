"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const config_1 = require("../config");
/**
 * ConfigManager is a simple wrapper around configs.
 *
 * It exists to provide a layer around our configs which can then be mocked while writing tests
 */
class ConfigManager {
    getRfqmApiKeyWhitelist() {
        return config_1.RFQM_API_KEY_WHITELIST;
    }
    getIntegratorByIdOrThrow(integratorId) {
        return (0, config_1.getIntegratorByIdOrThrow)(integratorId);
    }
    getIntegratorIdForApiKey(apiKey) {
        return (0, config_1.getIntegratorIdForApiKey)(apiKey);
    }
    /**
     * Get a map of makers that support RFQt workflow with rfq order type
     * @returns a map from makerIds to makers' configuration object
     */
    getRfqtMakerConfigMapForRfqOrder() {
        return config_1.RFQT_MAKER_CONFIG_MAP_FOR_RFQ_ORDER;
    }
    getChainId() {
        return config_1.CHAIN_ID;
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config_manager.js.map