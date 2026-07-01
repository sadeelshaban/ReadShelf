"use client";

import { useRef } from "react";
import { bookmarkColorHex } from "@/lib/reader/bookmarks";
import { cn } from "@/lib/utils";

type PageBookmarkRibbonProps = {
  colorId: string;
  label?: string;
  offsetIndex?: number;
  onClick?: () => void;
  onDoubleClick?: () => void;
};

export function PageBookmarkRibbon({
  colorId,
  label,
  offsetIndex = 0,
  onClick,
  onDoubleClick,
}: PageBookmarkRibbonProps) {
  const fill = bookmarkColorHex(colorId);
  const fillLight = `color-mix(in srgb, ${fill} 88%, white)`;
  const fillDark = `color-mix(in srgb, ${fill} 82%, black)`;
  const clickTimerRef = useRef<number | null>(null);

  return (
    <button
      type="button"
      title={label || "Bookmark"}
      aria-label={label || "Bookmark"}
      onClick={() => {
        if (clickTimerRef.current) {
          window.clearTimeout(clickTimerRef.current);
        }
        clickTimerRef.current = window.setTimeout(() => {
          onClick?.();
          clickTimerRef.current = null;
        }, 220);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (clickTimerRef.current) {
          window.clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        onDoubleClick?.();
      }}
      className={cn(
        "group absolute top-0 z-10 border-0 bg-transparent p-0",
        onClick || onDoubleClick ? "cursor-pointer" : "pointer-events-none",
      )}
      style={{ right: 10 + offsetIndex * 36 }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[7.5rem] w-10 drop-shadow-[0_6px_14px_rgba(0,0,0,0.28)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ribbon-${colorId}-${offsetIndex}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillLight} />
            <stop offset="55%" stopColor={fill} />
            <stop offset="100%" stopColor={fillDark} />
          </linearGradient>
        </defs>
        <path
          d="M8 4.5h8a1 1 0 0 1 1 1v12.8l-3.2-2.2-2.8 2.2-2.8-2.2L7 18.3V5.5a1 1 0 0 1 1-1z"
          fill={`url(#ribbon-${colorId}-${offsetIndex})`}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="0.35"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
