"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createReadingListClient,
  deleteReadingListClient,
  fetchReadingListsClient,
  renameReadingListClient,
} from "@/lib/reading-lists/client-queries";
import {
  MAX_READING_LIST_NAME_LENGTH,
  readingListBookCountLabel,
} from "@/lib/reading-lists/names";
import { isOnline } from "@/lib/offline/online";
import type { ReadingListWithCount } from "@/types";
import { cn } from "@/lib/utils";

function formatCreated(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" aria-hidden>
      <path
        d="M6 5.5h12v14l-2.4-1.6L12 19.5l-3.6-1.6L6 19.5V5.5z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path d="M9 9.5h6M9 12.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-4 w-4", className)} fill="none" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ListsPageClient() {
  const router = useRouter();
  const [lists, setLists] = useState<ReadingListWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const totalBooks = useMemo(
    () => lists.reduce((sum, list) => sum + list.book_count, 0),
    [lists],
  );

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

  useEffect(() => {
    if (!menuId) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuId(null);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setMessage(null);
    setCreating(true);
    try {
      const created = await createReadingListClient(name);
      setName("");
      const withCount = { ...created, book_count: 0 };
      setEnteringIds(new Set([created.id]));
      setLists((prev) => [withCount, ...prev]);
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
    setMenuId(null);
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
          list.id === listId ? { ...list, name: updated.name, updated_at: updated.updated_at } : list,
        ),
      );
      setRenamingId(null);
      setMenuId(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not rename list.");
    }
  }

  function focusCreate() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = formRef.current?.querySelector("input");
    input?.focus();
  }

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Organize
          </p>
          <h1 className="mt-0.5 font-serif text-[1.85rem] font-semibold tracking-tight text-text sm:text-[2.05rem]">
            Reading Lists
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-text-muted">
            Create named lists in Arabic or English, then add books from your shelf.
          </p>
        </div>

        {!loading && lists.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadbc8] bg-white px-3 py-1 text-xs font-medium text-[#5b4028]">
              <ListIcon className="h-3.5 w-3.5 text-primary" />
              {lists.length} {lists.length === 1 ? "List" : "Lists"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadbc8] bg-white px-3 py-1 text-xs font-medium text-[#5b4028]">
              {totalBooks} {totalBooks === 1 ? "Book" : "Books"}
            </span>
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={handleCreate}
          className="flex flex-col gap-2.5 rounded-2xl border border-[#eadbc8]/90 bg-white p-3 shadow-sm sm:flex-row sm:items-end sm:gap-3 sm:p-3.5"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="list-name" className="text-xs font-medium text-[#6f4528]">
              List name
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                  <path
                    d="M3.5 6.5h4.2l1.3 1.4H16.5v7.6H3.5V6.5z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <Input
                id="list-name"
                className="pl-9"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Exams / To Read"
                maxLength={MAX_READING_LIST_NAME_LENGTH}
                dir="auto"
                disabled={!isOnline() || creating}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            className="gap-1.5 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
            disabled={!isOnline() || creating || !name.trim()}
          >
            <PlusIcon />
            {creating ? "Creating..." : "Create List"}
          </Button>
        </form>

        {offline && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            Reading lists need an internet connection.
          </p>
        )}
        {message && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {message}
          </p>
        )}
      </header>

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">Loading lists...</p>
      ) : lists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#eadbc8] bg-white px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1dc] text-primary">
            <ListIcon className="h-6 w-6" />
          </div>
          <h2 className="mt-3 font-serif text-xl font-semibold text-text">
            No reading lists yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            Create your first reading list, then pick books from your shelf.
          </p>
          <Button className="mt-5 gap-1.5" onClick={focusCreate}>
            <PlusIcon />
            Create List
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <li
              key={list.id}
              className={cn(
                "relative rounded-2xl border border-[#eadbc8]/90 bg-white p-3.5 shadow-sm transition duration-200",
                "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
                enteringIds.has(list.id) && "list-card-enter",
              )}
            >
              {renamingId === list.id ? (
                <form
                  className="space-y-2"
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
                <>
                  <div className="flex items-start gap-2.5">
                    <Link
                      href={`/lists/${list.id}`}
                      className="flex min-w-0 flex-1 items-start gap-2.5"
                      dir="auto"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff1dc] text-primary">
                        <ListIcon />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-serif text-lg font-semibold text-text">
                          {list.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-text-muted">
                          {readingListBookCountLabel(list.book_count)}
                        </span>
                        <span className="mt-1 block text-[11px] text-text-muted/80">
                          Created {formatCreated(list.created_at)}
                        </span>
                      </span>
                    </Link>

                    <div className="relative shrink-0" ref={menuId === list.id ? menuRef : undefined}>
                      <button
                        type="button"
                        aria-label="List options"
                        className="rounded-lg px-2 py-1 text-text-muted hover:bg-[#f4ebe0] hover:text-text"
                        onClick={() =>
                          setMenuId((current) => (current === list.id ? null : list.id))
                        }
                      >
                        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                          <circle cx="8" cy="3.5" r="1.2" fill="currentColor" />
                          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                          <circle cx="8" cy="12.5" r="1.2" fill="currentColor" />
                        </svg>
                      </button>
                      {menuId === list.id && (
                        <div className="absolute right-0 z-20 mt-1 min-w-[8.5rem] overflow-hidden rounded-xl border border-[#eadbc8] bg-white py-1 shadow-lg">
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-[#fff8f1]"
                            onClick={() => {
                              setRenamingId(list.id);
                              setRenameValue(list.name);
                              setMenuId(null);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            onClick={() => void handleDelete(list.id, list.name)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
