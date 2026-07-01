import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  value: string | number;
  label: string;
  hint: string;
  trend?: string;
  percent?: number;
};

export function AdminStatCard({
  value,
  label,
  hint,
  trend,
  percent,
}: AdminStatCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <article className="glass-panel flex h-full min-h-[152px] flex-col rounded-2xl p-5 transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(31,22,16,0.12)] sm:p-6">
      <p className="font-serif text-4xl font-semibold tabular-nums leading-none tracking-tight text-primary">
        {displayValue}
      </p>

      <p className="mt-3 text-base font-semibold text-text">{label}</p>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-text-muted">
        {hint}
      </p>

      <div className="mt-auto pt-3">
        {percent !== undefined ? (
          <div className="h-2 overflow-hidden rounded-full bg-[#f3ece2]">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
        ) : (
          <p
            className={cn(
              "min-h-[1rem] text-xs font-medium",
              trend ? "text-emerald-700" : "text-transparent",
            )}
          >
            {trend ?? "·"}
          </p>
        )}
      </div>
    </article>
  );
}
