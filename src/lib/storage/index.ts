import { isR2Storage } from "@/lib/storage/config";
import {
  createR2CoverReadUrl,
  createR2CoverUploadUrl,
  createR2PdfUploadUrl,
  deleteR2Objects,
  downloadR2Pdf,
} from "@/lib/storage/r2";
import {
  createSupabaseCoverReadUrl,
  deleteSupabaseObjects,
  downloadSupabasePdf,
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
