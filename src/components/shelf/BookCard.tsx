"use client";

import Link from "next/link";
import Image from "next/image";
import type { BookWithCounts } from "@/types";
import { getReadButtonLabel } from "@/lib/pdf";
import { cn } from "@/lib/utils";

type BookCardProps = {
  book: BookWithCounts;
  coverUrl: string | null;
};

const overlayBtn =
  "interactive-lift flex w-full items-center justify-center rounded-xl px-3 py-2 text-center text-[11px] font-semibold leading-tight transition-colors sm:text-xs";

export function BookCard({ book, coverUrl }: BookCardProps) {
  const readLabel = getReadButtonLabel(book);
  const author = book.author.trim() || "Unknown";
  const progressLabel = book.total_pages
    ? `${book.progress_percent}% read · ${book.last_page}/${book.total_pages}`
    : `${book.progress_percent}% read · p. ${book.last_page}`;

  return (
    <article className="group flex h-full w-full max-w-[184px] flex-col">
      <div className="relative overflow-hidden rounded-[1.45rem] border border-soft-gray/10 bg-background-elevated shadow-[0_10px_24px_rgba(31,22,16,0.08)]">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/58 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.45rem] transition-transform duration-300 ease-out group-hover:scale-[1.02]">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="184px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20 px-4 text-center font-serif text-sm text-primary">
              No cover
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
          <Link
            href={`/book/${book.id}/read`}
            className={cn(
              overlayBtn,
              "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-light",
            )}
          >
            {readLabel}
          </Link>
          <Link
            href={`/book/${book.id}`}
            className={cn(
              overlayBtn,
              "border border-white/70 bg-white/80 text-text shadow-sm hover:bg-white",
            )}
          >
            Details
          </Link>
        </div>
      </div>

      <Link href={`/book/${book.id}`} className="mt-3 block min-w-0 flex-1" title={`${book.title} - ${author}`}>
        <p className="line-clamp-2 text-[14px] leading-5 text-text sm:text-[14px]" dir="auto">
          {book.title}
        </p>
        <p className="mt-1 line-clamp-1 text-[11px] text-text-muted" dir="auto">
          {author}
        </p>
      </Link>

      <p className="mt-1 text-[11px] text-text-muted">
        {progressLabel}
      </p>
    </article>
  );
}
