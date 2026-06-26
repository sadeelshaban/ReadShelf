import { redirect } from "next/navigation";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { getPlatformStats } from "@/lib/admin/stats";
import { isAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <article className="glass-panel rounded-2xl p-6">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p className="mt-2 font-serif text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
        {value.toLocaleString()}
      </p>
      <p className="mt-3 text-sm text-text-muted">{hint}</p>
    </article>
  );
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
  try {
    stats = await getPlatformStats();
  } catch {
    return (
      <div className="rounded-2xl border border-accent/40 bg-card p-8 text-center">
        <h1 className="font-serif text-2xl font-semibold text-primary">
          Admin setup incomplete
        </h1>
        <p className="mt-3 text-text-muted">
          Add <code className="rounded bg-background px-1">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
          <code className="rounded bg-background px-1">.env.local</code> and restart the dev
          server.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-text sm:text-4xl">
          Dashboard
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={stats.users} hint="Total accounts" />
        <StatCard label="Books uploaded" value={stats.books} hint="PDFs on shelves" />
        <StatCard label="Notes" value={stats.notes} hint="All notes" />
        <StatCard label="Highlights" value={stats.highlights} hint="All highlights" />
      </div>

      <AdminUsersPanel />

      <p className="mt-8 text-center text-xs text-text-muted">
        Signed in as {user.email}
      </p>
    </div>
  );
}
