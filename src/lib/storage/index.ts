import { isR2Storage } from "@/lib/storage/config";
import {
  createR2CoverReadUrl,
  createR2CoverUploadUrl,
  createR2PdfUploadUrl,
  deleteR2Objects,
  downloadR2Pdf,
  uploadR2Cover,
  uploadR2Pdf,
} from "@/lib/storage/r2";
import {
  createSupabaseCoverReadUrl,
  deleteSupabaseObjects,
  downloadSupabasePdf,
  uploadSupabaseCover,
  uploadSupabasePdf,
} from "@/lib/storage/supabase-storage";

export async function downloadBookPdf(path: string) {
  if (isR2Storage()) return downloadR2Pdf(path);
  return downloadSupabasePdf(path);
}

export async function deleteBookFiles(paths: {
  pdfPath: string;
  coverPath?: string | null;
}) {
  if (isR2Storage()) return deleteR2Objects(paths);
  return deleteSupabaseObjects(paths);
}

export async function getCoverReadUrl(path: string | null) {
  if (!path) return null;
  if (isR2Storage()) return createR2CoverReadUrl(path);
  return createSupabaseCoverReadUrl(path);
}

export async function createBookUploadUrls(input: {
  pdfPath: string;
  coverPath: string;
  coverContentType: string;
}) {
  if (!isR2Storage()) {
    return { storage: "supabase" as const };
  }

  const [pdfUploadUrl, coverUploadUrl] = await Promise.all([
    createR2PdfUploadUrl(input.pdfPath),
    createR2CoverUploadUrl(input.coverPath, input.coverContentType),
  ]);

  return {
    storage: "r2" as const,
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
  if (isR2Storage()) {
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
