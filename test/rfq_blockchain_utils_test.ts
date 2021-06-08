import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { expect } from '@0x/contracts-test-utils';
import { artifacts as zeroExArtifacts, fullMigrateAsync, IZeroExContract } from '@0x/contracts-zero-ex';
import { Web3ProviderEngine } from '@0x/dev-utils';
import { RfqOrder, Signature } from '@0x/protocol-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { LogEntry } from 'ethereum-types';
import 'mocha';

import { PROTOCOL_FEE_MULTIPLIER } from '../src/config';
import { ChainId } from '../src/types';
import { RfqBlockchainUtils } from '../src/utils/rfq_blockchain_utils';

import { getProvider } from './constants';
import { setupDependenciesAsync, teardownDependenciesAsync } from './utils/deployment';

const SUITE_NAME = 'RFQ Blockchain Utils Test';

const GAS_PRICE = 1e9;
const VALID_EXPIRY = new BigNumber(9000000000);
const CHAIN_ID = ChainId.Ganache;
const TEST_RFQ_ORDER_FILLED_EVENT_LOG: LogEntry = {
    blockHash: '0x4c9f6904bd33f57204a8451de0891b448a7be065c1704e5b6905f382cb31b040',
    address: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    logIndex: 74,
    data: '0xf70ec34e807d08cb83757ec62fffd9e0d22db6b4b97f46b78adcf47682c4cccb000000000000000000000000e89bc18cee87c9af8b472635a152704b96dafb8f0000000000000000000000009016cc2122b52ff5d9937c0c1422b78d7e81ceea0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000e44a075a36f7e7010000000000000000000000000000000000000000000000000000000000000000',
    topics: ['0x829fa99d94dc4636925b38632e625736a614c154d55006b7ab6bea979c210c32'],
    blockNumber: 11598119,
    transactionIndex: 70,
    transactionHash: '0x2b723137d9328fbe5e64bc2729ef5b1d846bb1d242ae2f3c016b9f70715aa818',
};
const TEST_RFQ_ORDER_FILLED_EVENT_TAKER_AMOUNT = new BigNumber('10000000000000000');

