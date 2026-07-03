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

const RIBBON_PATH = `M1.5,7 C1.5,3 ${BOOKMARK_RIBBON_WIDTH - 1.5},3 ${BOOKMARK_RIBBON_WIDTH - 1.5},7 L${BOOKMARK_RIBBON_WIDTH - 1.5},${BOOKMARK_RIBBON_HEIGHT - 21} L${BOOKMARK_RIBBON_WIDTH / 2},${BOOKMARK_RIBBON_HEIGHT - 1.5} L1.5,${BOOKMARK_RIBBON_HEIGHT - 21} Z`;

function RibbonMarkIcon({ goldId }: { goldId: string }) {
  return (
    <g transform={`translate(${BOOKMARK_RIBBON_WIDTH / 2}, ${BOOKMARK_RIBBON_HEIGHT - 52})`}>
      <path
        d="M-4.5 3.5 3.5 -4.5 5.5 -2.5 -2.5 5.5 Z"
        fill={`url(#${goldId})`}
        stroke="#8A6A12"
        strokeWidth="0.35"
      />
      <path
        d="M4.5 -5.5 5.8 -3.8 7.2 -5.2 5.9 -6.9 Z"
        fill={`url(#${goldId})`}
      />
      <path
        d="M6.8 1.2 7.6 2.8 9.2 2 8.4 0.4 Z"
        fill={`url(#${goldId})`}
      />
      <path
        d="M8.6 -1.1 9.1 0.1 10.3 -0.4 9.8 -1.6 Z"
        fill={`url(#${goldId})`}
      />
    </g>
  );
}

export function PageBookmarkRibbon({
  colorId,
  label,
  offsetIndex = 0,
  onClick,
  onDoubleClick,
}: PageBookmarkRibbonProps) {
  const palette = bookmarkRibbonPalette(colorId);
  const uid = useId().replace(/:/g, "");
  const gradientId = `${uid}-ribbon`;
  const goldId = `${uid}-gold`;
  const shadowId = `${uid}-shadow`;
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
        right: BOOKMARK_RIBBON_INSET + offsetIndex * (BOOKMARK_RIBBON_WIDTH + BOOKMARK_RIBBON_GAP),
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
            <stop offset="34%" stopColor={palette.mid} />
            <stop offset="50%" stopColor={palette.highlight} />
            <stop offset="66%" stopColor={palette.mid} />
            <stop offset="100%" stopColor={palette.edge} />
          </linearGradient>
          <linearGradient id={goldId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F7E7A8" />
            <stop offset="45%" stopColor="#E8C547" />
            <stop offset="100%" stopColor="#B8891A" />
          </linearGradient>
          <filter id={shadowId} x="-40%" y="-8%" width="180%" height="130%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodColor="#000" floodOpacity="0.22" />
          </filter>
        </defs>
        <path
          d={RIBBON_PATH}
          fill={`url(#${gradientId})`}
          stroke="#FFFFFF"
          strokeWidth="1.35"
          strokeLinejoin="round"
          filter={`url(#${shadowId})`}
        />
        <RibbonMarkIcon goldId={goldId} />
      </svg>
    </button>
  );
}
