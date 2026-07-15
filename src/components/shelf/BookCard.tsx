"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BookWithCounts } from "@/types";
import { getReadButtonLabel } from "@/lib/pdf";
import { cn } from "@/lib/utils";

type BookCardProps = {
  book: BookWithCounts;
  coverUrl: string | null;
  onCoverError?: (bookId: string) => void;
  /** Optional overflow menu (e.g. remove from reading list). */
  menuItems?: Array<{ label: string; onClick: () => void; danger?: boolean }>;
};

const overlayBtn =
  "interactive-lift flex w-full items-center justify-center rounded-xl px-3 py-2 text-center text-[11px] font-semibold leading-tight transition-colors sm:text-xs";

function isFinePointerDevice() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function BookCard({ book, coverUrl, onCoverError, menuItems }: BookCardProps) {
  const router = useRouter();
  const retriedCoverRef = useRef(false);
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mobileOverlay, setMobileOverlay] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const readLabel = getReadButtonLabel(book);
  const progressLabel = book.total_pages
    ? `${book.progress_percent}% · ${book.last_page}/${book.total_pages}`
    : `${book.progress_percent}% · p. ${book.last_page}`;
  const pagesLabel = book.total_pages ? `${book.total_pages} Pages` : "— Pages";
  const author = book.author.trim() || "Unknown";

  useEffect(() => {
    retriedCoverRef.current = false;
  }, [coverUrl]);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  const closeMobileOverlay = useCallback(() => {
    setMobileOverlay(false);
  }, []);

  useEffect(() => {
    if (!mobileOverlay) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(`[data-book-card="${book.id}"]`)) return;
      closeMobileOverlay();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [book.id, closeMobileOverlay, mobileOverlay]);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  function handleCoverPointerUp() {
    if (isFinePointerDevice()) return;

    const now = Date.now();
    const delta = now - lastTapRef.current;

    if (delta > 0 && delta < 350) {
      if (tapTimeoutRef.current) {
        window.clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      lastTapRef.current = 0;
      closeMobileOverlay();
      router.push(`/book/${book.id}`);
      return;
    }

    lastTapRef.current = now;
    if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = window.setTimeout(() => {
      setMobileOverlay(true);
      tapTimeoutRef.current = null;
    }, 280);
  }

  return (
    <article
      className="group relative flex w-[140px] shrink-0 flex-col sm:w-[152px]"
      data-book-card={book.id}
    >
      <div className="relative">
        <button
          type="button"
          className="book-card-cover relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-background-elevated shadow-md ring-1 ring-black/5"
          aria-label={`Open ${book.title}`}
          onPointerUp={handleCoverPointerUp}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="176px"
              className="object-cover object-center"
              unoptimized
              onError={() => {
                if (retriedCoverRef.current) return;
                retriedCoverRef.current = true;
                onCoverError?.(book.id);
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20 px-2 text-center font-serif text-[10px] text-primary">
              No cover
            </div>
          )}
        </button>

        {menuItems && menuItems.length > 0 && (
          <div className="absolute right-1.5 top-1.5 z-30" ref={menuRef}>
            <button
              type="button"
              aria-label="Book options"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-text-muted shadow-sm ring-1 ring-black/5 hover:bg-white hover:text-text"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((open) => !open);
              }}
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                <circle cx="8" cy="3.5" r="1.15" fill="currentColor" />
                <circle cx="8" cy="8" r="1.15" fill="currentColor" />
                <circle cx="8" cy="12.5" r="1.15" fill="currentColor" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 min-w-[8rem] overflow-hidden rounded-xl border border-[#eadbc8] bg-white py-1 shadow-lg">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={cn(
                      "block w-full px-3 py-2 text-left text-sm hover:bg-[#fff8f1]",
                      item.danger ? "text-red-600 hover:bg-red-50" : "text-text",
                    )}
                    onClick={() => {
                      setMenuOpen(false);
                      item.onClick();
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            "book-card-overlay absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl p-2.5 opacity-0 pointer-events-none transition-opacity duration-200",
            mobileOverlay && "opacity-100 pointer-events-auto",
          )}
        >
          <Link
            href={`/book/${book.id}/read`}
            className={cn(
              overlayBtn,
              "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-light",
            )}
            onClick={closeMobileOverlay}
          >
            {readLabel}
          </Link>
          <Link
            href={`/book/${book.id}`}
            className={cn(
              overlayBtn,
              "border border-white/70 bg-white/60 text-text shadow-sm hover:bg-white/85",
            )}
            onClick={closeMobileOverlay}
          >
            Details
          </Link>
        </div>
      </div>

      <Link
        href={`/book/${book.id}`}
        className="mt-2.5 block min-w-0"
        title={`${book.title} — ${author}`}
      >
        <p
          className="line-clamp-2 text-center text-xs font-medium leading-snug text-text/90 sm:text-sm"
          dir="auto"
        >
          {book.title}
        </p>
        <p className="mt-0.5 truncate text-center text-[10px] text-text-muted sm:text-[11px]" dir="auto">
          {author}
        </p>
      </Link>

      <div className="relative mt-1.5 h-4 shrink-0">
        <p className="absolute inset-x-0 top-0 text-center text-[10px] font-medium text-text-muted transition-opacity duration-200 group-hover:opacity-0">
          {pagesLabel}
        </p>
        <p className="absolute inset-x-0 top-0 text-center text-[10px] text-text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {progressLabel}
        </p>
      </div>
    </article>
  );
}
