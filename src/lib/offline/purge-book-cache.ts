import {
  idbDelete,
  idbGetAll,
  idbGetAllByIndex,
} from "@/lib/offline/db";
import { removeCachedBook } from "@/lib/offline/books-store";
import { removeCachedPdf } from "@/lib/offline/pdf-cache";
import type { Highlight, Note } from "@/types";

type SyncQueueItem = {
  id: string;
  recordId: string;
};

export async function purgeBookFromLocalCache(bookId: string) {
  const [highlights, notes] = await Promise.all([
    idbGetAllByIndex<Highlight>("highlights", "book_id", bookId),
    idbGetAllByIndex<Note>("notes", "book_id", bookId),
  ]);

  const relatedRecordIds = new Set<string>([
    bookId,
    ...highlights.map((row) => row.id),
    ...notes.map((row) => row.id),
  ]);

  const queue = await idbGetAll<SyncQueueItem>("syncQueue");
  await Promise.all([
    removeCachedBook(bookId),
    removeCachedPdf(bookId),
    ...highlights.map((row) => idbDelete("highlights", row.id)),
    ...notes.map((row) => idbDelete("notes", row.id)),
    ...queue
      .filter((item) => relatedRecordIds.has(item.recordId))
      .map((item) => idbDelete("syncQueue", item.id)),
  ]);
}
