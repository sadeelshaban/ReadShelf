import Link from "next/link";
import { COPYRIGHT_NOTICE, legalLinks } from "@/lib/legal/constants";
import { cn } from "@/lib/utils";

type SiteFooterProps = {
  variant?: "dark" | "light";
  className?: string;
};

export function SiteFooter({ variant = "light", className }: SiteFooterProps) {
  const isDark = variant === "dark";

  return (
    <footer className={cn("text-sm", className)}>
      <div
        className={cn(
          "flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between",
          isDark ? "border-white/15 text-white/65" : "border-[#eadbc8]/70 text-text-muted",
        )}
      >
        <p className={cn(isDark ? "text-white/75" : "text-text-muted")}>{COPYRIGHT_NOTICE}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-medium transition hover:underline",
                isDark ? "text-white/85 hover:text-white" : "text-text hover:text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/platform"
            className={cn(
              "font-medium transition hover:underline",
              isDark ? "text-white/85 hover:text-white" : "text-text hover:text-primary",
            )}
          >
            Platform
          </Link>
        </nav>
      </div>
    </footer>
  );
}
