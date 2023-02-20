"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopulateRfqMakerPairsTable1639527388617 = void 0;
const asset_swapper_1 = require("../src/asset-swapper");
const config_1 = require("../src/config");
const entities_1 = require("../src/entities");
const pair_utils_1 = require("../src/utils/pair_utils");
const getRfqMakerPairsArray = () => {
    const chainId = asset_swapper_1.ChainId.Mainnet;
    return config_1.RFQ_MAKER_CONFIGS.map((makerConfig) => {
        const pairKeys = [];
        if (makerConfig.rfqtMakerUri &&
            makerConfig.rfqtOrderTypes.length > 0 &&
            config_1.RFQT_MAKER_ASSET_OFFERINGS[makerConfig.rfqtMakerUri]) {
            config_1.RFQT_MAKER_ASSET_OFFERINGS[makerConfig.rfqtMakerUri].forEach(([tokenA, tokenB]) => {
                pairKeys.push(pair_utils_1.pairUtils.toKey(tokenA, tokenB));
            });
        }
        if (makerConfig.rfqmMakerUri &&
            makerConfig.rfqmOrderTypes.length > 0 &&
            config_1.RFQM_MAKER_ASSET_OFFERINGS[makerConfig.rfqmMakerUri]) {
            config_1.RFQM_MAKER_ASSET_OFFERINGS[makerConfig.rfqmMakerUri].forEach(([tokenA, tokenB]) => {
                pairKeys.push(pair_utils_1.pairUtils.toKey(tokenA, tokenB));
            });
        }
        const pairs = pair_utils_1.pairUtils.toUniqueArray(pairKeys);
        return new entities_1.RfqMakerPairs({
            makerId: makerConfig.makerId,
            chainId,
            pairs,
        });
    });
};
class PopulateRfqMakerPairsTable1639527388617 {
    constructor() {
        this.name = 'PopulateRfqMakerPairsTable1639527388617';
    }
    async up(queryRunner) {
        const rfqMakerPairsArray = getRfqMakerPairsArray();
        if (rfqMakerPairsArray.length === 0) {
            return;
        }
        let queryString = `INSERT INTO rfq_maker_pairs (maker_id, chain_id, pairs) VALUES`;
        rfqMakerPairsArray.forEach((rfqMakerPairs) => {
            queryString += `('${rfqMakerPairs.makerId}', '${rfqMakerPairs.chainId}', '${JSON.stringify(rfqMakerPairs.pairs)}'),`;
        });
        queryString = queryString.slice(0, -1); // remove last comma
        await queryRunner.query(queryString);
    }
    async down(queryRunner) { }
}
exports.PopulateRfqMakerPairsTable1639527388617 = PopulateRfqMakerPairsTable1639527388617;
//# sourceMappingURL=1639527388617-PopulateRfqMakerPairsTable.js.map