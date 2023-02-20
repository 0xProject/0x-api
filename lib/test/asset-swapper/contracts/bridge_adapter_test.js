"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contract_addresses_1 = require("@0x/contract-addresses");
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const contracts_zero_ex_1 = require("@0x/contracts-zero-ex");
const asset_swapper_1 = require("../../../src/asset-swapper");
const orders_1 = require("../../../src/asset-swapper/utils/market_operation_utils/orders");
(0, contracts_test_utils_1.blockchainTests)('Bridge adapter source compatibility tests', (env) => {
    (0, contracts_test_utils_1.describe)('Avalanche', () => {
        let adapter;
        before(async () => {
            adapter = await contracts_zero_ex_1.AvalancheBridgeAdapterContract.deployFrom0xArtifactAsync(contracts_zero_ex_1.artifacts.AvalancheBridgeAdapter, env.provider, env.txDefaults, contracts_zero_ex_1.artifacts, contracts_test_utils_1.constants.NULL_ADDRESS);
        });
        it('sell sources', async () => {
            const sellSources = asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Avalanche].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(sellSources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
        it('buy sources', async () => {
            const buySources = asset_swapper_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Avalanche].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(buySources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
    });
    (0, contracts_test_utils_1.describe)('BSC', () => {
        let adapter;
        before(async () => {
            adapter = await contracts_zero_ex_1.BSCBridgeAdapterContract.deployFrom0xArtifactAsync(contracts_zero_ex_1.artifacts.BSCBridgeAdapter, env.provider, env.txDefaults, contracts_zero_ex_1.artifacts, contracts_test_utils_1.constants.NULL_ADDRESS);
        });
        it('sell sources', async () => {
            const sellSources = asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.BSC].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(sellSources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
        it('buy sources', async () => {
            const buySources = asset_swapper_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.BSC].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(buySources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
    });
    (0, contracts_test_utils_1.describe)('Celo', () => {
        let adapter;
        before(async () => {
            adapter = await contracts_zero_ex_1.CeloBridgeAdapterContract.deployFrom0xArtifactAsync(contracts_zero_ex_1.artifacts.CeloBridgeAdapter, env.provider, env.txDefaults, contracts_zero_ex_1.artifacts, contracts_test_utils_1.constants.NULL_ADDRESS);
        });
        it('sell sources', async () => {
            const sellSources = asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Celo].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(sellSources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
        it('buy sources', async () => {
            const buySources = asset_swapper_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Celo].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(buySources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
    });
    (0, contracts_test_utils_1.describe)('Ethereum', () => {
        let adapter;
        before(async () => {
            adapter = await contracts_zero_ex_1.EthereumBridgeAdapterContract.deployFrom0xArtifactAsync(contracts_zero_ex_1.artifacts.EthereumBridgeAdapter, env.provider, env.txDefaults, contracts_zero_ex_1.artifacts, contracts_test_utils_1.constants.NULL_ADDRESS);
        });
        it('sell sources', async () => {
            const sellSources = asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Mainnet].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(sellSources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
        it('buy sources', async () => {
            const buySources = asset_swapper_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Mainnet].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(buySources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
    });
    (0, contracts_test_utils_1.describe)('Fantom', () => {
        let adapter;
        before(async () => {
            adapter = await contracts_zero_ex_1.FantomBridgeAdapterContract.deployFrom0xArtifactAsync(contracts_zero_ex_1.artifacts.FantomBridgeAdapter, env.provider, env.txDefaults, contracts_zero_ex_1.artifacts, contracts_test_utils_1.constants.NULL_ADDRESS);
        });
        it('sell sources', async () => {
            const sellSources = asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Fantom].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(sellSources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
        it('buy sources', async () => {
            const buySources = asset_swapper_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Fantom].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(buySources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
    });
    (0, contracts_test_utils_1.describe)('Optimism', () => {
        let adapter;
        before(async () => {
            adapter = await contracts_zero_ex_1.OptimismBridgeAdapterContract.deployFrom0xArtifactAsync(contracts_zero_ex_1.artifacts.OptimismBridgeAdapter, env.provider, env.txDefaults, contracts_zero_ex_1.artifacts, contracts_test_utils_1.constants.NULL_ADDRESS);
        });
        it('sell sources', async () => {
            const sellSources = asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Optimism].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(sellSources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
        it('buy sources', async () => {
            const buySources = asset_swapper_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Optimism].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(buySources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
    });
    (0, contracts_test_utils_1.describe)('Polygon', () => {
        let adapter;
        before(async () => {
            adapter = await contracts_zero_ex_1.PolygonBridgeAdapterContract.deployFrom0xArtifactAsync(contracts_zero_ex_1.artifacts.PolygonBridgeAdapter, env.provider, env.txDefaults, contracts_zero_ex_1.artifacts, contracts_test_utils_1.constants.NULL_ADDRESS);
        });
        it('sell sources', async () => {
            const sellSources = asset_swapper_1.SELL_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Polygon].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(sellSources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
        it('buy sources', async () => {
            const buySources = asset_swapper_1.BUY_SOURCE_FILTER_BY_CHAIN_ID[contract_addresses_1.ChainId.Polygon].exclude([
                asset_swapper_1.ERC20BridgeSource.Native,
                asset_swapper_1.ERC20BridgeSource.MultiHop,
            ]).sources;
            return Promise.all(buySources.map(async (source) => {
                const isSupported = await adapter
                    .isSupportedSource((0, orders_1.getErc20BridgeSourceToBridgeSource)(source))
                    .callAsync();
                (0, contracts_test_utils_1.expect)(isSupported, `${source} is not supported`).to.be.true();
            }));
        });
    });
});
//# sourceMappingURL=bridge_adapter_test.js.map