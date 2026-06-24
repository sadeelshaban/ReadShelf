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

  const totalAnnotations = highlightGroups.length + noteGroups.length;

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
        <source src="/videos/book-details-background.mp4" type="video/mp4" />
      </video>
      <div className="video-hero-overlay absolute inset-0" />
      <div className="video-book-overlay absolute inset-0" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-7xl flex-col px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <Link
          href="/shelf"
          className="mb-5 inline-flex items-center text-sm text-white/78 hover:text-white hover:underline"
        >
          ← Back to shelf
        </Link>

        <section className="rounded-[2rem] border border-white/16 bg-white/10 p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:p-6 lg:p-7">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/62">
                Book details
              </p>
              <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl" dir="auto">
                {book.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/76 sm:text-base" dir="auto">
                {book.author || "Unknown author"} · {book.total_pages ?? "—"} pages · Added{" "}
                {formatAddedDate(book.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-2.5 text-sm shadow-sm backdrop-blur-md">
                <span className="text-white/60">Progress</span>
                <span className="ml-2 font-semibold text-white">{book.progress_percent}%</span>
              </div>
              <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-2.5 text-sm shadow-sm backdrop-blur-md">
                <span className="text-white/60">Last page</span>
                <span className="ml-2 font-semibold text-white">{book.last_page}</span>
              </div>
              <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-2.5 text-sm shadow-sm backdrop-blur-md">
                <span className="text-white/60">Annotations</span>
                <span className="ml-2 font-semibold text-white">{totalAnnotations}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-white/14 bg-black/10 shadow-xl backdrop-blur-md">
                <div className="relative aspect-[3/4] overflow-hidden">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={`Cover of ${book.title}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/20 to-white/8 px-6 text-center font-serif text-xl text-white/88">
                      No cover
                    </div>
                  )}
                </div>
              </div>

              {editing ? (
                <form
                  className="space-y-3 rounded-[1.5rem] border border-white/14 bg-black/10 p-4 backdrop-blur-md"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveDetails();
                  }}
                >
                  <Input
                    label="Title"
                    labelClassName="text-white"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="border-white/20 bg-white/92 text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
                  />
                  <Input
                    label="Author"
                    labelClassName="text-white"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="border-white/20 bg-white/92 text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button type="submit" size="sm" className="w-full" disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full border-white/18 bg-white/14 text-white hover:bg-white/20"
                      disabled={saving}
                      onClick={cancelEditing}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="rounded-[1.5rem] border border-white/14 bg-black/10 p-4 backdrop-blur-md">
                  <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2 text-sm">
                    <dt className="text-white/52">Title</dt>
                    <dd className="font-medium text-white" title={book.title} dir="auto">
                      {book.title}
                    </dd>
                    <dt className="text-white/52">Author</dt>
                    <dd className="text-white/82" title={book.author} dir="auto">
                      {book.author || "Unknown"}
                    </dd>
                    <dt className="text-white/52">Pages</dt>
                    <dd className="text-white/82">{book.total_pages ?? "—"}</dd>
                    <dt className="text-white/52">Added</dt>
                    <dd className="text-white/82">{formatAddedDate(book.created_at)}</dd>
                  </dl>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4 w-full border-white/18 bg-white/14 text-white hover:bg-white/20"
                    onClick={startEditing}
                  >
                    Edit details
                  </Button>
                </div>
              )}

              {success && (
                <p className="rounded-2xl border border-[#d9c7a7]/24 bg-[#f6eedf]/88 px-4 py-3 text-sm text-[#5b4028]">
                  {success}
                </p>
              )}

              <div className="grid gap-2.5">
                <Link href={`/book/${book.id}/read`} className="block">
                  <Button className="w-full">{getReadButtonLabel(book)}</Button>
                </Link>
                <Button
                  variant="secondary"
                  className="w-full border-white/18 bg-white/14 text-white hover:bg-white/20"
                  onClick={downloadPdf}
                  disabled={downloading}
                >
                  {downloading ? "Preparing PDF..." : "Download PDF"}
                </Button>
                <Button
                  className="w-full border border-red-300/18 bg-red-900/55 text-white hover:bg-red-800/70"
                  onClick={deleteBook}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete from shelf"}
                </Button>
              </div>
            </aside>

            <section className="flex min-h-0 flex-col rounded-[1.75rem] border border-white/14 bg-black/10 p-4 backdrop-blur-md sm:p-5">
              {message && (
                <p className="mb-4 rounded-2xl border border-[#e5c79d]/28 bg-[#2f241b]/52 px-4 py-3 text-sm text-[#fff4e3] backdrop-blur-md">
                  {message}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                {([
                  { key: "highlights" as Tab, label: "Highlights", count: highlightGroups.length },
                  { key: "notes" as Tab, label: "Notes", count: noteGroups.length },
                ]).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      tab === item.key
                        ? "bg-white/92 font-medium text-primary shadow-sm"
                        : "border border-white/10 bg-white/8 text-white/78 hover:bg-white/14"
                    }`}
                  >
                    {item.label}
                    <span className="ml-2 text-xs opacity-75">{item.count}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5 max-h-[34rem] overflow-y-auto overscroll-contain pr-1">
                {tab === "highlights" && (
                  <>
                    {highlightGroups.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-white/14 bg-white/6 px-5 py-8 text-center">
                        <p className="text-base font-medium text-white">No highlights yet</p>
                        <p className="mt-2 text-sm text-white/66">
                          Open the reader and start marking the important parts of this book.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {highlightGroups.map((group) => (
                          <li key={group.pageNumber}>
                            <Link
                              href={`/book/${book.id}/read?page=${group.pageNumber}`}
                              className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/12 bg-white/8 px-4 py-3 transition hover:border-white/22 hover:bg-white/14"
                            >
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  Page {group.pageNumber}
                                </p>
                                <p className="mt-1 text-xs text-white/60">
                                  {group.highlightIds.length} highlight
                                  {group.highlightIds.length === 1 ? "" : "s"}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                {group.colors.map((color) => (
                                  <span
                                    key={`${group.pageNumber}-${color}`}
                                    className="h-5 w-5 rounded-full border border-white/35 shadow-sm"
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
                      <div className="rounded-[1.5rem] border border-dashed border-white/14 bg-white/6 px-5 py-8 text-center">
                        <p className="text-base font-medium text-white">No notes yet</p>
                        <p className="mt-2 text-sm text-white/66">
                          Add comments in the reader and they will show up here page by page.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {noteGroups.map((group) => (
                          <li key={group.pageNumber}>
                            <Link
                              href={`/book/${book.id}/read?page=${group.pageNumber}`}
                              className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/12 bg-white/8 px-4 py-3 transition hover:border-white/22 hover:bg-white/14"
                            >
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  Page {group.pageNumber}
                                </p>
                                <p className="mt-1 text-xs text-white/60">
                                  {group.noteIds.length} note{group.noteIds.length === 1 ? "" : "s"}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                {group.colors.map((color) => (
                                  <span
                                    key={`${group.pageNumber}-${color}`}
                                    className="h-5 w-5 rounded-full border border-white/35 shadow-sm"
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
        </section>
      </div>
    </section>
  );
}
