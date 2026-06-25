import { isFirebaseStorage } from "@/lib/storage/config";
import {
  createFirebaseCoverReadUrl,
  createFirebaseCoverUploadUrl,
  createFirebasePdfUploadUrl,
  deleteFirebaseObjects,
  downloadFirebasePdf,
  uploadFirebaseCover,
  uploadFirebasePdf,
} from "@/lib/storage/firebase";
import {
  createSupabaseCoverReadUrl,
  deleteSupabaseObjects,
  downloadSupabasePdf,
  uploadSupabaseCover,
  uploadSupabasePdf,
} from "@/lib/storage/supabase-storage";

export async function downloadBookPdf(path: string) {
  if (isFirebaseStorage()) return downloadFirebasePdf(path);
  return downloadSupabasePdf(path);
}

export async function deleteBookFiles(paths: {
  pdfPath: string;
  coverPath?: string | null;
}) {
  if (isFirebaseStorage()) return deleteFirebaseObjects(paths);
  return deleteSupabaseObjects(paths);
}

export async function getCoverReadUrl(path: string | null) {
  if (!path) return null;
  if (isFirebaseStorage()) return createFirebaseCoverReadUrl(path);
  return createSupabaseCoverReadUrl(path);
}

export async function createBookUploadUrls(input: {
  pdfPath: string;
  coverPath: string;
  coverContentType: string;
}) {
  if (!isFirebaseStorage()) {
    return { storage: "supabase" as const };
  }

  const [pdfUploadUrl, coverUploadUrl] = await Promise.all([
    createFirebasePdfUploadUrl(input.pdfPath),
    createFirebaseCoverUploadUrl(input.coverPath, input.coverContentType),
  ]);

  return {
    storage: "firebase" as const,
    pdfUploadUrl,
    coverUploadUrl,
  };
}

export async function uploadBookFile(input: {
  path: string;
  kind: "pdf" | "cover";
  contentType: string;
  body: Buffer;
}) {
  if (isFirebaseStorage()) {
    if (input.kind === "pdf") {
      await uploadFirebasePdf(input.path, input.body, input.contentType);
      return;
    }
    await uploadFirebaseCover(input.path, input.body, input.contentType);
    return;
  }

  if (input.kind === "pdf") {
    await uploadSupabasePdf(input.path, input.body, input.contentType);
    return;
  }
  await uploadSupabaseCover(input.path, input.body, input.contentType);
}
