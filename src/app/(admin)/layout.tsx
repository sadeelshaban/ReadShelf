import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Admin",
};

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin#engagement", label: "Analytics" },
  { href: "/admin#users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-bg min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-background-elevated [transform:translateZ(0)]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <Link href="/admin" className="font-serif text-xl font-semibold text-primary">
              Admin
            </Link>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-text-muted transition hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <div className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
