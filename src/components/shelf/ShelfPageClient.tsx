"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShelfGrid } from "@/components/shelf/ShelfGrid";
import { ShelfStats } from "@/components/shelf/ShelfStats";
import {
  fetchBooksWithCountsClient,
  fetchCoverUrlsClient,
} from "@/lib/books/client-queries";
import { cacheBooks, getCachedBooks } from "@/lib/offline/books-store";
import { isOnline } from "@/lib/offline/online";
import { flushSyncQueue } from "@/lib/offline/reader-api";
import type { BookWithCounts } from "@/types";

export function ShelfPageClient() {
  const pathname = usePathname();
  const [books, setBooks] = useState<BookWithCounts[]>([]);
  const [coverUrls, setCoverUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const loadShelf = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);

    if (isOnline()) {
      try {
        const fetched = await fetchBooksWithCountsClient();
        if (cancelled()) return;

        await cacheBooks(fetched);
        const urls = await fetchCoverUrlsClient(fetched);
        if (cancelled()) return;

        setBooks(fetched);
        setCoverUrls(urls);
        setOffline(false);
        void flushSyncQueue();
        setLoading(false);
        return;
      } catch {
        // Fall back to cached shelf when the network request fails.
      }
    }

    const cached = await getCachedBooks();
    if (cancelled()) return;
    setBooks(cached);
    setCoverUrls({});
    setOffline(!isOnline());
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadShelf(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadShelf, pathname, reloadToken]);

  useEffect(() => {
    function refreshShelf() {
      setReloadToken((value) => value + 1);
    }

    window.addEventListener("focus", refreshShelf);
    return () => window.removeEventListener("focus", refreshShelf);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Library
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            My Reading Shelf
          </h1>
        </div>
        {books.length > 0 && <ShelfStats books={books} />}
      </header>

      {offline && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
          Offline mode — showing cached books. Open a book once online to download
          it for offline reading.
        </p>
      )}

      <ShelfGrid books={books} coverUrls={coverUrls} loading={loading} />
    </div>
  );
}
