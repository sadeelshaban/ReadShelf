import Link from "next/link";

type AdminOverviewCardProps = {
  href: string;
  title: string;
  value: string | number;
  description: string;
  actionLabel?: string;
};

export function AdminOverviewCard({
  href,
  title,
  value,
  description,
  actionLabel = "Open",
}: AdminOverviewCardProps) {
  return (
    <Link
      href={href}
      className="glass-panel group block rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-text">{title}</h2>
          <p className="mt-3 font-serif text-4xl font-semibold tracking-tight text-primary">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-primary transition group-hover:translate-x-0.5">
          {actionLabel} →
        </span>
      </div>
    </Link>
  );
}
