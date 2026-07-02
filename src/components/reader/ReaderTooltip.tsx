"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ReaderTooltipProps = {
  label: string;
  children: ReactNode;
  side?: "right" | "left";
  className?: string;
};

export function ReaderTooltip({ label, children, side = "right", className }: ReaderTooltipProps) {
  return (
    <div className={cn("reader-tooltip-wrap group/tooltip relative flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "reader-tooltip pointer-events-none absolute top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium opacity-0 shadow-sm transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "right" ? "left-[calc(100%+8px)]" : "right-[calc(100%+8px)]",
        )}
      >
        {label}
      </span>
    </div>
  );
}
