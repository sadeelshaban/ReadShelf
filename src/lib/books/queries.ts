import { createClient } from "@/lib/supabase/server";
import { getCoverReadUrl } from "@/lib/storage";
import type { BookWithCounts } from "@/types";

export async function getBooksWithCounts(): Promise<BookWithCounts[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("last_opened_at", { ascending: false, nullsFirst: false });

  if (error || !books) return [];

  const bookIds = books.map((b) => b.id);
  if (bookIds.length === 0) return [];

  const [{ data: highlights }, { data: notes }] = await Promise.all([
    supabase.from("highlights").select("book_id").in("book_id", bookIds),
    supabase.from("notes").select("book_id").in("book_id", bookIds),
  ]);

  const highlightCounts = new Map<string, number>();
  const noteCounts = new Map<string, number>();

  highlights?.forEach((h) => {
    highlightCounts.set(h.book_id, (highlightCounts.get(h.book_id) ?? 0) + 1);
  });

  notes?.forEach((n) => {
    noteCounts.set(n.book_id, (noteCounts.get(n.book_id) ?? 0) + 1);
  });

  return books.map((book) => ({
    ...book,
    highlight_count: highlightCounts.get(book.id) ?? 0,
    note_count: noteCounts.get(book.id) ?? 0,
  }));
}

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
