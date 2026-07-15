"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const compact = pathname.startsWith("/lists");

  return (
    <main
      className={cn(
        "w-full px-4 sm:px-6 lg:px-8",
        compact ? "py-4 sm:py-5" : "py-7 sm:py-8",
      )}
    >
      {children}
    </main>
  );
}
