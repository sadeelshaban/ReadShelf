import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  coverObjectKey,
  getR2Config,
  pdfObjectKey,
} from "@/lib/storage/config";

let client: S3Client | null = null;

function getClient() {
  if (client) return client;
  const { accountId, accessKeyId, secretAccessKey } = getR2Config();
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === "string") return Buffer.from(body);

  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function downloadR2Pdf(path: string) {
  const { bucketName } = getR2Config();
  const response = await getClient().send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: pdfObjectKey(path),
    }),
  );
  return streamToBuffer(response.Body);
}

export async function deleteR2Objects(paths: { pdfPath: string; coverPath?: string | null }) {
  const { bucketName } = getR2Config();
  const keys = [pdfObjectKey(paths.pdfPath)];
  if (paths.coverPath) keys.push(coverObjectKey(paths.coverPath));

  await Promise.all(
    keys.map((Key) =>
      getClient().send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key,
        }),
      ),
    ),
  );
}

export async function createR2UploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
) {
  const { bucketName } = getR2Config();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn });
}

export async function createR2PdfUploadUrl(path: string) {
  return createR2UploadUrl(pdfObjectKey(path), "application/pdf");
}

export async function createR2CoverUploadUrl(path: string, contentType: string) {
  return createR2UploadUrl(coverObjectKey(path), contentType);
}

export async function createR2CoverReadUrl(path: string, expiresIn = 3600) {
  const { bucketName, publicBaseUrl } = getR2Config();
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${coverObjectKey(path)}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: coverObjectKey(path),
  });
  return getSignedUrl(getClient(), command, { expiresIn });
}

export async function uploadR2Pdf(path: string, body: Buffer, contentType = "application/pdf") {
  const { bucketName } = getR2Config();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: pdfObjectKey(path),
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function uploadR2Cover(path: string, body: Buffer, contentType: string) {
  const { bucketName } = getR2Config();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: coverObjectKey(path),
      Body: body,
      ContentType: contentType,
    }),
  );
}
