"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";

const FOOTER_HIDDEN_PREFIXES = ["/shelf/add"];

export function AppFooterGate() {
  const pathname = usePathname();
  const hideFooter = FOOTER_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hideFooter) {
    return null;
  }

  return (
    <div className="w-full px-4 pb-4 pt-2 sm:px-6 lg:px-8">
      <SiteFooter compact />
    </div>
  );
}
