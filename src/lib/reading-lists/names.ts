import type { BookWithCounts, ReadingList, ReadingListWithCount } from "@/types";

export const MAX_READING_LIST_NAME_LENGTH = 80;

/** Accept Arabic/English (and most unicode) names; reject empty/control chars. */
export function normalizeReadingListName(input: string): string | null {
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_READING_LIST_NAME_LENGTH) return null;
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  return trimmed;
}

export function readingListBookCountLabel(count: number) {
  if (count === 0) return "No books";
  if (count === 1) return "1 Book";
  return `${count} Books`;
}

export type ReadingListMembership = {
  list: ReadingList;
  bookIds: string[];
};

export type ReadingListDetail = {
  list: ReadingList;
  books: BookWithCounts[];
};

export type { ReadingList, ReadingListWithCount };
