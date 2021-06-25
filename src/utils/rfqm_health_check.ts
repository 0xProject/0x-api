import { Producer } from 'sqs-producer';

const SQS_QUEUE_SIZE_DEGRADED_THRESHOLD = 10; // More messages sitting in queue than this will cause a DEGRADED issue
const SQS_QUEUE_SIZE_FAILED_THRESHOLD = 20; // More messages sitting in queue than this will cause a FAILED issue
const SQS_MESSAGE_AGE_MINUTES_DEGRADED_THRESHOLD = 3; // A message older than this in the queue will cause a DEGRADED issue
const SQS_MESSAGE_AGE_MINUTES_FAILED_THRESHOLD = 5; // A message older than this in the queue will cause a FAILED issue

export enum HealthCheckStatus {
    Operational = 'operational',
    Unknown = 'unknown',
    Maintenance = 'maintenance',
    Degraded = 'degraded',
    Failed = 'failed',
}

interface HealthCheckIssue {
    status: HealthCheckStatus;
    description: string;
}

export interface HealthCheckResult {
    status: HealthCheckStatus;
    pairs: {
        [pair: string]: HealthCheckStatus; // where the pair has the form `${contractA}-${contractB}`
    };
    http: {
        status: HealthCheckStatus;
        issues: HealthCheckIssue[];
    };
    workers: {
        status: HealthCheckStatus;
        issues: HealthCheckIssue[];
    };
    // TODO (rhinodavid): Add MarketMakers
}

export interface RfqmHealthCheckShortResponse {
    isOperational: boolean;
    pairs: [string, string][];
}

const MILLISECONDS_IN_MINUTE = 60 * 1000; // tslint:disable-line custom-no-magic-numbers

/**
 * Transform the full health check result into the minimal response the Matcha UI requires.
 */
export function transformResultToShortResponse(result: HealthCheckResult): RfqmHealthCheckShortResponse {
    return {
        isOperational: result.status === HealthCheckStatus.Operational || result.status === HealthCheckStatus.Degraded,
        pairs: Object.entries(result.pairs)
            .filter(
                ([_pair, status]) => status === HealthCheckStatus.Operational || status === HealthCheckStatus.Degraded,
            )
            .map(([pair, _status]) => {
                const [tokenA, tokenB] = pair.split('-');
                return [tokenA, tokenB];
            }),
    };
}

/**
 * Runs checks on the SQS queue to detect if there are messages piling up or if there are old messages in the
 * queue which have expired or will expire soon. `nowTime` parameter is provided for testing.
 */
export async function checkSqsQueueAsync(producer: Producer, nowTime: Date = new Date()): Promise<HealthCheckIssue[]> {
    const results: HealthCheckIssue[] = [];
    const messagesInQueue = await producer.queueSize();
    if (messagesInQueue === 0) {
        return results;
    }
    if (messagesInQueue > SQS_QUEUE_SIZE_FAILED_THRESHOLD) {
        results.push({
            status: HealthCheckStatus.Failed,
            description: `SQS queue contains ${messagesInQueue} messages (threshold is ${SQS_QUEUE_SIZE_FAILED_THRESHOLD})`,
        });
    } else if (messagesInQueue > SQS_QUEUE_SIZE_DEGRADED_THRESHOLD) {
        results.push({
            status: HealthCheckStatus.Degraded,
            description: `SQS queue contains ${messagesInQueue} messages (threshold is ${SQS_QUEUE_SIZE_DEGRADED_THRESHOLD})`,
        });
    }
    const { Messages: messages } = await producer.sqs
        .receiveMessage({
            MaxNumberOfMessages: 10 /* API maximum */,
            QueueUrl: producer.queueUrl,
            AttributeNames: ['SentTimestamp'],
            VisibilityTimeout: 0 /* sec (don't make the messages invisible to workers) */,
        })
        .promise();
    if (messages === undefined) {
        throw new Error("SQS response did not include 'Messages'");
    }
    const messageTimestamps = messages.map((m) => parseInt(m.Attributes!.SentTimestamp, 10)).sort();
    const oldestTimestamp = messageTimestamps[0];
    if (oldestTimestamp) {
        const ageMs = nowTime.getTime() - oldestTimestamp;
        const ageMinutes = ageMs / MILLISECONDS_IN_MINUTE;
        if (ageMinutes > SQS_MESSAGE_AGE_MINUTES_FAILED_THRESHOLD) {
            results.push({
                status: HealthCheckStatus.Failed,
                description: `SQS queue contains a message ${ageMs} old (threshold is ${
                    SQS_MESSAGE_AGE_MINUTES_FAILED_THRESHOLD * MILLISECONDS_IN_MINUTE
                })`,
            });
        } else if (ageMinutes > SQS_MESSAGE_AGE_MINUTES_DEGRADED_THRESHOLD) {
            results.push({
                status: HealthCheckStatus.Degraded,
                description: `SQS queue contains a message ${ageMs} old (threshold is ${
                    SQS_MESSAGE_AGE_MINUTES_DEGRADED_THRESHOLD * MILLISECONDS_IN_MINUTE
                })`,
            });
        }
    }
    return results;
}
