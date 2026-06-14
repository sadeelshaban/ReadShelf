import { createClient } from "@/lib/supabase/client";
import type {
  Highlight,
  HighlightPosition,
  HighlightStroke,
  Note,
  NotePosition,
} from "@/types";
import {
  deleteLocalNote,
  getLocalNoteById,
  loadBookAnnotations,
  putLocalHighlight,
  putLocalNote,
  seedBookAnnotations,
} from "@/lib/offline/annotations-store";
import { updateCachedBookProgress } from "@/lib/offline/books-store";
import { idbDelete, idbGetAll } from "@/lib/offline/db";
import { isOnline } from "@/lib/offline/online";
import { loadPdfBuffer } from "@/lib/offline/pdf-cache";
import {
  enqueueSync,
  flushSyncQueue,
  removeSyncItemsForRecord,
} from "@/lib/offline/sync-queue";
import { computeProgress } from "@/lib/pdf";

function newId() {
  return crypto.randomUUID();
}

async function syncIfOnline() {
  if (isOnline()) {
    await flushSyncQueue();
  }
}

async function enqueueBookProgress(
  bookId: string,
  payload: Record<string, unknown>,
) {
  const pending = await idbGetAll<{
    id: string;
    entity: string;
    recordId: string;
    status: string;
  }>("syncQueue");

  await Promise.all(
    pending
      .filter(
        (item) =>
          item.entity === "book" &&
          item.recordId === bookId &&
          item.status === "pending",
      )
      .map((item) => idbDelete("syncQueue", item.id)),
  );

  await enqueueSync({
    id: newId(),
    entity: "book",
    op: "update",
    recordId: bookId,
    payload,
    createdAt: new Date().toISOString(),
  });
}

export { loadPdfBuffer, seedBookAnnotations, loadBookAnnotations, flushSyncQueue };

export async function saveReadingProgress(
  bookId: string,
  currentPage: number,
  totalPages: number | null,
) {
  const progressPercent = computeProgress(currentPage, totalPages);
  const payload = {
    last_page: currentPage,
    progress_percent: progressPercent,
    last_opened_at: new Date().toISOString(),
  };

  await updateCachedBookProgress(bookId, payload);

  if (isOnline()) {
    const supabase = createClient();
    const { error } = await supabase.from("books").update(payload).eq("id", bookId);
    if (error) {
      await enqueueBookProgress(bookId, payload);
    }
    return;
  }

  await enqueueBookProgress(bookId, payload);
}

export async function insertHighlight(input: {
  bookId: string;
  userId: string;
  pageNumber: number;
  color: string;
  position: HighlightPosition;
  highlightType?: "freeform" | "pen";
}) {
  const now = new Date().toISOString();
  const row: Highlight = {
    id: newId(),
    book_id: input.bookId,
    user_id: input.userId,
    page_number: input.pageNumber,
    selected_text: "",
    color: input.color,
    highlight_type: input.highlightType ?? "freeform",
    position: input.position,
    created_at: now,
  };

  await putLocalHighlight(row);

  if (isOnline()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("highlights")
      .insert({
        id: row.id,
        book_id: row.book_id,
        user_id: row.user_id,
        page_number: row.page_number,
        selected_text: row.selected_text,
        color: row.color,
        highlight_type: row.highlight_type,
        position: row.position,
      })
      .select("*")
      .single();

    if (error) {
      await enqueueSync({
        id: newId(),
        entity: "highlight",
        op: "insert",
        recordId: row.id,
        payload: { ...row },
        createdAt: now,
      });
      return row;
    }

    await putLocalHighlight(data as Highlight);
    return data as Highlight;
  }

  await enqueueSync({
    id: newId(),
    entity: "highlight",
    op: "insert",
    recordId: row.id,
    payload: { ...row },
    createdAt: now,
  });
  return row;
}

