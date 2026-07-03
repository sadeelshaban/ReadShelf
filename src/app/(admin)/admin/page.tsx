import { redirect } from "next/navigation";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminFeedbackPanel } from "@/components/admin/AdminFeedbackPanel";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import {
  getEngagementStats,
  getPlatformStats,
  getPlatformTrends,
  getReaderPreferenceStats,
} from "@/lib/admin/stats";
import { formatStorageBytes, getPlatformStorageBytes } from "@/lib/admin/storage-usage";
import { isAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

function formatTrend(count: number, period: string) {
  if (count <= 0) return undefined;
  return `↑ +${count.toLocaleString()} ${period}`;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (!isAdminUser(user)) {
    redirect("/shelf");
  }

  let stats;
  let engagement;
  let readerPreferences;
  let trends;
  let totalStorageBytes = 0;
  let setupError: string | null = null;
  try {
    stats = await getPlatformStats();
    [engagement, readerPreferences, trends, totalStorageBytes] = await Promise.all([
      getEngagementStats(stats),
      getReaderPreferenceStats(stats.users),
      getPlatformTrends(),
      getPlatformStorageBytes(),
    ]);
  } catch (err) {
    setupError = err instanceof Error ? err.message : "Unknown admin setup error";
  }

  if (setupError || !stats || !engagement || !readerPreferences || !trends) {
    const message = setupError ?? "Admin dashboard data could not be loaded.";
    const missingServiceKey = message.includes("SUPABASE_SERVICE_ROLE_KEY");
    return (
      <div className="rounded-2xl border border-accent/40 bg-card p-8 text-center">
        <h1 className="font-serif text-2xl font-semibold text-primary">
          Admin setup incomplete
        </h1>
        {missingServiceKey ? (
          <p className="mt-3 text-text-muted">
            Add <code className="rounded bg-background px-1">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
            <code className="rounded bg-background px-1">.env.local</code> and restart the dev
            server.
          </p>
        ) : (
          <p className="mt-3 text-text-muted">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-text sm:text-5xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Platform overview and user management.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <AdminStatCard
          value={stats.users}
          label="Users"
          hint="Total accounts"
          trend={formatTrend(trends.newUsers30d, "this month")}
        />
        <AdminStatCard
          value={stats.books}
          label="Books uploaded"
          hint="PDFs on shelves"
          trend={formatTrend(trends.newBooks7d, "this week")}
        />
        <AdminStatCard
          value={formatStorageBytes(totalStorageBytes)}
          label="Storage used"
          hint="PDFs and covers"
        />
        <AdminStatCard
          value={stats.notes}
          label="Notes"
          hint="All notes"
        />
        <AdminStatCard
          value={stats.highlights}
          label="Highlights"
          hint="All highlights"
        />
      </div>

      <section id="engagement" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-[2.125rem] font-semibold tracking-tight text-text">
          Reading engagement
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Platform-wide metrics for completion and activity.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AdminStatCard
            value={`${engagement.avgProgressPercent}%`}
            label="Avg. progress"
            hint="Average progress across all books"
            percent={engagement.avgProgressPercent}
          />
          <AdminStatCard
            value={`${engagement.completionRate}%`}
            label="Completion rate"
            hint={`${engagement.completedBooks} books at 90%+ progress`}
            percent={engagement.completionRate}
          />
          <AdminStatCard
            value={engagement.activeReaders30d}
            label="Active readers"
            hint="Users who opened a book in the last 30 days"
          />
          <AdminStatCard
            value={engagement.booksOpened7d}
            label="Books opened"
            hint="Books opened in the last 7 days"
          />
          <AdminStatCard
            value={engagement.avgAnnotationsPerBook}
            label="Annotations per book"
            hint="Average highlights + notes per uploaded book"
          />
        </div>
      </section>

      <section id="reader-experience" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-[2.125rem] font-semibold tracking-tight text-text">
          Reader experience
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Dark mode adoption syncs when users open the reader or toggle the theme.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AdminStatCard
            value={readerPreferences.darkModeUsers}
            label="Dark mode users"
            hint="Accounts with reader dark mode currently enabled"
          />
          <AdminStatCard
            value={`${readerPreferences.darkModeAdoptionPercent}%`}
            label="Dark mode adoption"
            hint={`${readerPreferences.darkModeUsers} of ${stats.users} total users`}
            percent={readerPreferences.darkModeAdoptionPercent}
          />
          <AdminStatCard
            value={`${readerPreferences.darkModeAmongTrackedPercent}%`}
            label="Dark mode (tracked readers)"
            hint={`Among ${readerPreferences.trackedReaders} users who opened the reader since tracking`}
            percent={readerPreferences.darkModeAmongTrackedPercent}
          />
        </div>
      </section>

      <AdminFeedbackPanel />

      <AdminUsersPanel />

      <p className="mt-8 text-center text-xs text-text-muted">
        Signed in as {user.email}
      </p>
    </div>
  );
}
