"use client";

import { useRef, type CSSProperties } from "react";
import { bookmarkColorHex } from "@/lib/reader/bookmarks";
import { cn } from "@/lib/utils";

type PageBookmarkRibbonProps = {
  colorId: string;
  label?: string;
  offsetIndex?: number;
  onClick?: () => void;
  onDoubleClick?: () => void;
};

function BookmarkMarkIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#3c2a21]/85" aria-hidden>
      <path
        d="M13.8 3.2l3 3-9.2 9.2-3.8 1 1-3.8 9-8.4z"
        fill="currentColor"
      />
      <path
        d="M15.2 5.1l.35 1.05 1.05.35-1.05.35-.35 1.05-.35-1.05-1.05-.35 1.05-.35.35-1.05z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PageBookmarkRibbon({
  colorId,
  label,
  offsetIndex = 0,
  onClick,
  onDoubleClick,
}: PageBookmarkRibbonProps) {
  const bookmarkColor = bookmarkColorHex(colorId);
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
        "group absolute top-0 z-10 flex w-7 flex-col items-center border-0 bg-transparent p-0",
        onClick || onDoubleClick ? "cursor-pointer" : "pointer-events-none",
      )}
      style={{ right: 14 + offsetIndex * 28 }}
    >
      <span
        className="relative flex h-[6rem] w-6 flex-col items-center shadow-[4px_5px_12px_rgba(0,0,0,0.24)]"
        style={{ "--bookmarkColor": bookmarkColor } as CSSProperties}
      >
        <span
          className="block h-full w-full"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, var(--bookmarkColor) 92%, white) 0%, var(--bookmarkColor) 55%, color-mix(in srgb, var(--bookmarkColor) 78%, black) 100%)`,
            clipPath:
              "polygon(0 0, 100% 0, 100% calc(100% - 12px), 50% 100%, 0 calc(100% - 12px))",
          }}
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-[30%] flex justify-center">
          <BookmarkMarkIcon />
        </span>
      </span>
    </button>
  );
}
