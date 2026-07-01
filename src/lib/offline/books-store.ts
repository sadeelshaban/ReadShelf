import {
  idbDelete,
  idbGet,
  idbGetAll,
  idbPut,
} from "@/lib/offline/db";
import type { Book, BookWithCounts } from "@/types";

type CachedBook = BookWithCounts & {
  cachedAt: string;
  cover_read_url?: string | null;
  cover_read_url_expires_at?: number;
};

export async function cacheBooks(books: BookWithCounts[]) {
  const cachedAt = new Date().toISOString();
  const incomingIds = new Set(books.map((book) => book.id));
  const existing = await idbGetAll<CachedBook>("books");

  await Promise.all(
    existing
      .filter((book) => !incomingIds.has(book.id))
      .map((book) => idbDelete("books", book.id)),
  );

  await Promise.all(
    books.map(async (book) => {
      const existing = await idbGet<CachedBook>("books", book.id);
      await idbPut<CachedBook>("books", {
        ...book,
        cover_read_url: existing?.cover_read_url ?? null,
        cover_read_url_expires_at: existing?.cover_read_url_expires_at,
        cachedAt,
      });
    }),
  );
}

export async function cacheBook(book: Book) {
  const existing = await idbGet<CachedBook>("books", book.id);
  await idbPut<CachedBook>("books", {
    ...(existing ?? {
      highlight_count: 0,
      note_count: 0,
    }),
    ...book,
    highlight_count: existing?.highlight_count ?? 0,
    note_count: existing?.note_count ?? 0,
    cover_read_url: existing?.cover_read_url ?? null,
    cover_read_url_expires_at: existing?.cover_read_url_expires_at,
    cachedAt: new Date().toISOString(),
  });
}

export async function removeCachedBook(bookId: string) {
  await idbDelete("books", bookId);
}

export async function getCachedBooks(): Promise<BookWithCounts[]> {
  const rows = await idbGetAll<CachedBook>("books");
  return rows.sort((a, b) => {
    const aTime = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
    const bTime = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
    return bTime - aTime;
  });
}

export async function getCachedCoverUrlMap(
  books: BookWithCounts[],
): Promise<Record<string, string | null>> {
  const { buildCoverUrlMap, rememberCoverUrl } = await import("@/lib/books/cover-url-cache");
  const map = buildCoverUrlMap(books);
  const now = Date.now();

  await Promise.all(
    books.map(async (book) => {
      if (map[book.id]) return;

      const cached = await idbGet<CachedBook>("books", book.id);
      const url = cached?.cover_read_url;
      const expiresAt = cached?.cover_read_url_expires_at ?? 0;
      if (!url || expiresAt <= now) return;

      map[book.id] = url;
      rememberCoverUrl(book.cover_path, url);
    }),
  );

  return map;
}

export async function persistCachedCoverUrls(
  books: BookWithCounts[],
  urls: Record<string, string | null>,
) {
  const { rememberCoverUrl } = await import("@/lib/books/cover-url-cache");
  const expiresAt = Date.now() + 55 * 60 * 1000;

  await Promise.all(
    books.map(async (book) => {
      const url = urls[book.id] ?? null;
      rememberCoverUrl(book.cover_path, url);

      const existing = await idbGet<CachedBook>("books", book.id);
      if (!existing) return;

      await idbPut<CachedBook>("books", {
        ...existing,
        cover_read_url: url,
        cover_read_url_expires_at: url ? expiresAt : undefined,
      });
    }),
  );
}

export async function getCachedBook(bookId: string) {
  return idbGet<CachedBook>("books", bookId);
}

export async function updateCachedBookProgress(
  bookId: string,
  patch: Pick<
    Book,
    | "last_page"
    | "progress_percent"
    | "last_opened_at"
    | "read_count"
    | "reading_scroll_y"
    | "reading_zoom"
  >,
) {
  const existing = await getCachedBook(bookId);
  if (!existing) return;
  await idbPut<CachedBook>("books", {
    ...existing,
    ...patch,
    cachedAt: new Date().toISOString(),
  });
}

export async function listCachedPdfBookIds(): Promise<string[]> {
  const rows = await idbGetAll<{ bookId: string }>("pdfs");
  return rows.map((row) => row.bookId);
}
