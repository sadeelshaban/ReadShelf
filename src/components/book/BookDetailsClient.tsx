"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Book, Highlight, Note } from "@/types";
import { getReadButtonLabel } from "@/lib/pdf";
import { flushSyncQueue, loadBookAnnotations } from "@/lib/offline/reader-api";
import { purgeBookFromLocalCache } from "@/lib/offline/purge-book-cache";
import { noteTextCss } from "@/lib/reader/constants";
import { Button } from "@/components/ui/Button";

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
  book,
  highlights,
  notes,
  coverUrl,
}: BookDetailsClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("highlights");
  const [message, setMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const highlightGroups = groupHighlightsByPage(highlights);
  const noteGroups = groupNotesByPage(notes);

  async function downloadPdf() {
    setMessage(null);
    setDownloading(true);

    try {
      await flushSyncQueue();
      const local = await loadBookAnnotations(book.id);
      const exportHighlights =
        local.highlights.length > 0 ? local.highlights : highlights;
      const exportNotes = local.notes.length > 0 ? local.notes : notes;

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
    const response = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error ?? "Could not delete book.");
      setDeleting(false);
      return;
    }

    await purgeBookFromLocalCache(book.id);
    router.push("/shelf");
    router.refresh();
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
        <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1.5 rounded-xl border border-soft-gray/30 bg-card px-3 py-3 text-xs">
          <dt className="text-text/55">Title</dt>
          <dd className="truncate font-medium text-text" title={book.title}>
            {book.title}
          </dd>
          <dt className="text-text/55">Author</dt>
          <dd className="truncate text-text/80" title={book.author}>
            {book.author || "Unknown"}
          </dd>
          <dt className="text-text/55">Pages</dt>
          <dd className="text-text/80">{book.total_pages ?? "—"}</dd>
          <dt className="text-text/55">Added</dt>
          <dd className="text-text/80">{formatAddedDate(book.created_at)}</dd>
        </dl>
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
                <p className="text-sm text-text/70">No highlights yet.</p>
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
                <p className="text-sm text-text/70">No notes yet.</p>
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
