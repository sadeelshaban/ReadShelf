import {
  formatPlausibleHint,
  getPlausibleTrafficStats,
  isPlausibleConfigured,
  type PlausibleTrafficStats,
} from "@/lib/admin/plausible";

function TrafficStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <article className="glass-panel rounded-2xl p-6">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p className="mt-2 font-serif text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="mt-3 text-sm text-text-muted">{hint}</p>
    </article>
  );
}

function TrafficGrid({ stats }: { stats: PlausibleTrafficStats }) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <TrafficStatCard
        label="Unique visitors"
        value={stats.visitors}
        hint={formatPlausibleHint(stats)}
      />
      <TrafficStatCard
        label="Pageviews"
        value={stats.pageviews}
        hint="Total pages viewed on the site"
      />
      <TrafficStatCard
        label="Visits"
        value={stats.visits}
        hint="Sessions in the selected period"
      />
      <TrafficStatCard
        label="Bounce rate"
        value={stats.bounceRate != null ? `${stats.bounceRate}%` : "—"}
        hint={
          stats.visitDurationSeconds != null
            ? `Avg visit ${Math.floor(stats.visitDurationSeconds / 60)}m ${stats.visitDurationSeconds % 60}s`
            : "Single-page sessions"
        }
      />
    </div>
  );
}

export async function AdminTrafficPanel() {
  const configured = isPlausibleConfigured();
  const stats = configured ? await getPlausibleTrafficStats("30d") : null;

  if (!configured) {
    return (
      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold text-text">Site traffic</h2>
        <p className="mt-1 text-sm text-text-muted">
          Plausible Analytics — visitor and pageview metrics for due diligence.
        </p>
        <div className="mt-5 rounded-2xl border border-dashed border-accent/50 bg-card/50 p-6 text-sm text-text-muted">
          <p className="font-medium text-text">Plausible not configured yet</p>
          <p className="mt-2 leading-6">
            Add{" "}
            <code className="rounded bg-background px-1">NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code> and{" "}
            <code className="rounded bg-background px-1">PLAUSIBLE_API_KEY</code> to your
            environment. See <code className="rounded bg-background px-1">docs/analytics.md</code>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-semibold text-text">Site traffic</h2>
      <p className="mt-1 text-sm text-text-muted">
        Plausible Analytics — last 30 days (visitors, pageviews, sessions).
      </p>

      {stats ? (
        <TrafficGrid stats={stats} />
      ) : (
        <p className="mt-5 text-sm text-text-muted">
          Could not load Plausible stats. Check your API key and site ID.
        </p>
      )}
    </section>
  );
}
