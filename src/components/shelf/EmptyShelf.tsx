import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function EmptyShelf() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/18 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="grid min-h-[26rem] gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="self-center">
          <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
            Curate your shelf
          </div>
          <h2 className="mt-5 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Turn this quiet space into a beautiful personal reading library.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
            Add your first PDF and keep every chapter, note, and highlight in one
            cinematic shelf designed for calm reading and quick return.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/shelf/add">
              <Button size="lg" className="shadow-xl shadow-black/15">
                + Add your first book
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant="secondary"
                size="lg"
                className="border-white/25 bg-white/12 text-white hover:bg-white/18"
              >
                Review account settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-3xl border border-white/18 bg-white/10 p-5 text-white shadow-xl shadow-black/10 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
              Organize
            </p>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Keep every PDF, cover, and title neatly grouped in one private shelf.
            </p>
          </div>
          <div className="rounded-3xl border border-white/18 bg-white/10 p-5 text-white shadow-xl shadow-black/10 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
              Read
            </p>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Open books in a focused reader that remembers the exact page where you paused.
            </p>
          </div>
          <div className="rounded-3xl border border-white/18 bg-white/10 p-5 text-white shadow-xl shadow-black/10 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
              Annotate
            </p>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Save highlights and notes page by page so your thinking stays attached to the book.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
