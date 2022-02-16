import { S3 } from 'aws-sdk';

/**
 * S3Client wraps S3, making it far easier to unit test S3 and ignore S3 details
 */
export class S3Client {
    constructor(private readonly _s3: S3) {}

    public async hasFileAsync(
        bucket: string,
        key: string,
    ): Promise<{ exists: boolean; lastModified: Date | undefined }> {
        var bucketParams = {
            Bucket: bucket,
            Key: key,
        };

        try {
            const response = await this._s3.headObject(bucketParams).promise();
            if (response.LastModified) {
                return { exists: true, lastModified: response.LastModified };
            } else {
                throw new Error(`Failed to get metadata of S3 object ${key} in bucket ${bucket}.`);
            }
        } catch (error) {
            if (error.code === 'NotFound') {
                return { exists: false, lastModified: undefined };
            } else {
                throw error;
            }
        }
    }

    public async getFileContentAsync(bucket: string, key: string): Promise<{ content: string; lastModified: Date }> {
        var bucketParams = {
            Bucket: bucket,
            Key: key,
        };

        const response = await this._s3.getObject(bucketParams).promise();
        if (response && response.Body && response.LastModified) {
            return { content: response.Body.toString(), lastModified: response.LastModified };
        } else {
            throw new Error(`Failed to get content of S3 object ${key} in bucket ${bucket}.`);
        }
    }
}
