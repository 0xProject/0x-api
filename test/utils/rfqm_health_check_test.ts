import { expect } from '@0x/contracts-test-utils';
import { Producer } from 'sqs-producer';
import { mock, when, instance, anything } from 'ts-mockito';
import { checkSqsQueueAsync, HealthCheckStatus } from '../../src/utils/rfqm_health_check';
import { Request, SQS } from 'aws-sdk';

let sqsMock: SQS;
let requestMock: Request<any, any>; // NOT a normal request; see AWS types/docs for more.
let producerMock: Producer;

describe('RFQm Health Check', () => {
    describe('checkSqsQueueAsync', () => {
        beforeEach(() => {
            // See https://github.com/NagRock/ts-mockito/issues/112#issuecomment-517971325
            sqsMock = mock<SQS>();
            requestMock = mock(Request);
            producerMock = mock(Producer);
            when(producerMock.sqs).thenReturn(instance(sqsMock));
            when(sqsMock.receiveMessage(anything())).thenReturn(instance(requestMock));
            when(requestMock.promise()).thenReturn(
                new Promise((resolve, _reject) => {
                    resolve({
                        ResponseMetadata: {
                            RequestId: '2299d3c1-76f6-5fbb-b07f-8a91563e74fc',
                        },
                        Messages: [],
                    });
                }),
            );
        });

        describe('queue size check', () => {
            it('creates no issues if there are 5 or less jobs in the queue', async () => {
                when(producerMock.queueSize()).thenResolve(1);

                const issues = await checkSqsQueueAsync(instance(producerMock));

                expect(issues).to.have.length(0);
            });

            it('creates a DEGRADED issue if there are more than 5 messages in the queue', async () => {
                when(producerMock.queueSize()).thenResolve(6);

                const issues = await checkSqsQueueAsync(instance(producerMock));

                expect(issues).to.have.length(1);
                expect(issues[0].status).to.equal(HealthCheckStatus.Degraded);
            });

            it('creates a FAILED issue if there are more than 10 messages in the queue', async () => {
                when(producerMock.queueSize()).thenResolve(11);

                const issues = await checkSqsQueueAsync(instance(producerMock));

                expect(issues).to.have.length(1);
                expect(issues[0].status).to.equal(HealthCheckStatus.Failed);
            });
        });
        describe('message age check', () => {
            it('creates no issues for messages newer than 3 minutes', async () => {
                const now = new Date();
                when(requestMock.promise()).thenReturn(
                    new Promise((resolve, _reject) => {
                        resolve({
                            ResponseMetadata: {
                                RequestId: '2299d3c1-76f6-5fbb-b07f-8a91563e74fc',
                            },
                            Messages: [
                                {
                                    MessageId: 'dfe0c393-3a3f-4160-aa58-6d6cffb07953',
                                    ReceiptHandle:
                                        'AQEB8CCc9tm0ti4UKHOBAc0dCAsJqv/u9pL6rsVwu1q+D1kThOM4rm9pdqRQCyWOzxS7/QByVilK+zzZmrY4nRg3xuFO/CWOo6PdLmUmm6bXE9dY0XWu28h8iCmSWoMhbYjMPBMyhRGDsx8yWb34IeKtIrTUqn68l/NVH2P1A8LOgjAlI4Mamxgr9cyJVnfdGsusqd9QlEVbzh6ZK+ccyTiixe65hHhkxVLhAu5Z4C2Vo/chjqPkNoy0exZefF7y4Whya3t7cOo0ZeNggyTukDDvkUKg+aHHYn1u1Myj+qSbThU=',
                                    MD5OfBody: '29628f6790da2e7daa6f40ab933e05d9',
                                    Body: 'order-1',
                                    Attributes: {
                                        SentTimestamp: `${now.getTime() - 60000}`, // 1 minute old
                                    },
                                },
                            ],
                        });
                    }),
                );
                when(producerMock.queueSize()).thenResolve(1);

                const issues = await checkSqsQueueAsync(instance(producerMock), now);

                expect(issues).to.have.length(0);
            });

            it('creates a DEGRADED issue for messages older than 3 minutes', async () => {
                const now = new Date();
                when(requestMock.promise()).thenReturn(
                    new Promise((resolve, _reject) => {
                        resolve({
                            ResponseMetadata: {
                                RequestId: '2299d3c1-76f6-5fbb-b07f-8a91563e74fc',
                            },
                            Messages: [
                                {
                                    MessageId: 'dfe0c393-3a3f-4160-aa58-6d6cffb07953',
                                    ReceiptHandle:
                                        'AQEB8CCc9tm0ti4UKHOBAc0dCAsJqv/u9pL6rsVwu1q+D1kThOM4rm9pdqRQCyWOzxS7/QByVilK+zzZmrY4nRg3xuFO/CWOo6PdLmUmm6bXE9dY0XWu28h8iCmSWoMhbYjMPBMyhRGDsx8yWb34IeKtIrTUqn68l/NVH2P1A8LOgjAlI4Mamxgr9cyJVnfdGsusqd9QlEVbzh6ZK+ccyTiixe65hHhkxVLhAu5Z4C2Vo/chjqPkNoy0exZefF7y4Whya3t7cOo0ZeNggyTukDDvkUKg+aHHYn1u1Myj+qSbThU=',
                                    MD5OfBody: '29628f6790da2e7daa6f40ab933e05d9',
                                    Body: 'order-1',
                                    Attributes: {
                                        SentTimestamp: `${now.getTime() - 60000}`, // 1 minute old
                                    },
                                },
                                {
                                    MessageId: 'dfe0c393-3a3f-4160-aa58-6d6cffb07954',
                                    ReceiptHandle:
                                        'AQEB8CCc9tm0ti4UKHOBAc0dCAsJqv/u9pL6rsVwu1q+D1kThOM4rm9pdqRQCyWOzxS7/QByVilK+zzZmrY4nRg3xuFO/CWOo6PdLmUmm6bXE9dY0XWu28h8iCmSWoMhbYjMPBMyhRGDsx8yWb34IeKtIrTUqn68l/NVH2P1A8LOgjAlI4Mamxgr9cyJVnfdGsusqd9QlEVbzh6ZK+ccyTiixe65hHhkxVLhAu5Z4C2Vo/chjqPkNoy0exZefF7y4Whya3t7cOo0ZeNggyTukDDvkUKg+aHHYn1u1Myj+qSbThU=',
                                    MD5OfBody: '29628f6790da2e7daa6f40ab933e05d9',
                                    Body: 'order-2',
                                    Attributes: {
                                        SentTimestamp: `${now.getTime() - 180001}`, // 3 minutes old (plus 1 ms)
                                    },
                                },
                            ],
                        });
                    }),
                );
                when(producerMock.queueSize()).thenResolve(2);

                const issues = await checkSqsQueueAsync(instance(producerMock), now);

                expect(issues).to.have.length(1);
                expect(issues[0].status).to.equal(HealthCheckStatus.Degraded);
            });

            it('creates a FAILED issue for messages older than 5 minutes', async () => {
                const now = new Date();
                when(requestMock.promise()).thenReturn(
                    new Promise((resolve, _reject) => {
                        resolve({
                            ResponseMetadata: {
                                RequestId: '2299d3c1-76f6-5fbb-b07f-8a91563e74fc',
                            },
                            Messages: [
                                {
                                    MessageId: 'dfe0c393-3a3f-4160-aa58-6d6cffb07953',
                                    ReceiptHandle:
                                        'AQEB8CCc9tm0ti4UKHOBAc0dCAsJqv/u9pL6rsVwu1q+D1kThOM4rm9pdqRQCyWOzxS7/QByVilK+zzZmrY4nRg3xuFO/CWOo6PdLmUmm6bXE9dY0XWu28h8iCmSWoMhbYjMPBMyhRGDsx8yWb34IeKtIrTUqn68l/NVH2P1A8LOgjAlI4Mamxgr9cyJVnfdGsusqd9QlEVbzh6ZK+ccyTiixe65hHhkxVLhAu5Z4C2Vo/chjqPkNoy0exZefF7y4Whya3t7cOo0ZeNggyTukDDvkUKg+aHHYn1u1Myj+qSbThU=',
                                    MD5OfBody: '29628f6790da2e7daa6f40ab933e05d9',
                                    Body: 'order-1',
                                    Attributes: {
                                        SentTimestamp: `${now.getTime() - 360000}`, // 6 minutes old
                                    },
                                },
                                {
                                    MessageId: 'dfe0c393-3a3f-4160-aa58-6d6cffb07954',
                                    ReceiptHandle:
                                        'AQEB8CCc9tm0ti4UKHOBAc0dCAsJqv/u9pL6rsVwu1q+D1kThOM4rm9pdqRQCyWOzxS7/QByVilK+zzZmrY4nRg3xuFO/CWOo6PdLmUmm6bXE9dY0XWu28h8iCmSWoMhbYjMPBMyhRGDsx8yWb34IeKtIrTUqn68l/NVH2P1A8LOgjAlI4Mamxgr9cyJVnfdGsusqd9QlEVbzh6ZK+ccyTiixe65hHhkxVLhAu5Z4C2Vo/chjqPkNoy0exZefF7y4Whya3t7cOo0ZeNggyTukDDvkUKg+aHHYn1u1Myj+qSbThU=',
                                    MD5OfBody: '29628f6790da2e7daa6f40ab933e05d9',
                                    Body: 'order-2',
                                    Attributes: {
                                        SentTimestamp: `${now.getTime() - 180001}`, // 3 minutes old (plus 1 ms)
                                    },
                                },
                            ],
                        });
                    }),
                );


                when(producerMock.queueSize()).thenResolve(2);

                const issues = await checkSqsQueueAsync(instance(producerMock), now);

                expect(issues).to.have.length(1);
                expect(issues[0].status).to.equal(HealthCheckStatus.Failed);
            });
        });
    });
});
