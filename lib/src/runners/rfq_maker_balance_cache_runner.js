"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheRfqBalancesAsync = void 0;
const api_utils_1 = require("@0x/api-utils");
const dev_utils_1 = require("@0x/dev-utils");
const utils_1 = require("@0x/utils");
const delay = require("delay");
const express = require("express");
const _ = require("lodash");
const prom_client_1 = require("prom-client");
const artifacts_1 = require("../artifacts");
const asset_swapper_1 = require("../asset-swapper");
const defaultConfig = require("../config");
const constants_1 = require("../constants");
const db_connection_1 = require("../db_connection");
const entities_1 = require("../entities");
const logger_1 = require("../logger");
const provider_utils_1 = require("../utils/provider_utils");
const result_cache_1 = require("../utils/result_cache");
const DELAY_WHEN_NEW_BLOCK_FOUND = constants_1.ONE_SECOND_MS * 5;
const DELAY_WHEN_NEW_BLOCK_NOT_FOUND = constants_1.ONE_SECOND_MS;
const CACHE_MAKER_TOKENS_FOR_MS = Math.floor(constants_1.RFQ_FIRM_QUOTE_CACHE_EXPIRY / 4);
// The eth_call will run out of gas if there are too many balance calls at once
const MAX_BALANCE_CHECKS_PER_CALL = 1000;
const BALANCE_CHECKER_GAS_LIMIT = 10000000;
// Maximum balances to save at once
const MAX_ROWS_TO_UPDATE = 1000;
const RANDOM_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff';
const MAX_REQUEST_ERRORS = 10;
const MAX_CACHE_RFQ_BALANCES_ERRORS = 10;
// Metric collection related fields
const LATEST_BLOCK_PROCESSED_GAUGE = new prom_client_1.Gauge({
    name: 'rfqtw_latest_block_processed',
    help: 'Latest block processed by the RFQ worker process',
    labelNames: ['workerId'],
});
const MAKER_BALANCE_CACHE_RESULT_COUNT = new prom_client_1.Gauge({
    name: 'maker_balance_cache_result_count',
    help: 'Records the number of records being returned by the DB',
    labelNames: ['workerId'],
});
const MAKER_BALANCE_CACHE_RETRIEVAL_TIME = new prom_client_1.Summary({
    name: 'maker_balance_cache_retrieval_time',
    help: 'Records the amount of time needed to grab records',
    labelNames: ['workerId'],
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error(err);
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    if (err) {
        logger_1.logger.error(err);
    }
});
if (require.main === module) {
    (async () => {
        logger_1.logger.info('running RFQ balance cache runner');
        const provider = provider_utils_1.providerUtils.createWeb3Provider(defaultConfig.defaultHttpServiceConfig.ethereumRpcUrl, defaultConfig.defaultHttpServiceConfig.rpcRequestTimeout, defaultConfig.defaultHttpServiceConfig.shouldCompressRequest);
        const web3Wrapper = new dev_utils_1.Web3Wrapper(provider);
        const connection = await (0, db_connection_1.getDBConnectionOrThrow)();
        const balanceCheckerContractInterface = getBalanceCheckerContractInterface(RANDOM_ADDRESS, provider);
        await runRfqBalanceCacheAsync(web3Wrapper, connection, balanceCheckerContractInterface);
    })().catch((error) => {
        logger_1.logger.error(error);
        process.exit(1);
    });
}
async function runRfqBalanceCacheAsync(web3Wrapper, connection, balanceCheckerContractInterface) {
    if (defaultConfig.ENABLE_PROMETHEUS_METRICS) {
        const app = express();
        const metricsService = new api_utils_1.MetricsService();
        const metricsRouter = (0, api_utils_1.createMetricsRouter)(metricsService);
        app.use(constants_1.METRICS_PATH, metricsRouter);
        const server = app.listen(defaultConfig.PROMETHEUS_PORT, () => {
            logger_1.logger.info(`Metrics (HTTP) listening on port ${defaultConfig.PROMETHEUS_PORT}`);
        });
        server.on('error', (err) => {
            logger_1.logger.error(err);
        });
    }
    let blockRequestErrors = 0;
    let cacheRfqBalanceErrors = 0;
    const workerId = _.uniqueId('rfqw_');
    let lastBlockSeen = -1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (blockRequestErrors >= MAX_REQUEST_ERRORS) {
            throw new Error(`too many bad Web3 requests to fetch blocks (reached limit of ${MAX_REQUEST_ERRORS})`);
        }
        if (cacheRfqBalanceErrors >= MAX_CACHE_RFQ_BALANCES_ERRORS) {
            throw new Error(`too many errors from calling cacheRfqBalancesAsync (reached limit of ${MAX_CACHE_RFQ_BALANCES_ERRORS})`);
        }
        let newBlock;
        try {
            newBlock = await web3Wrapper.getBlockNumberAsync();
        }
        catch (err) {
            blockRequestErrors += 1;
            logger_1.logger.error(err);
            continue;
        }
        if (lastBlockSeen < newBlock) {
            utils_1.logUtils.log({
                block: newBlock,
                workerId,
            }, 'Found new block');
            try {
                await cacheRfqBalancesAsync(connection, balanceCheckerContractInterface, true, workerId);
            }
            catch (err) {
                logger_1.logger.error(err);
                cacheRfqBalanceErrors += 1;
                continue;
            }
            LATEST_BLOCK_PROCESSED_GAUGE.labels(workerId).set(newBlock);
            lastBlockSeen = newBlock;
            await delay(DELAY_WHEN_NEW_BLOCK_FOUND);
        }
        else {
            await delay(DELAY_WHEN_NEW_BLOCK_NOT_FOUND);
        }
    }
}
/**
 * This function retrieves and caches ERC20 balances of RFQ market makers
 */
