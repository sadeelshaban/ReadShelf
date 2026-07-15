"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createReadingListClient,
  deleteReadingListClient,
  fetchReadingListsClient,
} from "@/lib/reading-lists/client-queries";
import {
  MAX_READING_LIST_NAME_LENGTH,
  readingListBookCountLabel,
} from "@/lib/reading-lists/names";
import { isOnline } from "@/lib/offline/online";
import type { ReadingListWithCount } from "@/types";
import { cn } from "@/lib/utils";

export function ListsPageClient() {
  const router = useRouter();
  const [lists, setLists] = useState<ReadingListWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setMessage(null);
    setCreating(true);
    try {
      const created = await createReadingListClient(name);
      setName("");
      setLists((prev) => [{ ...created, book_count: 0 }, ...prev]);
      router.push(`/lists/${created.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create list.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(listId: string, listName: string) {
    const ok = window.confirm(`Delete reading list "${listName}"? Books stay on your shelf.`);
    if (!ok) return;
    try {
      await deleteReadingListClient(listId);
      setLists((prev) => prev.filter((list) => list.id !== listId));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not delete list.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Organize
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Reading Lists
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text-muted">
            أنشئ قوائم وسمّها بأي اسم عربي أو إنجليزي، ثم أضف كتبك من الـ shelf.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-2xl border border-[#eadbc8]/80 bg-[#fff8f1] p-4 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <label htmlFor="list-name" className="text-xs font-medium text-[#6f4528]">
              اسم القائمة
            </label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: امتحانات / To Read"
              maxLength={MAX_READING_LIST_NAME_LENGTH}
              dir="auto"
              disabled={!isOnline() || creating}
            />
          </div>
          <Button type="submit" disabled={!isOnline() || creating || !name.trim()}>
            {creating ? "Creating..." : "Create list"}
          </Button>
        </form>

        {offline && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Reading lists need an internet connection.
          </p>
        )}
        {message && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </p>
        )}
      </header>

      {loading ? (
        <p className="py-10 text-center text-sm text-text-muted">Loading lists...</p>
      ) : lists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#eadbc8] bg-[#fffdf9] px-6 py-14 text-center">
          <h2 className="font-serif text-2xl font-semibold text-text">No lists yet</h2>
          <p className="mx-auto mt-3 max-w-md text-text-muted">
            Create your first reading list above, then pick books from your shelf.
          </p>
          <Link href="/shelf" className="mt-6 inline-block text-sm font-medium text-primary underline">
            Go to shelf
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lists.map((list) => (
            <li key={list.id}>
              <div
                className={cn(
                  "flex items-stretch gap-2 rounded-2xl border border-[#eadbc8]/80 bg-[#fff8f1] p-2 transition",
                  "hover:border-primary/30 hover:shadow-sm",
                )}
              >
                <Link
                  href={`/lists/${list.id}`}
                  className="min-w-0 flex-1 rounded-xl px-3 py-3"
                  dir="auto"
                >
                  <p className="truncate font-serif text-lg font-semibold text-text">
                    {list.name}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {readingListBookCountLabel(list.book_count)}
                  </p>
                </Link>
                <button
                  type="button"
                  className="shrink-0 self-center rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  onClick={() => void handleDelete(list.id, list.name)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
