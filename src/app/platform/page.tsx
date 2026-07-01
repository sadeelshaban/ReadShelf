import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Platform overview",
  description:
    "Production-ready white-label PDF reading platform with offline sync, annotations, and secure storage.",
};

const liveDemoUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://readshelf-rust.vercel.app";

const buyers = [
  {
    title: "EdTech & Course Platforms",
    body: "Give learners a private shelf for course PDFs, textbooks, and handouts with progress tracking.",
  },
  {
    title: "Publishers",
    body: "Offer a branded reading experience with highlights, notes, and annotated PDF export — including Arabic text support.",
  },
  {
    title: "Corporate Training & Knowledge Teams",
    body: "Centralize manuals, SOPs, and training PDFs in one secure library per organization.",
  },
  {
    title: "Development Agencies",
    body: "Acquire a white-label base and ship a reading product for clients in weeks instead of months.",
  },
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

const tech = [
  "Next.js 16 (App Router)",
  "React 19 + TypeScript",
  "Supabase (Auth, PostgreSQL)",
  "Supabase Storage (PDF & cover object storage)",
  "pdfjs-dist + pdf-lib",
  "IndexedDB offline layer",
  "Vercel deployment",
];

export default function PlatformPage() {
  return (
    <div className="ambient-bg min-h-screen">
      <header className="border-b border-white/50 bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ReadShelf"
              width={40}
              height={40}
              className="h-9 w-9 rounded-lg object-cover"
              unoptimized
            />
            <span className="font-serif text-xl font-semibold text-primary">ReadShelf</span>
          </Link>
          <Link href={liveDemoUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              Live demo
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="glass-panel rounded-3xl p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
            Acquisition Overview
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            A production-ready PDF reading platform
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-text-muted">
            ReadShelf is a white-label reading infrastructure product: personal libraries,
            in-browser PDF reading, annotations, progress sync, offline support, and
            annotated export. Built for teams that need a complete solution — not a prototype.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="mailto:sadeelshabanmedia@gmail.com?subject=ReadShelf%20acquisition%20inquiry">
              <Button size="lg">Request acquisition details</Button>
            </a>
            <Link href={liveDemoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="lg">
                Open live demo
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <article className="glass-panel rounded-2xl p-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">Problem</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Teams and learners struggle with fragmented PDF workflows. Files sit in
              folders and generic viewers. Progress, highlights, and notes don&apos;t stay
              attached to the book, and they don&apos;t follow the user across devices.
            </p>
          </article>
          <article className="glass-panel rounded-2xl p-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">Solution</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              ReadShelf centralizes reading, notes, highlights, and progress in one calm
              shelf. Each user gets a private library with a full annotation toolkit and
              optional admin analytics for platform operators.
            </p>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-3xl font-semibold text-primary">Who It&apos;s For</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {buyers.map((item) => (
              <article key={item.title} className="glass-panel rounded-2xl p-5">
                <h3 className="font-semibold text-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 glass-panel rounded-2xl p-6 sm:p-8">
          <h2 className="font-serif text-3xl font-semibold text-primary">Core Capabilities</h2>
          <ul className="mt-5 grid gap-2 text-sm leading-6 text-text-muted sm:grid-cols-2">
            <li>Personal PDF library with covers and search</li>
            <li>Reading progress synced per book and device</li>
            <li>Highlights, notes, pen, and eraser in the reader</li>
            <li>Annotated PDF export with Arabic text support</li>
            <li>Offline reading after first open online</li>
            <li>Bookmarks with color-coded page ribbons</li>
            <li>Continue Reading and Read Again (100% complete) flows</li>
            <li>Admin dashboard with engagement analytics</li>
          </ul>
        </section>

        <section className="mt-10 glass-panel rounded-2xl p-6 sm:p-8">
          <h2 className="font-serif text-3xl font-semibold text-primary">Data Room</h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Due-diligence documentation ships with the repository: architecture diagram,
            ERD, database schema, API reference, deployment guide, cost model, backup
            strategy, security overview, product roadmap, analytics export, branding
            assets, and handover checklist. See{" "}
            <code className="rounded bg-background px-1.5 py-0.5 text-text">docs/</code>{" "}
            in the source repo.
          </p>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="glass-panel rounded-2xl p-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">Tech Stack</h2>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              {tech.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="glass-panel rounded-2xl p-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">
              Included in Acquisition
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              {included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-10 glass-panel rounded-2xl p-6 sm:p-8">
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
            Contact us for a guided walkthrough.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-accent/30 bg-card/80 p-6 text-center sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-primary">
            Available for Full Product Acquisition
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            Source code, infrastructure handover, and optional transition support. Ideal
            for EdTech, publishing, agencies, and internal knowledge platforms.
          </p>
          <a
            href="mailto:sadeelshabanmedia@gmail.com?subject=ReadShelf%20acquisition%20inquiry"
            className="mt-6 inline-block"
          >
            <Button size="lg">Contact Sadeel Shaban</Button>
          </a>
        </section>

        <div className="mt-10">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
