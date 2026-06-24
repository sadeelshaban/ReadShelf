import { createClient } from "@/lib/supabase/server";

function normalizeStorageErrorMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("bucket not found")) {
    return "Storage is not fully set up yet. Create the Supabase storage buckets `book-pdfs` and `book-covers`, or rerun the SQL setup.";
  }

  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Storage permissions are not ready yet. Recheck the Supabase storage policies from the setup SQL.";
  }

  return message;
}

export async function downloadSupabasePdf(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("book-pdfs").download(path);
  if (error || !data) {
    throw new Error(
      normalizeStorageErrorMessage(error?.message ?? "Could not load PDF."),
    );
  }
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteSupabaseObjects(paths: {
  pdfPath: string;
  coverPath?: string | null;
}) {
  const supabase = await createClient();
  await supabase.storage.from("book-pdfs").remove([paths.pdfPath]);
  if (paths.coverPath) {
    await supabase.storage.from("book-covers").remove([paths.coverPath]);
  }
}

export async function createSupabaseCoverReadUrl(path: string, expiresIn = 3600) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("book-covers")
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function uploadSupabasePdf(path: string, body: Buffer, contentType: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from("book-pdfs").upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(normalizeStorageErrorMessage(error.message));
}

export async function uploadSupabaseCover(path: string, body: Buffer, contentType: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from("book-covers").upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(normalizeStorageErrorMessage(error.message));
}
