import { logUtils } from '@0x/utils';
import * as delay from 'delay';
// HACK: ethers is already a dependency from another package, using it here
// tslint:disable-next-line:no-implicit-dependencies
import { ethers } from 'ethers';
import { uniqueId } from 'lodash';
import { Gauge } from 'prom-client';
import { Connection } from 'typeorm';

import { defaultHttpServiceWithRateLimiterConfig } from '../config';
import { BALANCE_CHECKER_ABI, BALANCE_CHECKER_ADDRESS, ONE_SECOND_MS, TEN_MINUTES_MS } from '../constants';
import { getDBConnectionAsync } from '../db_connection';
import { MakerBalanceChainCacheEntity } from '../entities';
import { logger } from '../logger';
import { createResultCache, ResultCache } from '../utils/result_cache';

const DELAY_WHEN_NEW_BLOCK_FOUND = ONE_SECOND_MS * 10;
const DELAY_WHEN_NEW_BLOCK_NOT_FOUND = ONE_SECOND_MS;

// Metric collection related fields
const LATEST_BLOCK_PROCESSED_GAUGE = new Gauge({
    name: 'rfqtw_latest_block_processed',
    help: 'Latest block processed by the RFQ worker process',
    labelNames: ['workerId'],
});

process.on('uncaughtException', err => {
    logger.error(err);
    process.exit(1);
});

process.on('unhandledRejection', err => {
    if (err) {
        logger.error(err);
    }
});

interface BalancesCallInput {
    addresses: string[];
    tokens: string[];
}

if (require.main === module) {
    (async () => {
        logger.info('running RFQ balance cache runner');
        const ethersProvider = new ethers.providers.JsonRpcProvider(defaultHttpServiceWithRateLimiterConfig.ethereumRpcUrl);
        const connection = await getDBConnectionAsync();
        const balanceCheckerContractInterface = await _getBalanceCheckerContractInterfaceAsync(ethersProvider);

        await runRfqBalanceCheckerAsync(ethersProvider, connection, balanceCheckerContractInterface);
    })().catch(error => logger.error(error.stack));
}

async function runRfqBalanceCheckerAsync(
    ethersProvider: ethers.providers.JsonRpcProvider,
    connection: Connection,
    balanceCheckerContractInterface: ethers.Contract,
): Promise<void> {
    const workerId = uniqueId('rfqw_');
    let lastBlockSeen = -1;
    while (true) {
        const newBlock = await ethersProvider.getBlockNumber();
        if (lastBlockSeen < newBlock) {
            lastBlockSeen = newBlock;
            LATEST_BLOCK_PROCESSED_GAUGE.labels(workerId).set(lastBlockSeen);
            logUtils.log({
                block: lastBlockSeen,
                workerId,
            }, 'Found new block');

            const makerTokens = await _getMakerTokensAsync(connection);
            const balancesCallInput = splitValues(makerTokens);

            const erc20Balances = await _getErc20BalancesAsync(balanceCheckerContractInterface, balancesCallInput.addresses, balancesCallInput.tokens);

            logUtils.log(erc20Balances);
            logUtils.log(newBlock);


            await delay(DELAY_WHEN_NEW_BLOCK_FOUND);
        } else {
            await delay(DELAY_WHEN_NEW_BLOCK_NOT_FOUND);
        }
    }
}

// NOTE: this only returns a partial entity class, just token address and maker address
// Cache the query results to reduce reads from the DB
let MAKER_TOKEN_CACHE: ResultCache<MakerBalanceChainCacheEntity[]>;
const _getMakerTokensAsync = async (connection: Connection) => {
    if (!MAKER_TOKEN_CACHE) {
        MAKER_TOKEN_CACHE = createResultCache<any[]>(() => connection.getRepository(MakerBalanceChainCacheEntity).createQueryBuilder().select(['token_address', 'maker_address']).getMany(), TEN_MINUTES_MS);
    }
    return (await MAKER_TOKEN_CACHE.getResultAsync()).result;
};

function splitValues(makerTokens: MakerBalanceChainCacheEntity[]): BalancesCallInput {
    const functionInputs: BalancesCallInput = { addresses: [], tokens: [] };

    return makerTokens.reduce(({addresses, tokens}, makerToken) => {

      return {
        addresses: addresses.concat(makerToken.makerAddress as string),
        tokens: tokens.concat(makerToken.tokenAddress as string)
      };
    }, functionInputs);
}

async function _getBalanceCheckerContractInterfaceAsync(provider: ethers.providers.JsonRpcProvider): Promise<ethers.Contract> {
    return new ethers.Contract(BALANCE_CHECKER_ADDRESS, BALANCE_CHECKER_ABI, provider);
}

async function _getErc20BalancesAsync(balanceCheckerContractInterface: ethers.Contract, addresses: string[], tokens: string[]): Promise<string[]> {
    const balances = await balanceCheckerContractInterface.functions.balances(addresses, tokens);
    return balances.map((bal: any) => bal.toString());
}


