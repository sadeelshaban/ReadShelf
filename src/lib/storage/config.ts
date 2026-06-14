export type StorageKind = "r2" | "supabase";

export function getStorageKind(): StorageKind {
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  ) {
    return "r2";
  }
  return "supabase";
}

export function isR2Storage() {
  return getStorageKind() === "r2";
}

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("R2 storage is not fully configured.");
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicBaseUrl };
}

export function pdfObjectKey(path: string) {
  return `pdfs/${path}`;
}

export function coverObjectKey(path: string) {
  return `covers/${path}`;
}
