export type StorageKind = "firebase" | "supabase";

export function getStorageKind(): StorageKind {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_STORAGE_BUCKET
  ) {
    return "firebase";
  }
  return "supabase";
}

export function isFirebaseStorage() {
  return getStorageKind() === "firebase";
}

export function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const publicBaseUrl = process.env.FIREBASE_STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, "");

  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    throw new Error("Firebase Storage is not fully configured.");
  }

  return { projectId, clientEmail, privateKey, storageBucket, publicBaseUrl };
}

export function pdfObjectKey(path: string) {
  return `pdfs/${path}`;
}

export function coverObjectKey(path: string) {
  return `covers/${path}`;
}
