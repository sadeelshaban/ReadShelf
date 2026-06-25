import { createServiceClient } from "@/lib/supabase/service";

export type PlatformStats = {
  users: number;
  books: number;
  notes: number;
  highlights: number;
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
