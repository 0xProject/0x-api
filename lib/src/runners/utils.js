"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultAppDependenciesAsync = exports.destroyCallback = void 0;
const dev_utils_1 = require("@0x/dev-utils");
const aws_sdk_1 = require("aws-sdk");
const axios_1 = require("axios");
const kafkajs_1 = require("kafkajs");
const asset_swapper_1 = require("../asset-swapper");
const config_1 = require("../config");
const db_connection_1 = require("../db_connection");
const logger_1 = require("../logger");
const meta_transaction_service_1 = require("../services/meta_transaction_service");
const orderbook_service_1 = require("../services/orderbook_service");
const postgres_rfqt_firm_quote_validator_1 = require("../services/postgres_rfqt_firm_quote_validator");
const swap_service_1 = require("../services/swap_service");
const asset_swapper_orderbook_1 = require("../utils/asset_swapper_orderbook");
const no_op_orderbook_1 = require("../utils/no_op_orderbook");
const rfq_client_1 = require("../utils/rfq_client");
const rfq_dyanmic_blacklist_1 = require("../utils/rfq_dyanmic_blacklist");
const s3_client_1 = require("../utils/s3_client");
const slippage_model_manager_1 = require("../utils/slippage_model_manager");
/**
 * Pass this callback into the default server to ensure all dependencies shut down correctly
 * @param dependencies A set of app dependencies
 */
function destroyCallback(dependencies) {
    return async () => {
        if (dependencies.connection) {
            await dependencies.connection.close();
        }
    };
}
exports.destroyCallback = destroyCallback;
async function deploySamplerContractAsync(provider, chainId) {
    const web3Wrapper = new dev_utils_1.Web3Wrapper(provider);
    const _chainId = await web3Wrapper.getChainIdAsync();
    if (_chainId !== chainId) {
        throw new Error(`Incorrect Chain Id: ${_chainId}`);
    }
    const [account] = await web3Wrapper.getAvailableAddressesAsync();
    try {
        const sampler = await asset_swapper_1.ERC20BridgeSamplerContract.deployFrom0xArtifactAsync(asset_swapper_1.artifacts.ERC20BridgeSampler, provider, { from: account }, {});
        logger_1.logger.info(`Deployed ERC20BridgeSamplerContract on network ${chainId}: ${sampler.address}`);
        return sampler;
    }
    catch (err) {
        logger_1.logger.error(`Failed to deploy ERC20BridgeSamplerContract on network ${chainId}: ${err}`);
        throw err;
    }
}
let contractAddresses_;
/**
 * Determines the contract addresses needed for the network. For testing (ganache)
 * required contracts are deployed
 * @param provider provider to the network, used for ganache deployment
 * @param chainId the network chain id
 */
async function getContractAddressesForNetworkOrThrowAsync(provider, chainId) {
    // If global exists, use that
    if (contractAddresses_) {
        return contractAddresses_;
    }
    let contractAddresses = (0, asset_swapper_1.getContractAddressesForChainOrThrow)(chainId);
    // In a testnet where the environment does not support overrides
    // so we deploy the latest sampler
    if (chainId === asset_swapper_1.ChainId.Ganache) {
        const sampler = await deploySamplerContractAsync(provider, chainId);
        contractAddresses = { ...contractAddresses, erc20BridgeSampler: sampler.address };
    }
    // Set the global cached contractAddresses_
    contractAddresses_ = contractAddresses;
    return contractAddresses_;
}
/**
 * Create and initialize a SlippageModelManager instance
 */
async function createAndInitializeSlippageModelManagerAsync(s3Client) {
    const slippageModelManager = new slippage_model_manager_1.SlippageModelManager(s3Client);
    await slippageModelManager.initializeAsync();
    return slippageModelManager;
}
function createOrderbook(orderBookService) {
    if (orderBookService === undefined) {
        return new no_op_orderbook_1.NoOpOrderbook();
    }
    return new asset_swapper_orderbook_1.AssetSwapperOrderbook(orderBookService);
}
/**
 * Instantiates dependencies required to run the app. Uses default settings based on config
 * @param config should the ethereum RPC URL
 */
async function getDefaultAppDependenciesAsync(provider, config) {
    const contractAddresses = await getContractAddressesForNetworkOrThrowAsync(provider, config_1.CHAIN_ID);
    const connection = await (0, db_connection_1.getDBConnection)();
    let kafkaClient;
    if (config.kafkaBrokers !== undefined) {
        kafkaClient = new kafkajs_1.Kafka({
            clientId: 'sra-client',
            brokers: config.kafkaBrokers,
        });
    }
    else {
        logger_1.logger.warn(`skipping kafka client creation because no kafkaBrokers were passed in`);
    }
    const orderBookService = orderbook_service_1.OrderBookService.create(connection);
    if (orderBookService == undefined) {
        logger_1.logger.warn('Order book service is disabled');
    }
    let swapService;
    let metaTransactionService;
    try {
        const rfqClient = new rfq_client_1.RfqClient(config_1.RFQ_API_URL, axios_1.default);
        const s3Client = new s3_client_1.S3Client(new aws_sdk_1.S3({
            apiVersion: config_1.SLIPPAGE_MODEL_S3_API_VERSION,
        }));
        const slippageModelManager = await createAndInitializeSlippageModelManagerAsync(s3Client);
        swapService = new swap_service_1.SwapService(createOrderbook(orderBookService), provider, contractAddresses, rfqClient, postgres_rfqt_firm_quote_validator_1.PostgresRfqtFirmQuoteValidator.create(connection), rfq_dyanmic_blacklist_1.RfqDynamicBlacklist.create(connection), slippageModelManager);
        metaTransactionService = createMetaTxnServiceFromSwapService(swapService, contractAddresses);
    }
    catch (err) {
        logger_1.logger.error(err.stack);
    }
    const websocketOpts = { path: config_1.WEBSOCKET_ORDER_UPDATES_PATH, kafkaTopic: config_1.ORDER_WATCHER_KAFKA_TOPIC };
    const hasSentry = config_1.SENTRY_ENABLED;
    if (hasSentry) {
        logger_1.logger.info('sentry enabled');
    }
    else {
        logger_1.logger.info('sentry disabled');
    }
    return {
        contractAddresses,
        connection,
        kafkaClient,
        orderBookService,
        swapService,
        metaTransactionService,
        provider,
        websocketOpts,
        hasSentry,
    };
}
exports.getDefaultAppDependenciesAsync = getDefaultAppDependenciesAsync;
/*
/**
 * Instantiates a MetaTransactionService
 */
function createMetaTxnServiceFromSwapService(swapService, contractAddresses) {
    return new meta_transaction_service_1.MetaTransactionService(swapService, contractAddresses);
}
//# sourceMappingURL=utils.js.map