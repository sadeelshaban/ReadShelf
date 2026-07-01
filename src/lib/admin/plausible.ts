export type PlausibleTrafficStats = {
  period: string;
  visitors: number;
  pageviews: number;
  visits: number;
  bounceRate: number | null;
  visitDurationSeconds: number | null;
};

function siteId() {
  return (
    process.env.PLAUSIBLE_SITE_ID?.trim() ||
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() ||
    ""
  );
}

function apiKey() {
  return process.env.PLAUSIBLE_API_KEY?.trim() || "";
}

export function isPlausibleConfigured() {
  return Boolean(siteId() && apiKey());
}

export async function getPlausibleTrafficStats(
  period: "7d" | "30d" | "month" = "30d",
): Promise<PlausibleTrafficStats | null> {
  const key = apiKey();
  const site = siteId();
  if (!key || !site) return null;

  const response = await fetch("https://plausible.io/api/v2/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: site,
      metrics: ["visitors", "pageviews", "visits", "bounce_rate", "visit_duration"],
      date_range: period,
    }),
    next: { revalidate: 300 },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    results?: Array<{
      metrics?: Array<number | null>;
    }>;
  };

  const metrics = data.results?.[0]?.metrics;
  if (!metrics || metrics.length < 3) return null;

  return {
    period,
    visitors: Math.round(metrics[0] ?? 0),
    pageviews: Math.round(metrics[1] ?? 0),
    visits: Math.round(metrics[2] ?? 0),
    bounceRate: metrics[3] != null ? Math.round(metrics[3] * 10) / 10 : null,
    visitDurationSeconds:
      metrics[4] != null ? Math.round(metrics[4] as number) : null,
  };
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

export function formatPlausibleHint(stats: PlausibleTrafficStats) {
  const parts = [`Last ${stats.period}`];
  if (stats.bounceRate != null) parts.push(`${stats.bounceRate}% bounce`);
  if (stats.visitDurationSeconds != null) {
    parts.push(`${formatDuration(stats.visitDurationSeconds)} avg visit`);
  }
  return parts.join(" · ");
}
