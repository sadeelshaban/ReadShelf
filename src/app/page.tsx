import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SiteFooter } from "@/components/layout/SiteFooter";

const features = [
  {
    title: "Organize",
    body: "Keep every PDF, cover, and title neatly grouped in one private shelf.",
  },
  {
    title: "Read",
    body: "Open books in a focused reader that remembers the exact page where you paused.",
  },
  {
    title: "Annotate",
    body: "Save highlights and notes page by page so your thinking stays attached to the book.",
  },
];

export default function HomePage() {
  return (
    <div className="video-hero-panel relative min-h-screen overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/videos/empty-shelf-library-background.mp4" type="video/mp4" />
      </video>
      <div className="video-hero-overlay absolute inset-0" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="ReadShelf"
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-white/20"
            unoptimized
          />
          <span className="font-serif text-2xl font-semibold text-white">
            ReadShelf
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="rounded-full border border-white/18 bg-white/8 px-4 text-white hover:bg-white/14"
            >
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="rounded-full px-5">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 pb-20 pt-6 lg:px-8">
        <section className="space-y-4">
          <div className="max-w-3xl space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/72">
              Library
            </p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              My Reading Shelf
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/82 sm:text-[15px]">
              Keep your PDFs, reading progress, highlights, and notes in one calm
              place. Your shelf should feel organized before you even open a book.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/18 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
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
                  <Link href="/signup">
                    <Button size="lg" className="shadow-xl shadow-black/15">
                      Start your shelf
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="border-white/25 bg-white/12 text-white hover:bg-white/18"
                    >
                      I already have an account
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                {features.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/18 bg-white/10 p-5 text-white shadow-xl shadow-black/10 backdrop-blur-xl"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
                      {item.title}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white/85">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <SiteFooter variant="dark" />
      </footer>
    </div>
  );
}
