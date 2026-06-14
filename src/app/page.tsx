import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

const sampleBooks = [
  {
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    cover: "https://covers.openlibrary.org/b/id/8228691-L.jpg",
  },
  {
    title: "The Metamorphosis",
    author: "Franz Kafka",
    cover: "https://covers.openlibrary.org/b/id/6979861-L.jpg",
  },
  {
    title: "The Brothers Karamazov",
    author: "Fyodor Dostoevsky",
    cover: "https://covers.openlibrary.org/b/id/8232411-L.jpg",
  },
  {
    title: "The Trial",
    author: "Franz Kafka",
    cover: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
  },
];

const features = [
  {
    title: "Build your shelf",
    body: "Drop in any PDF and ReadShelf turns the first page into a cover — your private library, always within reach.",
  },
  {
    title: "Mark it your way",
    body: "Draw freeform highlights and pin notes anywhere on the page — just like a real book, but smarter.",
  },
  {
    title: "Always in sync",
    body: "Your shelf, progress, highlights, and notes stay saved in the cloud — open ReadShelf in your browser and pick up where you left off.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/favicon.png"
            alt="ReadShelf"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-cover"
            unoptimized
          />
          <span className="font-serif text-2xl font-semibold text-primary">
            ReadShelf
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-4">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="space-y-5 lg:-mt-6">
            <p className="text-sm font-medium uppercase tracking-wider text-accent">
              Your personal reading shelf
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight text-text sm:text-5xl">
              Your books, highlights, and notes — in one place.
            </h1>
            <p className="max-w-xl text-lg text-text/80">
              Upload PDFs, read with a focused viewer, highlight freely, and leave notes
              on any page. A personal reading shelf in your browser.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/signup">
                <Button size="lg">Start your shelf</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {sampleBooks.map((book) => (
              <div
                key={book.title}
                className="rounded-2xl border border-soft-gray/30 bg-card p-3 shadow-sm"
              >
                <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-xl bg-background">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="font-serif text-sm font-semibold text-text line-clamp-2">
                  {book.title}
                </p>
                <p className="text-xs text-text/60">{book.author}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-6 md:grid-cols-3">
          {features.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-soft-gray/30 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg"
            >
              <h3 className="font-serif text-xl font-semibold text-primary transition-colors group-hover:text-accent">
                {item.title}
              </h3>
              <p className="mt-2 text-text/75">{item.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
