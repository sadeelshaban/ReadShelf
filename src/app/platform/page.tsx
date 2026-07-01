import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PlatformHeroPreview } from "@/components/platform/PlatformHeroPreview";
import { PlatformNav } from "@/components/platform/PlatformNav";

export const metadata: Metadata = {
  title: "Platform overview",
  description:
    "White-label PDF reading infrastructure with annotations, offline sync, and secure storage.",
};

const liveDemoUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://readshelf-rust.vercel.app";

const acquisitionMailto =
  "mailto:sadeelshabanmedia@gmail.com?subject=ReadShelf%20acquisition%20package";

const docsUrl =
  "https://github.com/sadeelshaban/ReadShelf/blob/main/docs/README.md";

const buyers = [
  {
    icon: "🎓",
    title: "EdTech & Course Platforms",
    body: "Private shelves for course PDFs, textbooks, and handouts with progress tracking.",
  },
  {
    icon: "📚",
    title: "Publishers",
    body: "Branded reading with highlights, notes, and annotated export — including Arabic text.",
  },
  {
    icon: "🏢",
    title: "Corporate Training & Knowledge Teams",
    body: "Centralize manuals, SOPs, and training PDFs in one secure library per organization.",
  },
  {
    icon: "💻",
    title: "Development Agencies",
    body: "White-label base to ship a reading product for clients in weeks, not months.",
  },
];

const capabilities = [
  { icon: "📚", text: "Personal PDF library with covers and search" },
  { icon: "📈", text: "Reading progress synced per book and device" },
  { icon: "✏️", text: "Highlights, notes, pen, and eraser in the reader" },
  { icon: "📄", text: "Annotated PDF export with Arabic text support" },
  { icon: "☁️", text: "Offline reading after first open online" },
  { icon: "🔖", text: "Bookmarks with color-coded page ribbons" },
  { icon: "↩️", text: "Continue Reading and Read Again flows" },
  { icon: "📊", text: "Admin dashboard with engagement analytics" },
];

const included = [
  "Full Next.js source code and database migrations",
  "Supabase schema with row-level security",
  "Auth flow: signup, email confirmation, password reset",
  "PDF reader with highlights, notes, pen, bookmarks, and export",
  "Reading resume (scroll + zoom) and read-again flow",
  "Offline cache and background sync",
  "Admin dashboard with platform and engagement analytics",
  "Data Room documentation (docs/) for due diligence",
  "Production deployment on Vercel + handover support",
];

const techBadges = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Supabase",
  "PostgreSQL",
  "pdf.js",
  "pdf-lib",
  "IndexedDB",
  "Vercel",
];

export default function PlatformPage() {
  return (
    <div className="ambient-bg min-h-screen">
      <PlatformNav liveDemoUrl={liveDemoUrl} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section
          id="overview"
          className="glass-panel scroll-mt-24 rounded-3xl p-8 sm:p-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              Acquisition Overview
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-primary sm:text-[2.75rem] sm:leading-tight">
              Build your PDF reading platform in weeks, not months
            </h1>
            <p className="mt-4 text-base leading-7 text-text-muted">
              White-label PDF reading infrastructure with annotations, bookmarks,
              offline support, reading progress, and Arabic PDF export — ready for
              EdTech, publishers, and agencies.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={liveDemoUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg">Open live demo</Button>
              </Link>
              <a href={acquisitionMailto}>
                <Button variant="secondary" size="lg">
                  Request acquisition package
                </Button>
              </a>
            </div>
          </div>
          <div className="mt-10 lg:mt-0">
            <PlatformHeroPreview />
          </div>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <article className="glass-panel rounded-2xl p-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">Problem</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Teams struggle with fragmented PDF workflows. Progress, highlights, and
              notes don&apos;t stay attached to the book or follow users across devices.
            </p>
          </article>
          <article className="glass-panel rounded-2xl p-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">Solution</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              ReadShelf centralizes reading, notes, highlights, and progress in one calm
              shelf — with a full annotation toolkit and optional admin analytics.
            </p>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-3xl font-semibold text-primary">Who It&apos;s For</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {buyers.map((item) => (
              <article key={item.title} className="glass-panel rounded-2xl p-5">
                <span className="text-2xl" aria-hidden>
                  {item.icon}
                </span>
                <h3 className="mt-2 font-semibold text-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="capabilities"
          className="mt-10 glass-panel scroll-mt-24 rounded-2xl p-6 sm:p-8"
        >
          <h2 className="font-serif text-3xl font-semibold text-primary">Core Capabilities</h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-text-muted sm:grid-cols-2">
            {capabilities.map((item) => (
              <li key={item.text} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 text-base" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 glass-panel rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-primary">Data Room</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
                Due-diligence documentation ships with the repository: architecture,
                ERD, database schema, API reference, deployment guide, security, backup,
                roadmap, and handover checklist.
              </p>
            </div>
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm font-medium text-primary shadow-sm transition hover:bg-white/85"
            >
              View documentation
              <span aria-hidden>→</span>
            </a>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="glass-panel rounded-2xl p-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">Tech Stack</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {techBadges.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#eadbc8]/80 bg-background-elevated/60 px-3 py-1.5 text-xs font-medium text-text"
                >
                  {item}
                </span>
              ))}
            </div>
          </article>
          <article className="glass-panel rounded-2xl p-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">
              Included in Acquisition
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              {included.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section
          id="demo"
          className="mt-10 glass-panel scroll-mt-24 rounded-2xl p-6 sm:p-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-8"
        >
          <div>
            <h2 className="font-serif text-3xl font-semibold text-primary">Live Demo</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Production deployment:{" "}
              <Link
                href={liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {liveDemoUrl.replace(/^https?:\/\//, "")}
              </Link>
            </p>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Explore the shelf, reader, annotations, and admin dashboard on the live site.
            </p>
            <Link
              href={liveDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block"
            >
              <Button size="lg">Launch demo</Button>
            </Link>
          </div>
          <div className="mt-8 lg:mt-0">
            <PlatformHeroPreview />
          </div>
        </section>

        <section
          id="contact"
          className="mt-10 scroll-mt-24 rounded-2xl border border-accent/30 bg-card/80 p-6 text-center sm:p-10"
        >
          <h2 className="font-serif text-2xl font-semibold text-primary sm:text-3xl">
            Interested in acquiring ReadShelf?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            Receive the acquisition package, technical documentation, pricing, and
            deployment details. Contact the creator,{" "}
            <span className="font-medium text-text">Sadeel Shaban</span>, to discuss
            acquisition and transition.
          </p>
          <a href={acquisitionMailto} className="mt-6 inline-block">
            <Button size="lg">Request acquisition package</Button>
          </a>
        </section>

        <div className="mt-8">
          <SiteFooter showAcquisitionLinks />
        </div>
      </main>
    </div>
  );
}
