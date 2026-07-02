import { createClient } from "@/lib/supabase/server";

export async function downloadSupabasePdf(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("book-pdfs").download(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not load PDF.");
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
  const slash = path.lastIndexOf("/");
  const folder = slash >= 0 ? path.slice(0, slash) : "";
  const filename = slash >= 0 ? path.slice(slash + 1) : path;

  const { data: files, error: listError } = await supabase.storage
    .from("book-covers")
    .list(folder, { search: filename, limit: 1 });

  if (listError || !files?.some((file) => file.name === filename)) {
    return null;
  }

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
  if (error) throw new Error(error.message);
}

export async function uploadSupabaseCover(path: string, body: Buffer, contentType: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from("book-covers").upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
}
