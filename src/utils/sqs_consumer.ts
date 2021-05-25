import { SQS } from 'aws-sdk';

import { logger } from '../logger';

export class SqsConsumer {
    private readonly _sqs: SQS;
    private readonly _queueUrl: string;
    private readonly _beforeHandle?: () => Promise<boolean>;
    private readonly _handleMessage: (message: SQS.Types.Message) => Promise<any>;
    private readonly _afterHandle?: () => Promise<void>;
    private _isConsuming: boolean;

    constructor(params: {
        sqs: SQS;
        queueUrl: string;
        beforeHandle?: () => Promise<boolean>;
        handleMessage: (message: SQS.Types.Message) => Promise<any>;
        afterHandle?: () => Promise<void>;
    }) {
        this._sqs = params.sqs;
        this._queueUrl = params.queueUrl;
        this._beforeHandle = params.beforeHandle;
        this._handleMessage = params.handleMessage;
        this._afterHandle = params.afterHandle;
        this._isConsuming = false;
    }

    public stop(): void {
        this._isConsuming = false;
    }

    public async consumeAsync(): Promise<void> {
        this._isConsuming = true;
        while (this._isConsuming) {
            await this.consumeOnceAsync();
        }
    }

    public async consumeOnceAsync(): Promise<void> {
        // Run the before hook
        if (this._beforeHandle) {
            let beforeCheck;
            try {
                beforeCheck = await this._beforeHandle();
            } catch (e) {
                logger.warn(e, 'Error encountered in the preHandle check');
                return;
            }

            if (!beforeCheck) {
                logger.warn('before validation failed');
                return;
            }
        }

        // Receive message
        const response = await this._sqs
            .receiveMessage({
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20, // long polling
                QueueUrl: this._queueUrl,
            })
            .promise();

        // No message
        if (response === undefined || response.Messages?.length !== 1) {
            return;
        }

        // Get message
        const message = response.Messages[0];

        // Handle message
        try {
            await this._handleMessage(message);
        } catch (err) {
            logger.error({ err, message }, 'Encountered error while handling message');
            // Retry message
            await this._sqs
                .changeMessageVisibility({
                    QueueUrl: this._queueUrl,
                    ReceiptHandle: message.ReceiptHandle!,
                    VisibilityTimeout: 0,
                })
                .promise();
            return;
        }

        // Delete message
        await this._sqs
            .deleteMessage({
                QueueUrl: this._queueUrl,
                ReceiptHandle: message.ReceiptHandle!,
            })
            .promise();

        // Run the after hook
        if (this._afterHandle) {
            await this._afterHandle();
        }
    }
}
