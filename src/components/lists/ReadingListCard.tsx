"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readingListBookCountLabel } from "@/lib/reading-lists/names";
import type { ReadingListPreviewBook, ReadingListWithPreview } from "@/types";
import { cn } from "@/lib/utils";

type ReadingListCardProps = {
  list: ReadingListWithPreview;
  coverUrls: Record<string, string | null>;
  entering?: boolean;
  onRename: () => void;
  onDelete: () => void;
  onCoverError?: (bookId: string) => void;
};

function BooksStackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <rect
        x="3.5"
        y="8"
        width="7"
        height="18"
        rx="1.2"
        fill="currentColor"
        opacity="0.35"
        transform="rotate(-8 7 17)"
      />
      <rect x="11" y="6" width="8" height="20" rx="1.2" fill="currentColor" opacity="0.55" />
      <rect
        x="20"
        y="8.5"
        width="7.5"
        height="17"
        rx="1.2"
        fill="currentColor"
        opacity="0.85"
        transform="rotate(7 23.75 17)"
      />
      <path
        d="M14 12.5h2.2M14 15.5h3.5M14 18.5h2.8"
        stroke="#fff8f1"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

function CoverThumb({
  book,
  coverUrl,
  className,
  onError,
}: {
  book: ReadingListPreviewBook;
  coverUrl: string | null;
  className?: string;
  onError?: () => void;
}) {
  return (
    <span
      className={cn(
        "relative block overflow-hidden rounded-md bg-[#efe4d4] shadow-md ring-1 ring-black/10",
        className,
      )}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt=""
          fill
          sizes="64px"
          className="object-cover object-center"
          unoptimized
          onError={onError}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f0dfc8] to-[#e2c9a8]">
          <span className="h-[70%] w-[3px] rounded-full bg-primary/25" aria-hidden />
        </span>
      )}
    </span>
  );
}

export function ReadingListCard({
  list,
  coverUrls,
  entering = false,
  onRename,
  onDelete,
  onCoverError,
}: ReadingListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const previews = list.preview_books.slice(0, 3);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#eadbc8]/90 bg-white shadow-sm transition duration-200",
        "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
        entering && "list-card-enter",
      )}
    >
      <div className="absolute right-1.5 top-1.5 z-20" ref={menuRef}>
        <button
          type="button"
          aria-label="List options"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-text-muted shadow-sm ring-1 ring-black/5 hover:bg-white hover:text-text"
          onClick={(e) => {
            e.preventDefault();
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
          <div className="absolute right-0 mt-1 min-w-[8.5rem] overflow-hidden rounded-xl border border-[#eadbc8] bg-white py-1 shadow-lg">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-[#fff8f1]"
              onClick={() => {
                setMenuOpen(false);
                onRename();
              }}
            >
              Rename
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <Link href={`/lists/${list.id}`} className="block p-2.5 sm:p-3">
        {/* dir fixed so Arabic names don't flip the cover stack */}
        <div className="flex items-center gap-3" dir="ltr">
          <div className="relative h-[76px] w-[72px] shrink-0 sm:h-[84px] sm:w-[78px]">
            {previews.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-[#fff1dc] to-[#edd9bc] text-primary ring-1 ring-[#eadbc8]">
                <BooksStackIcon className="h-9 w-9" />
              </div>
            ) : (
              previews.map((book, index) => (
                <span
                  key={book.id}
                  className="absolute"
                  style={{
                    left: index * 10,
                    top: index * 4,
                    zIndex: previews.length - index,
                    transform: `rotate(${(index - 1) * 3.5}deg)`,
                  }}
                >
                  <CoverThumb
                    book={book}
                    coverUrl={coverUrls[book.id] ?? null}
                    onError={() => onCoverError?.(book.id)}
                    className="aspect-[2/3] w-[48px] sm:w-[52px]"
                  />
                </span>
              ))
            )}
          </div>

          <div className="min-w-0 flex-1 pr-6 text-start">
            <h2
              className="truncate font-serif text-base font-semibold tracking-tight text-text sm:text-[1.05rem]"
              dir="auto"
            >
              {list.name}
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-text-muted">
              {readingListBookCountLabel(list.book_count)}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
