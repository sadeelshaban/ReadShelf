import { createClient } from "@/lib/supabase/server";
import { getCoverReadUrl } from "@/lib/storage";

export async function getSignedCoverUrl(coverPath: string | null) {
  return getCoverReadUrl(coverPath);
}

export async function getBookById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return book;
}
