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
  onCoverError?: (bookId: string) => void;
};

export function ShelfGrid({ books, coverUrls, loading = false, onCoverError }: ShelfGridProps) {
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
    <div className="space-y-6">
      <ShelfControls
        search={search}
        sort={sort}
        onSearchChange={setSearch}
        onSortChange={setSort}
      />

      <div>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-text-muted">
            No books match your search.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-7 gap-y-5">
            {filtered.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                coverUrl={coverUrls[book.id] ?? null}
                onCoverError={onCoverError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
