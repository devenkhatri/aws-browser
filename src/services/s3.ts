
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Configuration for accessing an S3 bucket.
 */
export interface S3Config {
    /**
     * The name of the S3 bucket.
     */
    bucketName: string;
    /**
     * The region of the S3 bucket.
     */
    region: string;
    /**
     * The access key ID for authenticating with S3.
     */
    accessKeyId: string;
    /**
     * The secret access key for authenticating with S3.
     */
    secretAccessKey: string;
}

/**
 * Represents a file or folder in the S3 bucket.
 */
export interface S3Object {
    /**
     * The key (path) of the object in S3.
     */
    key: string;
    /**
     * The size of the object in bytes. Only applicable for files.
     */
    size?: number;
    /**
     * The last modified date of the object. Only applicable for files.
     */
    lastModified?: Date;
    /**
     * Indicates whether the object is a file or a folder.
     */
    type: 'file' | 'folder';
}

/**
 * Asynchronously lists objects (files and folders) in an S3 bucket under a given prefix.
 *
 * @param config The S3 configuration.
 * @param prefix The prefix (path) to list objects under. Use an empty string to list objects at the root level.
 * @returns A promise that resolves to an array of S3Object.
 */
export async function listObjects(config: S3Config, prefix: string): Promise<S3Object[]> {
    const s3Client = new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        Delimiter: '/',
    });

    try {
        const response = await s3Client.send(command);
        const contents: S3Object[] = [];

        if (response.CommonPrefixes) {
            response.CommonPrefixes.forEach((prefix) => {
                if (prefix.Prefix) {
                    contents.push({
                        key: prefix.Prefix,
                        type: 'folder',
                    });
                }
            });
        }

        if (response.Contents) {
            response.Contents.forEach((object) => {
                if (object.Key) {
                    contents.push({
                        key: object.Key,
                        size: object.Size,
                        lastModified: object.LastModified,
                        type: 'file',
                    });
                }
            });
        }

        return contents;
    } catch (error) {
        console.error("Error listing objects:", error);
        throw error;
    }
}

/**
 * Asynchronously retrieves a pre-signed URL for downloading an object from S3.
 *
 * @param config The S3 configuration.
 * @param key The key (path) of the object in S3.
 * @returns A promise that resolves to the pre-signed URL.
 */
export async function getDownloadUrl(config: S3Config, key: string): Promise<string> {
    const s3Client = new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
        return url;
    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        throw error;
    }
}

/**
 * Asynchronously uploads a file to S3.
 *
 * @param config The S3 configuration.
 * @param key The key (path) to store the object in S3.
 * @param file The file to upload (as a Buffer or Blob).
 * @returns A promise that resolves when the upload is complete.
 */
export async function uploadFile(config: S3Config, key: string, file: Buffer): Promise<void> {
    const s3Client = new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: file,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

/**
 * Asynchronously deletes a file from S3.
 *
 * @param config The S3 configuration.
 * @param key The key (path) of the file to delete from S3.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteFile(config: S3Config, key: string): Promise<void> {
    const s3Client = new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
    }
}


/**
 * Asynchronously creates a new folder (object with a trailing slash) in S3.
 *
 * @param config The S3 configuration.
 * @param key The key (path) of the new folder in S3 (must end with a slash).
 * @returns A promise that resolves when the folder is created.
 */
export async function createFolder(config: S3Config, key: string): Promise<void> {
    // TODO: Implement this by calling the S3 API.
    return;
}
