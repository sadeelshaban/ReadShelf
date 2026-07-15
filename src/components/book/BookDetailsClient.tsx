"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Book, Bookmark, Highlight, Note } from "@/types";
import { mergeAnnotationsById } from "@/lib/annotations/merge";
import { getReadButtonLabel } from "@/lib/pdf";
import { formatLastOpened, formatReadCount } from "@/lib/books/reading-stats";
import { rememberCoverUrl } from "@/lib/books/cover-url-cache";
import { bookmarkColorHex } from "@/lib/reader/bookmarks";
import {
  HIGHLIGHT_PRESETS,
  NOTE_TEXT_COLORS,
  normalizeHex,
  noteTextCss,
} from "@/lib/reader/constants";
import { flushSyncQueue, loadBookAnnotations, loadBookBookmarks } from "@/lib/offline/reader-api";
import { cacheBook } from "@/lib/offline/books-store";
import { purgeBookFromLocalCache } from "@/lib/offline/purge-book-cache";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BookTabEmptyState } from "@/components/book/BookTabEmptyState";
import {
  TabBookmarkIcon,
  TabHighlighterIcon,
  TabNoteIcon,
} from "@/components/book/BookDetailTabIcons";
import { ReadBookIcon } from "@/components/icons/ReadBookIcon";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BookDetailsClientProps = {
  book: Book;
  highlights: Highlight[];
  notes: Note[];
  bookmarks: Bookmark[];
  coverUrl: string | null;
};

type Tab = "highlights" | "notes" | "bookmarks";

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
    entry.colors.add(noteTextCss(note.text_color ?? "yellow"));
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

function highlightColorLabel(color: string) {
  const normalized = normalizeHex(color).toLowerCase();
  const preset = HIGHLIGHT_PRESETS.find((p) => p.value.toLowerCase() === normalized);
  return preset ? `${preset.name} highlight` : "Highlight";
}

function noteColorLabel(cssColor: string) {
  const match = NOTE_TEXT_COLORS.find((c) => c.css.toLowerCase() === cssColor.toLowerCase());
  return match ? `${match.name} note` : "Note";
}

function PageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0 text-[#8B6F52]", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
    </svg>
  );
}

function MetaPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#eadbc8]/90 bg-[#fff8f1] px-4 py-2 text-sm text-[#5b4028] transition duration-200 hover:border-primary/25 hover:shadow-sm">
      {icon}
      {children}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "secondary",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "secondary" | "outline" | "danger";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 min-w-[5.5rem] items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "danger" &&
          "border border-red-200 bg-white text-red-600 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm",
        variant === "outline" &&
          "border border-[#eadbc8] bg-transparent text-[#3c2a21] hover:-translate-y-0.5 hover:bg-[#fff8f1] hover:shadow-sm",
        variant === "secondary" &&
          "border border-[#eadbc8] bg-white text-[#3c2a21] hover:-translate-y-0.5 hover:bg-[#fbf7f0] hover:shadow-sm",
        className,
      )}
    >
      {children}
    </button>
  );
}

