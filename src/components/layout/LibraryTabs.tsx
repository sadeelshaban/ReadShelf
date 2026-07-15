"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/shelf",
    label: "Shelf",
    match: (path: string) => path === "/shelf" || path.startsWith("/shelf/"),
  },
  {
    href: "/lists",
    label: "Reading Lists",
    match: (path: string) => path === "/lists" || path.startsWith("/lists/"),
  },
] as const;

export function LibraryTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Library sections"
      className="flex gap-6 border-b border-[#eadbc8]/90"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative -mb-px pb-2.5 text-sm font-medium transition-colors",
              active ? "text-primary" : "text-text-muted hover:text-text",
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