describe(SUITE_NAME, () => {
    let provider: Web3ProviderEngine;
    let makerToken: DummyERC20TokenContract;
    let takerToken: DummyERC20TokenContract;
    let takerAmount: BigNumber;
    let invalidTakerAmount: BigNumber;
    let makerAmount: BigNumber;
    let web3Wrapper: Web3Wrapper;
    let owner: string;
    let maker: string;
    let taker: string;
    let txOrigin: string;
    let zeroEx: IZeroExContract;
    let rfqOrder: RfqOrder;
    let unfillableRfqOrder: RfqOrder;
    let rfqBlockchainUtils: RfqBlockchainUtils;
    let orderSig: Signature;
    let sigForUnfillableOrder: Signature;

    before(async () => {
        await setupDependenciesAsync(SUITE_NAME);
        provider = getProvider();
        web3Wrapper = new Web3Wrapper(provider);

        [owner, maker, taker, txOrigin] = await web3Wrapper.getAvailableAddressesAsync();

        makerToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyERC20Token,
            provider,
            { from: maker, gas: 10000000 },
            {},
            'The token that originally belongs to the maker',
            'makerToken',
            new BigNumber(18),
            new BigNumber(1000000),
        );

        takerToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyERC20Token,
            provider,
            { from: taker, gas: 10000000 },
            {},
            'The token that originally belongs to the maker',
            'takerToken',
            new BigNumber(18),
            new BigNumber(1000000),
        );

        makerAmount = new BigNumber(100);
        takerAmount = new BigNumber(50);
        invalidTakerAmount = new BigNumber(100);

        zeroEx = await fullMigrateAsync(
            owner,
            provider,
            { from: owner, gasPrice: GAS_PRICE },
            {},
            { protocolFeeMultiplier: Number(PROTOCOL_FEE_MULTIPLIER) },
            {
                nativeOrders: zeroExArtifacts.NativeOrdersFeature,
                metaTransactions: zeroExArtifacts.MetaTransactionsFeature,
            },
        );

        rfqOrder = new RfqOrder({
            makerToken: makerToken.address,
            takerToken: takerToken.address,
            makerAmount,
            takerAmount,
            maker,
            taker,
            txOrigin,
            expiry: VALID_EXPIRY,
            salt: new BigNumber(1),
            verifyingContract: zeroEx.address,
            chainId: CHAIN_ID,
        });
        orderSig = await rfqOrder.getSignatureWithProviderAsync(provider);

        unfillableRfqOrder = new RfqOrder({
            makerToken: makerToken.address,
            takerToken: takerToken.address,
            makerAmount,
            takerAmount: invalidTakerAmount,
            maker,
            taker,
            txOrigin,
            expiry: VALID_EXPIRY,
            salt: new BigNumber(1),
            verifyingContract: zeroEx.address,
            chainId: CHAIN_ID,
        });
        sigForUnfillableOrder = await unfillableRfqOrder.getSignatureWithProviderAsync(provider);

        await makerToken.mint(makerAmount).awaitTransactionSuccessAsync({ from: maker });
        await makerToken
            .approve(zeroEx.address, makerAmount)
            .awaitTransactionSuccessAsync({ from: maker });
        await takerToken.mint(takerAmount).awaitTransactionSuccessAsync({ from: taker });
        await takerToken
            .approve(zeroEx.address, takerAmount)
            .awaitTransactionSuccessAsync({ from: taker });

        rfqBlockchainUtils = new RfqBlockchainUtils(provider, zeroEx.address);
    });

    after(async () => {
        await teardownDependenciesAsync(SUITE_NAME);
    });

    describe('validateMetaTransaction', () => {
        it('returns successful filled amounts for a valid metatransaction', async () => {
            const metaTx = rfqBlockchainUtils.generateMetaTransaction(rfqOrder, orderSig, taker, takerAmount, CHAIN_ID);
            const metaTxSig = await metaTx.getSignatureWithProviderAsync(provider);

            expect(await rfqBlockchainUtils.validateMetaTransactionOrThrowAsync(metaTx, metaTxSig, txOrigin)).to.deep.eq([takerAmount, makerAmount]);
        });
        it('throws for a metatransaction with an invalid signature', async () => {
            const metaTx = rfqBlockchainUtils.generateMetaTransaction(rfqOrder, orderSig, taker, takerAmount, CHAIN_ID);
            const invalidMetaTxSig = orderSig;

            try {
                await rfqBlockchainUtils.validateMetaTransactionOrThrowAsync(metaTx, invalidMetaTxSig, txOrigin);
                expect.fail(`validateMetaTransactionOrThrowAsync should throw an error when the signature is invalid`);
            } catch (err) {
                expect(String(err)).to.contain('SignatureValidationError');
            }
        });
        it('throws for a metatransaction with an unfillable order', async () => {
            const metaTx = rfqBlockchainUtils.generateMetaTransaction(unfillableRfqOrder, sigForUnfillableOrder, taker, invalidTakerAmount, CHAIN_ID);
            const metaTxSig = await metaTx.getSignatureWithProviderAsync(provider);

            try {
                await rfqBlockchainUtils.validateMetaTransactionOrThrowAsync(metaTx, metaTxSig, txOrigin);
                expect.fail(`validateMetaTransactionOrThrowAsync should throw an error when the order is unfillable`);
            } catch (err) {
                expect(String(err)).to.contain('MetaTransactionCallFailedError');
            }
        });
        it('returns successful filled amounts for a valid metatransaction when validating calldata', async () => {
            const metaTx = rfqBlockchainUtils.generateMetaTransaction(rfqOrder, orderSig, taker, takerAmount, CHAIN_ID);
            const metaTxSig = await metaTx.getSignatureWithProviderAsync(provider);

            const callData = rfqBlockchainUtils.generateMetaTransactionCallData(metaTx, metaTxSig);
            expect(await rfqBlockchainUtils.decodeMetaTransactionCallDataAndValidateAsync(callData, txOrigin)).to.deep.eq([takerAmount, makerAmount]);
        });
        it('throws for a metatransaction with an invalid signature when validating calldata', async () => {
            const metaTx = rfqBlockchainUtils.generateMetaTransaction(rfqOrder, orderSig, taker, takerAmount, CHAIN_ID);
            const invalidMetaTxSig = orderSig;

            const callData = rfqBlockchainUtils.generateMetaTransactionCallData(metaTx, invalidMetaTxSig);

            try {
                await rfqBlockchainUtils.decodeMetaTransactionCallDataAndValidateAsync(callData, txOrigin);
                expect.fail(`validateMetaTransactionOrThrowAsync should throw an error when the signature is invalid`);
            } catch (err) {
                expect(String(err)).to.contain('SignatureValidationError');
            }
        });
        it('throws for a metatransaction with an unfillable order when validating calldata', async () => {
            const metaTx = rfqBlockchainUtils.generateMetaTransaction(unfillableRfqOrder, sigForUnfillableOrder, taker, invalidTakerAmount, CHAIN_ID);
            const metaTxSig = await metaTx.getSignatureWithProviderAsync(provider);

            const callData = rfqBlockchainUtils.generateMetaTransactionCallData(metaTx, metaTxSig);

            try {
                await rfqBlockchainUtils.decodeMetaTransactionCallDataAndValidateAsync(callData, txOrigin);
                expect.fail(`validateMetaTransactionOrThrowAsync should throw an error when the order is unfillable`);
            } catch (err) {
                expect(String(err)).to.contain('MetaTransactionCallFailedError');
            }
        });
        it('should throw for a partially filled order', async () => {
            const metaTx1 = rfqBlockchainUtils.generateMetaTransaction(rfqOrder, orderSig, taker, takerAmount.div(2), CHAIN_ID);
            const metaTxSig1 = await metaTx1.getSignatureWithProviderAsync(provider);

            await zeroEx.executeMetaTransaction(metaTx1, metaTxSig1).awaitTransactionSuccessAsync({from: txOrigin});

            const metaTx2 = rfqBlockchainUtils.generateMetaTransaction(rfqOrder, orderSig, taker, takerAmount, CHAIN_ID);
            const metaTxSig2 = await metaTx2.getSignatureWithProviderAsync(provider);

            try {
                await rfqBlockchainUtils.validateMetaTransactionOrThrowAsync(metaTx2, metaTxSig2, txOrigin);
                expect.fail(`validateMetaTransactionOrThrowAsync should throw an error when not filling the entire amount`);
            } catch (err) {
                expect(String(err)).to.contain(`filled amount is less than requested fill amount`);
            }
        });
    });
    describe('submitCallDataToExchangeProxyAsync', () => {
        it('passes submit validation and returns a transaction hash for a valid meta tx', async () => {
            const metaTx = rfqBlockchainUtils.generateMetaTransaction(rfqOrder, orderSig, taker, takerAmount, CHAIN_ID);
            const metaTxSig = await metaTx.getSignatureWithProviderAsync(provider);

            const callData = rfqBlockchainUtils.generateMetaTransactionCallData(metaTx, metaTxSig);

            const txHash = await rfqBlockchainUtils.submitCallDataToExchangeProxyAsync(callData, txOrigin, { gasPrice: 1e9, gas: 200000, value: 0 });

            expect(txHash).to.match(/^0x[0-9a-fA-F]+/);
        });
    });
    describe('getTakerTokenFillAmountFromMetaTxCallData', () => {
        it('returns the correct taker token fill amount from calldata', async () => {
            const metaTx = rfqBlockchainUtils.generateMetaTransaction(rfqOrder, orderSig, taker, takerAmount, CHAIN_ID);
            const metaTxSig = await metaTx.getSignatureWithProviderAsync(provider);

            const callData = rfqBlockchainUtils.generateMetaTransactionCallData(metaTx, metaTxSig);

            const expectedTakerTokenFillAmount = rfqBlockchainUtils.getTakerTokenFillAmountFromMetaTxCallData(callData);
            expect(expectedTakerTokenFillAmount).to.deep.eq(takerAmount);
        });
    });
    describe('getRfqOrderTakerTokenFilledAmountFromLogs', () => {
        it('returns the correct taker token fill amount from an RfqOrderFillEvent log', async () => {
            const actualTakerAmount = rfqBlockchainUtils.getRfqOrderTakerTokenFilledAmountFromLogs([TEST_RFQ_ORDER_FILLED_EVENT_LOG]);

            expect(actualTakerAmount).to.deep.eq(TEST_RFQ_ORDER_FILLED_EVENT_TAKER_AMOUNT);
        });
    });
});
