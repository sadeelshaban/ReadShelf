"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeaderListsLink() {
  const pathname = usePathname();
  if (pathname.startsWith("/lists")) {
    return null;
  }

  return (
    <Link
      href="/lists"
      aria-label="Reading lists"
      className="rounded-xl px-2.5 py-2 text-sm font-medium text-text/70 transition-all hover:bg-background-elevated hover:text-primary hover:shadow-sm"
    >
      Lists
    </Link>
  );
}
