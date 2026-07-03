import { S3Client } from "@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

export function getR2BucketName() {
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not configured.");
  }
  return bucket;
}

export function getR2Client() {
  if (cachedClient) return cachedClient;

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials are incomplete. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.",
    );
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return cachedClient;
}