export async function insertNote(input: {
  bookId: string;
  userId: string;
  pageNumber: number;
  position: NotePosition;
  textColor: string;
}) {
  const now = new Date().toISOString();
  const row: Note = {
    id: newId(),
    book_id: input.bookId,
    user_id: input.userId,
    page_number: input.pageNumber,
    note_text: "",
    highlight_id: null,
    position: input.position,
    text_color: input.textColor,
    created_at: now,
    updated_at: now,
  };

  await putLocalNote(row);

  if (isOnline()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notes")
      .insert({
        id: row.id,
        book_id: row.book_id,
        user_id: row.user_id,
        page_number: row.page_number,
        note_text: row.note_text,
        highlight_id: row.highlight_id,
        position: row.position,
        text_color: row.text_color,
      })
      .select("*")
      .single();

    if (error) {
      await enqueueSync({
        id: newId(),
        entity: "note",
        op: "insert",
        recordId: row.id,
        payload: { ...row },
        createdAt: now,
      });
      return row;
    }

    await putLocalNote(data as Note);
    return data as Note;
  }

  await enqueueSync({
    id: newId(),
    entity: "note",
    op: "insert",
    recordId: row.id,
    payload: { ...row },
    createdAt: now,
  });
  return row;
}

async function updateLocalNote(id: string, patch: Partial<Note>) {
  const existing = await getLocalNoteById(id);
  if (!existing) throw new Error("Note not found");
  const updated = { ...existing, ...patch, updated_at: new Date().toISOString() };
  await putLocalNote(updated);
  return updated;
}

async function updateNoteRemote(
  id: string,
  payload: Record<string, unknown>,
  localPatch: Partial<Note>,
) {
  const updated = await updateLocalNote(id, localPatch);

  if (isOnline()) {
    const supabase = createClient();
    const { error } = await supabase.from("notes").update(payload).eq("id", id);
    if (error) {
      await enqueueSync({
        id: newId(),
        entity: "note",
        op: "update",
        recordId: id,
        payload,
        createdAt: new Date().toISOString(),
      });
    }
    await syncIfOnline();
    return updated;
  }

  await enqueueSync({
    id: newId(),
    entity: "note",
    op: "update",
    recordId: id,
    payload,
    createdAt: new Date().toISOString(),
  });
  return updated;
}

export async function updateNoteText(id: string, text: string) {
  return updateNoteRemote(
    id,
    { note_text: text, updated_at: new Date().toISOString() },
    { note_text: text },
  );
}

export async function clearNoteText(id: string) {
  return updateNoteRemote(
    id,
    { note_text: "", updated_at: new Date().toISOString() },
    { note_text: "" },
  );
}

export async function updateNoteColor(id: string, color: string) {
  return updateNoteRemote(id, { text_color: color }, { text_color: color });
}

export async function updateNoteFontSize(id: string, position: NotePosition) {
  return updateNoteRemote(
    id,
    { position, updated_at: new Date().toISOString() },
    { position },
  );
}

export async function moveNote(id: string, position: NotePosition) {
  return updateNoteRemote(
    id,
    { position, updated_at: new Date().toISOString() },
    { position },
  );
}

export async function deleteNote(id: string) {
  await removeSyncItemsForRecord(id);
  await deleteLocalNote(id);

  if (isOnline()) {
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      await enqueueSync({
        id: newId(),
        entity: "note",
        op: "delete",
        recordId: id,
        payload: {},
        createdAt: new Date().toISOString(),
      });
    }
    await syncIfOnline();
    return;
  }

  await enqueueSync({
    id: newId(),
    entity: "note",
    op: "delete",
    recordId: id,
    payload: {},
    createdAt: new Date().toISOString(),
  });
}

export async function saveHighlightStroke(input: {
  bookId: string;
  userId: string;
  pageNumber: number;
  color: string;
  stroke: HighlightStroke;
  viewport: { viewportWidth?: number; viewportHeight?: number };
  highlightType?: "freeform" | "pen";
}) {
  const position: HighlightPosition = {
    strokes: [input.stroke],
    viewportWidth: input.viewport.viewportWidth,
    viewportHeight: input.viewport.viewportHeight,
  };
  return insertHighlight({
    bookId: input.bookId,
    userId: input.userId,
    pageNumber: input.pageNumber,
    color: input.color,
    position,
    highlightType: input.highlightType,
  });
}
