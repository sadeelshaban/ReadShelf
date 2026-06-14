import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    throw new Error(".env.local not found.");
  }

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error("Missing R2_* variables in .env.local");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const testKey = "readshelf-connection-test.txt";

try {
  await client.send(new HeadBucketCommand({ Bucket: bucketName }));
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: "ReadShelf R2 connection OK",
      ContentType: "text/plain",
    }),
  );
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }),
  );
  console.log(`OK — connected to R2 bucket "${bucketName}"`);
} catch (error) {
  console.error("R2 test failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
