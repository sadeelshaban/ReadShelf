"use client";

import { useMemo, useState } from "react";
import { BookCard } from "@/components/shelf/BookCard";
import { EmptyShelf } from "@/components/shelf/EmptyShelf";
import { ShelfControls } from "@/components/shelf/ShelfControls";
import type { BookWithCounts, SortOption } from "@/types";

type ShelfGridProps = {
  books: BookWithCounts[];
  coverUrls: Record<string, string | null>;
  loading?: boolean;
};

export function ShelfGrid({ books, coverUrls, loading = false }: ShelfGridProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = books;

    if (query) {
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query),
      );
    }

    return [...result].sort((a, b) => {
      if (sort === "progress") return b.progress_percent - a.progress_percent;
      if (sort === "added") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      const aTime = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
      const bTime = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [books, search, sort]);

  if (books.length === 0) {
    if (loading) return null;
    return <EmptyShelf />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-soft-gray/14 bg-card/90 p-4 shadow-[0_12px_32px_rgba(31,22,16,0.06)] sm:p-5">
        <ShelfControls
          search={search}
          sort={sort}
          onSearchChange={setSearch}
          onSortChange={setSort}
        />
      </div>

      <div className="rounded-[2rem] border border-soft-gray/12 bg-card/92 p-5 shadow-[0_16px_40px_rgba(31,22,16,0.06)] sm:p-7">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-text/56 sm:text-base">
            No books match your search.
          </p>
        ) : (
          <div className="grid justify-items-start grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {filtered.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                coverUrl={coverUrls[book.id] ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
