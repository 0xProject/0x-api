import { SQS } from 'aws-sdk';

/**
 * SqsClient wraps SQS, making it far easier to unit test SQS and ignore SQS details
 */
export class SqsClient {
    private readonly _sqs: SQS;
    private readonly _queueUrl: string;
    constructor(params: { sqs: SQS; queueUrl: string }) {
        this._sqs = params.sqs;
        this._queueUrl = params.queueUrl;
    }

    public async receiveMessageAsync(): Promise<SQS.Message | null> {
        const response = await this._sqs
            .receiveMessage({
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20, // long polling
                QueueUrl: this._queueUrl,
            })
            .promise();

        if (response === undefined || response.Messages?.length !== 1) {
            return null;
        }
        return response.Messages[0];
    }

    public async changeMessageVisibilityAsync(receiptHandle: string, visibilityTimeout: number): Promise<void> {
        await this._sqs
            .changeMessageVisibility({
                QueueUrl: this._queueUrl,
                ReceiptHandle: receiptHandle,
                VisibilityTimeout: visibilityTimeout,
            })
            .promise();
    }

    public async deleteMessageAsync(receiptHandle: string): Promise<void> {
        await this._sqs
            .deleteMessage({
                QueueUrl: this._queueUrl,
                ReceiptHandle: receiptHandle,
            })
            .promise();
    }
}
