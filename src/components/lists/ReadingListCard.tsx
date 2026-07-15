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
          sizes="72px"
          className="object-cover object-center"
          unoptimized
          onError={onError}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-1 text-center font-serif text-[8px] leading-tight text-primary">
          {book.title.slice(0, 18)}
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
        "group relative overflow-hidden rounded-2xl border border-[#eadbc8]/90 bg-white shadow-sm transition duration-200",
        "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
        entering && "list-card-enter",
      )}
    >
      <div className="absolute right-2 top-2 z-20" ref={menuRef}>
        <button
          type="button"
          aria-label="List options"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-text-muted shadow-sm ring-1 ring-black/5 hover:bg-white hover:text-text"
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

      <Link href={`/lists/${list.id}`} className="block p-3.5 sm:p-4" dir="auto">
        <div className="flex gap-3.5 sm:gap-4">
          <div className="relative h-[108px] w-[92px] shrink-0 sm:h-[118px] sm:w-[100px]">
            {previews.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#fff1dc] to-[#f3e4cf] ring-1 ring-[#eadbc8]">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary/70" fill="none" aria-hidden>
                  <path
                    d="M6 5.5h12v14l-2.4-1.6L12 19.5l-3.6-1.6L6 19.5V5.5z"
                    stroke="currentColor"
                    strokeWidth="1.55"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : (
              previews.map((book, index) => (
                <span
                  key={book.id}
                  className="absolute"
                  style={{
                    left: index * 14,
                    top: index * 6,
                    zIndex: previews.length - index,
                    transform: `rotate(${(index - 1) * 4}deg)`,
                  }}
                >
                  <CoverThumb
                    book={book}
                    coverUrl={coverUrls[book.id] ?? null}
                    onError={() => onCoverError?.(book.id)}
                    className="aspect-[2/3] w-[68px] sm:w-[74px]"
                  />
                </span>
              ))
            )}
          </div>

          <div className="min-w-0 flex-1 pr-8">
            <h2 className="truncate font-serif text-lg font-semibold tracking-tight text-text sm:text-xl">
              {list.name}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-text-muted">
              {readingListBookCountLabel(list.book_count)}
            </p>

            {previews.length > 0 ? (
              <ul className="mt-2.5 space-y-1.5">
                {previews.map((book) => (
                  <li key={book.id} className="min-w-0">
                    <p className="truncate text-xs font-medium text-text/90" dir="auto">
                      {book.title}
                    </p>
                    <p className="truncate text-[10px] text-text-muted" dir="auto">
                      {book.author.trim() || "Unknown"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-text-muted">No books yet — open to add from shelf.</p>
            )}

            {list.book_count > previews.length && (
              <p className="mt-2 text-[11px] text-text-muted">
                +{list.book_count - previews.length} more
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
