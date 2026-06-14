import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBookById, getSignedCoverUrl } from "@/lib/books/queries";
import { BookDetailsClient } from "@/components/book/BookDetailsClient";

type BookPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) notFound();

  const supabase = await createClient();
  const [{ data: highlights }, { data: notes }] = await Promise.all([
    supabase
      .from("highlights")
      .select("*")
      .eq("book_id", book.id)
      .order("page_number", { ascending: true }),
    supabase
      .from("notes")
      .select("*")
      .eq("book_id", book.id)
      .order("page_number", { ascending: true }),
  ]);

  const coverUrl = await getSignedCoverUrl(book.cover_path);

  return (
    <BookDetailsClient
      book={book}
      highlights={highlights ?? []}
      notes={notes ?? []}
      coverUrl={coverUrl}
    />
  );
}
