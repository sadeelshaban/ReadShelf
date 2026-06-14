import type { Highlight, Note } from "@/types";
import {
  idbDelete,
  idbGetAllByIndex,
  idbPut,
} from "@/lib/offline/db";
import { isOnline } from "@/lib/offline/online";

export async function getLocalHighlights(bookId: string) {
  return idbGetAllByIndex<Highlight>("highlights", "book_id", bookId);
}

export async function getLocalNotes(bookId: string) {
  return idbGetAllByIndex<Note>("notes", "book_id", bookId);
}

export async function putLocalHighlight(highlight: Highlight) {
  await idbPut("highlights", highlight);
}

export async function putLocalNote(note: Note) {
  await idbPut("notes", note);
}

export async function deleteLocalNote(id: string) {
  await idbDelete("notes", id);
}

export async function seedBookAnnotations(
  bookId: string,
  highlights: Highlight[],
  notes: Note[],
) {
  if (!isOnline()) {
    return {
      highlights: await getLocalHighlights(bookId),
      notes: await getLocalNotes(bookId),
    };
  }

  for (const highlight of highlights) {
    await putLocalHighlight(highlight);
  }
  for (const note of notes) {
    await putLocalNote(note);
  }

  return {
    highlights: await getLocalHighlights(bookId),
    notes: await getLocalNotes(bookId),
  };
}

export async function getLocalNoteById(id: string) {
  const { idbGet } = await import("@/lib/offline/db");
  return idbGet<Note>("notes", id);
}

export async function loadBookAnnotations(bookId: string) {
  return {
    highlights: await getLocalHighlights(bookId),
    notes: await getLocalNotes(bookId),
  };
}
