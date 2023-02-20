"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const utils_1 = require("@0x/utils");
const sqs_producer_1 = require("sqs-producer");
const ts_mockito_1 = require("ts-mockito");
const constants_1 = require("../../src/constants");
const entities_1 = require("../../src/entities");
const rfqm_health_check_1 = require("../../src/utils/rfqm_health_check");
let producerMock;
const MS_IN_MINUTE = 60000;
const fullBalance = new utils_1.BigNumber(1).shiftedBy(constants_1.ETH_DECIMALS);
describe('RFQm Health Check', () => {
    describe('checkSqsQueueAsync', () => {
        beforeEach(() => {
            producerMock = (0, ts_mockito_1.mock)(sqs_producer_1.Producer);
        });
        describe('queue size check', () => {
            it('creates no issues if there are 10 or less jobs in the queue', async () => {
                (0, ts_mockito_1.when)(producerMock.queueSize()).thenResolve(1);
                const issues = await (0, rfqm_health_check_1.checkSqsQueueAsync)((0, ts_mockito_1.instance)(producerMock));
                (0, contracts_test_utils_1.expect)(issues).to.have.length(0);
            });
            it('creates a DEGRADED issue if there are more than 5 messages in the queue', async () => {
                (0, ts_mockito_1.when)(producerMock.queueSize()).thenResolve(11);
                const issues = await (0, rfqm_health_check_1.checkSqsQueueAsync)((0, ts_mockito_1.instance)(producerMock));
                (0, contracts_test_utils_1.expect)(issues).to.have.length(1);
                (0, contracts_test_utils_1.expect)(issues[0].status).to.equal(rfqm_health_check_1.HealthCheckStatus.Degraded);
            });
            it('creates a FAILED issue if there are more than 20 messages in the queue', async () => {
                (0, ts_mockito_1.when)(producerMock.queueSize()).thenResolve(21);
                const issues = await (0, rfqm_health_check_1.checkSqsQueueAsync)((0, ts_mockito_1.instance)(producerMock));
                (0, contracts_test_utils_1.expect)(issues).to.have.length(1);
                (0, contracts_test_utils_1.expect)(issues[0].status).to.equal(rfqm_health_check_1.HealthCheckStatus.Failed);
            });
        });
    });
    describe('checkWorkerHeartbeatsAsync', () => {
        it('creates a failed issue when no heartbeats are found', async () => {
            const issues = await (0, rfqm_health_check_1.checkWorkerHeartbeatsAsync)([]);
            (0, contracts_test_utils_1.expect)(issues).to.have.length(1);
            (0, contracts_test_utils_1.expect)(issues[0].status).to.equal(rfqm_health_check_1.HealthCheckStatus.Failed);
        });
        describe('Heartbeat age', () => {
            it('creates a failed issue with no recent heartbeats', async () => {
                const now = new Date();
                const nowTime = now.getTime();
                const heartbeat = new entities_1.RfqmWorkerHeartbeatEntity({
                    address: '0x00',
                    balance: fullBalance,
                    index: 0,
                    timestamp: new Date(nowTime - MS_IN_MINUTE * 6),
                });
                const issues = await (0, rfqm_health_check_1.checkWorkerHeartbeatsAsync)([heartbeat], now);
                const failedIssues = issues.filter(({ status }) => status === rfqm_health_check_1.HealthCheckStatus.Failed);
                (0, contracts_test_utils_1.expect)(failedIssues).to.have.length(1);
            });
            it('creates degraded issues for stale heartbeats', async () => {
                const now = new Date();
                const nowTime = now.getTime();
                const heartbeat1 = new entities_1.RfqmWorkerHeartbeatEntity({
                    address: '0x00',
                    balance: fullBalance,
                    index: 0,
                    timestamp: now,
                });
                const heartbeat2 = new entities_1.RfqmWorkerHeartbeatEntity({
                    address: '0x01',
                    balance: fullBalance,
                    index: 1,
                    timestamp: new Date(nowTime - MS_IN_MINUTE * 8),
                });
                const issues = await (0, rfqm_health_check_1.checkWorkerHeartbeatsAsync)([heartbeat1, heartbeat2], now);
                const failedIssues = issues.filter(({ status }) => status === rfqm_health_check_1.HealthCheckStatus.Failed);
                (0, contracts_test_utils_1.expect)(failedIssues).to.have.length(0);
                const degradedIssues = issues.filter(({ status }) => status === rfqm_health_check_1.HealthCheckStatus.Degraded);
                (0, contracts_test_utils_1.expect)(degradedIssues).to.have.length(1);
                (0, contracts_test_utils_1.expect)(degradedIssues[0].description).to.contain('0x01');
            });
        });
        describe('Worker balance', () => {
            it('creates a failed issue when no worker has a balance above the failed threshold', async () => {
                const now = new Date();
                const heartbeat = new entities_1.RfqmWorkerHeartbeatEntity({
                    address: '0x00',
                    balance: new utils_1.BigNumber(0.01),
                    index: 0,
                    timestamp: now,
                });
                const issues = await (0, rfqm_health_check_1.checkWorkerHeartbeatsAsync)([heartbeat], now);
                const failedIssues = issues.filter(({ status }) => status === rfqm_health_check_1.HealthCheckStatus.Failed);
                (0, contracts_test_utils_1.expect)(failedIssues).to.have.length(1);
            });
            it('creates degraded issues for low worker balances', async () => {
                const now = new Date();
                const heartbeat1 = new entities_1.RfqmWorkerHeartbeatEntity({
                    address: '0x00',
                    balance: new utils_1.BigNumber(0.01),
                    index: 0,
                    timestamp: now,
                });
                const heartbeat2 = new entities_1.RfqmWorkerHeartbeatEntity({
                    address: '0x01',
                    balance: fullBalance,
                    index: 1,
                    timestamp: now,
                });
                const issues = await (0, rfqm_health_check_1.checkWorkerHeartbeatsAsync)([heartbeat1, heartbeat2], now);
                const failedIssues = issues.filter(({ status }) => status === rfqm_health_check_1.HealthCheckStatus.Failed);
                (0, contracts_test_utils_1.expect)(failedIssues).to.have.length(0);
                const degradedIssues = issues.filter(({ status }) => status === rfqm_health_check_1.HealthCheckStatus.Degraded);
                (0, contracts_test_utils_1.expect)(degradedIssues).to.have.length(1);
                (0, contracts_test_utils_1.expect)(degradedIssues[0].description).to.contain('Less than two workers have a balance above the degraded threshold');
            });
        });
    });
    describe('getHttpIssues', () => {
        it('goes into maintainence mode', async () => {
            const issues = (0, rfqm_health_check_1.getHttpIssues)(/* isMaintainenceMode */ true, /* registryBalance */ fullBalance);
            (0, contracts_test_utils_1.expect)(issues[0].status).to.equal(rfqm_health_check_1.HealthCheckStatus.Maintenance);
        });
        it('produces a FAILED issue with a low registry balance', async () => {
            const lowRegistryBalance = new utils_1.BigNumber(0.01).shiftedBy(constants_1.ETH_DECIMALS);
            const issues = (0, rfqm_health_check_1.getHttpIssues)(/* isMaintainenceMode */ false, lowRegistryBalance);
            (0, contracts_test_utils_1.expect)(issues[0].status).to.equal(rfqm_health_check_1.HealthCheckStatus.Failed);
            (0, contracts_test_utils_1.expect)(issues[0].description).to.contain(lowRegistryBalance.shiftedBy(constants_1.ETH_DECIMALS * -1).toString());
        });
    });
});
//# sourceMappingURL=rfqm_health_check_test.js.map