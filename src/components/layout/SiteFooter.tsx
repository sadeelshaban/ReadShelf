import Link from "next/link";
import { COPYRIGHT_NOTICE, legalLinks } from "@/lib/legal/constants";
import { cn } from "@/lib/utils";

type SiteFooterProps = {
  variant?: "dark" | "light";
  className?: string;
  compact?: boolean;
  showAcquisitionLinks?: boolean;
};

export function SiteFooter({
  variant = "light",
  className,
  compact,
  showAcquisitionLinks,
}: SiteFooterProps) {
  const isDark = variant === "dark";

  return (
    <footer className={cn("text-center text-sm", className)}>
      <div
        className={cn(
          "flex flex-col items-center gap-3 border-t",
          compact ? "border-[#eadbc8]/45 pt-4" : "pt-6",
          isDark ? "border-white/15" : compact ? "border-[#eadbc8]/45" : "border-[#eadbc8]/70",
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
                "transition-colors duration-200 hover:underline",
                isDark ? "hover:text-white/80" : "hover:text-text/80",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/platform"
            className={cn(
              "transition-colors duration-200 hover:underline",
              isDark ? "hover:text-white/80" : "hover:text-text/80",
            )}
          >
            Platform
          </Link>
          {showAcquisitionLinks && (
            <>
              <a
                href="https://github.com/sadeelshaban/ReadShelf"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "transition-colors duration-200 hover:underline",
                  isDark ? "hover:text-white/80" : "hover:text-text/80",
                )}
              >
                GitHub
              </a>
              <a
                href="mailto:sadeelshabanmedia@gmail.com"
                className={cn(
                  "transition-colors duration-200 hover:underline",
                  isDark ? "hover:text-white/80" : "hover:text-text/80",
                )}
              >
                Email
              </a>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
}
