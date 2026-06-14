import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBookById } from "@/lib/books/queries";
import { ReaderWrapper } from "@/components/reader/ReaderWrapper";

type ReadPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReadPage({ params }: ReadPageProps) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [{ data: highlights }, { data: notes }] = await Promise.all([
    supabase
      .from("highlights")
      .select("*")
      .eq("book_id", book.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("notes")
      .select("*")
      .eq("book_id", book.id)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/book/${book.id}`}
          className="text-sm text-primary hover:underline"
        >
          ← Back to book
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-text">
          {book.title}
        </h1>
      </div>

      <ReaderWrapper
        bookId={book.id}
        userId={user.id}
        initialPage={book.last_page || 1}
        totalPages={book.total_pages}
        initialHighlights={highlights ?? []}
        initialNotes={notes ?? []}
      />
    </div>
  );
}
