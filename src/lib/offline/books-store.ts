import {
  idbDelete,
  idbGet,
  idbGetAll,
  idbPut,
} from "@/lib/offline/db";
import type { Book, BookWithCounts } from "@/types";

type CachedBook = BookWithCounts & {
  cachedAt: string;
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
    books.map((book) =>
      idbPut<CachedBook>("books", {
        ...book,
        cachedAt,
      }),
    ),
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

export async function getCachedBook(bookId: string) {
  return idbGet<CachedBook>("books", bookId);
}

export async function updateCachedBookProgress(
  bookId: string,
  patch: Pick<Book, "last_page" | "progress_percent" | "last_opened_at">,
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
