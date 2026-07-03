import { createServiceClient } from "@/lib/supabase/service";

export type PlatformStats = {
  users: number;
  books: number;
  notes: number;
  highlights: number;
  bookmarks: number;
};

export type PlatformTrends = {
  newUsers30d: number;
  newBooks7d: number;
};

export type EngagementStats = {
  avgProgressPercent: number;
  completionRate: number;
  completedBooks: number;
  activeReaders30d: number;
  booksOpened7d: number;
  avgAnnotationsPerBook: number;
  totalReadCompletions: number;
  booksReadAgain: number;
  dailyActiveReaders: number;
  avgBookmarksPerBook: number;
  pdfExportsTotal: number;
  pdfExports7d: number;
};

type BookRow = {
  progress_percent: number;
  last_opened_at: string | null;
  user_id: string;
  read_count: number;
};

async function countTable(
  table: "profiles" | "books" | "notes" | "highlights" | "bookmarks" | "pdf_exports",
) {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Could not count ${table}: ${error.message}`);
  }

  return count ?? 0;
}

async function countSinceDate(
  table: "profiles" | "books" | "pdf_exports",
  since: Date,
): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte("created_at", since.toISOString());

  if (error) {
    throw new Error(`Could not count recent ${table}: ${error.message}`);
  }

  return count ?? 0;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [users, books, notes, highlights, bookmarks] = await Promise.all([
    countTable("profiles"),
    countTable("books"),
    countTable("notes"),
    countTable("highlights"),
    countTable("bookmarks"),
  ]);

  return { users, books, notes, highlights, bookmarks };
}

export async function getPlatformTrends(): Promise<PlatformTrends> {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [newUsers30d, newBooks7d] = await Promise.all([
    countSinceDate("profiles", thirtyDaysAgo),
    countSinceDate("books", sevenDaysAgo),
  ]);

  return { newUsers30d, newBooks7d };
}

export async function getEngagementStats(
  totals: Pick<PlatformStats, "books" | "notes" | "highlights" | "bookmarks">,
): Promise<EngagementStats> {
  const supabase = createServiceClient();
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now - sevenDaysMs);

  const [{ data, error }, pdfExportsTotal, pdfExports7d] = await Promise.all([
    supabase.from("books").select("progress_percent, last_opened_at, user_id, read_count"),
    countTable("pdf_exports"),
    countSinceDate("pdf_exports", sevenDaysAgo),
  ]);

  if (error) {
    throw new Error(`Could not load engagement stats: ${error.message}`);
  }

  const books = (data ?? []) as BookRow[];
  const totalBooks = books.length;

  const avgProgressPercent =
    totalBooks > 0
      ? Math.round(
          books.reduce((sum, book) => sum + book.progress_percent, 0) / totalBooks,
        )
      : 0;

  const completedBooks = books.filter((book) => book.progress_percent >= 90).length;
  const completionRate =
    totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0;

  const activeReaders30d = new Set(
    books
      .filter((book) => {
        if (!book.last_opened_at) return false;
        return now - new Date(book.last_opened_at).getTime() <= thirtyDaysMs;
      })
      .map((book) => book.user_id),
  ).size;

  const dailyActiveReaders = new Set(
    books
      .filter((book) => {
        if (!book.last_opened_at) return false;
        return now - new Date(book.last_opened_at).getTime() <= oneDayMs;
      })
      .map((book) => book.user_id),
  ).size;

  const booksOpened7d = books.filter((book) => {
    if (!book.last_opened_at) return false;
    return now - new Date(book.last_opened_at).getTime() <= sevenDaysMs;
  }).length;

  const annotationTotal = totals.notes + totals.highlights;
  const avgAnnotationsPerBook =
    totals.books > 0
      ? Math.round((annotationTotal / totals.books) * 10) / 10
      : 0;

  const totalReadCompletions = books.reduce((sum, book) => sum + book.read_count, 0);
  const booksReadAgain = books.filter((book) => book.read_count >= 2).length;
  const avgBookmarksPerBook =
    totals.books > 0
      ? Math.round((totals.bookmarks / totals.books) * 10) / 10
      : 0;

  return {
    avgProgressPercent,
    completionRate,
    completedBooks,
    activeReaders30d,
    booksOpened7d,
    avgAnnotationsPerBook,
    totalReadCompletions,
    booksReadAgain,
    dailyActiveReaders,
    avgBookmarksPerBook,
    pdfExportsTotal,
    pdfExports7d,
  };
}

export async function logPdfExport(userId: string, bookId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pdf_exports").insert({
    user_id: userId,
    book_id: bookId,
  });

  if (error) {
    console.error("Could not log PDF export:", error.message);
  }
}
