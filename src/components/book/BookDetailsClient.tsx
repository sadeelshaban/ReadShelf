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
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

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

function MetaPill({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-[#eadbc8]/80 bg-[#fbf7f0] px-3.5 py-2 text-sm text-[#5b4028]">
      {icon}
      {children}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  danger,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
          : "border-[#eadbc8] bg-white text-[#3c2a21] hover:bg-[#fbf7f0]",
        className,
      )}
    >
      {children}
    </button>
  );
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
  const readLabel = getReadButtonLabel(book);
  const isUnread = !book.last_opened_at;

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
    <div className="space-y-8">
      <Link
        href="/shelf"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8a7968] transition hover:text-primary"
      >
        <span aria-hidden>←</span> Back to shelf
      </Link>

      {(message || success) && (
        <div className="space-y-2">
          {message && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
          )}
          {success && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{success}</p>
          )}
        </div>
      )}

      <div className="flex flex-row items-start gap-5 sm:gap-8">
        <div className="w-[128px] shrink-0 sm:w-[168px] lg:w-[200px]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#f3ece2] shadow-lg ring-1 ring-black/5">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/25 font-serif text-primary">
                No cover
              </div>
            )}
            {isUnread && (
              <span className="absolute left-2 top-2 rounded-lg bg-[#f3ece2]/95 px-2 py-0.5 text-[10px] font-semibold text-[#5b4028] shadow-sm ring-1 ring-[#eadbc8] sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
                To Read
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-left">
          <h1
            className="text-left font-serif text-2xl font-semibold leading-tight text-[#3c2a21] sm:text-3xl lg:text-4xl"
            dir="auto"
          >
            {book.title}
          </h1>
          <p className="mt-2 text-left text-base text-[#8a7968] sm:text-lg" dir="auto">
            {book.author || "Unknown author"}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <MetaPill
              icon={
                <svg className="h-4 w-4 text-[#8a7968]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                </svg>
              }
            >
              {book.total_pages ?? "-"} Pages
            </MetaPill>
            <MetaPill
              icon={
                <svg className="h-4 w-4 text-[#8a7968]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                </svg>
              }
            >
              {formatAddedDate(book.created_at)} Added
            </MetaPill>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/book/${book.id}/read`}>
              <Button className="gap-2 px-5 py-2.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {readLabel}
              </Button>
            </Link>
            <ActionButton onClick={startEditing}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
              </svg>
              Edit
            </ActionButton>
            <ActionButton onClick={downloadPdf} disabled={downloading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
              </svg>
              {downloading ? "..." : "PDF"}
            </ActionButton>
            <ActionButton onClick={deleteBook} disabled={deleting} danger>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12Z" />
              </svg>
              {deleting ? "..." : "Delete"}
            </ActionButton>
          </div>

          {editing && (
            <form
              className="mt-6 space-y-4 rounded-2xl border border-[#eadbc8] bg-white p-5 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                void saveDetails();
              }}
            >
              <Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              <Input label="Author" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} />
              <div className="flex gap-3">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={cancelEditing}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[#eadbc8]/70 bg-white shadow-sm">
        <div className="flex gap-1 border-b border-[#eadbc8]/70 px-4 pt-2 sm:px-6">
          {(
            [
              { id: "highlights" as const, label: "Highlights", count: highlightGroups.length },
              { id: "notes" as const, label: "Notes", count: noteGroups.length },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition",
                tab === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-[#8a7968] hover:text-[#5b4028]",
              )}
            >
              {item.id === "highlights" ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10.5-10.5a2.12 2.12 0 1 0-3-3L5 17v3Z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                </svg>
              )}
              {item.label}
              <span className="rounded-full bg-[#f3ece2] px-2 py-0.5 text-xs font-semibold text-[#5b4028]">
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div className="max-h-[28rem] overflow-y-auto overscroll-contain">
          {tab === "highlights" &&
            (highlightGroups.length === 0 ? (
              <BookTabEmptyState variant="highlights" bookId={book.id} />
            ) : (
              <ul className="space-y-2 p-4 sm:p-6">
                {highlightGroups.map((group) => (
                  <li key={group.pageNumber}>
                    <Link
                      href={`/book/${book.id}/read?page=${group.pageNumber}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#eadbc8]/70 bg-[#fbf7f0] px-4 py-3 transition hover:border-primary/30 hover:bg-[#f7f1e5]"
                    >
                      <span className="text-sm font-medium text-[#3c2a21]">
                        Page {group.pageNumber}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {group.colors.map((color) => (
                          <span
                            key={`${group.pageNumber}-${color}`}
                            className="h-5 w-5 rounded-full border border-[#eadbc8]"
                            style={{ backgroundColor: color }}
                            title="Highlight color"
                          />
                        ))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "notes" &&
            (noteGroups.length === 0 ? (
              <BookTabEmptyState variant="notes" bookId={book.id} />
            ) : (
              <ul className="space-y-2 p-4 sm:p-6">
                {noteGroups.map((group) => (
                  <li key={group.pageNumber}>
                    <Link
                      href={`/book/${book.id}/read?page=${group.pageNumber}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#eadbc8]/70 bg-[#fbf7f0] px-4 py-3 transition hover:border-primary/30 hover:bg-[#f7f1e5]"
                    >
                      <span className="text-sm font-medium text-[#3c2a21]">
                        Page {group.pageNumber}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {group.colors.map((color) => (
                          <span
                            key={`${group.pageNumber}-${color}`}
                            className="h-5 w-5 rounded-full border border-[#eadbc8]"
                            style={{ backgroundColor: color }}
                            title="Note color"
                          />
                        ))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </section>
    </div>
  );
}
