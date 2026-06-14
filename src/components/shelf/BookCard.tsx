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

function bookLabel(title: string, author: string) {
  return `${title} - ${author.trim() || "Unknown"}`;
}

const overlayBtn =
  "interactive-lift flex w-full items-center justify-center rounded-xl px-3 py-2 text-center text-[11px] font-semibold leading-tight transition-colors sm:text-xs";

export function BookCard({ book, coverUrl }: BookCardProps) {
  const label = bookLabel(book.title, book.author);
  const readLabel = getReadButtonLabel(book);

  return (
    <article className="group relative w-[168px] shrink-0 sm:w-[176px]">
      <div className="relative">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-background-elevated shadow-md ring-1 ring-black/5 transition-all duration-300 ease-out group-hover:z-10 group-hover:scale-[1.14] group-hover:shadow-xl group-hover:ring-primary/30">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="176px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20 px-2 text-center font-serif text-[10px] text-primary">
              No cover
            </div>
          )}
        </div>

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl p-2.5 opacity-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-100 group-hover:pointer-events-auto">
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
              "border border-white/70 bg-white/60 text-text shadow-sm hover:bg-white/85",
            )}
          >
            Details
          </Link>
        </div>
      </div>

      <Link href={`/book/${book.id}`} className="mt-3 block min-w-0" title={label}>
        <p className="line-clamp-2 text-center text-xs leading-snug text-text/90 sm:text-sm" dir="auto">
          {label}
        </p>
      </Link>

      <p className="mt-1.5 text-center text-[10px] text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
        {book.progress_percent}% · {book.highlight_count} hl · {book.note_count} notes
      </p>
    </article>
  );
}
