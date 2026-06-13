import * as Minio from 'minio';

const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
let host = endpoint;
let port = 9000;

if (endpoint.includes(':')) {
  const parts = endpoint.split(':');
  host = parts[0];
  port = parseInt(parts[1], 10);
}

export const minioClient = new Minio.Client({
  endPoint: host,
  port: port,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

let isMinioConnected = false;
let checkAttempted = false;

export async function ensureBucketsExist() {
  const buckets = ['recordings', 'chat-files'];
  for (const bucket of buckets) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1');
        console.log(`[minio] Bucket '${bucket}' created successfully`);
      }
    } catch (err: any) {
      console.warn(`[minio] Failed to ensure bucket '${bucket}' exists:`, err.message);
    }
  }
}

export async function isMinioAvailable(): Promise<boolean> {
  if (checkAttempted) return isMinioConnected;
  checkAttempted = true;
  try {
    // Ping MinIO using listBuckets to verify connection
    await minioClient.listBuckets();
    isMinioConnected = true;
    console.log('[minio] ✅ Successfully connected to MinIO');
    await ensureBucketsExist();
  } catch (err: any) {
    console.warn(`[minio] ⚠️ MinIO connection failed: ${err.message}. Falling back to local disk storage.`);
    isMinioConnected = false;
  }
  return isMinioConnected;
}

/**
 * Uploads a local file to MinIO
 */
export async function uploadToMinio(bucketName: string, objectName: string, filePath: string, contentType?: string): Promise<string> {
  await minioClient.fPutObject(bucketName, objectName, filePath, {
    'Content-Type': contentType || 'application/octet-stream',
  });
  return objectName;
}

/**
 * Generates a presigned GET URL for an object
 */
export async function getPresignedDownloadUrl(bucketName: string, objectName: string, expirySeconds: number): Promise<string> {
  return await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
}
