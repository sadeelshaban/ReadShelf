import type { Bookmark } from "@/types";
import { idbDelete, idbGet, idbGetAllByIndex, idbPut } from "@/lib/offline/db";
import { isOnline } from "@/lib/offline/online";

export async function getLocalBookmarks(bookId: string) {
  return idbGetAllByIndex<Bookmark>("bookmarks", "book_id", bookId);
}

export async function putLocalBookmark(bookmark: Bookmark) {
  await idbPut("bookmarks", bookmark);
}

export async function deleteLocalBookmark(id: string) {
  await idbDelete("bookmarks", id);
}

export async function getLocalBookmarkById(id: string) {
  return idbGet<Bookmark>("bookmarks", id);
}

export async function seedBookBookmarks(bookId: string, bookmarks: Bookmark[]) {
  if (!isOnline()) {
    return getLocalBookmarks(bookId);
  }

  for (const bookmark of bookmarks) {
    await putLocalBookmark(bookmark);
  }

  return getLocalBookmarks(bookId);
}

export async function loadBookBookmarks(bookId: string) {
  return getLocalBookmarks(bookId);
}
