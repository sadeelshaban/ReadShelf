"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

function PageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0 text-[#8B6F52]", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
      <circle cx="8" cy="3.25" r="1.1" />
      <circle cx="8" cy="8" r="1.1" />
      <circle cx="8" cy="12.75" r="1.1" />
    </svg>
  );
}

export type BookAnnotationListRowProps = {
  href: string;
  pageNumber: number;
  label: string;
  labelDir?: "ltr" | "rtl" | "auto";
  labelClassName?: string;
  labelStyle?: CSSProperties;
  colors?: string[];
  colorTitle?: (color: string) => string;
  onDelete?: () => void;
  deleting?: boolean;
};

export function BookAnnotationListRow({
  href,
  pageNumber,
  label,
  labelDir = "auto",
  labelClassName,
  labelStyle,
  colors = [],
  colorTitle,
  onDelete,
  deleting,
}: BookAnnotationListRowProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLLIElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <li
      ref={rootRef}
      className="group relative border-b border-[#eadbc8]/45 last:border-b-0"
    >
      <div className="flex h-12 min-h-[48px] max-h-[52px] items-center gap-2 px-3 sm:px-4">
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-1 pr-1 transition hover:bg-[#fff8f1]/80"
        >
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium tabular-nums text-[#8a7968]">
            <PageIcon />
            <span className="text-[#5b4028]">p. {pageNumber}</span>
          </span>
          <span
            className={cn("min-w-0 flex-1 truncate text-sm text-[#3c2a21]", labelClassName)}
            dir={labelDir}
            style={labelStyle}
            title={label}
          >
            {label}
          </span>
        </Link>

        {(colors.length > 0 || onDelete) && (
          <div className="flex shrink-0 items-center gap-3 sm:gap-3.5">
            {colors.length > 0 && (
              <span className="flex items-center gap-1 px-0.5">
                {colors.slice(0, 3).map((color, index) => (
                  <span
                    key={`${color}-${index}`}
                    className="h-2.5 w-2.5 rounded-full border border-[#eadbc8]/90"
                    style={{ backgroundColor: color }}
                    title={colorTitle?.(color)}
                    aria-hidden
                  />
                ))}
              </span>
            )}

            {onDelete && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Note actions"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-controls={menuOpen ? menuId : undefined}
                  disabled={deleting}
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-[#8a7968] transition hover:bg-[#fff8f1] hover:text-[#5b4028] disabled:opacity-50"
                >
                  <MoreIcon />
                </button>
                {menuOpen && (
                  <div
                    id={menuId}
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-1 min-w-[7.5rem] overflow-hidden rounded-lg border border-[#eadbc8]/80 bg-white py-1 shadow-[0_8px_20px_rgba(31,22,16,0.1)]"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
