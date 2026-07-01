import { createClient } from "@/lib/supabase/client";
import {
  buildCoverUrlMap,
  rememberCoverUrl,
} from "@/lib/books/cover-url-cache";
import { getClientCoverReadUrl } from "@/lib/storage/client-covers";
import type { BookWithCounts } from "@/types";

export async function fetchBooksWithCountsClient(): Promise<BookWithCounts[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", session.user.id)
    .order("last_opened_at", { ascending: false, nullsFirst: false });

  if (error || !books) return [];

  const bookIds = books.map((b) => b.id);
  if (bookIds.length === 0) return [];

  const [{ data: highlights }, { data: notes }] = await Promise.all([
    supabase
      .from("highlights")
      .select("book_id, highlight_type")
      .in("book_id", bookIds),
    supabase.from("notes").select("book_id").in("book_id", bookIds),
  ]);

  const highlightCounts = new Map<string, number>();
  const noteCounts = new Map<string, number>();

  highlights?.forEach((h) => {
    if (h.highlight_type === "pen") return;
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

export async function fetchCoverUrlsClient(
  books: BookWithCounts[],
): Promise<Record<string, string | null>> {
  const coverUrls = buildCoverUrlMap(books);
  const missing = books.filter((book) => !coverUrls[book.id] && book.cover_path);

  await Promise.all(
    missing.map(async (book) => {
      const url = await getClientCoverReadUrl(book.cover_path);
      coverUrls[book.id] = url;
      rememberCoverUrl(book.cover_path, url);
    }),
  );

  return coverUrls;
}

export async function fetchBookByIdClient(id: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  return book;
}

export async function fetchBookAnnotationsClient(bookId: string) {
  const supabase = createClient();
  const [{ data: highlights }, { data: notes }] = await Promise.all([
    supabase
      .from("highlights")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: true }),
    supabase
      .from("notes")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    highlights: highlights ?? [],
    notes: notes ?? [],
  };
}

export async function fetchBookBookmarksClient(bookId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });

  return data ?? [];
}