async function cacheRfqBalancesAsync(connection, balanceCheckerContractInterface, codeOverride, workerId) {
    const makerTokens = await getMakerTokensAsync(connection, workerId);
    const balancesCallInput = splitValues(makerTokens);
    const updateTime = new Date();
    const erc20Balances = await getErc20BalancesAsync(balanceCheckerContractInterface, balancesCallInput, codeOverride);
    await updateErc20BalancesAsync(balancesCallInput, erc20Balances, connection, updateTime);
}
exports.cacheRfqBalancesAsync = cacheRfqBalancesAsync;
// NOTE: this only returns a partial entity class, just token address and maker address
// Cache the query results to reduce reads from the DB
let MAKER_TOKEN_CACHE;
async function getMakerTokensAsync(connection, workerId) {
    const start = new Date().getTime();
    if (!MAKER_TOKEN_CACHE) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
        MAKER_TOKEN_CACHE = (0, result_cache_1.createResultCache)(() => connection
            .getRepository(entities_1.MakerBalanceChainCacheEntity)
            .createQueryBuilder('maker_balance_chain_cache')
            .select(['maker_balance_chain_cache.tokenAddress', 'maker_balance_chain_cache.makerAddress'])
            .getMany(), CACHE_MAKER_TOKENS_FOR_MS);
    }
    const results = (await MAKER_TOKEN_CACHE.getResultAsync()).result;
    MAKER_BALANCE_CACHE_RESULT_COUNT.labels(workerId).set(results.length);
    MAKER_BALANCE_CACHE_RETRIEVAL_TIME.labels(workerId).observe(new Date().getTime() - start);
    return results;
}
function splitValues(makerTokens) {
    const functionInputs = { addresses: [], tokens: [] };
    return makerTokens.reduce(({ addresses, tokens }, makerToken) => {
        return {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            addresses: addresses.concat(makerToken.makerAddress),
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            tokens: tokens.concat(makerToken.tokenAddress),
        };
    }, functionInputs);
}
/**
 * Returns the balaceChecker interface given a random address
 */
function getBalanceCheckerContractInterface(contractAddress, provider) {
    return new asset_swapper_1.BalanceCheckerContract(contractAddress, provider, { gas: BALANCE_CHECKER_GAS_LIMIT });
}
async function getErc20BalancesAsync(balanceCheckerContractInterface, balancesCallInput, 
// HACK: allow for testing on ganache without override
codeOverride) {
    // due to gas contraints limit the call to 1K balance checks
    const addressesChunkedArray = _.chunk(balancesCallInput.addresses, MAX_BALANCE_CHECKS_PER_CALL);
    const tokensChunkedArray = _.chunk(balancesCallInput.tokens, MAX_BALANCE_CHECKS_PER_CALL);
    const balanceCheckerByteCode = _.get(artifacts_1.artifacts.BalanceChecker, 'compilerOutput.evm.deployedBytecode.object');
    const balances = await Promise.all(_.zip(addressesChunkedArray, tokensChunkedArray).map(async ([addressesChunk, tokensChunk]) => {
        const txOpts = codeOverride
            ? {
                overrides: {
                    [RANDOM_ADDRESS]: {
                        code: balanceCheckerByteCode,
                    },
                },
            }
            : {};
        return (balanceCheckerContractInterface
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
            .getMinOfBalancesOrAllowances(addressesChunk, tokensChunk, constants_1.RFQ_ALLOWANCE_TARGET)
            .callAsync(txOpts, dev_utils_1.BlockParamLiteral.Latest));
    }));
    const balancesFlattened = Array.prototype.concat.apply([], balances);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
    return balancesFlattened.map((bal) => bal.toString());
}
async function updateErc20BalancesAsync(balancesCallInput, balances, connection, updateTime) {
    const toSave = balancesCallInput.addresses.map((addr, i) => {
        const dbEntity = new entities_1.MakerBalanceChainCacheEntity();
        dbEntity.makerAddress = addr;
        dbEntity.tokenAddress = balancesCallInput.tokens[i];
        dbEntity.balance = new utils_1.BigNumber(balances[i]);
        dbEntity.timeOfSample = updateTime;
        return dbEntity;
    });
    await connection.getRepository(entities_1.MakerBalanceChainCacheEntity).save(toSave, { chunk: MAX_ROWS_TO_UPDATE });
}
//# sourceMappingURL=rfq_maker_balance_cache_runner.js.map