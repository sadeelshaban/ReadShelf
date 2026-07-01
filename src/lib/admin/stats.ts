import { createServiceClient } from "@/lib/supabase/service";

export type PlatformStats = {
  users: number;
  books: number;
  notes: number;
  highlights: number;
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
};

type BookRow = {
  progress_percent: number;
  last_opened_at: string | null;
  user_id: string;
};

async function countTable(table: "profiles" | "books" | "notes" | "highlights") {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Could not count ${table}: ${error.message}`);
  }

  return count ?? 0;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [users, books, notes, highlights] = await Promise.all([
    countTable("profiles"),
    countTable("books"),
    countTable("notes"),
    countTable("highlights"),
  ]);

  return { users, books, notes, highlights };
}

async function countSince(
  table: "profiles" | "books",
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

export async function getPlatformTrends(): Promise<PlatformTrends> {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [newUsers30d, newBooks7d] = await Promise.all([
    countSince("profiles", thirtyDaysAgo),
    countSince("books", sevenDaysAgo),
  ]);

  return { newUsers30d, newBooks7d };
}

export async function getEngagementStats(
  totals: Pick<PlatformStats, "books" | "notes" | "highlights">,
): Promise<EngagementStats> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("books")
    .select("progress_percent, last_opened_at, user_id");

  if (error) {
    throw new Error(`Could not load engagement stats: ${error.message}`);
  }

  const books = (data ?? []) as BookRow[];
  const totalBooks = books.length;
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

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

  const booksOpened7d = books.filter((book) => {
    if (!book.last_opened_at) return false;
    return now - new Date(book.last_opened_at).getTime() <= sevenDaysMs;
  }).length;

  const annotationTotal = totals.notes + totals.highlights;
  const avgAnnotationsPerBook =
    totals.books > 0
      ? Math.round((annotationTotal / totals.books) * 10) / 10
      : 0;

  return {
    avgProgressPercent,
    completionRate,
    completedBooks,
    activeReaders30d,
    booksOpened7d,
    avgAnnotationsPerBook,
  };
}
