"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const subproviders_1 = require("@0x/subproviders");
const utils_1 = require("@0x/utils");
const artifacts_1 = require("../../artifacts");
const wrappers_1 = require("../../wrappers");
const VB = '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b';
contracts_test_utils_1.blockchainTests.skip('Mainnet Sampler Tests', (env) => {
    let testContract;
    const fakeSamplerAddress = '0x1111111111111111111111111111111111111111';
    const overrides = {
        [fakeSamplerAddress]: {
            code: artifacts_1.artifacts.ERC20BridgeSampler.compilerOutput.evm.deployedBytecode.object,
        },
    };
    before(async () => {
        const provider = new contracts_test_utils_1.Web3ProviderEngine();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: fix me!
        provider.addProvider(new subproviders_1.RPCSubprovider(process.env.RPC_URL));
        utils_1.providerUtils.startProviderEngine(provider);
        testContract = new wrappers_1.ERC20BridgeSamplerContract(fakeSamplerAddress, provider, {
            ...env.txDefaults,
            from: VB,
        });
    });
    (0, contracts_test_utils_1.describe)('Curve', () => {
        const CURVE_ADDRESS = '0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51';
        const DAI_TOKEN_INDEX = new utils_1.BigNumber(0);
        const USDC_TOKEN_INDEX = new utils_1.BigNumber(1);
        const CURVE_INFO = {
            poolAddress: CURVE_ADDRESS,
            sellQuoteFunctionSelector: '0x07211ef7',
            buyQuoteFunctionSelector: '0x0e71d1b9',
        };
        (0, contracts_test_utils_1.describe)('sampleSellsFromCurve()', () => {
            it('samples sells from Curve DAI->USDC', async () => {
                const samples = await testContract
                    .sampleSellsFromCurve(CURVE_INFO, DAI_TOKEN_INDEX, USDC_TOKEN_INDEX, [(0, contracts_test_utils_1.toBaseUnitAmount)(1)])
                    .callAsync({ overrides });
                (0, contracts_test_utils_1.expect)(samples.length).to.be.bignumber.greaterThan(0);
                (0, contracts_test_utils_1.expect)(samples[0]).to.be.bignumber.greaterThan(0);
            });
            it('samples sells from Curve USDC->DAI', async () => {
                const samples = await testContract
                    .sampleSellsFromCurve(CURVE_INFO, USDC_TOKEN_INDEX, DAI_TOKEN_INDEX, [(0, contracts_test_utils_1.toBaseUnitAmount)(1, 6)])
                    .callAsync({ overrides });
                (0, contracts_test_utils_1.expect)(samples.length).to.be.bignumber.greaterThan(0);
                (0, contracts_test_utils_1.expect)(samples[0]).to.be.bignumber.greaterThan(0);
            });
        });
        (0, contracts_test_utils_1.describe)('sampleBuysFromCurve()', () => {
            it('samples buys from Curve DAI->USDC', async () => {
                // From DAI to USDC
                // I want to buy 1 USDC
                const samples = await testContract
                    .sampleBuysFromCurve(CURVE_INFO, DAI_TOKEN_INDEX, USDC_TOKEN_INDEX, [(0, contracts_test_utils_1.toBaseUnitAmount)(1, 6)])
                    .callAsync({ overrides });
                (0, contracts_test_utils_1.expect)(samples.length).to.be.bignumber.greaterThan(0);
                (0, contracts_test_utils_1.expect)(samples[0]).to.be.bignumber.greaterThan(0);
            });
            it('samples buys from Curve USDC->DAI', async () => {
                // From USDC to DAI
                // I want to buy 1 DAI
                const samples = await testContract
                    .sampleBuysFromCurve(CURVE_INFO, USDC_TOKEN_INDEX, DAI_TOKEN_INDEX, [(0, contracts_test_utils_1.toBaseUnitAmount)(1)])
                    .callAsync({ overrides });
                (0, contracts_test_utils_1.expect)(samples.length).to.be.bignumber.greaterThan(0);
                (0, contracts_test_utils_1.expect)(samples[0]).to.be.bignumber.greaterThan(0);
            });
        });
    });
});
//# sourceMappingURL=bridge_sampler_mainnet_test.js.map