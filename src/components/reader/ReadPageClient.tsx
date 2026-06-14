"use client";

import { useEffect, useState } from "react";
import { ReaderWrapper } from "@/components/reader/ReaderWrapper";
import {
  fetchBookAnnotationsClient,
  fetchBookByIdClient,
} from "@/lib/books/client-queries";
import { cacheBook, getCachedBook } from "@/lib/offline/books-store";
import { isOnline } from "@/lib/offline/online";
import {
  flushSyncQueue,
  loadBookAnnotations,
  seedBookAnnotations,
} from "@/lib/offline/reader-api";
import { createClient } from "@/lib/supabase/client";
import type { Book, Highlight, Note } from "@/types";

type ReadPageClientProps = {
  bookId: string;
};

type LoadedState = {
  book: Book;
  userId: string;
  highlights: Highlight[];
  notes: Note[];
};

export function ReadPageClient({ bookId }: ReadPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<LoadedState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        if (!cancelled) {
          setError("Sign in to read this book.");
          setLoading(false);
        }
        return;
      }

      if (isOnline()) {
        try {
          const book = await fetchBookByIdClient(bookId);
          if (cancelled) return;

          if (book) {
            await cacheBook(book);
            const remote = await fetchBookAnnotationsClient(bookId);
            const local = await seedBookAnnotations(
              bookId,
              remote.highlights,
              remote.notes,
            );
            void flushSyncQueue();

            setLoaded({
              book,
              userId,
              highlights: local.highlights,
              notes: local.notes,
            });
            setLoading(false);
            return;
          }
        } catch {
          // Fall back to cached book metadata and local annotations.
        }
      }

      const cached = await getCachedBook(bookId);
      if (cancelled) return;

      if (!cached) {
        setError(
          isOnline()
            ? "Book not found."
            : "This book is not available offline. Open it once while online.",
        );
        setLoading(false);
        return;
      }

      const local = await loadBookAnnotations(bookId);
      if (cancelled) return;

      setLoaded({
        book: cached,
        userId,
        highlights: local.highlights,
        notes: local.notes,
      });
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (loading) {
    return (
      <div className="acrobat-reader fixed inset-0 z-40 flex items-center justify-center">
        <p className="text-sm text-white/60">Loading reader...</p>
      </div>
    );
  }

  if (error || !loaded) {
    return (
      <div className="acrobat-reader fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-center text-sm text-red-300">
          {error ?? "Could not load this book."}
        </p>
      </div>
    );
  }

  return (
    <ReaderWrapper
      bookId={loaded.book.id}
      bookTitle={loaded.book.title}
      userId={loaded.userId}
      initialPage={loaded.book.last_page || 1}
      totalPages={loaded.book.total_pages}
      initialHighlights={loaded.highlights}
      initialNotes={loaded.notes}
    />
  );
}
