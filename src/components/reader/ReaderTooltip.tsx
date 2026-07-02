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
    <div className={cn("reader-tooltip-wrap relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "reader-tooltip pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium shadow-md",
          side === "right" ? "left-[calc(100%+8px)]" : "right-[calc(100%+8px)]",
        )}
      >
        {label}
      </span>
    </div>
  );
}
