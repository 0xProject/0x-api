import { Connection } from 'typeorm';

import { RfqMakerPairs } from '../entities';

/**
 * RfqMakerDbUtils provides tools for maker services to interact with the database
 */
export class RfqMakerDbUtils {
    constructor(private readonly _connection: Connection) {}

    /**
     * [RFQ maker] find all RfqMakerPairs for given blockchain
     */
    public async getPairsArrayAsync(chainId: number): Promise<RfqMakerPairs[]> {
        return this._connection.getRepository(RfqMakerPairs).find({
            where: { chainId },
        });
    }
}
