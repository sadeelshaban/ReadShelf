"use client";

import type { CSSProperties } from "react";
import { bookmarkColorHex } from "@/lib/reader/bookmarks";
import { cn } from "@/lib/utils";

type PageBookmarkRibbonProps = {
  colorId: string;
  label?: string;
  offsetIndex?: number;
  onClick?: () => void;
};

export function PageBookmarkRibbon({
  colorId,
  label,
  offsetIndex = 0,
  onClick,
}: PageBookmarkRibbonProps) {
  const bookmarkColor = bookmarkColorHex(colorId);

  return (
    <button
      type="button"
      title={label || "Bookmark"}
      aria-label={label || "Bookmark"}
      onClick={onClick}
      className={cn(
        "group absolute top-0 z-10 flex w-7 flex-col items-center border-0 bg-transparent p-0",
        onClick ? "cursor-pointer" : "pointer-events-none",
      )}
      style={{ right: 12 + offsetIndex * 30 }}
    >
      <span
        className="relative flex h-[4.5rem] w-6 flex-col items-center shadow-[0_4px_12px_rgba(0,0,0,0.22)]"
        style={
          {
            "--bookmarkColor": bookmarkColor,
          } as CSSProperties
        }
      >
        <span
          className="block h-full w-full"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, var(--bookmarkColor) 92%, white) 0%, var(--bookmarkColor) 55%, color-mix(in srgb, var(--bookmarkColor) 78%, black) 100%)`,
            clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), 50% 100%, 0 calc(100% - 10px))",
          }}
        />
        <span className="pointer-events-none absolute bottom-3 text-[9px] text-[#3c2a21]/80">
          ✎
        </span>
      </span>
    </button>
  );
}
