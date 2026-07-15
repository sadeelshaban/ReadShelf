"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppHeaderListsLink() {
  const pathname = usePathname();
  if (pathname.startsWith("/lists")) {
    return null;
  }

  return (
    <Link
      href="/lists"
      aria-label="Reading lists"
      className={cn(
        "inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold shadow-md transition-all",
        "bg-primary text-white shadow-primary/20",
        "hover:-translate-y-0.5 hover:bg-primary-light hover:shadow-lg hover:shadow-primary/25",
      )}
    >
      Reading Lists
    </Link>
  );
}