function AnnotationCard({
  href,
  pageNumber,
  subtitle,
  colors,
  colorLabel,
}: {
  href: string;
  pageNumber: number;
  subtitle?: string;
  colors: string[];
  colorLabel: (color: string) => string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-xl border border-[#eadbc8]/70 bg-[#fff8f1] px-4 py-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[#fffdf9] hover:shadow-[0_8px_20px_rgba(31,22,16,0.08)]"
    >
      <div className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#3c2a21]">
          <PageIcon />
          Page {pageNumber}
        </span>
        {subtitle && (
          <p className="mt-1 pl-6 text-xs font-medium text-[#8a7968]">{subtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {colors.map((color) => (
          <span
            key={`${pageNumber}-${color}`}
            className="h-3.5 w-3.5 rounded-full border border-[#eadbc8]/90 shadow-sm"
            style={{ backgroundColor: color }}
            title={colorLabel(color)}
          />
        ))}
      </div>
    </Link>
  );
}

export function BookDetailsClient({
  book: initialBook,
  highlights: serverHighlights,
  notes: serverNotes,
  bookmarks: serverBookmarks,
  coverUrl,
}: BookDetailsClientProps) {
  const router = useRouter();
  const [book, setBook] = useState(initialBook);
  const [displayHighlights, setDisplayHighlights] = useState(serverHighlights);
  const [displayNotes, setDisplayNotes] = useState(serverNotes);
  const [displayBookmarks, setDisplayBookmarks] = useState(serverBookmarks);
  const [tab, setTab] = useState<Tab>("bookmarks");
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
    const bookmarks = await loadBookBookmarks(book.id);
    setDisplayHighlights(mergeAnnotationsById(serverHighlights, local.highlights));
    setDisplayNotes(mergeAnnotationsById(serverNotes, local.notes));
    setDisplayBookmarks(bookmarks);
  }, [book.id, serverHighlights, serverNotes]);

  useEffect(() => {
    void refreshAnnotations();
  }, [refreshAnnotations]);

  useEffect(() => {
    router.prefetch("/shelf");
    rememberCoverUrl(book.cover_path, coverUrl);
  }, [router, book.cover_path, coverUrl]);

  useEffect(() => {
    function onFocus() {
      void refreshAnnotations();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshAnnotations]);

  const highlightGroups = groupHighlightsByPage(
    displayHighlights.filter(
      (h) => h.highlight_type !== "pen" && !h.highlight_type.startsWith("shape_"),
    ),
  );
  const noteGroups = groupNotesByPage(displayNotes);
  const readLabel = getReadButtonLabel(book);
  const isUnread = !book.last_opened_at;
  const isCompleted = book.progress_percent >= 100;
  const lastOpenedLabel = book.last_opened_at ? formatLastOpened(book.last_opened_at) : null;
  const readCountLabel = formatReadCount(book.read_count ?? 0);
  const progressPercent = Math.min(100, Math.max(0, book.progress_percent ?? 0));

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
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-4">
      <Link
        href="/shelf"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8a7968] transition duration-200 hover:text-primary"
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

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(140px,200px)_1fr] lg:gap-10">
        <div className="mx-auto w-[140px] shrink-0 sm:w-[168px] lg:mx-0 lg:w-full">
          <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#f3ece2] shadow-[0_12px_28px_rgba(0,0,0,0.12)] ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.14)]">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover transition duration-200 group-hover:scale-[1.02]"
                unoptimized
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/25 font-serif text-primary">
                No cover
              </div>
            )}
            {isUnread && (
              <span className="absolute left-2 top-2 rounded-lg bg-[#fff8f1]/95 px-2 py-0.5 text-[10px] font-semibold text-[#5b4028] shadow-sm ring-1 ring-[#eadbc8] sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
                To Read
              </span>
            )}
            {isCompleted && (
              <span className="absolute right-2 top-2 rounded-lg bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
                Completed
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 text-left">
          <h1
            className="text-left font-serif text-[2.5rem] font-bold leading-[1.2] text-[#3c2a21]"
            dir="auto"
          >
            {book.title}
          </h1>
          <p className="mt-2 text-left text-lg text-[#8B6F52]" dir="auto">
            {book.author || "Unknown author"}
          </p>

          {progressPercent > 0 && (
            <div className="mt-5 max-w-md">
              <div className="flex items-center justify-between text-xs font-medium text-[#8a7968]">
                <span>Reading progress</span>
                <span className="tabular-nums text-[#5b4028]">{progressPercent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eadbc8]/70">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
            <MetaPill
              icon={
                <svg className="h-4 w-4 text-[#8B6F52]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                </svg>
              }
            >
              {book.total_pages ?? "-"} Pages
            </MetaPill>
            <MetaPill
              icon={
                <svg className="h-4 w-4 text-[#8B6F52]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                </svg>
              }
            >
              {formatAddedDate(book.created_at)}
            </MetaPill>
            {lastOpenedLabel && (
              <MetaPill
                icon={
                  <svg className="h-4 w-4 text-[#8B6F52]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 7v5l3 2" />
                  </svg>
                }
              >
                Last opened {lastOpenedLabel}
              </MetaPill>
            )}
            {readCountLabel && (
              <MetaPill
                icon={
                  <svg className="h-4 w-4 text-[#8B6F52]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                  </svg>
                }
              >
                {readCountLabel}
              </MetaPill>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/book/${book.id}/read`}>
              <Button className="h-11 gap-2 px-6 transition duration-200 hover:-translate-y-0.5">
                <ReadBookIcon />
                {readLabel}
              </Button>
            </Link>
            <ActionButton onClick={startEditing}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
              </svg>
              Edit
            </ActionButton>
            <ActionButton variant="outline" onClick={downloadPdf} disabled={downloading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
              </svg>
              {downloading ? "..." : "PDF"}
            </ActionButton>
            <ActionButton variant="danger" onClick={deleteBook} disabled={deleting}>
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
                <Button type="submit" size="sm" disabled={saving} className="h-11">
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="secondary" size="sm" disabled={saving} className="h-11" onClick={cancelEditing}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[#eadbc8]/70 bg-white shadow-[0_8px_24px_rgba(31,22,16,0.06)]">
        <div className="flex gap-1 border-b border-[#eadbc8]/70 px-4 pt-1 sm:px-6">
          {(
            [
              { id: "bookmarks" as const, label: "Bookmarks", count: displayBookmarks.length },
              { id: "highlights" as const, label: "Highlights", count: highlightGroups.length },
              { id: "notes" as const, label: "Notes", count: noteGroups.length },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex items-center gap-2 border-b-[3px] px-4 py-3 text-sm font-medium transition duration-[250ms]",
                tab === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-[#8a7968] hover:border-[#eadbc8] hover:text-[#5b4028]",
              )}
            >
              {item.id === "bookmarks" ? (
                <TabBookmarkIcon active={tab === item.id} />
              ) : item.id === "highlights" ? (
                <TabHighlighterIcon active={tab === item.id} />
              ) : (
                <TabNoteIcon active={tab === item.id} />
              )}
              {item.label}
              <span className="rounded-full bg-[#fff8f1] px-2 py-0.5 text-xs font-semibold text-[#5b4028] ring-1 ring-[#eadbc8]/80">
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div key={tab} className="book-tab-panel max-h-[28rem] overflow-y-auto overscroll-contain readshelf-scroll">
          {tab === "highlights" &&
            (highlightGroups.length === 0 ? (
              <BookTabEmptyState variant="highlights" bookId={book.id} />
            ) : (
              <ul className="space-y-3 p-4 sm:p-6">
                {highlightGroups.map((group) => (
                  <li key={group.pageNumber}>
                    <AnnotationCard
                      href={`/book/${book.id}/read?page=${group.pageNumber}`}
                      pageNumber={group.pageNumber}
                      subtitle={
                        group.highlightIds.length > 1
                          ? `${group.highlightIds.length} highlights`
                          : undefined
                      }
                      colors={group.colors}
                      colorLabel={highlightColorLabel}
                    />
                  </li>
                ))}
              </ul>
            ))}

          {tab === "notes" &&
            (noteGroups.length === 0 ? (
              <BookTabEmptyState variant="notes" bookId={book.id} />
            ) : (
              <ul className="space-y-3 p-4 sm:p-6">
                {noteGroups.map((group) => (
                  <li key={group.pageNumber}>
                    <AnnotationCard
                      href={`/book/${book.id}/read?page=${group.pageNumber}`}
                      pageNumber={group.pageNumber}
                      subtitle={
                        group.noteIds.length > 1
                          ? `${group.noteIds.length} notes`
                          : undefined
                      }
                      colors={group.colors}
                      colorLabel={noteColorLabel}
                    />
                  </li>
                ))}
              </ul>
            ))}

          {tab === "bookmarks" &&
            (displayBookmarks.length === 0 ? (
              <BookTabEmptyState variant="bookmarks" bookId={book.id} />
            ) : (
              <ul className="space-y-3 p-4 sm:p-6">
                {displayBookmarks.map((bookmark) => (
                  <li key={bookmark.id}>
                    <Link
                      href={`/book/${book.id}/read?page=${bookmark.page_number}`}
                      className="flex items-start justify-between gap-4 rounded-xl border border-[#eadbc8]/70 bg-[#fff8f1] px-4 py-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[#fffdf9] hover:shadow-[0_8px_20px_rgba(31,22,16,0.08)]"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-[#3c2a21]">
                          <PageIcon />
                          {bookmark.label || `Page ${bookmark.page_number}`}
                        </p>
                        <p className="mt-1 pl-6 text-xs text-[#8a7968]">
                          Page {bookmark.page_number}
                        </p>
                      </div>
                      <span
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-[#eadbc8]/90 shadow-sm"
                        style={{ backgroundColor: bookmarkColorHex(bookmark.color) }}
                        title={`${bookmark.color} bookmark`}
                      />
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
