"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShelfGrid } from "@/components/shelf/ShelfGrid";
import { ShelfStats } from "@/components/shelf/ShelfStats";
import { buildCoverUrlMap } from "@/lib/books/cover-url-cache";
import {
  fetchBooksWithCountsClient,
  fetchCoverUrlsClient,
} from "@/lib/books/client-queries";
import { cacheBooks, getCachedBooks } from "@/lib/offline/books-store";
import { isOnline } from "@/lib/offline/online";
import { flushSyncQueue } from "@/lib/offline/reader-api";
import type { BookWithCounts } from "@/types";

export function ShelfPageClient() {
  const router = useRouter();
  const [books, setBooks] = useState<BookWithCounts[]>([]);
  const [coverUrls, setCoverUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const loadShelf = useCallback(async (cancelled: () => boolean, silent = false) => {
    const cached = await getCachedBooks();
    if (cancelled()) return;

    if (cached.length > 0) {
      setBooks(cached);
      setCoverUrls(buildCoverUrlMap(cached));
      setLoading(false);
    } else if (!silent) {
      setLoading(true);
    }

    if (!isOnline()) {
      setBooks(cached);
      setCoverUrls(buildCoverUrlMap(cached));
      setOffline(true);
      setLoading(false);
      return;
    }

    try {
      void flushSyncQueue();
      const fetched = await fetchBooksWithCountsClient();
      if (cancelled()) return;

      setBooks(fetched);
      setOffline(false);
      setLoading(false);

      void cacheBooks(fetched).catch(() => undefined);

      const urls = await fetchCoverUrlsClient(fetched);
      if (cancelled()) return;
      setCoverUrls(urls);
    } catch {
      if (cancelled()) return;
      setBooks(cached);
      setCoverUrls(buildCoverUrlMap(cached));
      setOffline(!isOnline());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    router.prefetch("/shelf");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    void loadShelf(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadShelf]);

  useEffect(() => {
    function refreshShelf() {
      void loadShelf(() => false, true);
    }

    window.addEventListener("focus", refreshShelf);
    return () => window.removeEventListener("focus", refreshShelf);
  }, [loadShelf]);

  return (
    <div className="space-y-5">
      <header className="space-y-4">
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
          Offline mode. Showing cached books. Open a book once online to download
          it for offline reading.
        </p>
      )}

      <ShelfGrid books={books} coverUrls={coverUrls} loading={loading} />
    </div>
  );
}
