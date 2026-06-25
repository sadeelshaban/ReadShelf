import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import {
  coverObjectKey,
  getFirebaseConfig,
  pdfObjectKey,
} from "@/lib/storage/config";

const SIGNED_URL_TTL_MS = 60 * 60 * 1000;

function getBucket() {
  const config = getFirebaseConfig();
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
      storageBucket: config.storageBucket,
    });
  }
  return getStorage().bucket(config.storageBucket);
}

async function createSignedUploadUrl(key: string, contentType: string) {
  const file = getBucket().file(key);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + SIGNED_URL_TTL_MS,
    contentType,
  });
  return url;
}

async function createSignedReadUrl(key: string) {
  const file = getBucket().file(key);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + SIGNED_URL_TTL_MS,
  });
  return url;
}

export async function downloadFirebasePdf(path: string) {
  const file = getBucket().file(pdfObjectKey(path));
  const [buffer] = await file.download();
  return Buffer.from(buffer);
}

export async function deleteFirebaseObjects(paths: {
  pdfPath: string;
  coverPath?: string | null;
}) {
  const bucket = getBucket();
  const deletions = [bucket.file(pdfObjectKey(paths.pdfPath)).delete({ ignoreNotFound: true })];
  if (paths.coverPath) {
    deletions.push(
      bucket.file(coverObjectKey(paths.coverPath)).delete({ ignoreNotFound: true }),
    );
  }
  await Promise.all(deletions);
}

export async function createFirebasePdfUploadUrl(path: string) {
  return createSignedUploadUrl(pdfObjectKey(path), "application/pdf");
}

export async function createFirebaseCoverUploadUrl(path: string, contentType: string) {
  return createSignedUploadUrl(coverObjectKey(path), contentType);
}

export async function createFirebaseCoverReadUrl(path: string) {
  const { publicBaseUrl } = getFirebaseConfig();
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${coverObjectKey(path)}`;
  }
  return createSignedReadUrl(coverObjectKey(path));
}

export async function uploadFirebasePdf(
  path: string,
  body: Buffer,
  contentType = "application/pdf",
) {
  const file = getBucket().file(pdfObjectKey(path));
  await file.save(body, {
    contentType,
    resumable: false,
  });
}

export async function uploadFirebaseCover(path: string, body: Buffer, contentType: string) {
  const file = getBucket().file(coverObjectKey(path));
  await file.save(body, {
    contentType,
    resumable: false,
  });
}
