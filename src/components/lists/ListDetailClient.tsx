"use client";

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

export function ListDetailClient({ listId }: ListDetailClientProps) {
  const [list, setList] = useState<ReadingList | null>(null);
  const [books, setBooks] = useState<BookWithCounts[]>([]);
  const [coverUrls, setCoverUrls] = useState<Record<string, string | null>>({});
  const [allShelfBooks, setAllShelfBooks] = useState<BookWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savingBooks, setSavingBooks] = useState(false);

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
      const book = books.find((entry) => entry.id === bookId);
      if (!book?.cover_path) return;
      forgetCoverUrl(book.cover_path);
      const url = await getClientCoverReadUrl(book.cover_path);
      setCoverUrls((current) => ({ ...current, [bookId]: url }));
      if (url) rememberCoverUrl(book.cover_path, url);
    },
    [books],
  );

  if (loading) {
    return <p className="py-16 text-center text-sm text-text-muted">Loading list...</p>;
  }

  if (!list) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-text-muted">{message ?? "List not found."}</p>
        <Link href="/lists" className="text-sm font-medium text-primary underline">
          Back to lists
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/lists" className="text-text-muted hover:text-primary">
            ← Lists
          </Link>
          <span className="text-text-muted">/</span>
          <Link href="/shelf" className="text-text-muted hover:text-primary">
            Shelf
          </Link>
        </div>

        <form onSubmit={handleRename} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <label htmlFor="rename-list" className="text-xs font-medium text-text-muted">
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
          <Button type="button" onClick={() => setPickerOpen(true)}>
            Add books
          </Button>
        </form>

        <p className="text-sm text-text-muted">
          {readingListBookCountLabel(books.length)}
        </p>

        {message && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </p>
        )}
      </header>

      <ShelfGrid
        books={books}
        coverUrls={coverUrls}
        onCoverError={(bookId) => void refreshCover(bookId)}
        emptyState={
          <div className="rounded-2xl border border-dashed border-[#eadbc8] bg-[#fffdf9] px-6 py-14 text-center">
            <h2 className="font-serif text-2xl font-semibold text-text">
              This list is empty
            </h2>
            <p className="mx-auto mt-3 max-w-md text-text-muted">
              Add books from your shelf to start reading from this list.
            </p>
            <Button className="mt-6" onClick={() => setPickerOpen(true)}>
              Add books from shelf
            </Button>
          </div>
        }
      />

      {books.length > 0 && (
        <ul className="space-y-2 rounded-2xl border border-[#eadbc8]/70 bg-[#fff8f1] p-4">
          <li className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Manage books in list
          </li>
          {books.map((book) => (
            <li
              key={book.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm text-text" dir="auto">
                {book.title}
              </span>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                onClick={() => void handleRemove(book.id, book.title)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add books to list"
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-[#eadbc8] bg-[#fffdf9] shadow-xl"
          >
            <div className="border-b border-[#eadbc8]/80 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl font-semibold text-text">
                  Add from shelf
                </h2>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm text-text-muted hover:bg-[#eadbc8]/40"
                  onClick={() => {
                    setPickerOpen(false);
                    setSelectedIds(new Set());
                    setPickerQuery("");
                  }}
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

            <div className="max-h-[50vh] overflow-y-auto p-3">
              {availableBooks.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-muted">
                  {allShelfBooks.length === 0
                    ? "Your shelf is empty."
                    : "All shelf books are already in this list."}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {availableBooks.map((book) => {
                    const checked = selectedIds.has(book.id);
                    return (
                      <li key={book.id}>
                        <button
                          type="button"
                          onClick={() => toggleBook(book.id)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-start transition",
                            checked
                              ? "border-primary/40 bg-[#fff1dc]"
                              : "border-transparent bg-white/70 hover:border-[#eadbc8]",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              checked
                                ? "border-primary bg-primary text-white"
                                : "border-[#cbb79f] bg-white",
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
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-text" dir="auto">
                              {book.title}
                            </span>
                            <span className="block truncate text-xs text-text-muted" dir="auto">
                              {book.author}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#eadbc8]/80 px-4 py-3">
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
