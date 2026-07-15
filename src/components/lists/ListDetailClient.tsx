"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShelfGrid } from "@/components/shelf/ShelfGrid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  fetchBooksWithCountsClient,
  fetchCoverUrlsClient,
} from "@/lib/books/client-queries";
import { forgetCoverUrl, rememberCoverUrl } from "@/lib/books/cover-url-cache";
import { getClientCoverReadUrl } from "@/lib/storage/client-covers";
import {
  addBooksToReadingListClient,
  fetchReadingListDetailClient,
  removeBookFromReadingListClient,
  renameReadingListClient,
} from "@/lib/reading-lists/client-queries";
import {
  MAX_READING_LIST_NAME_LENGTH,
  readingListBookCountLabel,
} from "@/lib/reading-lists/names";
import { isOnline } from "@/lib/offline/online";
import type { BookWithCounts, ReadingList } from "@/types";
import { cn } from "@/lib/utils";

type ListDetailClientProps = {
  listId: string;
};

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-4 w-4", className)} fill="none" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ListDetailClient({ listId }: ListDetailClientProps) {
  const [list, setList] = useState<ReadingList | null>(null);
  const [books, setBooks] = useState<BookWithCounts[]>([]);
  const [coverUrls, setCoverUrls] = useState<Record<string, string | null>>({});
  const [shelfCoverUrls, setShelfCoverUrls] = useState<Record<string, string | null>>({});
  const [allShelfBooks, setAllShelfBooks] = useState<BookWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savingBooks, setSavingBooks] = useState(false);
  const [loadingShelfCovers, setLoadingShelfCovers] = useState(false);

  const memberIds = useMemo(() => new Set(books.map((book) => book.id)), [books]);

  const availableBooks = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    return allShelfBooks.filter((book) => {
      if (memberIds.has(book.id)) return false;
      if (!query) return true;
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    });
  }, [allShelfBooks, memberIds, pickerQuery]);

  const loadDetail = useCallback(async () => {
    if (!isOnline()) {
      setMessage("Reading lists need an internet connection.");
      setLoading(false);
      return;
    }

    try {
      const detail = await fetchReadingListDetailClient(listId);
      if (!detail) {
        setMessage("List not found.");
        setList(null);
        setBooks([]);
        setLoading(false);
        return;
      }

      setList(detail.list);
      setDraftName(detail.list.name);
      setBooks(detail.books);
      setMessage(null);

      const urls = await fetchCoverUrlsClient(detail.books, { force: true });
      setCoverUrls(urls);

      const shelf = await fetchBooksWithCountsClient();
      setAllShelfBooks(shelf);
    } catch {
      setMessage("Could not load this list.");
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!pickerOpen || allShelfBooks.length === 0) return;
    let cancelled = false;

    async function loadPickerCovers() {
      setLoadingShelfCovers(true);
      try {
        const urls = await fetchCoverUrlsClient(allShelfBooks, { force: false });
        if (!cancelled) setShelfCoverUrls(urls);
      } finally {
        if (!cancelled) setLoadingShelfCovers(false);
      }
    }

    void loadPickerCovers();
    return () => {
      cancelled = true;
    };
  }, [pickerOpen, allShelfBooks]);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!list || renaming) return;
    setRenaming(true);
    setMessage(null);
    try {
      const updated = await renameReadingListClient(list.id, draftName);
      setList(updated);
      setDraftName(updated.name);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not rename list.");
    } finally {
      setRenaming(false);
    }
  }

  function toggleBook(bookId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }

  async function handleAddSelected() {
    if (selectedIds.size === 0 || savingBooks) return;
    setSavingBooks(true);
    setMessage(null);
    try {
      await addBooksToReadingListClient(listId, [...selectedIds]);
      setSelectedIds(new Set());
      setPickerOpen(false);
      setPickerQuery("");
      setLoading(true);
      await loadDetail();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add books.");
    } finally {
      setSavingBooks(false);
    }
  }

  async function handleRemove(bookId: string, title: string) {
    const ok = window.confirm(`Remove "${title}" from this list?`);
    if (!ok) return;
    try {
      await removeBookFromReadingListClient(listId, bookId);
      setBooks((prev) => prev.filter((book) => book.id !== bookId));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not remove book.");
    }
  }

  const refreshCover = useCallback(
    async (bookId: string) => {
      const book =
        books.find((entry) => entry.id === bookId) ??
        allShelfBooks.find((entry) => entry.id === bookId);
      if (!book?.cover_path) return;
      forgetCoverUrl(book.cover_path);
      const url = await getClientCoverReadUrl(book.cover_path);
      setCoverUrls((current) => ({ ...current, [bookId]: url }));
      setShelfCoverUrls((current) => ({ ...current, [bookId]: url }));
      if (url) rememberCoverUrl(book.cover_path, url);
    },
    [allShelfBooks, books],
  );

  function closePicker() {
    setPickerOpen(false);
    setSelectedIds(new Set());
    setPickerQuery("");
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-text-muted">Loading list...</p>;
  }

  if (!list) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-text-muted">{message ?? "List not found."}</p>
        <Link href="/lists" className="text-sm font-medium text-primary underline">
          Back to lists
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/lists" className="text-text-muted hover:text-primary">
            ← Lists
          </Link>
          <span className="text-text-muted">/</span>
          <Link href="/shelf" className="text-text-muted hover:text-primary">
            Shelf
          </Link>
        </div>

        <form
          onSubmit={handleRename}
          className="flex flex-col gap-2.5 rounded-2xl border border-[#eadbc8]/90 bg-white p-3 shadow-sm sm:flex-row sm:items-end sm:gap-3 sm:p-3.5"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="rename-list" className="text-xs font-medium text-[#6f4528]">
              List name
            </label>
            <Input
              id="rename-list"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={MAX_READING_LIST_NAME_LENGTH}
              dir="auto"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={renaming || draftName.trim() === list.name}
          >
            {renaming ? "Saving..." : "Rename"}
          </Button>
          <Button
            type="button"
            className="gap-1.5 shadow-md shadow-primary/25"
            onClick={() => setPickerOpen(true)}
          >
            <PlusIcon />
            Add books
          </Button>
        </form>

        <p className="text-sm text-text-muted">{readingListBookCountLabel(books.length)}</p>

        {message && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {message}
          </p>
        )}
      </header>

      <ShelfGrid
        books={books}
        coverUrls={coverUrls}
        compact
        hideAddBook
        onCoverError={(bookId) => void refreshCover(bookId)}
        trailingAction={
          <Button
            size="sm"
            className="gap-1.5 shadow-md"
            onClick={() => setPickerOpen(true)}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add books
          </Button>
        }
        bookMenuItems={(book) => [
          {
            label: "Remove from list",
            danger: true,
            onClick: () => void handleRemove(book.id, book.title),
          },
        ]}
        emptyState={
          <div className="rounded-2xl border border-dashed border-[#eadbc8] bg-white px-5 py-10 text-center shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-text">This list is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
              Add books from your shelf to start reading from this list.
            </p>
            <Button className="mt-5 gap-1.5" onClick={() => setPickerOpen(true)}>
              <PlusIcon />
              Add books from shelf
            </Button>
          </div>
        }
      />

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add books to list"
            className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#eadbc8] bg-[#fffdf9] shadow-xl"
          >
            <div className="shrink-0 border-b border-[#eadbc8]/80 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-text">Add from shelf</h2>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Tap covers to select books for this list.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm text-text-muted hover:bg-[#eadbc8]/40"
                  onClick={closePicker}
                >
                  Close
                </button>
              </div>
              <Input
                className="mt-3"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder="Search shelf books..."
                dir="auto"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loadingShelfCovers && availableBooks.length > 0 && (
                <p className="mb-3 text-center text-xs text-text-muted">Loading covers...</p>
              )}
              {availableBooks.length === 0 ? (
                <p className="py-10 text-center text-sm text-text-muted">
                  {allShelfBooks.length === 0
                    ? "Your shelf is empty."
                    : pickerQuery.trim()
                      ? "No books match your search."
                      : "All shelf books are already in this list."}
                </p>
              ) : (
                <div className="flex flex-wrap justify-start gap-x-4 gap-y-4">
                  {availableBooks.map((book) => {
                    const checked = selectedIds.has(book.id);
                    const coverUrl = shelfCoverUrls[book.id] ?? null;
                    const author = book.author.trim() || "Unknown";
                    const pagesLabel = book.total_pages
                      ? `${book.total_pages} Pages`
                      : "— Pages";

                    return (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => toggleBook(book.id)}
                        className={cn(
                          "group flex w-[104px] flex-col text-start transition sm:w-[112px]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                        )}
                        aria-pressed={checked}
                      >
                        <span
                          className={cn(
                            "relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-background-elevated shadow-md ring-1 transition",
                            checked
                              ? "ring-2 ring-primary shadow-primary/20"
                              : "ring-black/5 group-hover:ring-primary/30",
                          )}
                        >
                          {coverUrl ? (
                            <Image
                              src={coverUrl}
                              alt=""
                              fill
                              sizes="112px"
                              className="object-cover object-center"
                              unoptimized
                              onError={() => void refreshCover(book.id)}
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20 px-1.5 text-center font-serif text-[9px] text-primary">
                              No cover
                            </span>
                          )}
                          <span
                            className={cn(
                              "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md border text-white shadow-sm transition",
                              checked
                                ? "border-primary bg-primary"
                                : "border-white/80 bg-black/25 opacity-0 group-hover:opacity-100",
                            )}
                            aria-hidden
                          >
                            {checked ? (
                              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                                <path
                                  d="M2.5 6.2 4.8 8.5 9.5 3.5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                          </span>
                        </span>
                        <span
                          className="mt-2 line-clamp-2 text-center text-[11px] font-medium leading-snug text-text/90"
                          dir="auto"
                        >
                          {book.title}
                        </span>
                        <span
                          className="mt-0.5 truncate text-center text-[10px] text-text-muted"
                          dir="auto"
                        >
                          {author}
                        </span>
                        <span className="mt-1 text-center text-[10px] text-text-muted">
                          {pagesLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#eadbc8]/80 px-4 py-3">
              <p className="text-xs text-text-muted">
                {selectedIds.size === 0
                  ? "Select books to add"
                  : `${selectedIds.size} selected`}
              </p>
              <Button
                type="button"
                disabled={selectedIds.size === 0 || savingBooks}
                onClick={() => void handleAddSelected()}
              >
                {savingBooks ? "Adding..." : "Add to list"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
