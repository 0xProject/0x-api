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
            return { exists: true, lastModified: response.LastModified };
        } catch (error) {
            if (error.code === 'NotFound') {
                return { exists: false, lastModified: undefined };
            } else {
                throw error;
            }
        }
    }

    public async getFileContentAsync(bucket: string, key: string): Promise< { content: string | null, lastModified: Date | undefined }> {
        var bucketParams = {
            Bucket: bucket,
            Key: key,
        };

        try {
            const response = await this._s3.getObject(bucketParams).promise();
            if (response?.Body) {
                return { content: response.Body.toString(), lastModified: response.LastModified };
            }
        } catch (error) {}
        return { content: null, lastModified: undefined };
    }
}
