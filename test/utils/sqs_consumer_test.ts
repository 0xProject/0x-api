// tslint:disable:custom-no-magic-numbers
// tslint:disable:no-empty
// tslint:disable:max-file-line-count

import { expect } from '@0x/contracts-test-utils';
import { SQS } from 'aws-sdk';
import { mock } from 'ts-mockito';

import { SqsConsumer } from '../../src/utils/sqs_consumer';

const queueUrl = 'https://some-url.com/queue';

describe('SqsConsumer', () => {
    describe('consumeOnceAsync', () => {
        describe('beforeHandle', () => {
            it('should not call handleMessage if beforeHandle returns false', async () => {
                // Given
                const sqsMock = mock(SQS);
                let isHandleCalled = false;
                const beforeHandle = async () => false;
                const handleMessage = async () => {
                    isHandleCalled = true;
                };

                const consumer = new SqsConsumer({
                    sqs: sqsMock,
                    queueUrl,
                    handleMessage,
                    beforeHandle,
                });

                // When
                await consumer.consumeOnceAsync();

                // Then
                expect(isHandleCalled).to.eq(false);
            });

            it('should not call handleMessage if beforeHandle throws an error', async () => {
                // Given
                const sqsMock = mock(SQS);
                let isHandleCalled = false;
                const beforeHandle = async () => Promise.reject('error!');
                const handleMessage = async () => {
                    isHandleCalled = true;
                };

                const consumer = new SqsConsumer({
                    sqs: sqsMock,
                    queueUrl,
                    handleMessage,
                    beforeHandle,
                });

                // When
                await consumer.consumeOnceAsync();

                // Then
                expect(isHandleCalled).to.eq(false);
            });
        });
    });
});
