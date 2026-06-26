"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Book, Highlight, Note } from "@/types";
import { mergeAnnotationsById } from "@/lib/annotations/merge";
import { getReadButtonLabel } from "@/lib/pdf";
import { flushSyncQueue, loadBookAnnotations } from "@/lib/offline/reader-api";
import { cacheBook } from "@/lib/offline/books-store";
import { purgeBookFromLocalCache } from "@/lib/offline/purge-book-cache";
import { noteTextCss } from "@/lib/reader/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BookTabEmptyState } from "@/components/book/BookTabEmptyState";

type BookDetailsClientProps = {
  book: Book;
  highlights: Highlight[];
  notes: Note[];
  coverUrl: string | null;
};

type Tab = "highlights" | "notes";

type PageHighlightGroup = {
  pageNumber: number;
  colors: string[];
  highlightIds: string[];
};

type PageNoteGroup = {
  pageNumber: number;
  colors: string[];
  noteIds: string[];
};

function groupHighlightsByPage(highlights: Highlight[]): PageHighlightGroup[] {
  const map = new Map<number, { colors: Set<string>; ids: string[] }>();

  for (const highlight of highlights) {
    const entry = map.get(highlight.page_number) ?? {
      colors: new Set<string>(),
      ids: [],
    };
    entry.colors.add(highlight.color || "#FFEB3B");
    entry.ids.push(highlight.id);
    map.set(highlight.page_number, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([pageNumber, { colors, ids }]) => ({
      pageNumber,
      colors: Array.from(colors),
      highlightIds: ids,
    }));
}

function groupNotesByPage(notes: Note[]): PageNoteGroup[] {
  const map = new Map<number, { colors: Set<string>; ids: string[] }>();

  for (const note of notes) {
    const entry = map.get(note.page_number) ?? {
      colors: new Set<string>(),
      ids: [],
    };
    entry.colors.add(noteTextCss(note.text_color ?? "black"));
    entry.ids.push(note.id);
    map.set(note.page_number, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([pageNumber, { colors, ids }]) => ({
      pageNumber,
      colors: Array.from(colors),
      noteIds: ids,
    }));
}

function formatAddedDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function BookDetailsClient({
  book: initialBook,
  highlights: serverHighlights,
  notes: serverNotes,
  coverUrl,
}: BookDetailsClientProps) {
  const router = useRouter();
  const [book, setBook] = useState(initialBook);
  const [displayHighlights, setDisplayHighlights] = useState(serverHighlights);
  const [displayNotes, setDisplayNotes] = useState(serverNotes);
  const [tab, setTab] = useState<Tab>("highlights");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState(initialBook.title);
  const [editAuthor, setEditAuthor] = useState(initialBook.author);

  const refreshAnnotations = useCallback(async () => {
    await flushSyncQueue();
    const local = await loadBookAnnotations(book.id);
    setDisplayHighlights(mergeAnnotationsById(serverHighlights, local.highlights));
    setDisplayNotes(mergeAnnotationsById(serverNotes, local.notes));
  }, [book.id, serverHighlights, serverNotes]);

  useEffect(() => {
    void refreshAnnotations();
  }, [refreshAnnotations]);

  useEffect(() => {
    function onFocus() {
      void refreshAnnotations();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshAnnotations]);

  const highlightGroups = groupHighlightsByPage(
    displayHighlights.filter((h) => h.highlight_type !== "pen"),
  );
  const noteGroups = groupNotesByPage(displayNotes);

  function startEditing() {
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditing(true);
    setMessage(null);
    setSuccess(null);
  }

  function cancelEditing() {
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditing(false);
  }

  async function saveDetails() {
    const title = editTitle.trim();
    if (!title) {
      setMessage("Title is required.");
      return;
    }

    setSaving(true);
    setMessage(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author: editAuthor.trim(),
        }),
      });

      const body = (await response.json()) as { book?: Book; error?: string };
      if (!response.ok || !body.book) {
        setMessage(body.error ?? "Could not save changes.");
        return;
      }

      setBook(body.book);
      await cacheBook(body.book);
      setEditing(false);
      setSuccess("Book details updated.");
      router.refresh();
    } catch {
      setMessage("Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadPdf() {
    setMessage(null);
    setDownloading(true);

    try {
      await flushSyncQueue();
      const local = await loadBookAnnotations(book.id);
      const exportHighlights = mergeAnnotationsById(serverHighlights, local.highlights);
      const exportNotes = mergeAnnotationsById(serverNotes, local.notes);

      const response = await fetch(`/api/books/${book.id}/pdf/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          highlights: exportHighlights,
          notes: exportNotes,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setMessage(body.error ?? "Could not download PDF.");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const utf8Match = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
      const asciiMatch = disposition?.match(/filename="([^"]+)"/i);
      const filename = utf8Match?.[1]
        ? decodeURIComponent(utf8Match[1])
        : asciiMatch?.[1] ?? "book.pdf";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Could not download PDF.");
    } finally {
      setDownloading(false);
    }
  }

  async function deleteBook() {
    if (
      !window.confirm(
        `Delete "${book.title}" from your shelf? This removes the PDF, cover, highlights, and notes.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await flushSyncQueue();
      const response = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setMessage(body.error ?? "Could not delete book.");
        return;
      }

      await purgeBookFromLocalCache(book.id);
      router.push("/shelf");
      router.refresh();
    } catch {
      setMessage("Could not delete book.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Link
        href="/shelf"
        className="mb-5 inline-flex items-center text-sm text-primary hover:underline"
      >
        ← Back to shelf
      </Link>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-background">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`Cover of ${book.title}`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/25 font-serif text-primary">
              No cover
            </div>
          )}
        </div>
        {editing ? (
          <form
            className="space-y-3 rounded-xl border border-soft-gray/30 bg-card px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              void saveDetails();
            }}
          >
            <Input
              label="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
            <Input
              label="Author"
              value={editAuthor}
              onChange={(e) => setEditAuthor(e.target.value)}
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                disabled={saving}
                onClick={cancelEditing}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1.5 rounded-xl border border-soft-gray/30 bg-card px-3 py-3 text-xs">
              <dt className="text-text/55">Title</dt>
              <dd className="truncate font-medium text-text" title={book.title} dir="auto">
                {book.title}
              </dd>
              <dt className="text-text/55">Author</dt>
              <dd className="truncate text-text/80" title={book.author} dir="auto">
                {book.author || "Unknown"}
              </dd>
              <dt className="text-text/55">Pages</dt>
              <dd className="text-text/80">{book.total_pages ?? "-"}</dd>
              <dt className="text-text/55">Added</dt>
              <dd className="text-text/80">{formatAddedDate(book.created_at)}</dd>
            </dl>
            <Button variant="secondary" size="sm" className="w-full" onClick={startEditing}>
              Edit details
            </Button>
          </>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{success}</p>
        )}
        <div className="flex flex-col gap-2">
          <Link href={`/book/${book.id}/read`} className="block">
            <Button className="w-full">{getReadButtonLabel(book)}</Button>
          </Link>
          <Button
            variant="secondary"
            className="w-full"
            onClick={downloadPdf}
            disabled={downloading}
          >
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </Button>
          <Button
            variant="danger"
            className="w-full"
            onClick={deleteBook}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete from shelf"}
          </Button>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col">
        {message && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        )}

        <div className="flex shrink-0 gap-2 border-b border-soft-gray/30">
          {(["highlights", "notes"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`px-4 py-2 text-sm capitalize ${
                tab === item
                  ? "border-b-2 border-primary font-medium text-primary"
                  : "text-text/70"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-4 max-h-[23.25rem] overflow-y-auto overscroll-contain pr-1">
          {tab === "highlights" && (
            <>
              {highlightGroups.length === 0 ? (
                <BookTabEmptyState variant="highlights" />
              ) : (
                <ul className="space-y-2">
                  {highlightGroups.map((group) => (
                    <li key={group.pageNumber}>
                      <Link
                        href={`/book/${book.id}/read?page=${group.pageNumber}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-soft-gray/30 bg-card px-3 py-2.5 transition hover:border-primary/30 hover:bg-accent/10"
                      >
                        <span className="text-sm font-medium text-text">
                          Page {group.pageNumber}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {group.colors.map((color) => (
                            <span
                              key={`${group.pageNumber}-${color}`}
                              className="h-5 w-5 rounded-full border border-soft-gray/40"
                              style={{ backgroundColor: color }}
                              title="Highlight color"
                            />
                          ))}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "notes" && (
            <>
              {noteGroups.length === 0 ? (
                <BookTabEmptyState variant="notes" />
              ) : (
                <ul className="space-y-2">
                  {noteGroups.map((group) => (
                    <li key={group.pageNumber}>
                      <Link
                        href={`/book/${book.id}/read?page=${group.pageNumber}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-soft-gray/30 bg-card px-3 py-2.5 transition hover:border-primary/30 hover:bg-accent/10"
                      >
                        <span className="text-sm font-medium text-text">
                          Page {group.pageNumber}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {group.colors.map((color) => (
                            <span
                              key={`${group.pageNumber}-${color}`}
                              className="h-5 w-5 rounded-full border border-soft-gray/40"
                              style={{ backgroundColor: color }}
                              title="Note color"
                            />
                          ))}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </div>
    </>
  );
}
