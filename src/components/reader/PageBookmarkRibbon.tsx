"use client";

import { useId, useRef } from "react";
import {
  BOOKMARK_RIBBON_GAP,
  BOOKMARK_RIBBON_HEIGHT,
  BOOKMARK_RIBBON_INSET,
  BOOKMARK_RIBBON_WIDTH,
  bookmarkRibbonPalette,
} from "@/lib/reader/bookmarks";
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
  const palette = bookmarkRibbonPalette(colorId);
  const gradientId = useId().replace(/:/g, "");
  const shadowId = `${gradientId}-shadow`;
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
      style={{
        left: BOOKMARK_RIBBON_INSET + offsetIndex * (BOOKMARK_RIBBON_WIDTH + BOOKMARK_RIBBON_GAP),
        width: BOOKMARK_RIBBON_WIDTH,
        height: BOOKMARK_RIBBON_HEIGHT,
      }}
    >
      <svg
        width={BOOKMARK_RIBBON_WIDTH}
        height={BOOKMARK_RIBBON_HEIGHT}
        viewBox={`0 0 ${BOOKMARK_RIBBON_WIDTH} ${BOOKMARK_RIBBON_HEIGHT}`}
        className="block transition-transform duration-150 group-hover:translate-y-[1px]"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={palette.edge} />
            <stop offset="32%" stopColor={palette.mid} />
            <stop offset="50%" stopColor={palette.highlight} />
            <stop offset="68%" stopColor={palette.mid} />
            <stop offset="100%" stopColor={palette.edge} />
          </linearGradient>
          <filter id={shadowId} x="-30%" y="-10%" width="160%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.8" floodColor="#000" floodOpacity="0.18" />
          </filter>
        </defs>
        <path
          d={`M1,9 C1,3 ${BOOKMARK_RIBBON_WIDTH - 1},3 ${BOOKMARK_RIBBON_WIDTH - 1},9 L${BOOKMARK_RIBBON_WIDTH - 1},${BOOKMARK_RIBBON_HEIGHT - 19} L${BOOKMARK_RIBBON_WIDTH / 2},${BOOKMARK_RIBBON_HEIGHT - 1} L1,${BOOKMARK_RIBBON_HEIGHT - 19} Z`}
          fill={`url(#${gradientId})`}
          filter={`url(#${shadowId})`}
        />
      </svg>
    </button>
  );
}
