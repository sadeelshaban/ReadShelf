import {
  createSupabaseCoverReadUrl,
  deleteSupabaseObjects,
  downloadSupabasePdf,
  uploadSupabaseCover,
  uploadSupabasePdf,
} from "@/lib/storage/supabase-storage";

export async function downloadBookPdf(path: string) {
  return downloadSupabasePdf(path);
}

export async function deleteBookFiles(paths: {
  pdfPath: string;
  coverPath?: string | null;
}) {
  return deleteSupabaseObjects(paths);
}

export async function getCoverReadUrl(path: string | null) {
  if (!path) return null;
  return createSupabaseCoverReadUrl(path);
}

export async function createBookUploadUrls(_input: {
  pdfPath: string;
  coverPath: string;
  coverContentType: string;
}) {
  return { storage: "supabase" as const };
}

export async function uploadBookFile(input: {
  path: string;
  kind: "pdf" | "cover";
  contentType: string;
  body: Buffer;
}) {
  if (input.kind === "pdf") {
    await uploadSupabasePdf(input.path, input.body, input.contentType);
    return;
  }
  await uploadSupabaseCover(input.path, input.body, input.contentType);
}
