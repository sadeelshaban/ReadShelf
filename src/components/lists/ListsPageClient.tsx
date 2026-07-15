"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReadingListCard } from "@/components/lists/ReadingListCard";
import { ShelfControls } from "@/components/shelf/ShelfControls";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchCoverUrlsClient } from "@/lib/books/client-queries";
import { forgetCoverUrl, rememberCoverUrl } from "@/lib/books/cover-url-cache";
import {
  createReadingListClient,
  deleteReadingListClient,
  fetchReadingListsClient,
  renameReadingListClient,
} from "@/lib/reading-lists/client-queries";
import { MAX_READING_LIST_NAME_LENGTH } from "@/lib/reading-lists/names";
import { isOnline } from "@/lib/offline/online";
import { getClientCoverReadUrl } from "@/lib/storage/client-covers";
import type { ListSortOption, ReadingListWithPreview } from "@/types";
import { cn } from "@/lib/utils";

const LIST_SORT_OPTIONS = [
  { value: "recent", label: "Recently updated" },
  { value: "created", label: "Date created" },
  { value: "name", label: "Name" },
  { value: "books", label: "Book count" },
];

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-4 w-4", className)} fill="none" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ListsPageClient() {
  const router = useRouter();
  const [lists, setLists] = useState<ReadingListWithPreview[]>([]);
  const [coverUrls, setCoverUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ListSortOption>("recent");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set());

  const totalBooks = useMemo(
    () => lists.reduce((sum, list) => sum + list.book_count, 0),
    [lists],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = lists;

    if (query) {
      result = result.filter((list) => {
        if (list.name.toLowerCase().includes(query)) return true;
        return list.preview_books.some(
          (book) =>
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query),
        );
      });
    }

    return [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      if (sort === "books") return b.book_count - a.book_count;
      if (sort === "created") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [lists, search, sort]);

  const loadLists = useCallback(async () => {
    if (!isOnline()) {
      setOffline(true);
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      const fetched = await fetchReadingListsClient();
      setLists(fetched);
      setOffline(false);

      const previewBooks = fetched.flatMap((list) =>
        list.preview_books.map((book) => ({
          id: book.id,
          cover_path: book.cover_path,
        })),
      );
      if (previewBooks.length > 0) {
        const urls = await fetchCoverUrlsClient(previewBooks, { force: false });
        setCoverUrls(urls);
      } else {
        setCoverUrls({});
      }
    } catch {
      setMessage("Could not load reading lists.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    router.prefetch("/shelf");
    void loadLists();
  }, [loadLists, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setMessage(null);
    setCreating(true);
    try {
      const created = await createReadingListClient(name);
      setName("");
      setCreateOpen(false);
      const withPreview: ReadingListWithPreview = {
        ...created,
        book_count: 0,
        preview_books: [],
      };
      setEnteringIds(new Set([created.id]));
      setLists((prev) => [withPreview, ...prev]);
      window.setTimeout(() => {
        setEnteringIds((prev) => {
          const next = new Set(prev);
          next.delete(created.id);
          return next;
        });
      }, 280);
      router.push(`/lists/${created.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create list.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(listId: string, listName: string) {
    const ok = window.confirm(
      `Delete reading list "${listName}"? Books stay on your shelf.`,
    );
    if (!ok) return;
    try {
      await deleteReadingListClient(listId);
      setLists((prev) => prev.filter((list) => list.id !== listId));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not delete list.");
    }
  }

  async function handleRenameSubmit(listId: string) {
    try {
      const updated = await renameReadingListClient(listId, renameValue);
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, name: updated.name, updated_at: updated.updated_at }
            : list,
        ),
      );
      setRenamingId(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not rename list.");
    }
  }

  const refreshCover = useCallback(
    async (bookId: string) => {
      const book = lists
        .flatMap((list) => list.preview_books)
        .find((entry) => entry.id === bookId);
      if (!book?.cover_path) return;
      forgetCoverUrl(book.cover_path);
      const url = await getClientCoverReadUrl(book.cover_path);
      setCoverUrls((current) => ({ ...current, [bookId]: url }));
      if (url) rememberCoverUrl(book.cover_path, url);
    },
    [lists],
  );

  return (
    <div className="space-y-5">
      <header className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Organize
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Reading Lists
          </h1>
        </div>

        {!loading && lists.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-[#eadbc8]/80 bg-background-elevated/60 px-3.5 py-1.5 text-xs">
              <span className="font-semibold tabular-nums text-text">{lists.length}</span>{" "}
              <span className="text-text-muted">
                {lists.length === 1 ? "List" : "Lists"}
              </span>
            </div>
            <div className="rounded-full border border-[#eadbc8]/80 bg-background-elevated/60 px-3.5 py-1.5 text-xs">
              <span className="font-semibold tabular-nums text-text">{totalBooks}</span>{" "}
              <span className="text-text-muted">
                {totalBooks === 1 ? "Book" : "Books"}
              </span>
            </div>
          </div>
        )}
      </header>

      {offline && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
          Reading lists need an internet connection.
        </p>
      )}
      {message && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {message}
        </p>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-text-muted">Loading lists...</p>
      ) : lists.length === 0 ? (
        <div className="space-y-4">
          <ShelfControls
            search={search}
            sort={sort}
            onSearchChange={setSearch}
            onSortChange={(value) => setSort(value as ListSortOption)}
            searchId="lists-search"
            sortId="lists-sort"
            searchPlaceholder="List name or book..."
            sortOptions={LIST_SORT_OPTIONS}
            onAddClick={() => setCreateOpen(true)}
            addLabel="Add Reading List"
          />
          <div className="rounded-2xl border border-dashed border-[#eadbc8] bg-white px-5 py-10 text-center shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-text">
              No reading lists yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
              Create your first reading list, then pick books from your shelf.
            </p>
            <Button className="mt-5 gap-1.5" onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              Add Reading List
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ShelfControls
            search={search}
            sort={sort}
            onSearchChange={setSearch}
            onSortChange={(value) => setSort(value as ListSortOption)}
            searchId="lists-search"
            sortId="lists-sort"
            searchPlaceholder="List name or book..."
            sortOptions={LIST_SORT_OPTIONS}
            onAddClick={() => setCreateOpen(true)}
            addLabel="Add Reading List"
          />

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-text-muted">No lists match your search.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((list) => (
                <li key={list.id}>
                  {renamingId === list.id ? (
                    <form
                      className="space-y-2 rounded-2xl border border-[#eadbc8]/90 bg-white p-4 shadow-sm"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleRenameSubmit(list.id);
                      }}
                    >
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        maxLength={MAX_READING_LIST_NAME_LENGTH}
                        dir="auto"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setRenamingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <ReadingListCard
                      list={list}
                      coverUrls={coverUrls}
                      entering={enteringIds.has(list.id)}
                      onRename={() => {
                        setRenamingId(list.id);
                        setRenameValue(list.name);
                      }}
                      onDelete={() => void handleDelete(list.id, list.name)}
                      onCoverError={(bookId) => void refreshCover(bookId)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create reading list"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[#eadbc8] bg-[#fffdf9] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#eadbc8]/80 px-4 py-3">
              <h2 className="font-serif text-xl font-semibold text-text">New reading list</h2>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-text-muted hover:bg-[#eadbc8]/40"
                onClick={() => {
                  setCreateOpen(false);
                  setName("");
                }}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 p-4">
              <div className="space-y-1">
                <label htmlFor="new-list-name" className="text-xs font-medium text-[#6f4528]">
                  List name
                </label>
                <Input
                  id="new-list-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Exams / To Read"
                  maxLength={MAX_READING_LIST_NAME_LENGTH}
                  dir="auto"
                  autoFocus
                  disabled={!isOnline() || creating}
                />
              </div>
              <Button
                type="submit"
                className="w-full gap-1.5"
                disabled={!isOnline() || creating || !name.trim()}
              >
                <PlusIcon />
                {creating ? "Creating..." : "Create List"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
