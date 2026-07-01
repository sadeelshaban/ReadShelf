import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AdminStatCardProps = {
  value: string | number;
  label: string;
  hint: string;
  icon?: ReactNode;
  trend?: string;
  percent?: number;
  featured?: boolean;
};

export function AdminStatCard({
  value,
  label,
  hint,
  icon,
  trend,
  percent,
  featured,
}: AdminStatCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <article
      className={cn(
        "glass-panel flex min-h-[168px] flex-col rounded-2xl p-6 transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(31,22,16,0.12)]",
        featured && "sm:min-h-[184px] xl:col-span-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-h-[3.5rem]">
          <p className="font-serif text-[2.75rem] font-semibold leading-none tracking-tight text-primary sm:text-[3.5rem]">
            {displayValue}
          </p>
        </div>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff8f1] text-lg ring-1 ring-[#eadbc8]/80">
            {icon}
          </span>
        )}
      </div>

      <p className="mt-3 text-lg font-semibold text-text">{label}</p>
      <p className="mt-1 min-h-[2.5rem] text-sm leading-relaxed text-text-muted">{hint}</p>

      {trend && (
        <p className="mt-auto pt-3 text-xs font-medium text-emerald-700">{trend}</p>
      )}

      {percent !== undefined && (
        <div className="mt-auto space-y-2 pt-3">
          <div className="h-2 overflow-hidden rounded-full bg-[#f3ece2]">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
        </div>
      )}
    </article>
  );
}
