import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";

type LegalPageLayoutProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

export function LegalPageLayout({ title, updated, children }: LegalPageLayoutProps) {
  return (
    <div className="ambient-bg min-h-screen">
      <header className="border-b border-white/50 bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-serif text-xl font-semibold text-primary">
            ReadShelf
          </Link>
          <Link href="/login" className="text-sm font-medium text-text-muted hover:text-primary">
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="glass-panel rounded-3xl p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Legal
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-primary sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-text-muted">Last updated: {updated}</p>
          <div className="prose-legal mt-8 space-y-5 text-sm leading-7 text-text sm:text-base">
            {children}
          </div>
        </article>

        <div className="mt-10">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
