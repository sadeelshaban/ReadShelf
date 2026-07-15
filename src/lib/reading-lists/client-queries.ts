import { createClient } from "@/lib/supabase/client";
import { fetchBooksWithCountsClient } from "@/lib/books/client-queries";
import {
  normalizeReadingListName,
  type ReadingListDetail,
} from "@/lib/reading-lists/names";
import type {
  ReadingList,
  ReadingListPreviewBook,
  ReadingListWithPreview,
} from "@/types";

async function requireUserId() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return { supabase, userId: session.user.id };
}

const PREVIEW_BOOKS_PER_LIST = 4;

export async function fetchReadingListsClient(): Promise<ReadingListWithPreview[]> {
  const auth = await requireUserId();
  if (!auth) return [];

  const { data: lists, error } = await auth.supabase
    .from("reading_lists")
    .select("*")
    .eq("user_id", auth.userId)
    .order("updated_at", { ascending: false });

  if (error || !lists) return [];

  const listIds = lists.map((list) => list.id);
  if (listIds.length === 0) return [];

  const { data: memberships } = await auth.supabase
    .from("reading_list_books")
    .select("list_id, book_id, added_at")
    .in("list_id", listIds)
    .order("added_at", { ascending: false });

  const counts = new Map<string, number>();
  const previewIdsByList = new Map<string, string[]>();

  memberships?.forEach((row) => {
    counts.set(row.list_id, (counts.get(row.list_id) ?? 0) + 1);
    const existing = previewIdsByList.get(row.list_id) ?? [];
    if (existing.length < PREVIEW_BOOKS_PER_LIST) {
      existing.push(row.book_id);
      previewIdsByList.set(row.list_id, existing);
    }
  });

  const allPreviewIds = [
    ...new Set([...previewIdsByList.values()].flat()),
  ];

  const bookById = new Map<string, ReadingListPreviewBook>();
  if (allPreviewIds.length > 0) {
    const shelfBooks = await fetchBooksWithCountsClient();
    for (const book of shelfBooks) {
      if (!allPreviewIds.includes(book.id)) continue;
      bookById.set(book.id, {
        id: book.id,
        title: book.title,
        author: book.author,
        cover_path: book.cover_path,
      });
    }
  }

  return lists.map((list) => {
    const previewIds = previewIdsByList.get(list.id) ?? [];
    return {
      ...(list as ReadingList),
      book_count: counts.get(list.id) ?? 0,
      preview_books: previewIds
        .map((id) => bookById.get(id))
        .filter((book): book is ReadingListPreviewBook => Boolean(book)),
    };
  });
}

export async function createReadingListClient(name: string): Promise<ReadingList> {
  const auth = await requireUserId();
  if (!auth) throw new Error("Sign in to create a list.");

  const normalized = normalizeReadingListName(name);
  if (!normalized) throw new Error("Enter a valid list name.");

  const now = new Date().toISOString();
  const { data, error } = await auth.supabase
    .from("reading_lists")
    .insert({
      user_id: auth.userId,
      name: normalized,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create list.");
  }

  return data as ReadingList;
}

export async function renameReadingListClient(
  listId: string,
  name: string,
): Promise<ReadingList> {
  const auth = await requireUserId();
  if (!auth) throw new Error("Sign in to rename a list.");

  const normalized = normalizeReadingListName(name);
  if (!normalized) throw new Error("Enter a valid list name.");

  const { data, error } = await auth.supabase
    .from("reading_lists")
    .update({ name: normalized, updated_at: new Date().toISOString() })
    .eq("id", listId)
    .eq("user_id", auth.userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not rename list.");
  }

  return data as ReadingList;
}

export async function deleteReadingListClient(listId: string): Promise<void> {
  const auth = await requireUserId();
  if (!auth) throw new Error("Sign in to delete a list.");

  const { error } = await auth.supabase
    .from("reading_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", auth.userId);

  if (error) {
    throw new Error(error.message ?? "Could not delete list.");
  }
}

export async function fetchReadingListDetailClient(
  listId: string,
): Promise<ReadingListDetail | null> {
  const auth = await requireUserId();
  if (!auth) return null;

  const { data: list, error } = await auth.supabase
    .from("reading_lists")
    .select("*")
    .eq("id", listId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error || !list) return null;

  const { data: memberships } = await auth.supabase
    .from("reading_list_books")
    .select("book_id, added_at")
    .eq("list_id", listId)
    .order("added_at", { ascending: false });

  const bookIds = (memberships ?? []).map((row) => row.book_id);
  if (bookIds.length === 0) {
    return { list: list as ReadingList, books: [] };
  }

  const allBooks = await fetchBooksWithCountsClient();
  const byId = new Map(allBooks.map((book) => [book.id, book]));
  const books = bookIds
    .map((id) => byId.get(id))
    .filter((book): book is NonNullable<typeof book> => Boolean(book));

  return { list: list as ReadingList, books };
}

export async function addBooksToReadingListClient(
  listId: string,
  bookIds: string[],
): Promise<void> {
  const auth = await requireUserId();
  if (!auth) throw new Error("Sign in to add books.");

  const uniqueIds = [...new Set(bookIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  const { data: list } = await auth.supabase
    .from("reading_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!list) throw new Error("List not found.");

  const rows = uniqueIds.map((bookId) => ({
    list_id: listId,
    book_id: bookId,
  }));

  const { error } = await auth.supabase
    .from("reading_list_books")
    .upsert(rows, { onConflict: "list_id,book_id", ignoreDuplicates: true });

  if (error) {
    throw new Error(error.message ?? "Could not add books.");
  }

  await auth.supabase
    .from("reading_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId)
    .eq("user_id", auth.userId);
}

export async function removeBookFromReadingListClient(
  listId: string,
  bookId: string,
): Promise<void> {
  const auth = await requireUserId();
  if (!auth) throw new Error("Sign in to remove a book.");

  const { error } = await auth.supabase
    .from("reading_list_books")
    .delete()
    .eq("list_id", listId)
    .eq("book_id", bookId);

  if (error) {
    throw new Error(error.message ?? "Could not remove book.");
  }

  await auth.supabase
    .from("reading_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId)
    .eq("user_id", auth.userId);
}

export async function fetchReadingListBookIdsClient(
  listId: string,
): Promise<string[]> {
  const auth = await requireUserId();
  if (!auth) return [];

  const { data } = await auth.supabase
    .from("reading_list_books")
    .select("book_id")
    .eq("list_id", listId);

  return (data ?? []).map((row) => row.book_id);
}
