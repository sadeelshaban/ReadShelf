import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2BucketName, getR2Client } from "@/lib/storage/r2-client";

const PRESIGN_EXPIRY_SECONDS = 3600;

export function pdfObjectKey(path: string) {
  return `pdfs/${path}`;
}

export function coverObjectKey(path: string) {
  return `covers/${path}`;
}

async function streamToBuffer(body: unknown) {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === "object" && body !== null && Symbol.asyncIterator in body) {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  throw new Error("Unexpected R2 object body.");
}

export async function downloadR2Pdf(path: string) {
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: pdfObjectKey(path),
    }),
  );
  return streamToBuffer(response.Body);
}

export async function deleteR2Objects(paths: {
  pdfPath: string;
  coverPath?: string | null;
}) {
  const client = getR2Client();
  const bucket = getR2BucketName();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: pdfObjectKey(paths.pdfPath),
    }),
  );

  if (paths.coverPath) {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: coverObjectKey(paths.coverPath),
      }),
    );
  }
}

export async function createR2CoverReadUrl(path: string) {
  const key = coverObjectKey(path);

  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: getR2BucketName(),
        Key: key,
      }),
    );
  } catch {
    return null;
  }

  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS },
  );
}

export async function createR2UploadUrls(input: {
  pdfPath: string;
  coverPath: string;
  coverContentType: string;
}) {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const [pdfUploadUrl, coverUploadUrl] = await Promise.all([
    getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: pdfObjectKey(input.pdfPath),
        ContentType: "application/pdf",
      }),
      { expiresIn: PRESIGN_EXPIRY_SECONDS },
    ),
    getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: coverObjectKey(input.coverPath),
        ContentType: input.coverContentType,
      }),
      { expiresIn: PRESIGN_EXPIRY_SECONDS },
    ),
  ]);

  return {
    storage: "r2" as const,
    pdfUploadUrl,
    coverUploadUrl,
  };
}

export async function uploadR2Pdf(path: string, body: Buffer, contentType: string) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: pdfObjectKey(path),
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function uploadR2Cover(path: string, body: Buffer, contentType: string) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: coverObjectKey(path),
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function listR2UserStorageBytes(userId: string) {
  const client = getR2Client();
  const bucket = getR2BucketName();
  const prefixes = [`pdfs/${userId}/`, `covers/${userId}/`];
  let total = 0;

  for (const prefix of prefixes) {
    let continuationToken: string | undefined;

    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      for (const object of response.Contents ?? []) {
        total += object.Size ?? 0;
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
  }

  return total;
}

export async function getR2PlatformStorageBytes() {
  const client = getR2Client();
  const bucket = getR2BucketName();
  let total = 0;
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      total += object.Size ?? 0;
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return total;
}
