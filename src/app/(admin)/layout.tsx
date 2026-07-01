import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ambient-bg min-h-screen">
      <header className="border-b border-white/50 bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/admin" className="font-serif text-xl font-semibold text-primary">
            Admin
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/admin/settings"
              className="text-text-muted transition hover:text-primary"
            >
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
