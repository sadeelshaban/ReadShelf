import { redirect } from "next/navigation";
import { AdminOverviewCard } from "@/components/admin/AdminOverviewCard";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getFeedbackCount, getRecentFeedbackCount } from "@/lib/admin/feedback";
import {
  getEngagementStats,
  getPlatformStats,
  getPlatformTrends,
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
  let trends;
  let totalStorageBytes = 0;
  let feedbackCount = 0;
  let recentFeedbackCount = 0;
  let setupError: string | null = null;

  try {
    stats = await getPlatformStats();
    [engagement, trends, totalStorageBytes, feedbackCount, recentFeedbackCount] =
      await Promise.all([
        getEngagementStats(stats),
        getPlatformTrends(),
        getPlatformStorageBytes(),
        getFeedbackCount(),
        getRecentFeedbackCount(),
      ]);
  } catch (err) {
    setupError = err instanceof Error ? err.message : "Unknown admin setup error";
  }

  if (setupError || !stats || !engagement || !trends) {
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
          Platform overview. Open Feedback or Users for full details.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminOverviewCard
          href="/admin/feedback"
          title="Feedback"
          value={feedbackCount}
          description={
            recentFeedbackCount > 0
              ? `${recentFeedbackCount} new submission${recentFeedbackCount === 1 ? "" : "s"} in the last 7 days.`
              : "Private user notes with submitter email for follow-up."
          }
          actionLabel="View feedback"
        />
        <AdminOverviewCard
          href="/admin/users"
          title="Users"
          value={stats.users}
          description={
            trends.newUsers30d > 0
              ? `${trends.newUsers30d} joined this month. Manage storage and account access.`
              : "Manage storage, sign-out, and account access."
          }
          actionLabel="Manage users"
        />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        <AdminStatCard
          value={stats.bookmarks}
          label="Bookmarks"
          hint="Manual page bookmarks"
        />
        <AdminStatCard
          value={engagement.activeReaders30d}
          label="Monthly active readers"
          hint="Opened a book in the last 30 days"
        />
      </div>

      <section id="engagement" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-[2.125rem] font-semibold tracking-tight text-text">
          Reading engagement
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Completion, retention, annotations, and reader tool usage.
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
            value={engagement.booksOpened7d}
            label="Books opened"
            hint="Books opened in the last 7 days"
          />
          <AdminStatCard
            value={engagement.dailyActiveReaders}
            label="Daily active readers"
            hint="Users who opened a book in the last 24 hours"
          />
          <AdminStatCard
            value={engagement.totalReadCompletions}
            label="Read completions"
            hint="Total times books reached 100%"
          />
          <AdminStatCard
            value={engagement.booksReadAgain}
            label="Read again"
            hint="Books finished at least twice"
          />
          <AdminStatCard
            value={engagement.avgAnnotationsPerBook}
            label="Annotations per book"
            hint="Average highlights + notes per uploaded book"
          />
          <AdminStatCard
            value={engagement.avgBookmarksPerBook}
            label="Bookmarks per book"
            hint="Average manual bookmarks per uploaded book"
          />
          <AdminStatCard
            value={engagement.pdfExportsTotal}
            label="PDF exports"
            hint={
              engagement.pdfExports7d > 0
                ? `${engagement.pdfExports7d} annotated exports in the last 7 days`
                : "Annotated PDF downloads tracked from now on"
            }
            trend={formatTrend(engagement.pdfExports7d, "this week")}
          />
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-text-muted">
        Signed in as {user.email}
      </p>
    </div>
  );
}
