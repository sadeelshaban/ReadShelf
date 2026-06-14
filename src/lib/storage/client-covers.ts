import { createClient } from "@/lib/supabase/client";

export async function getClientCoverReadUrl(path: string | null) {
  if (!path) return null;

  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");
  if (publicBase) {
    return `${publicBase}/covers/${path}`;
  }

  const supabase = createClient();
  const { data } = await supabase.storage
    .from("book-covers")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
