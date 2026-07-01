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
    <footer className={cn("text-center text-sm", className)}>
      <div
        className={cn(
          "flex flex-col items-center gap-3 border-t pt-6",
          isDark ? "border-white/15" : "border-[#eadbc8]/70",
        )}
      >
        <p
          className={cn(
            isDark ? "text-white/55" : "text-text-muted/75",
          )}
        >
          {COPYRIGHT_NOTICE}
        </p>
        <nav
          className={cn(
            "flex flex-wrap items-center justify-center gap-x-4 gap-y-2",
            isDark ? "text-white/50" : "text-text-muted/70",
          )}
        >
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition hover:underline",
                isDark ? "hover:text-white/70" : "hover:text-text-muted",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/platform"
            className={cn(
              "transition hover:underline",
              isDark ? "hover:text-white/70" : "hover:text-text-muted",
            )}
          >
            Platform
          </Link>
        </nav>
      </div>
    </footer>
  );
}
