"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShelfGrid } from "@/components/shelf/ShelfGrid";
import { EmptyShelf } from "@/components/shelf/EmptyShelf";
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
    queueMicrotask(() => {
      void loadShelf(() => cancelled);
    });
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
  const hasBooks = books.length > 0;

  if (!loading && !hasBooks) {
    return (
      <section className="video-hero-panel relative left-1/2 right-1/2 min-h-[calc(100vh-4.5rem)] w-screen -translate-x-1/2 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/videos/empty-shelf-library-background.mp4" type="video/mp4" />
        </video>
        <div className="video-hero-overlay absolute inset-0" />

        <div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-7xl flex-col px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <header className="space-y-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Library
                </p>
                <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  My Reading Shelf
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/84 sm:text-[15px]">
                  Keep your PDFs, reading progress, highlights, and notes in one calm
                  place. Your shelf should feel organized before you even open a book.
                </p>
              </div>

              <div className="inline-flex items-center rounded-full border border-white/22 bg-white/12 px-4 py-2 text-sm text-white/82 shadow-sm backdrop-blur-md">
                Your next great read belongs here.
              </div>
            </div>
          </header>

          <div className="mt-7 flex-1">
            <EmptyShelf />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/65">
              Library
            </p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-text sm:text-[3.25rem]">
              My Reading Shelf
            </h1>
          </div>

          {hasBooks ? (
            <ShelfStats books={books} />
          ) : (
            <div className="inline-flex items-center rounded-full border border-soft-gray/20 bg-white/70 px-4 py-2 text-sm text-text/72 shadow-sm">
              Your next great read belongs here.
            </div>
          )}
        </div>

        {offline && (
          <p className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            Offline mode is active. You are seeing cached books until the connection
            comes back.
          </p>
        )}
      </header>

      <ShelfGrid books={books} coverUrls={coverUrls} loading={loading} />
    </div>
  );
}
