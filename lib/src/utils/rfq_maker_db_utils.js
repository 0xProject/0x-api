"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfqMakerDbUtils = void 0;
const entities_1 = require("../entities");
/**
 * RfqMakerDbUtils provides tools for maker services to interact with the database
 */
class RfqMakerDbUtils {
    constructor(_connection) {
        this._connection = _connection;
    }
    /**
     * [RFQ maker] find all RfqMakerPairs for given blockchain
     */
    async getPairsArrayAsync(chainId) {
        return this._connection.getRepository(entities_1.RfqMakerPairs).find({
            where: { chainId },
        });
    }
    /**
     * [RFQ maker] find a hash for all pairs update time
     */
    async getPairsArrayUpdateTimeHashAsync(chainId) {
        const rfqMakerPairsUpdateTimeHash = await this._connection.getRepository(entities_1.RfqMakerPairsUpdateTimeHash).findOne({
            where: { chainId },
        });
        return rfqMakerPairsUpdateTimeHash ? rfqMakerPairsUpdateTimeHash.hash : null;
    }
}
exports.RfqMakerDbUtils = RfqMakerDbUtils;
//# sourceMappingURL=rfq_maker_db_utils.js.map