"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LibraryTabs } from "@/components/layout/LibraryTabs";
import { ShelfGrid } from "@/components/shelf/ShelfGrid";
import { ShelfStats } from "@/components/shelf/ShelfStats";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  fetchBooksWithCountsClient,
  fetchCoverUrlsClient,
} from "@/lib/books/client-queries";
import {
  cacheBooks,
  getCachedBooks,
  getCachedCoverUrlMap,
  persistCachedCoverUrls,
} from "@/lib/offline/books-store";
import { forgetCoverUrl, rememberCoverUrl } from "@/lib/books/cover-url-cache";
import { getClientCoverReadUrl } from "@/lib/storage/client-covers";
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
      setCoverUrls(await getCachedCoverUrlMap(cached));
      setLoading(false);
    } else if (!silent) {
      setLoading(true);
    }

    if (!isOnline()) {
      setBooks(cached);
      setCoverUrls(await getCachedCoverUrlMap(cached));
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
      void cacheBooks(fetched).catch(() => undefined);

      // Wait for signed cover URLs so the shelf never flashes empty "No cover" tiles.
      const urls = await fetchCoverUrlsClient(fetched, { force: true });
      if (cancelled()) return;
      setCoverUrls(urls);
      void persistCachedCoverUrls(fetched, urls).catch(() => undefined);
      setLoading(false);
    } catch {
      if (cancelled()) return;
      setBooks(cached);
      setCoverUrls(await getCachedCoverUrlMap(cached));
      setOffline(!isOnline());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    router.prefetch("/lists");
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

  const refreshCover = useCallback(
    async (bookId: string) => {
      const book = books.find((entry) => entry.id === bookId);
      if (!book?.cover_path) return;

      forgetCoverUrl(book.cover_path);
      const url = await getClientCoverReadUrl(book.cover_path);
      setCoverUrls((current) => ({ ...current, [bookId]: url }));
      if (url) {
        rememberCoverUrl(book.cover_path, url);
      }
      void persistCachedCoverUrls([book], { [bookId]: url }).catch(() => undefined);
    },
    [books],
  );

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

        <LibraryTabs />

        {!loading && books.length > 0 && <ShelfStats books={books} />}
      </header>

      {offline && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
          Offline mode. Showing cached books. Open a book once online to download
          it for offline reading.
        </p>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <ShelfGrid
          books={books}
          coverUrls={coverUrls}
          loading={false}
          onCoverError={refreshCover}
        />
      )}
    </div>
  );
}
