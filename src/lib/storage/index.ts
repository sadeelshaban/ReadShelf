import { isR2StorageEnabled } from "@/lib/storage/config";
import {
  createR2CoverReadUrl,
  createR2UploadUrls,
  deleteR2Objects,
  downloadR2Pdf,
  uploadR2Cover,
  uploadR2Pdf,
} from "@/lib/storage/r2-storage";
import {
  createSupabaseCoverReadUrl,
  deleteSupabaseObjects,
  downloadSupabasePdf,
  uploadSupabaseCover,
  uploadSupabasePdf,
} from "@/lib/storage/supabase-storage";

export type BookUploadPlan =
  | { storage: "supabase" }
  | {
      storage: "r2";
      pdfUploadUrl: string;
      coverUploadUrl: string;
    };

export async function downloadBookPdf(path: string) {
  if (isR2StorageEnabled()) {
    return downloadR2Pdf(path);
  }
  return downloadSupabasePdf(path);
}

export async function deleteBookFiles(paths: {
  pdfPath: string;
  coverPath?: string | null;
}) {
  if (isR2StorageEnabled()) {
    return deleteR2Objects(paths);
  }
  return deleteSupabaseObjects(paths);
}

export async function getCoverReadUrl(path: string | null) {
  if (!path) return null;
  if (isR2StorageEnabled()) {
    return createR2CoverReadUrl(path);
  }
  return createSupabaseCoverReadUrl(path);
}

export async function createBookUploadUrls(input: {
  pdfPath: string;
  coverPath: string;
  coverContentType: string;
}): Promise<BookUploadPlan> {
  if (isR2StorageEnabled()) {
    return createR2UploadUrls(input);
  }
  return { storage: "supabase" };
}

export async function uploadBookFile(input: {
  path: string;
  kind: "pdf" | "cover";
  contentType: string;
  body: Buffer;
}) {
  if (isR2StorageEnabled()) {
    if (input.kind === "pdf") {
      await uploadR2Pdf(input.path, input.body, input.contentType);
      return;
    }
    await uploadR2Cover(input.path, input.body, input.contentType);
    return;
  }

  if (input.kind === "pdf") {
    await uploadSupabasePdf(input.path, input.body, input.contentType);
    return;
  }
  await uploadSupabaseCover(input.path, input.body, input.contentType);
}
