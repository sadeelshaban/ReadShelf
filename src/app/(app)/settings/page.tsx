import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/SettingsClient";

function getInitialUsername(
  email: string | undefined,
  metadata: Record<string, unknown>,
) {
  const fromMeta =
    (metadata.username as string | undefined) ||
    (metadata.display_name as string | undefined);
  if (fromMeta?.trim()) return fromMeta.trim();
  if (email) return email.split("@")[0];
  return "";
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [booksRes, highlightsRes, notesRes] = await Promise.all([
    supabase.from("books").select("progress_percent").eq("user_id", user.id),
    supabase.from("highlights").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const books = booksRes.data ?? [];
  const bookCount = books.length;
  const avgProgress =
    bookCount > 0
      ? Math.round(books.reduce((sum, b) => sum + (b.progress_percent ?? 0), 0) / bookCount)
      : 0;

  return (
    <SettingsClient
      email={user.email ?? ""}
      initialUsername={getInitialUsername(user.email, user.user_metadata ?? {})}
      readingStats={{
        books: bookCount,
        highlights: highlightsRes.count ?? 0,
        notes: notesRes.count ?? 0,
        avgProgress,
      }}
    />
  );
}
