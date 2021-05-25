import { SQS } from 'aws-sdk';

import { logger } from '../logger';

import { SqsClient } from './sqs_client';

export class SqsConsumer {
    private readonly _sqsClient: SqsClient;
    private readonly _beforeHandle?: () => Promise<boolean>;
    private readonly _handleMessage: (message: SQS.Types.Message) => Promise<any>;
    private readonly _afterHandle?: () => Promise<void>;
    private _isConsuming: boolean;

    constructor(params: {
        sqsClient: SqsClient;
        beforeHandle?: () => Promise<boolean>;
        handleMessage: (message: SQS.Types.Message) => Promise<any>;
        afterHandle?: () => Promise<void>;
    }) {
        this._sqsClient = params.sqsClient;
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
        const message = await this._sqsClient.receiveMessageAsync();

        // No message
        if (message === null) {
            return;
        }

        // Handle message
        try {
            await this._handleMessage(message);
        } catch (err) {
            logger.error({ err, message }, 'Encountered error while handling message');
            // Retry message
            await this._sqsClient.changeMessageVisibilityAsync(message.ReceiptHandle!, 0);
            return;
        }

        // Delete message
        await this._sqsClient.deleteMessageAsync(message.ReceiptHandle!);

        // Run the after hook
        if (this._afterHandle) {
            await this._afterHandle();
        }
    }
}
