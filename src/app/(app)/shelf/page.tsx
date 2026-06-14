import { ShelfGrid } from "@/components/shelf/ShelfGrid";
import { ShelfStats } from "@/components/shelf/ShelfStats";
import { getBooksWithCounts, getSignedCoverUrl } from "@/lib/books/queries";

export default async function ShelfPage() {
  const books = await getBooksWithCounts();

  const coverUrls: Record<string, string | null> = {};
  await Promise.all(
    books.map(async (book) => {
      coverUrls[book.id] = await getSignedCoverUrl(book.cover_path);
    }),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Library
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            My Reading Shelf
          </h1>
        </div>
        {books.length > 0 && <ShelfStats books={books} />}
      </header>

      <ShelfGrid books={books} coverUrls={coverUrls} />
    </div>
  );
}
